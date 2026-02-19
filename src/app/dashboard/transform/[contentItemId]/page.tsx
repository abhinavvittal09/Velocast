import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import TransformClient from '@/components/dashboard/TransformClient'

export const metadata: Metadata = { title: 'Platform Variants' }

export default async function TransformPage({
  params,
}: {
  params: { contentItemId: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: item } = await supabase
    .from('content_items')
    .select('*, content_variants(*)')
    .eq('id', params.contentItemId)
    .eq('user_id', user.id)
    .single()

  if (!item) notFound()

  const variants = (item.content_variants ?? []) as Array<{
    id: string
    content_item_id: string
    platform: string
    variant_url: string
    storage_path: string
    width: number
    height: number
    file_size: number
    hashtags: string[]
    created_at: string
  }>

  return (
    <div className="animate-fade-in">
      <TransformClient item={item} initialVariants={variants} />
    </div>
  )
}
