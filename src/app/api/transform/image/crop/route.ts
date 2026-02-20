import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { PLATFORM_SPECS, type Platform } from '@/lib/constants/platforms'
import sharp from 'sharp'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { contentItemId, platform, cropX, cropY, cropW, cropH } = body as {
      contentItemId: string
      platform: string
      cropX: number
      cropY: number
      cropW: number
      cropH: number
    }

    if (!contentItemId || !platform || cropX == null || cropY == null || !cropW || !cropH) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = await createAdminClient()

    // Verify ownership
    const { data: item, error: itemError } = await admin
      .from('content_items')
      .select('id, type, storage_path')
      .eq('id', contentItemId)
      .eq('user_id', user.id)
      .single()

    if (itemError || !item || item.type !== 'image') {
      return NextResponse.json({ error: 'Image content item not found' }, { status: 404 })
    }

    const spec = PLATFORM_SPECS[platform as Platform]
    if (!spec?.image) {
      return NextResponse.json({ error: 'Invalid platform for image crop' }, { status: 400 })
    }

    const { width: targetW, height: targetH } = spec.image

    // Download original
    const { data: blob, error: downloadError } = await admin.storage
      .from('content')
      .download(item.storage_path)

    if (downloadError || !blob) {
      return NextResponse.json({ error: 'Failed to download original' }, { status: 500 })
    }

    const originalBuffer = Buffer.from(await blob.arrayBuffer())

    // Process: extract the user-chosen crop region then resize to exact target
    const variantBuffer = await sharp(originalBuffer)
      .rotate() // honour EXIF
      .extract({ left: Math.round(cropX), top: Math.round(cropY), width: Math.round(cropW), height: Math.round(cropH) })
      .resize(targetW, targetH, { fit: 'fill', kernel: 'lanczos3' })
      .jpeg({ quality: 95, mozjpeg: true, chromaSubsampling: '4:4:4' })
      .toBuffer()

    // Upload to processed bucket using user's supabase client (RLS INSERT policy exists)
    const storagePath = `${user.id}/${contentItemId}/${platform}.jpg`
    const uploadBlob = new Blob([new Uint8Array(variantBuffer)], { type: 'image/jpeg' })

    const { error: uploadError } = await supabase.storage
      .from('processed')
      .upload(storagePath, uploadBlob, { contentType: 'image/jpeg', upsert: true })

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from('processed').getPublicUrl(storagePath)

    // Upsert content_variant
    const { error: upsertError } = await admin
      .from('content_variants')
      .upsert(
        {
          content_item_id: contentItemId,
          platform,
          variant_url: publicUrl,
          storage_path: storagePath,
          width: targetW,
          height: targetH,
          file_size: variantBuffer.length,
        },
        { onConflict: 'content_item_id,platform' }
      )

    if (upsertError) {
      return NextResponse.json({ error: `DB upsert failed: ${upsertError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, variantUrl: publicUrl })
  } catch (err) {
    console.error('[transform/image/crop] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
