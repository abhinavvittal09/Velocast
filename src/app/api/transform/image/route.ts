import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { PLATFORM_SPECS, ALL_PLATFORMS, type Platform } from '@/lib/constants/platforms'

export const runtime = 'nodejs'
export const maxDuration = 60

// Platforms that have an image spec (skip video-only platforms)
const IMAGE_PLATFORMS = ALL_PLATFORMS.filter(
  (p) => PLATFORM_SPECS[p].image != null
)

export async function POST(request: NextRequest) {
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

    if (item.type !== 'image') {
      return NextResponse.json({ error: 'This item is not an image' }, { status: 400 })
    }

    // ── Download original ─────────────────────────────────
    const { data: fileBlob, error: downloadError } = await admin.storage
      .from('content')
      .download(item.storage_path)

    if (downloadError || !fileBlob) {
      console.error('Download error:', downloadError)
      return NextResponse.json({ error: 'Failed to download original file' }, { status: 500 })
    }

    const originalBuffer = Buffer.from(await fileBlob.arrayBuffer())

    // ── Determine target platforms ────────────────────────
    const targetPlatforms = requestedPlatforms
      ? requestedPlatforms.filter((p) => PLATFORM_SPECS[p]?.image)
      : IMAGE_PLATFORMS

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
      if (!spec.image) continue

      const { width, height } = spec.image

      try {
        // Resize with Smart crop (entropy-based attention detection)
        const resizedBuffer = await sharp(originalBuffer)
          .rotate()                        // auto-rotate from EXIF
          .resize(width, height, {
            fit: 'cover',
            position: 'attention',         // keeps faces / focal points
            withoutEnlargement: false,
          })
          .jpeg({ quality: 90, mozjpeg: true })
          .toBuffer()

        // Upload to processed/{userId}/{contentItemId}/{platform}.jpg
        const storagePath = `${user.id}/${contentItemId}/${platform}.jpg`

        const { error: uploadError } = await admin.storage
          .from('processed')
          .upload(storagePath, resizedBuffer, {
            contentType: 'image/jpeg',
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
              file_size: resizedBuffer.length,
              hashtags: [],
            },
            { onConflict: 'content_item_id,platform' }
          )

        if (upsertError) {
          console.error(`DB upsert error [${platform}]:`, upsertError)
          errors.push({ platform, error: upsertError.message })
          continue
        }

        variants.push({ platform, url: publicUrl, width, height, file_size: resizedBuffer.length })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        console.error(`Sharp error [${platform}]:`, err)
        errors.push({ platform, error: msg })
      }
    }

    // Mark item as ready (it already is, but ensure status is set)
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
    console.error('Transform route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
