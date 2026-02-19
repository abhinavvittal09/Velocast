import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { PLATFORM_SPECS, ALL_PLATFORMS, type Platform } from '@/lib/constants/platforms'
import { waitUntil } from '@vercel/functions'

export const runtime = 'nodejs'

const VIDEO_PLATFORMS = ALL_PLATFORMS.filter((p) => PLATFORM_SPECS[p].video != null)

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

    // ── Verify ownership ───────────────────────────────────
    const { data: item, error: itemError } = await admin
      .from('content_items')
      .select('id, type')
      .eq('id', contentItemId)
      .eq('user_id', user.id)
      .single()

    if (itemError || !item || item.type !== 'video') {
      return NextResponse.json({ error: 'Video content item not found' }, { status: 404 })
    }

    const targetPlatforms = requestedPlatforms
      ? requestedPlatforms.filter((p) => PLATFORM_SPECS[p]?.video)
      : VIDEO_PLATFORMS

    // ── Avoid re-queuing platforms already being processed ─
    const { data: processingJobs } = await admin
      .from('transform_jobs')
      .select('platform')
      .eq('content_item_id', contentItemId)
      .in('platform', targetPlatforms)
      .eq('status', 'processing')

    const processingSet = new Set((processingJobs ?? []).map((j) => j.platform))

    // Delete existing non-processing jobs only for the target platforms so we
    // don't accidentally wipe jobs for other platforms the user didn't request.
    const platformsToQueue = targetPlatforms.filter((p) => !processingSet.has(p))
    if (platformsToQueue.length > 0) {
      await admin
        .from('transform_jobs')
        .delete()
        .eq('content_item_id', contentItemId)
        .in('platform', platformsToQueue)
        .neq('status', 'processing')
    }

    if (platformsToQueue.length > 0) {
      const { error: insertError } = await admin.from('transform_jobs').insert(
        platformsToQueue.map((platform) => ({
          user_id: user.id,
          content_item_id: contentItemId,
          platform,
          type: 'video' as const,
        }))
      )

      if (insertError) {
        console.error('Job enqueue error:', insertError)
        return NextResponse.json({ error: 'Failed to queue jobs' }, { status: 500 })
      }

      // Trigger the job processor immediately so jobs don't wait for the daily cron.
      // waitUntil keeps the function alive after the response is sent.
      const processorUrl = new URL('/api/jobs/process', request.url).toString()
      const authHeaders: HeadersInit = process.env.CRON_SECRET
        ? { Authorization: `Bearer ${process.env.CRON_SECRET}` }
        : {}
      waitUntil(fetch(processorUrl, { headers: authHeaders }))
    }

    return NextResponse.json({
      queued: platformsToQueue.length,
      skipped: processingSet.size,
      platforms: platformsToQueue,
    })
  } catch (err) {
    console.error('Video enqueue error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
