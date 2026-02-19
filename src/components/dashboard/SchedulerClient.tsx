'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Calendar, List, Plus, X, ChevronLeft, ChevronRight,
  Clock, Trash2, AlertCircle, Loader2, CheckCircle2,
  RefreshCw, Send, Info,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { PLATFORM_SPECS, type Platform } from '@/lib/constants/platforms'
import {
  POSTING_PROFILES, getSlotScore, formatHour, type DayOfWeek,
} from '@/lib/constants/posting-times'
import {
  format, startOfWeek, addDays, addWeeks, isSameDay,
  parseISO, isToday, isPast,
} from 'date-fns'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ContentItem {
  id: string
  title: string | null
  type: 'image' | 'video'
  storage_path: string
  original_url: string
  status: string
  content_variants: VariantMeta[]
}

interface VariantMeta {
  id: string
  platform: string
  width: number
  height: number
  caption: string | null
  hashtags: string[]
  variant_url: string
}

interface ScheduledPost {
  id: string
  platform: string
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'
  scheduled_at: string | null
  published_at: string | null
  caption: string | null
  error_message: string | null
  created_at: string
  content_variants: {
    id: string
    platform: string
    width: number
    height: number
    caption: string | null
    variant_url: string
    content_items: {
      id: string
      title: string | null
      type: 'image' | 'video'
      storage_path: string
    } | null
  } | null
}

// ── Platform helpers ───────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  instagram_feed:  '#E1306C',
  instagram_reels: '#C13584',
  instagram_story: '#833AB4',
  tiktok:          '#69C9D0',
  youtube:         '#FF0000',
  youtube_shorts:  '#FF0000',
  linkedin:        '#0A66C2',
  twitter:         '#8B8B8B',
  facebook:        '#1877F2',
}

function platformColor(platform: string) {
  return PLATFORM_COLORS[platform] ?? '#6B7280'
}

function platformLabel(platform: string) {
  return PLATFORM_SPECS[platform as Platform]?.label ?? platform
}

function platformIcon(platform: string) {
  return PLATFORM_SPECS[platform as Platform]?.icon ?? '📱'
}

// ── Optimal time helper ────────────────────────────────────────────────────────

function bestHourForPlatform(platform: string, dateStr: string): number {
  const profileKey = platform.replace(/_feed|_reels|_story|_shorts/, '')
  const prof = POSTING_PROFILES.find((p) => p.key === profileKey)
  if (!prof) return 12

  const dayIndex = new Date(dateStr + 'T12:00:00').getDay()
  const dayNames: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const day = dayNames[dayIndex]
  const profile = prof.video

  let bestHour = 12
  let bestScore = -1
  for (let h = 6; h <= 22; h++) {
    const score = getSlotScore(profile, 'general', day, h)
    if (score > bestScore) { bestScore = score; bestHour = h }
  }
  return bestHour
}

// ── Week calendar helpers ──────────────────────────────────────────────────────

function getWeekDays(offset: number): Date[] {
  const start = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), offset)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ScheduledPost['status'] }) {
  const map = {
    scheduled:  { label: 'Scheduled',   cls: 'bg-brand-900/60 text-brand-300 border-brand-700/40' },
    publishing: { label: 'Publishing…', cls: 'bg-amber-900/60 text-amber-300 border-amber-700/40' },
    published:  { label: 'Published',   cls: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/40' },
    failed:     { label: 'Failed',      cls: 'bg-rose-900/60 text-rose-300 border-rose-700/40' },
    draft:      { label: 'Draft',       cls: 'bg-surface-border/60 text-white/40 border-surface-border' },
  }
  const { label, cls } = map[status] ?? map.draft
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border', cls)}>
      {label}
    </span>
  )
}

// ── Platform chip ──────────────────────────────────────────────────────────────

function PlatformDot({ platform, size = 8 }: { platform: string; size?: number }) {
  return (
    <span
      className="inline-block rounded-full flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: platformColor(platform) }}
    />
  )
}

// ── Week View ─────────────────────────────────────────────────────────────────

function WeekView({
  weekDays,
  weekOffset,
  posts,
  deletingId,
  onWeekChange,
  onDelete,
}: {
  weekDays: Date[]
  weekOffset: number
  posts: ScheduledPost[]
  deletingId: string | null
  onWeekChange: (offset: number) => void
  onDelete: (id: string) => void
}) {
  const start = weekDays[0]
  const end = weekDays[6]

  return (
    <div className="card overflow-x-auto">
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4 min-w-[560px]">
        <button
          onClick={() => onWeekChange(weekOffset - 1)}
          className="p-1.5 rounded-lg hover:bg-surface-border/50 text-white/50 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-white/70">
          {format(start, 'MMM d')} – {format(end, 'MMM d, yyyy')}
          {weekOffset === 0 && (
            <span className="ml-2 text-brand-400 text-xs font-normal">This week</span>
          )}
        </span>
        <button
          onClick={() => onWeekChange(weekOffset + 1)}
          className="p-1.5 rounded-lg hover:bg-surface-border/50 text-white/50 hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7 gap-1 min-w-[560px]">
        {weekDays.map((day) => {
          const dayPosts = posts.filter(
            (p) => p.scheduled_at && isSameDay(parseISO(p.scheduled_at), day)
          )
          const today = isToday(day)

          return (
            <div key={day.toISOString()} className="min-h-[120px]">
              {/* Day header */}
              <div className={cn(
                'text-center py-1.5 mb-1 rounded-lg text-xs',
                today
                  ? 'bg-brand-500/20 text-brand-300 font-semibold'
                  : 'text-white/40'
              )}>
                <div className="font-medium">{format(day, 'EEE')}</div>
                <div className={cn('text-[11px]', today ? 'text-brand-300' : 'text-white/30')}>
                  {format(day, 'd')}
                </div>
              </div>

              {/* Posts for this day */}
              <div className="space-y-1">
                {dayPosts.slice(0, 4).map((post) => (
                  <div
                    key={post.id}
                    className="group relative rounded-md px-1.5 py-1 text-[10px] leading-tight cursor-default"
                    style={{ backgroundColor: platformColor(post.platform) + '22', borderLeft: `2px solid ${platformColor(post.platform)}` }}
                  >
                    <div className="font-medium text-white/80 truncate">
                      {post.scheduled_at ? format(parseISO(post.scheduled_at), 'h:mm a') : '—'}
                    </div>
                    <div className="text-white/50 truncate">
                      {post.content_variants?.content_items?.title ?? 'Untitled'}
                    </div>
                    {/* Delete button on hover */}
                    {['scheduled', 'failed', 'draft'].includes(post.status) && (
                      <button
                        onClick={() => onDelete(post.id)}
                        disabled={deletingId === post.id}
                        className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-rose-500/30 text-white/50 hover:text-rose-400 transition-all"
                      >
                        {deletingId === post.id
                          ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          : <X className="w-2.5 h-2.5" />}
                      </button>
                    )}
                    <StatusBadge status={post.status} />
                  </div>
                ))}
                {dayPosts.length > 4 && (
                  <div className="text-[10px] text-white/30 pl-1.5">
                    +{dayPosts.length - 4} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── List View ─────────────────────────────────────────────────────────────────

function ListView({
  posts,
  deletingId,
  onDelete,
}: {
  posts: ScheduledPost[]
  deletingId: string | null
  onDelete: (id: string) => void
}) {
  const upcoming = posts.filter((p) =>
    ['scheduled', 'publishing', 'draft'].includes(p.status)
  )
  const past = posts.filter((p) =>
    ['published', 'failed'].includes(p.status)
  )

  if (posts.length === 0) {
    return (
      <div className="card border-dashed text-center py-12 text-white/30 text-sm">
        No posts scheduled yet. Click &quot;Schedule Post&quot; to get started.
      </div>
    )
  }

  const Row = ({ post }: { post: ScheduledPost }) => (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-surface-border/20 rounded-lg transition-colors group">
      <PlatformDot platform={post.platform} size={10} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-white/80 truncate">
            {post.content_variants?.content_items?.title ?? 'Untitled'}
          </span>
          <span className="text-xs text-white/30">{platformLabel(post.platform)}</span>
        </div>
        {post.error_message && (
          <p className="text-xs text-rose-400 mt-0.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {post.error_message}
          </p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-xs text-white/40">
          {post.scheduled_at
            ? format(parseISO(post.scheduled_at), 'MMM d, h:mm a')
            : '—'}
        </div>
        <div className="mt-0.5">
          <StatusBadge status={post.status} />
        </div>
      </div>
      {['scheduled', 'failed', 'draft'].includes(post.status) && (
        <button
          onClick={() => onDelete(post.id)}
          disabled={deletingId === post.id}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/20 text-white/30 hover:text-rose-400 transition-all flex-shrink-0"
        >
          {deletingId === post.id
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {upcoming.length > 0 && (
        <div className="card">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 px-2">
            Upcoming ({upcoming.length})
          </h3>
          <div className="divide-y divide-surface-border/30">
            {upcoming.map((p) => <Row key={p.id} post={p} />)}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div className="card">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 px-2">
            History ({past.length})
          </h3>
          <div className="divide-y divide-surface-border/30">
            {past.map((p) => <Row key={p.id} post={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Schedule Modal ─────────────────────────────────────────────────────────────

function ScheduleModal({
  onClose,
  onScheduled,
  userId,
}: {
  onClose: () => void
  onScheduled: () => void
  userId: string
}) {
  const supabase = useMemo(() => createClient(), [])

  // Step: 'content' → 'datetime' → 'captions'
  const [step, setStep] = useState<'content' | 'datetime' | 'captions'>('content')

  // Content / variant selection
  const [items, setItems] = useState<ContentItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [selectedVariants, setSelectedVariants] = useState<VariantMeta[]>([])

  // Date / time
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [time, setTime] = useState('12:00')

  // Per-variant captions
  const [captions, setCaptions] = useState<Record<string, string>>({})

  // Scheduling state
  const [scheduling, setScheduling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch content items with their variants
  useEffect(() => {
    async function load() {
      setLoadingItems(true)
      const { data } = await supabase
        .from('content_items')
        .select('id, title, type, storage_path, original_url, status, content_variants(id, platform, width, height, caption, hashtags, variant_url)')
        .eq('user_id', userId)
        .eq('status', 'ready')
        .order('created_at', { ascending: false })
      setItems((data as ContentItem[]) ?? [])
      setLoadingItems(false)
    }
    load()
  }, [supabase, userId])

  const selectedItem = items.find((i) => i.id === selectedItemId)

  function toggleVariant(v: VariantMeta) {
    setSelectedVariants((prev) => {
      const exists = prev.some((x) => x.id === v.id)
      if (exists) return prev.filter((x) => x.id !== v.id)
      // Auto-fill caption from variant
      setCaptions((c) => ({ ...c, [v.id]: c[v.id] ?? v.caption ?? '' }))
      return [...prev, v]
    })
  }

  function applyOptimalTime() {
    if (!selectedVariants.length) return
    // Use first selected platform as the reference
    const h = bestHourForPlatform(selectedVariants[0].platform, date)
    setTime(`${String(h).padStart(2, '0')}:00`)
  }

  async function schedule() {
    if (!selectedVariants.length || !date || !time) return
    setScheduling(true)
    setError(null)

    const scheduled_at = new Date(`${date}T${time}:00`).toISOString()

    const results = await Promise.allSettled(
      selectedVariants.map((v) =>
        fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content_variant_id: v.id,
            platform: v.platform,
            scheduled_at,
            caption: captions[v.id] ?? v.caption ?? '',
          }),
        })
      )
    )

    const failed = results.filter((r) => r.status === 'rejected').length
    if (failed === results.length) {
      setError('Failed to schedule posts. Please try again.')
      setScheduling(false)
      return
    }

    onScheduled()
    onClose()
  }

  const canGoToDatetime = selectedVariants.length > 0
  const canGoToCaptions = date && time
  const canSchedule    = Object.values(captions).every((c) => c.length > 0) || selectedVariants.every((v) => v.caption)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-surface-card border border-surface-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <Send className="w-5 h-5 text-brand-400" />
            <h2 className="font-semibold">Schedule a Post</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-border/50 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-6 pt-4 pb-3 flex-shrink-0">
          {(['content', 'datetime', 'captions'] as const).map((s, i) => {
            const labels = { content: '1. Content', datetime: '2. Date & Time', captions: '3. Captions' }
            const active = step === s
            const done   = (step === 'datetime' && i === 0) ||
                           (step === 'captions' && i <= 1)
            return (
              <div key={s} className="flex items-center gap-0 flex-1">
                <button
                  disabled={!done && !active}
                  onClick={() => {
                    if (done) setStep(s)
                  }}
                  className={cn(
                    'text-xs font-medium px-2 py-1 rounded-md transition-colors',
                    active ? 'text-white' : done ? 'text-white/50 hover:text-white' : 'text-white/25 cursor-default'
                  )}
                >
                  {labels[s]}
                </button>
                {i < 2 && <div className="flex-1 h-px bg-surface-border/60 mx-1" />}
              </div>
            )
          })}
        </div>

        {/* Modal body (scrollable) */}
        <div className="overflow-y-auto flex-1 px-6 pb-4">

          {/* ── Step 1: Content selection ──────────────────────────────────── */}
          {step === 'content' && (
            <div className="space-y-4">
              {loadingItems ? (
                <div className="py-10 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-white/30" />
                </div>
              ) : items.length === 0 ? (
                <div className="py-10 text-center text-white/30 text-sm">
                  No content ready to schedule. Upload and transform content first.
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-white/40 mb-3">
                    Select a content item, then choose which platform variants to schedule.
                  </p>
                  {items.map((item) => {
                    const chosen = selectedItemId === item.id
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'rounded-xl border transition-colors',
                          chosen
                            ? 'border-brand-500/60 bg-brand-500/10'
                            : 'border-surface-border hover:border-surface-border/80 bg-surface/30'
                        )}
                      >
                        {/* Item row */}
                        <button
                          className="w-full flex items-center gap-3 p-3 text-left"
                          onClick={() => {
                            setSelectedItemId(item.id)
                            setSelectedVariants([])
                          }}
                        >
                          <div className="w-10 h-10 rounded-lg bg-surface-border/40 flex items-center justify-center flex-shrink-0 text-xl">
                            {item.type === 'video' ? '🎬' : '🖼'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">
                              {item.title ?? 'Untitled'}
                            </div>
                            <div className="text-xs text-white/40">
                              {item.content_variants.length} variant{item.content_variants.length !== 1 ? 's' : ''} available
                            </div>
                          </div>
                          {chosen && <CheckCircle2 className="w-4 h-4 text-brand-400 flex-shrink-0" />}
                        </button>

                        {/* Platform variant checkboxes (shown when this item is selected) */}
                        {chosen && item.content_variants.length > 0 && (
                          <div className="px-3 pb-3 pt-0 flex flex-wrap gap-2">
                            {item.content_variants.map((v) => {
                              const selected = selectedVariants.some((x) => x.id === v.id)
                              return (
                                <button
                                  key={v.id}
                                  onClick={() => toggleVariant(v)}
                                  className={cn(
                                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                                    selected
                                      ? 'border-brand-500 bg-brand-500/15 text-white'
                                      : 'border-surface-border text-white/50 hover:text-white hover:border-surface-border/80'
                                  )}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: platformColor(v.platform) }}
                                  />
                                  {platformIcon(v.platform)} {platformLabel(v.platform)}
                                  <span className="text-white/30 ml-0.5">{v.width}×{v.height}</span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                        {chosen && item.content_variants.length === 0 && (
                          <div className="px-3 pb-3 text-xs text-amber-400 flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5" />
                            No variants yet — go to Transform to create platform versions first.
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Date & Time ────────────────────────────────────────── */}
          {step === 'datetime' && (
            <div className="space-y-5">
              <p className="text-xs text-white/40">
                Choose when to publish. Times are in your local browser timezone.
              </p>

              {/* Selected variants summary */}
              <div className="flex flex-wrap gap-2">
                {selectedVariants.map((v) => (
                  <span
                    key={v.id}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border border-surface-border bg-surface/40"
                  >
                    <PlatformDot platform={v.platform} />
                    {platformLabel(v.platform)}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    value={date}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setDate(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              {/* Optimal time suggestion */}
              <button
                onClick={applyOptimalTime}
                className="flex items-center gap-2 text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                Apply optimal time for {platformLabel(selectedVariants[0]?.platform ?? '')}
                {' '}({formatHour(bestHourForPlatform(selectedVariants[0]?.platform ?? '', date))})
              </button>

              <div className="flex items-start gap-2 text-xs text-white/40 bg-surface-border/20 rounded-lg px-3 py-2">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>
                  Posting will be queued and auto-published once your platform accounts
                  are connected (Social APIs — Days 22-26).
                </span>
              </div>
            </div>
          )}

          {/* ── Step 3: Captions ───────────────────────────────────────────── */}
          {step === 'captions' && (
            <div className="space-y-4">
              <p className="text-xs text-white/40">
                Review and edit the caption for each platform. Auto-filled from your
                content variant.
              </p>
              {selectedVariants.map((v) => {
                const spec = PLATFORM_SPECS[v.platform as Platform]
                const limit = spec?.captionLimit ?? 2200
                const val   = captions[v.id] ?? ''
                return (
                  <div key={v.id} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <PlatformDot platform={v.platform} />
                      <label className="text-sm font-medium">{platformLabel(v.platform)}</label>
                      <span className="ml-auto text-[10px] text-white/30 tabular-nums">
                        {val.length}/{limit}
                      </span>
                    </div>
                    <textarea
                      value={val}
                      onChange={(e) => setCaptions((c) => ({ ...c, [v.id]: e.target.value }))}
                      maxLength={limit}
                      rows={4}
                      placeholder="Write your caption…"
                      className="input resize-none text-sm leading-relaxed w-full"
                    />
                    {val.length > limit * 0.9 && (
                      <p className="text-xs text-amber-400">
                        Approaching {platformLabel(v.platform)} caption limit.
                      </p>
                    )}
                  </div>
                )
              })}

              {error && (
                <div className="flex items-center gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-700/40 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-surface-border flex-shrink-0">
          <button
            onClick={step === 'content' ? onClose : () => setStep(step === 'captions' ? 'datetime' : 'content')}
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            {step === 'content' ? 'Cancel' : '← Back'}
          </button>

          {step === 'content' && (
            <button
              disabled={!canGoToDatetime}
              onClick={() => setStep('datetime')}
              className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next → Date & Time
            </button>
          )}
          {step === 'datetime' && (
            <button
              disabled={!canGoToCaptions}
              onClick={() => setStep('captions')}
              className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next → Captions
            </button>
          )}
          {step === 'captions' && (
            <button
              disabled={scheduling}
              onClick={schedule}
              className="btn-primary text-sm flex items-center gap-2 disabled:opacity-40"
            >
              {scheduling ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Scheduling…</>
              ) : (
                <><Send className="w-4 h-4" /> Schedule {selectedVariants.length} Post{selectedVariants.length !== 1 ? 's' : ''}</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SchedulerClient({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), [])

  const [view, setView]             = useState<'week' | 'list'>('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [posts, setPosts]           = useState<ScheduledPost[]>([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset])

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select(`
        id, platform, status, scheduled_at, published_at, caption,
        error_message, created_at, updated_at,
        content_variants (
          id, platform, width, height, caption, variant_url,
          content_items ( id, title, type, storage_path )
        )
      `)
      .eq('user_id', userId)
      .order('scheduled_at', { ascending: true })

    setPosts((data as ScheduledPost[]) ?? [])
    setLoading(false)
  }, [supabase, userId])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const deletePost = useCallback(async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id))
      }
    } finally {
      setDeletingId(null)
    }
  }, [])

  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length
  const publishedCount = posts.filter((p) => p.status === 'published').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-400" />
            Scheduler
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Plan and auto-publish to every platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-surface-border overflow-hidden">
            <button
              onClick={() => setView('week')}
              className={cn(
                'px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors',
                view === 'week' ? 'bg-brand-500/20 text-white' : 'text-white/50 hover:text-white'
              )}
            >
              <Calendar className="w-3.5 h-3.5" /> Week
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'px-3 py-1.5 text-sm flex items-center gap-1.5 border-l border-surface-border transition-colors',
                view === 'list' ? 'bg-brand-500/20 text-white' : 'text-white/50 hover:text-white'
              )}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
          </div>

          <button
            onClick={fetchPosts}
            className="p-2 rounded-lg border border-surface-border text-white/50 hover:text-white hover:border-surface-border/80 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-1.5 text-sm"
          >
            <Plus className="w-4 h-4" /> Schedule Post
          </button>
        </div>
      </div>

      {/* Stats strip */}
      {!loading && (scheduledCount > 0 || publishedCount > 0) && (
        <div className="flex gap-4 text-sm">
          {scheduledCount > 0 && (
            <span className="text-white/50">
              <span className="text-brand-300 font-semibold">{scheduledCount}</span> scheduled
            </span>
          )}
          {publishedCount > 0 && (
            <span className="text-white/50">
              <span className="text-emerald-400 font-semibold">{publishedCount}</span> published
            </span>
          )}
        </div>
      )}

      {/* Main view */}
      {loading ? (
        <div className="card py-16 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-white/30" />
        </div>
      ) : view === 'week' ? (
        <WeekView
          weekDays={weekDays}
          weekOffset={weekOffset}
          posts={posts}
          deletingId={deletingId}
          onWeekChange={setWeekOffset}
          onDelete={deletePost}
        />
      ) : (
        <ListView
          posts={posts}
          deletingId={deletingId}
          onDelete={deletePost}
        />
      )}

      {/* Platform legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-white/30">
        {Object.entries(PLATFORM_COLORS).map(([p, color]) => (
          <span key={p} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {platformLabel(p)}
          </span>
        ))}
      </div>

      {/* Schedule modal */}
      {showModal && (
        <ScheduleModal
          userId={userId}
          onClose={() => setShowModal(false)}
          onScheduled={fetchPosts}
        />
      )}
    </div>
  )
}
