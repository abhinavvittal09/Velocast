import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** GET /api/posts — list all posts for the authenticated user */
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, platform, status, scheduled_at, published_at, caption,
      error_message, created_at, updated_at,
      content_variants (
        id, platform, width, height, caption, hashtags, variant_url,
        content_items ( id, title, type, storage_path )
      )
    `)
    .eq('user_id', user.id)
    .order('scheduled_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ posts: data })
}

/** POST /api/posts — create a scheduled post */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { content_variant_id, platform, scheduled_at, caption } = body

  if (!content_variant_id || !platform || !scheduled_at) {
    return NextResponse.json(
      { error: 'content_variant_id, platform, and scheduled_at are required' },
      { status: 400 }
    )
  }

  // Verify the user owns the content variant
  const { data: variant } = await supabase
    .from('content_variants')
    .select('id, content_items ( user_id )')
    .eq('id', content_variant_id)
    .single()

  const itemUserId = (variant?.content_items as { user_id: string } | null)?.user_id
  if (!variant || itemUserId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      content_variant_id,
      platform,
      connected_account_id: null,
      scheduled_at,
      caption: caption ?? null,
      status: 'scheduled',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ post: data }, { status: 201 })
}
