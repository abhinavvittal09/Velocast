import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await createAdminClient()

    // Verify ownership and get storage paths
    const { data: item, error: itemError } = await admin
      .from('content_items')
      .select('*, content_variants(storage_path)')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (itemError || !item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Delete processed variants from storage
    const variantPaths = (item.content_variants as { storage_path: string }[])
      .map((v) => v.storage_path)
      .filter(Boolean)

    if (variantPaths.length > 0) {
      await admin.storage.from('processed').remove(variantPaths)
    }

    // Delete original from content storage
    if (item.storage_path) {
      await admin.storage.from('content').remove([item.storage_path])
    }

    // Delete from DB (FK cascade removes content_variants)
    const { error: deleteError } = await admin
      .from('content_items')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Content delete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
