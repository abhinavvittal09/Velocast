import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SchedulerClient from '@/components/dashboard/SchedulerClient'

export const metadata: Metadata = { title: 'Scheduler' }

export default async function SchedulerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="animate-fade-in">
      <SchedulerClient userId={user.id} />
    </div>
  )
}
