import { Metadata } from 'next'
import { Calendar, Clock, Send, Zap } from 'lucide-react'

export const metadata: Metadata = { title: 'Scheduler' }

const features = [
  {
    icon: Calendar,
    title: 'Visual Calendar',
    desc: 'Drag-and-drop scheduling across a weekly and monthly calendar view.',
    color: 'text-brand-400',
    bg: 'bg-brand-950',
  },
  {
    icon: Clock,
    title: 'Best Time Suggestions',
    desc: 'AI analyses your audience activity to suggest peak posting windows per platform.',
    color: 'text-purple-400',
    bg: 'bg-purple-950',
  },
  {
    icon: Send,
    title: 'Auto-Publish',
    desc: 'Connect your accounts once and Velocast publishes directly — no manual steps.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950',
  },
  {
    icon: Zap,
    title: 'Bulk Scheduling',
    desc: 'Queue an entire week of content in minutes with platform-specific captions.',
    color: 'text-amber-400',
    bg: 'bg-amber-950',
  },
]

export default function SchedulerPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Scheduler</h1>
        <p className="text-white/60 mt-1">Plan, schedule, and auto-publish to every platform</p>
      </div>

      {/* Coming soon banner */}
      <div className="card border-brand-600/40 bg-gradient-to-br from-brand-950/60 to-surface-card text-center py-16">
        <div className="w-16 h-16 bg-brand-600/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Calendar className="w-8 h-8 text-brand-400" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Coming in Week 4</h2>
        <p className="text-white/60 max-w-md mx-auto text-sm leading-relaxed">
          The scheduler is being built as part of the Social APIs week. Once your platform
          accounts are connected you&apos;ll be able to schedule and auto-publish from here.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-950 border border-brand-800 text-brand-300 text-sm">
          <Zap className="w-3.5 h-3.5" /> Week 4 — Social APIs
        </div>
      </div>

      {/* Preview of features */}
      <div>
        <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">
          What&apos;s coming
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <div key={f.title} className="card flex items-start gap-4 opacity-70">
              <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <div>
                <div className="font-medium mb-1">{f.title}</div>
                <div className="text-sm text-white/50">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
