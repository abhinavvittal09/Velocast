import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { PLATFORM_SPECS, type Platform } from '@/lib/constants/platforms'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    const contentItemId = formData.get('contentItemId') as string | null
    const platform = formData.get('platform') as string | null

    if (!imageFile || !contentItemId || !platform) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = await createAdminClient()

    // Verify ownership
    const { data: item, error: itemError } = await admin
      .from('content_items')
      .select('id, type')
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

    // Convert uploaded File to Buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())

    // Upload to processed bucket
    const storagePath = `${user.id}/${contentItemId}/${platform}.jpg`
    const uploadBlob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' })

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
          file_size: imageBuffer.length,
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
