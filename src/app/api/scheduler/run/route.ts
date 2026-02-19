import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Stub: publish to the given platform.
 * Real implementations will be added when platform OAuth tokens are wired up (Days 22-26).
 * Returns a mock platform_post_id so the scheduler loop can be tested end-to-end.
 */
async function publishToPlatform(post: {
  id: string
  platform: string
  caption: string | null
  connected_accounts: { platform_username: string | null } | null
  content_variants: { variant_url: string } | null
}): Promise<string> {
  if (!post.connected_accounts) {
    throw new Error('No connected account for this platform')
  }
  // TODO: wire up real platform APIs in Days 22-26
  console.log(
    `[Scheduler] Stub publish → platform=${post.platform}` +
    ` account=${post.connected_accounts.platform_username ?? 'unknown'}` +
    ` url=${post.content_variants?.variant_url ?? 'n/a'}`
  )
  return `mock_${post.platform}_${post.id}`
}

/**
 * GET /api/scheduler/run
 * Called by Vercel Cron every minute.
 * Fetches all due scheduled posts and attempts to publish them.
 */
export async function GET(req: NextRequest) {
  // Auth: Vercel sends the cron secret as a header; local dev can pass ?secret=
  const cronSecret =
    req.headers.get('x-vercel-cron-secret') ??
    req.nextUrl.searchParams.get('secret')

  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()
  const now = new Date().toISOString()

  // Fetch posts that are due and have a connected account
  const { data: duePosts, error } = await supabase
    .from('posts')
    .select(`
      id, platform, caption,
      content_variants ( variant_url ),
      connected_accounts ( platform_username )
    `)
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .not('connected_account_id', 'is', null)
    .limit(10)

  if (error) {
    console.error('[Scheduler] Query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = { processed: 0, published: 0, failed: 0 }

  for (const post of duePosts ?? []) {
    results.processed++

    // Mark as publishing to prevent double-processing
    await supabase
      .from('posts')
      .update({ status: 'publishing', updated_at: now })
      .eq('id', post.id)

    try {
      const platformPostId = await publishToPlatform(post as Parameters<typeof publishToPlatform>[0])

      await supabase
        .from('posts')
        .update({
          status: 'published',
          published_at: now,
          platform_post_id: platformPostId,
          updated_at: now,
        })
        .eq('id', post.id)

      results.published++
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown publish error'
      console.error(`[Scheduler] Failed to publish post ${post.id}:`, message)

      await supabase
        .from('posts')
        .update({
          status: 'failed',
          error_message: message,
          updated_at: now,
        })
        .eq('id', post.id)

      results.failed++
    }
  }

  return NextResponse.json({ success: true, now, ...results })
}
