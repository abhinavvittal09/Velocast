import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string) || file?.name || 'Untitled'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate size
    const isVideo = file.type.startsWith('video/')
    const maxSize = isVideo ? 500 * 1024 * 1024 : 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max ${isVideo ? '500MB' : '50MB'}.` },
        { status: 413 }
      )
    }

    // Validate type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    // Build storage path: userId/timestamp-filename
    const ext = file.name.split('.').pop() ?? (isVideo ? 'mp4' : 'jpg')
    const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    // Upload to Supabase Storage
    const adminClient = await createAdminClient()
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: storageError } = await adminClient.storage
      .from('content')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (storageError) {
      console.error('Storage error:', storageError)
      return NextResponse.json({ error: 'Storage upload failed' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = adminClient.storage
      .from('content')
      .getPublicUrl(storagePath)

    // Create content_item record
    const { data: contentItem, error: dbError } = await adminClient
      .from('content_items')
      .insert({
        user_id: user.id,
        type: isVideo ? 'video' : 'image',
        title,
        original_url: publicUrl,
        file_size: file.size,
        storage_path: storagePath,
        status: 'ready',
      })
      .select('id')
      .single()

    if (dbError || !contentItem) {
      console.error('DB error:', dbError)
      // Clean up orphaned storage file
      await adminClient.storage.from('content').remove([storagePath])
      return NextResponse.json({ error: 'Failed to save content record' }, { status: 500 })
    }

    // Increment user's monthly upload count
    await adminClient.rpc('increment_uploads', { user_id: user.id }).maybeSingle()

    return NextResponse.json({
      contentItemId: contentItem.id,
      url: publicUrl,
      type: isVideo ? 'video' : 'image',
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
