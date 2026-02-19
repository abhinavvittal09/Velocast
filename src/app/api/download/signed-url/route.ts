import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { PLATFORM_SPECS } from '@/lib/constants/platforms'

export const runtime = 'nodejs'

const SIGNED_URL_EXPIRY = 3600 // 1 hour

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { storagePath, platform, width, height, title } = body as {
      storagePath: string
      platform: string
      width?: number
      height?: number
      title?: string
    }

    if (!storagePath) {
      return NextResponse.json({ error: 'storagePath is required' }, { status: 400 })
    }

    // Security: only allow access to this user's own files
    if (!storagePath.startsWith(`processed/${user.id}/`)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = await createAdminClient()
    const { data, error } = await admin.storage
      .from('processed')
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRY)

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
    }

    // Build a descriptive filename
    const ext = storagePath.split('.').pop() ?? 'bin'
    const platformLabel = PLATFORM_SPECS[platform as keyof typeof PLATFORM_SPECS]?.label
      .toLowerCase()
      .replace(/\s+\/?\s*/g, '_')
      ?? platform
    const dims = width && height ? `_${width}x${height}` : ''
    const base = title
      ? title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)
      : 'content'
    const filename = `velocast_${platformLabel}${dims}_${base}.${ext}`

    return NextResponse.json({ signedUrl: data.signedUrl, filename })
  } catch (err) {
    console.error('Signed URL error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
