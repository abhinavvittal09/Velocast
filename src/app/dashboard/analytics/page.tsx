import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import {
  BarChart3, TrendingUp, Eye, Heart, Share2,
  Zap, Layers, Upload, CheckCircle2, Image, Video,
} from 'lucide-react'
import Link from 'next/link'
import { PLATFORM_SPECS, ALL_PLATFORMS, type Platform } from '@/lib/constants/platforms'

export const metadata: Metadata = { title: 'Analytics' }

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // ── Real data from our DB ─────────────────────────────────────────────────
  const [
    { count: totalContent },
    { data: contentByType },
    { count: totalVariants },
    { data: variantsByPlatform },
    { data: recentItems },
  ] = await Promise.all([
    supabase
      .from('content_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('content_items')
      .select('type')
      .eq('user_id', user.id),
    supabase
      .from('content_variants')
      .select('content_items!inner(user_id)', { count: 'exact', head: true })
      .eq('content_items.user_id', user.id),
    supabase
      .from('content_variants')
      .select('platform, content_items!inner(user_id)')
      .eq('content_items.user_id', user.id),
    supabase
      .from('content_items')
      .select('id, title, type, created_at, file_size, content_variants(id, platform)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const imageCount = contentByType?.filter((c) => c.type === 'image').length ?? 0
  const videoCount = contentByType?.filter((c) => c.type === 'video').length ?? 0

  // Platform coverage: how many distinct platforms have at least 1 variant
  const platformsWithVariants = new Set(variantsByPlatform?.map((v) => v.platform) ?? [])

  // Top platforms by variant count
  const platformCounts: Record<string, number> = {}
  variantsByPlatform?.forEach((v) => {
    platformCounts[v.platform] = (platformCounts[v.platform] ?? 0) + 1
  })
  const topPlatforms = ALL_PLATFORMS
    .filter((p) => platformCounts[p])
    .sort((a, b) => (platformCounts[b] ?? 0) - (platformCounts[a] ?? 0))
    .slice(0, 6)

  const contentStats = [
    { label: 'Total Content', value: totalContent ?? 0, icon: Upload, color: 'text-brand-400', bg: 'bg-brand-950' },
    { label: 'Images', value: imageCount, icon: Image, color: 'text-emerald-400', bg: 'bg-emerald-950' },
    { label: 'Videos', value: videoCount, icon: Video, color: 'text-purple-400', bg: 'bg-purple-950' },
    { label: 'Variants Generated', value: totalVariants ?? 0, icon: Layers, color: 'text-amber-400', bg: 'bg-amber-950' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-white/60 mt-1">Your content library at a glance</p>
      </div>

      {/* ── Content stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {contentStats.map((m) => (
          <div key={m.label} className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/60">{m.label}</span>
              <div className={`w-7 h-7 ${m.bg} rounded-lg flex items-center justify-center`}>
                <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
              </div>
            </div>
            <div className="text-3xl font-bold">{m.value}</div>
          </div>
        ))}
      </div>

      {/* ── Platform coverage ────────────────────────────────────────────── */}
      {(totalContent ?? 0) > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Platform Coverage</h2>
            <span className="text-xs text-white/40">
              {platformsWithVariants.size} of {ALL_PLATFORMS.length} platforms
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {ALL_PLATFORMS.map((platform) => {
              const spec    = PLATFORM_SPECS[platform as Platform]
              const count   = platformCounts[platform] ?? 0
              const covered = count > 0
              const color   = spec.color === '#000000' || spec.color === '#010101' ? '#6B7280' : spec.color
              return (
                <div key={platform} className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-surface-border/20">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: covered ? `${color}22` : 'transparent',
                      border: `1.5px solid ${covered ? color : '#374151'}`,
                    }}
                  >
                    {covered
                      ? <CheckCircle2 className="w-4 h-4" style={{ color }} />
                      : <span className="text-white/20">—</span>}
                  </div>
                  <span className="text-[9px] text-white/40 text-center leading-tight line-clamp-2">{spec.label}</span>
                  {count > 0 && (
                    <span className="text-[9px] font-medium" style={{ color }}>{count}</span>
                  )}
                </div>
              )
            })}
          </div>
          {topPlatforms.length > 0 && (
            <div className="mt-4 pt-4 border-t border-surface-border/40">
              <p className="text-xs text-white/30 mb-3">Top platforms by variants</p>
              <div className="space-y-2">
                {topPlatforms.map((platform) => {
                  const spec  = PLATFORM_SPECS[platform as Platform]
                  const count = platformCounts[platform] ?? 0
                  const pct   = totalVariants ? Math.round((count / totalVariants) * 100) : 0
                  const color = spec.color === '#000000' || spec.color === '#010101' ? '#6B7280' : spec.color
                  return (
                    <div key={platform} className="flex items-center gap-3">
                      <span className="text-xs text-white/60 w-28 truncate flex-shrink-0">{spec.label}</span>
                      <div className="flex-1 h-1.5 bg-surface-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="text-xs text-white/40 w-6 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Recent items ─────────────────────────────────────────────────── */}
      {recentItems && recentItems.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Recent Content</h2>
            <Link href="/dashboard/content" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentItems.map((item) => {
              const variantCount = (item.content_variants as { id: string; platform: string }[]).length
              return (
                <Link
                  key={item.id}
                  href={`/dashboard/transform/${item.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-border/30 transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    item.type === 'video' ? 'bg-purple-950' : 'bg-emerald-950'
                  }`}>
                    {item.type === 'video'
                      ? <Video className="w-3.5 h-3.5 text-purple-400" />
                      : <Image className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title ?? 'Untitled'}</p>
                    <p className="text-xs text-white/40">
                      {(item.file_size / 1024 / 1024).toFixed(1)} MB
                      {variantCount > 0 && ` · ${variantCount} variant${variantCount !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  {variantCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-brand-400 flex-shrink-0">
                      <Layers className="w-3 h-3" />{variantCount}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Social analytics coming soon ─────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Social Performance</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Views', icon: Eye, color: 'text-brand-400', bg: 'bg-brand-950' },
            { label: 'Engagement Rate', icon: Heart, color: 'text-rose-400', bg: 'bg-rose-950' },
            { label: 'Shares', icon: Share2, color: 'text-emerald-400', bg: 'bg-emerald-950' },
            { label: 'Growth', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-950' },
          ].map((m) => (
            <div key={m.label} className="card opacity-40">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/60">{m.label}</span>
                <div className={`w-7 h-7 ${m.bg} rounded-lg flex items-center justify-center`}>
                  <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-white/30">—</div>
            </div>
          ))}
        </div>
        <div className="card border-brand-600/30 bg-gradient-to-br from-brand-950/40 to-surface-card text-center py-10">
          <div className="w-12 h-12 bg-brand-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-6 h-6 text-brand-400" />
          </div>
          <h3 className="text-lg font-bold mb-2">Social analytics coming soon</h3>
          <p className="text-white/50 max-w-sm mx-auto text-sm leading-relaxed">
            Connect your social accounts and Velocast will pull live views, likes,
            shares, and follower growth across every platform.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-950 border border-brand-800 text-brand-300 text-xs">
            <Zap className="w-3 h-3" /> Connect accounts to unlock
          </div>
        </div>
      </div>
    </div>
  )
}
