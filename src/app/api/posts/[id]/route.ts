import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** DELETE /api/posts/[id] — cancel (delete) a scheduled post */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership
  const { data: post } = await supabase
    .from('posts')
    .select('id, user_id, status')
    .eq('id', params.id)
    .single()

  if (!post || post.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (post.status === 'publishing') {
    return NextResponse.json(
      { error: 'Cannot delete a post that is currently being published' },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

/** PATCH /api/posts/[id] — update caption or reschedule a post */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: post } = await supabase
    .from('posts')
    .select('id, user_id, status')
    .eq('id', params.id)
    .single()

  if (!post || post.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!['draft', 'scheduled', 'failed'].includes(post.status)) {
    return NextResponse.json({ error: 'Cannot edit a published or in-progress post' }, { status: 409 })
  }

  const body = await req.json()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.scheduled_at !== undefined) updates.scheduled_at = body.scheduled_at
  if (body.caption !== undefined) updates.caption = body.caption

  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ post: data })
}
