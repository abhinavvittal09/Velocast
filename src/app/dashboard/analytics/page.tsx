import { Metadata } from 'next'
import { BarChart3, TrendingUp, Eye, Heart, Share2, Zap } from 'lucide-react'

export const metadata: Metadata = { title: 'Analytics' }

const metrics = [
  { label: 'Total Views', value: '—', icon: Eye, color: 'text-brand-400', bg: 'bg-brand-950' },
  { label: 'Engagement Rate', value: '—', icon: Heart, color: 'text-rose-400', bg: 'bg-rose-950' },
  { label: 'Shares', value: '—', icon: Share2, color: 'text-emerald-400', bg: 'bg-emerald-950' },
  { label: 'Growth', value: '—', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-950' },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-white/60 mt-1">Track performance across every platform in one place</p>
      </div>

      {/* Placeholder stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="card opacity-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/60">{m.label}</span>
              <div className={`w-7 h-7 ${m.bg} rounded-lg flex items-center justify-center`}>
                <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white/30">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Coming soon */}
      <div className="card border-brand-600/40 bg-gradient-to-br from-brand-950/60 to-surface-card text-center py-16">
        <div className="w-16 h-16 bg-brand-600/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <BarChart3 className="w-8 h-8 text-brand-400" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Coming in Week 5</h2>
        <p className="text-white/60 max-w-md mx-auto text-sm leading-relaxed">
          Once your social accounts are connected, Velocast will pull live performance
          data — views, likes, comments, shares, and follower growth — across every platform.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-950 border border-brand-800 text-brand-300 text-sm">
          <Zap className="w-3.5 h-3.5" /> Week 5 — Analytics
        </div>
      </div>

      {/* Preview chart skeleton */}
      <div className="card opacity-40">
        <div className="flex items-center justify-between mb-6">
          <div className="h-4 bg-surface-border rounded w-32" />
          <div className="h-4 bg-surface-border rounded w-20" />
        </div>
        <div className="flex items-end gap-2 h-32">
          {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 45].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-brand-600/20 rounded-t"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
