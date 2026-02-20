/**
 * /api/jobs/process — Background job worker
 *
 * Called every minute by Vercel Cron (vercel.json).
 * Claims a batch of pending transform_jobs atomically and processes each one:
 *  - image jobs → Sharp resize + upload to processed bucket
 *  - video jobs → FFmpeg blur-background resize + upload
 *
 * Auth: Vercel passes CRON_SECRET as Bearer token. Also accepts direct GET
 * from localhost for local testing (no auth required when CRON_SECRET not set).
 */

import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'
import { PLATFORM_SPECS, type Platform } from '@/lib/constants/platforms'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

export const runtime = 'nodejs'
export const maxDuration = 300

// ── Auth guard ────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // dev: no secret configured → allow all
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

// ── GET handler (called by Vercel Cron) ───────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await createAdminClient()

  // Claim up to 5 pending jobs atomically (FOR UPDATE SKIP LOCKED prevents races)
  const { data: jobs, error: claimError } = await admin.rpc('claim_transform_jobs', {
    batch_size: 5,
  })

  if (claimError) {
    console.error('[jobs/process] Failed to claim jobs:', claimError)
    return NextResponse.json({ error: 'Failed to claim jobs' }, { status: 500 })
  }

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No pending jobs' })
  }

  const results: Array<{ jobId: string; platform: string; status: string; error?: string }> = []

  for (const job of jobs) {
    const result = await processJob(admin, job)
    results.push(result)
  }

  return NextResponse.json({ processed: results.length, results })
}

// ── Job processor ─────────────────────────────────────────────────────────────

type AdminClient = Awaited<ReturnType<typeof createAdminClient>>

async function processJob(
  admin: AdminClient,
  job: {
    id: string
    user_id: string
    content_item_id: string
    platform: string
    type: string
  }
) {
  const { id: jobId, content_item_id, platform, type, user_id } = job

  try {
    // ── Fetch the original content item ─────────────────────────────────────
    const { data: item, error: itemError } = await admin
      .from('content_items')
      .select('storage_path')
      .eq('id', content_item_id)
      .single()

    if (itemError || !item) throw new Error('Content item not found')

    // ── Download original from storage ───────────────────────────────────────
    const { data: blob, error: downloadError } = await admin.storage
      .from('content')
      .download(item.storage_path)

    if (downloadError || !blob) {
      throw new Error(`Download failed: ${downloadError?.message ?? 'empty blob'}`)
    }

    const originalBuffer = Buffer.from(await blob.arrayBuffer())

    // ── Process ──────────────────────────────────────────────────────────────
    let variantBuffer: Buffer
    let width: number
    let height: number
    let storagePath: string
    let contentType: string

    const spec = PLATFORM_SPECS[platform as Platform]
    if (!spec) throw new Error(`Unknown platform: ${platform}`)

    if (type === 'image') {
      const dims = spec.image
      if (!dims) throw new Error(`Platform ${platform} has no image spec`)
      ;({ width, height } = dims)

      storagePath = `${user_id}/${content_item_id}/${platform}.jpg`
      contentType = 'image/jpeg'

      variantBuffer = await sharp(originalBuffer)
        .rotate()                                // honour EXIF orientation
        .resize(width, height, {
          fit: 'cover',
          position: 'attention',                 // smart-crop: keeps faces/subjects centred
          kernel: 'lanczos3',                    // highest-quality downscale filter
          withoutEnlargement: false,
        })
        .jpeg({ quality: 95, mozjpeg: true, chromaSubsampling: '4:4:4' })  // near-lossless, full chroma
        .toBuffer()

    } else {
      // video
      const dims = spec.video
      if (!dims) throw new Error(`Platform ${platform} has no video spec`)
      ;({ width, height } = dims)

      storagePath = `${user_id}/${content_item_id}/${platform}.mp4`
      contentType = 'video/mp4'

      const tmpId = `${jobId}-${platform}`
      const inputPath = path.join(os.tmpdir(), `${tmpId}-input`)
      const outputPath = path.join(os.tmpdir(), `${tmpId}-output.mp4`)

      await fs.writeFile(inputPath, originalBuffer)

      try {
        await new Promise<void>((resolve, reject) => {
          // bg: scale up to cover target, center-crop, blur
          // fg: scale down to fit target (preserving AR), then round to even
          //     dimensions — libx264 requires both dims to be divisible by 2.
          //     e.g. 9:16 → 16:9 produces fg width ≈ 607 (odd) without the fix.
          const filterComplex = [
            `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,`,
            `crop=${width}:${height},boxblur=20:1[bg];`,
            `[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,`,
            `scale=trunc(iw/2)*2:trunc(ih/2)*2[fg];`,
            `[bg][fg]overlay=(W-w)/2:(H-h)/2[v]`,
          ].join('')

          ffmpeg(inputPath)
            .outputOptions([
              '-filter_complex', filterComplex,
              '-map', '[v]',
              '-map', '0:a?',
              '-c:v', 'libx264',
              '-c:a', 'aac',
              '-crf', '18',              // high quality (18=near-lossless, 23=default)
              '-preset', 'medium',       // better quality/compression than 'fast'
              '-b:v', '0',               // force CRF mode (no target bitrate)
              '-movflags', '+faststart',
              '-pix_fmt', 'yuv420p',
            ])
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .run()
        })

        variantBuffer = await fs.readFile(outputPath)
      } finally {
        await fs.unlink(inputPath).catch(() => {})
        await fs.unlink(outputPath).catch(() => {})
      }
    }

    // ── Upload to processed bucket ────────────────────────────────────────────
    // Convert Buffer → Blob: Node 18+ native fetch handles Blob more reliably
    // than Buffer for multipart storage uploads in the Supabase JS v2 client.
    const uploadBlob = new Blob([new Uint8Array(variantBuffer)], { type: contentType })
    const { error: uploadError } = await admin.storage
      .from('processed')
      .upload(storagePath, uploadBlob, { contentType, upsert: true })

    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`)

    const { data: { publicUrl } } = admin.storage.from('processed').getPublicUrl(storagePath)

    // ── Upsert content_variant ────────────────────────────────────────────────
    const { error: upsertError } = await admin
      .from('content_variants')
      .upsert(
        {
          content_item_id,
          platform,
          variant_url: publicUrl,
          storage_path: storagePath,
          width,
          height,
          file_size: variantBuffer.length,
        },
        { onConflict: 'content_item_id,platform' }
      )

    if (upsertError) {
      await admin.storage.from('processed').remove([storagePath])
      throw new Error(`DB upsert failed: ${upsertError.message}`)
    }

    // ── Mark job done ─────────────────────────────────────────────────────────
    await admin
      .from('transform_jobs')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', jobId)

    return { jobId, platform, status: 'done' }

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(`[jobs/process] Job ${jobId} (${platform}) failed:`, err)

    await admin
      .from('transform_jobs')
      .update({
        status: 'failed',
        error_message: errorMsg,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    return { jobId, platform, status: 'failed', error: errorMsg }
  }
}
