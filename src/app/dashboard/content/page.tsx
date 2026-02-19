import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Upload } from 'lucide-react'
import ContentLibraryClient from '@/components/dashboard/ContentLibraryClient'

export const metadata: Metadata = { title: 'Content Library' }

export default async function ContentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Library</h1>
          <p className="text-white/60 mt-1">All your uploaded content</p>
        </div>
        <Link href="/dashboard/upload" className="btn-primary">
          <Upload className="w-4 h-4" /> Upload
        </Link>
      </div>

      <ContentLibraryClient userId={user.id} />
    </div>
  )
}
