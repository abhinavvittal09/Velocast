import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import SettingsClient from '@/components/dashboard/SettingsClient'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <SettingsClient
      user={{ id: user.id, email: user.email ?? '' }}
      profile={profile}
      initialTab={searchParams.tab ?? 'profile'}
    />
  )
}
