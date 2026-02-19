import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'
import { PLATFORM_SPECS, ALL_PLATFORMS, type Platform } from '@/lib/constants/platforms'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 min — video processing can be slow

// Platforms that have a video spec
const VIDEO_PLATFORMS = ALL_PLATFORMS.filter(
  (p) => PLATFORM_SPECS[p].video != null
)

/**
 * Resize a video to the target dimensions using a blur-background technique.
 * Works for any input aspect ratio → any target aspect ratio:
 *  - Creates a blurred background at exact target size (cropped & blurred)
 *  - Scales the original to fit within the target (preserving aspect ratio)
 *  - Overlays the scaled video centered on the blurred background
 */
function processVideo(
  inputPath: string,
  outputPath: string,
  width: number,
  height: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const filterComplex = [
      // Background: scale up, crop to exact size, heavy blur
      `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,`,
      `crop=${width}:${height},boxblur=20:1[bg];`,
      // Foreground: scale to fit within target (preserves aspect ratio)
      `[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease[fg];`,
      // Overlay fg centered on bg
      `[bg][fg]overlay=(W-w)/2:(H-h)/2[v]`,
    ].join('')

    ffmpeg(inputPath)
      .outputOptions([
        '-filter_complex', filterComplex,
        '-map', '[v]',
        '-map', '0:a?',         // include audio if present (? = optional)
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-crf', '23',           // quality (18=best, 28=worst, 23=default)
        '-preset', 'fast',
        '-movflags', '+faststart', // enables progressive streaming
        '-pix_fmt', 'yuv420p',    // broad player compatibility
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run()
  })
}

export async function POST(request: NextRequest) {
  const tmpFiles: string[] = []

  try {
    // ── Auth ──────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const contentItemId: string = body.contentItemId
    const requestedPlatforms: Platform[] | undefined = body.platforms

    if (!contentItemId) {
      return NextResponse.json({ error: 'contentItemId is required' }, { status: 400 })
    }

    const admin = await createAdminClient()

    // ── Fetch content item (verify ownership) ─────────────
    const { data: item, error: itemError } = await admin
      .from('content_items')
      .select('*')
      .eq('id', contentItemId)
      .eq('user_id', user.id)
      .single()

    if (itemError || !item) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 })
    }

    if (item.type !== 'video') {
      return NextResponse.json({ error: 'This item is not a video' }, { status: 400 })
    }

    // ── Download original ─────────────────────────────────
    const { data: fileBlob, error: downloadError } = await admin.storage
      .from('content')
      .download(item.storage_path)

    if (downloadError || !fileBlob) {
      console.error('Download error:', downloadError)
      return NextResponse.json({ error: 'Failed to download original file' }, { status: 500 })
    }

    // Write original to temp file (FFmpeg needs file I/O)
    const inputPath = path.join(os.tmpdir(), `${contentItemId}_input.mp4`)
    await fs.writeFile(inputPath, Buffer.from(await fileBlob.arrayBuffer()))
    tmpFiles.push(inputPath)

    // ── Determine target platforms ────────────────────────
    const targetPlatforms = requestedPlatforms
      ? requestedPlatforms.filter((p) => PLATFORM_SPECS[p]?.video)
      : VIDEO_PLATFORMS

    const variants: Array<{
      platform: string
      url: string
      width: number
      height: number
      file_size: number
    }> = []

    const errors: Array<{ platform: string; error: string }> = []

    // ── Process each platform ─────────────────────────────
    for (const platform of targetPlatforms) {
      const spec = PLATFORM_SPECS[platform]
      if (!spec.video) continue

      const { width, height } = spec.video
      const outputPath = path.join(os.tmpdir(), `${contentItemId}_${platform}.mp4`)
      tmpFiles.push(outputPath)

      try {
        await processVideo(inputPath, outputPath, width, height)

        const outputBuffer = await fs.readFile(outputPath)

        // Upload to processed/{userId}/{contentItemId}/{platform}.mp4
        const storagePath = `${user.id}/${contentItemId}/${platform}.mp4`

        const { error: uploadError } = await admin.storage
          .from('processed')
          .upload(storagePath, outputBuffer, {
            contentType: 'video/mp4',
            upsert: true,
          })

        if (uploadError) {
          console.error(`Upload error [${platform}]:`, uploadError)
          errors.push({ platform, error: uploadError.message })
          continue
        }

        const { data: { publicUrl } } = admin.storage
          .from('processed')
          .getPublicUrl(storagePath)

        // Upsert into content_variants (unique on content_item_id + platform)
        const { error: upsertError } = await admin
          .from('content_variants')
          .upsert(
            {
              content_item_id: contentItemId,
              platform,
              variant_url: publicUrl,
              storage_path: storagePath,
              width,
              height,
              file_size: outputBuffer.length,
              hashtags: [],
            },
            { onConflict: 'content_item_id,platform' }
          )

        if (upsertError) {
          console.error(`DB upsert error [${platform}]:`, upsertError)
          // Clean up orphaned storage file
          await admin.storage.from('processed').remove([storagePath])
          errors.push({ platform, error: upsertError.message })
          continue
        }

        variants.push({ platform, url: publicUrl, width, height, file_size: outputBuffer.length })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        console.error(`FFmpeg error [${platform}]:`, err)
        errors.push({ platform, error: msg })
      }

      // Clean up this platform's output immediately to save disk space
      await fs.unlink(outputPath).catch(() => {})
      tmpFiles.splice(tmpFiles.indexOf(outputPath), 1)
    }

    // Mark item as ready
    await admin
      .from('content_items')
      .update({ status: 'ready', updated_at: new Date().toISOString() })
      .eq('id', contentItemId)

    return NextResponse.json({
      contentItemId,
      total: targetPlatforms.length,
      succeeded: variants.length,
      variants,
      errors,
    })
  } catch (err) {
    console.error('Video transform route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    // Clean up any remaining temp files
    for (const f of tmpFiles) {
      await fs.unlink(f).catch(() => {})
    }
  }
}
