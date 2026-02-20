import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { PLATFORM_SPECS, ALL_PLATFORMS, type Platform } from '@/lib/constants/platforms'

export const runtime = 'nodejs'
export const maxDuration = 60

const IMAGE_PLATFORMS = ALL_PLATFORMS.filter((p) => PLATFORM_SPECS[p].image != null)

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[transform/image] Auth failed:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const contentItemId: string = body.contentItemId
    const requestedPlatforms: Platform[] | undefined = body.platforms

    console.log('[transform/image] user:', user.id, 'item:', contentItemId, 'platforms:', requestedPlatforms)

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

    if (itemError || !item || item.type !== 'image') {
      console.error('[transform/image] Item lookup failed:', { itemError: itemError?.message, item, type: item?.type })
      return NextResponse.json({ error: 'Image content item not found' }, { status: 404 })
    }

    const targetPlatforms = requestedPlatforms
      ? requestedPlatforms.filter((p) => PLATFORM_SPECS[p]?.image)
      : IMAGE_PLATFORMS

    console.log('[transform/image] targetPlatforms:', targetPlatforms)

    // ── Avoid re-queuing platforms already being processed ─
    const { data: processingJobs, error: processingErr } = await admin
      .from('transform_jobs')
      .select('platform')
      .eq('content_item_id', contentItemId)
      .in('platform', targetPlatforms)
      .eq('status', 'processing')

    if (processingErr) console.error('[transform/image] processingJobs query error:', processingErr.message)

    const processingSet = new Set((processingJobs ?? []).map((j) => j.platform))

    // Delete existing non-processing jobs only for the target platforms so we
    // don't accidentally wipe jobs for other platforms the user didn't request.
    const platformsToQueue = targetPlatforms.filter((p) => !processingSet.has(p))
    console.log('[transform/image] platformsToQueue:', platformsToQueue)

    if (platformsToQueue.length > 0) {
      const { error: deleteErr } = await admin
        .from('transform_jobs')
        .delete()
        .eq('content_item_id', contentItemId)
        .in('platform', platformsToQueue)
        .neq('status', 'processing')

      if (deleteErr) console.error('[transform/image] delete error:', deleteErr.message)
    }

    if (platformsToQueue.length > 0) {
      const { error: insertError } = await admin.from('transform_jobs').insert(
        platformsToQueue.map((platform) => ({
          user_id: user.id,
          content_item_id: contentItemId,
          platform,
          type: 'image' as const,
        }))
      )

      if (insertError) {
        console.error('[transform/image] insert error:', insertError.message, insertError.details, insertError.hint)
        return NextResponse.json({ error: 'Failed to queue jobs', detail: insertError.message }, { status: 500 })
      }

      // Trigger the processor immediately. The non-awaited fetch keeps the
      // Node.js event loop alive after the response is sent, so it completes
      // in the background without blocking the client.
      const processorUrl = new URL('/api/jobs/process', request.url).toString()
      const authHeaders: HeadersInit = process.env.CRON_SECRET
        ? { Authorization: `Bearer ${process.env.CRON_SECRET}` }
        : {}
      fetch(processorUrl, { headers: authHeaders }).catch((e) => {
        console.error('[transform/image] processor trigger error:', e)
      })
    }

    console.log('[transform/image] success, queued:', platformsToQueue.length)
    return NextResponse.json({
      queued: platformsToQueue.length,
      skipped: processingSet.size,
      platforms: platformsToQueue,
    })
  } catch (err) {
    console.error('[transform/image] unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
