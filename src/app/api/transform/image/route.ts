import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { PLATFORM_SPECS, ALL_PLATFORMS, type Platform } from '@/lib/constants/platforms'

export const runtime = 'nodejs'

const IMAGE_PLATFORMS = ALL_PLATFORMS.filter((p) => PLATFORM_SPECS[p].image != null)

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

    if (itemError || !item || item.type !== 'image') {
      return NextResponse.json({ error: 'Image content item not found' }, { status: 404 })
    }

    const targetPlatforms = requestedPlatforms
      ? requestedPlatforms.filter((p) => PLATFORM_SPECS[p]?.image)
      : IMAGE_PLATFORMS

    // ── Avoid re-queuing platforms already being processed ─
    const { data: processingJobs } = await admin
      .from('transform_jobs')
      .select('platform')
      .eq('content_item_id', contentItemId)
      .eq('status', 'processing')

    const processingSet = new Set((processingJobs ?? []).map((j) => j.platform))

    // Delete non-processing jobs for this item (allow clean re-queue)
    await admin
      .from('transform_jobs')
      .delete()
      .eq('content_item_id', contentItemId)
      .neq('status', 'processing')

    // Enqueue one job per platform (skip any currently processing)
    const platformsToQueue = targetPlatforms.filter((p) => !processingSet.has(p))

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
        console.error('Job enqueue error:', insertError)
        return NextResponse.json({ error: 'Failed to queue jobs' }, { status: 500 })
      }
    }

    return NextResponse.json({
      queued: platformsToQueue.length,
      skipped: processingSet.size,
      platforms: platformsToQueue,
    })
  } catch (err) {
    console.error('Image enqueue error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
