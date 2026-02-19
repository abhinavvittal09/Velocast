'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import {
  LayoutDashboard,
  Upload,
  Video,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Zap,
  Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Upload', href: '/dashboard/upload', icon: Upload },
  { label: 'Content', href: '/dashboard/content', icon: Video },
  { label: 'Platforms', href: '/dashboard/platforms', icon: Globe },
  { label: 'Scheduler', href: '/dashboard/scheduler', icon: Calendar },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/')
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-surface-card border-r border-surface-border flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-surface-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg gradient-text">Velocast</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive(item.href, item.exact)
                ? 'bg-brand-600 text-white'
                : 'text-white/60 hover:text-white hover:bg-surface-border'
            )}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-surface-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {(user.email ?? 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user.email}</div>
            <div className="text-xs text-white/40">Free plan</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-surface-border w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
