import { createClient } from '@/lib/supabase/server'
import { Upload, Video, Calendar, BarChart3, TrendingUp, Zap } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { count: contentCount } = await supabase
    .from('content_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  const { count: postCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('status', 'published')

  const stats = [
    { label: 'Total Uploads', value: contentCount ?? 0, icon: Upload, color: 'text-brand-400' },
    { label: 'Posts Published', value: postCount ?? 0, icon: Video, color: 'text-emerald-400' },
    { label: 'AI Credits Used', value: profile?.ai_credits_used ?? 0, icon: Zap, color: 'text-amber-400' },
    { label: 'Platforms Connected', value: 0, icon: TrendingUp, color: 'text-purple-400' },
  ]

  const quickActions = [
    { label: 'Upload Content', href: '/dashboard/upload', icon: Upload, desc: 'Add a new video or image' },
    { label: 'Content Library', href: '/dashboard/content', icon: Video, desc: 'View and manage your content' },
    { label: 'Scheduler', href: '/dashboard/scheduler', icon: Calendar, desc: 'Schedule your posts' },
    { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, desc: 'Track your performance' },
  ]

  const firstName = profile?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Creator'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {firstName} 👋
        </h1>
        <p className="text-white/60 mt-1">
          Here&apos;s what&apos;s happening with your content today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/60">{stat.label}</span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="text-3xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="card hover:border-brand-600/50 transition-all hover:-translate-y-0.5 group"
            >
              <action.icon className="w-6 h-6 text-brand-400 mb-3 group-hover:scale-110 transition-transform" />
              <div className="font-medium mb-1">{action.label}</div>
              <div className="text-sm text-white/60">{action.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Plan banner for free users */}
      {profile?.plan === 'free' && (
        <div className="card border-brand-600/50 bg-gradient-to-r from-brand-950 to-surface-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold mb-1">You&apos;re on the Free plan</div>
              <p className="text-sm text-white/60">
                Upgrade to Creator for unlimited uploads, all platforms, and the scheduler.
              </p>
            </div>
            <Link href="/dashboard/settings?tab=billing" className="btn-primary whitespace-nowrap">
              Upgrade — $29/mo
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
