'use client'

import { useState, useMemo } from 'react'
import { TrendingUp, Info } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  POSTING_PROFILES,
  DAYS,
  HOURS,
  NICHE_LABELS,
  AUDIENCE_TIMEZONES,
  getSlotScore,
  scoreRating,
  scoreToStyle,
  formatHour,
  RATING_META,
  type DayOfWeek,
  type Niche,
} from '@/lib/constants/posting-times'

// ── Timezone utilities (browser-only) ─────────────────────────────────────────

/** Returns the UTC offset in minutes for a given IANA timezone right now. */
function getUtcOffsetMin(tz: string): number {
  const now = new Date()
  const a = new Date(now.toLocaleString('en-US', { timeZone: tz }))
  const b = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
  return Math.round((a.getTime() - b.getTime()) / 60000)
}

/**
 * Given an hour in the audience's timezone, return the equivalent hour
 * in the creator's browser timezone, plus how many days it shifts.
 */
function audienceToCreatorTime(
  audienceHour: number,
  audienceTz: string
): { hour: number; dayShift: number } {
  const creatorTz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const audienceOffset = getUtcOffsetMin(audienceTz)   // minutes from UTC
  const creatorOffset  = getUtcOffsetMin(creatorTz)    // minutes from UTC

  // audience hour → UTC → creator hour  (in fractional hours)
  const creatorHourRaw = audienceHour - audienceOffset / 60 + creatorOffset / 60
  const dayShift = Math.floor(creatorHourRaw / 24)
  const hour     = Math.round(((creatorHourRaw % 24) + 24) % 24)
  return { hour, dayShift }
}

// ── Component ─────────────────────────────────────────────────────────────────

type ContentType = 'image' | 'video'

interface SelectedSlot { day: DayOfWeek; hour: number }

export default function PostingTimeHeatmap() {
  const [platformKey, setPlatformKey]   = useState(POSTING_PROFILES[0].key)
  const [contentType, setContentType]   = useState<ContentType>('video')
  const [niche, setNiche]               = useState<Niche>('general')
  const [audienceTz, setAudienceTz]     = useState(AUDIENCE_TIMEZONES[0].tz)
  const [selected, setSelected]         = useState<SelectedSlot | null>(null)

  const platform = POSTING_PROFILES.find((p) => p.key === platformKey)!
  const profile  = contentType === 'image' ? platform.image : platform.video

  // Pre-compute the score for every cell (24 × 7 = 168)
  const scoreGrid = useMemo<number[][]>(() => {
    return HOURS.map((hour) =>
      DAYS.map((day) => getSlotScore(profile, niche, day, hour))
    )
  }, [profile, niche])

  // Info panel for the selected slot
  const selectedInfo = useMemo(() => {
    if (!selected) return null
    const score = getSlotScore(profile, niche, selected.day, selected.hour)
    const rating = scoreRating(score)
    const meta   = RATING_META[rating]
    const { hour: creatorHour, dayShift } = audienceToCreatorTime(selected.hour, audienceTz)
    const dayShiftNote =
      dayShift === 1  ? ' (next day your time)' :
      dayShift === -1 ? ' (prev day your time)' : ''
    const creatorTzLabel = Intl.DateTimeFormat().resolvedOptions().timeZone
      .replace('_', ' ')
      .split('/')
      .pop() ?? 'your timezone'
    return { score, rating, meta, creatorHour, dayShiftNote, creatorTzLabel }
  }, [selected, profile, niche, audienceTz])

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-brand-400" />
          Best Times to Post
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Research-based optimal windows per platform, content type, niche and audience region.
          All times shown in <strong className="text-white/70">audience local time</strong>.
        </p>
      </div>

      {/* ── Controls ────────────────────────────────────────────────────────── */}
      <div className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Platform */}
          <div>
            <label className="label">Platform</label>
            <div className="flex flex-wrap gap-1.5">
              {POSTING_PROFILES.map((p) => (
                <button
                  key={p.key}
                  onClick={() => { setPlatformKey(p.key); setSelected(null) }}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    platformKey === p.key
                      ? 'border-brand-500 bg-brand-500/15 text-white'
                      : 'border-surface-border text-white/50 hover:text-white hover:border-surface-border/80'
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.color === '#010101' || p.color === '#000000' ? '#fff' : p.color }}
                  />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content type */}
          <div>
            <label className="label">Content Type</label>
            <div className="flex gap-2">
              {(['image', 'video'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setContentType(t); setSelected(null) }}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize',
                    contentType === t
                      ? 'border-brand-500 bg-brand-500/15 text-white'
                      : 'border-surface-border text-white/50 hover:text-white'
                  )}
                >
                  {t === 'image' ? '🖼 Image' : '🎬 Video'}
                </button>
              ))}
            </div>
          </div>

          {/* Audience timezone */}
          <div>
            <label className="label">Audience Region</label>
            <select
              value={audienceTz}
              onChange={(e) => setAudienceTz(e.target.value)}
              className="input"
            >
              {AUDIENCE_TIMEZONES.map((tz) => (
                <option key={tz.tz} value={tz.tz}>{tz.label}</option>
              ))}
            </select>
          </div>

          {/* Niche */}
          <div>
            <label className="label">Niche / Category</label>
            <select
              value={niche}
              onChange={(e) => { setNiche(e.target.value as Niche); setSelected(null) }}
              className="input"
            >
              {(Object.entries(NICHE_LABELS) as [Niche, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Context note */}
        <div className="flex items-start gap-2 text-xs text-white/40 bg-surface-border/30 rounded-lg px-3 py-2">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>
            Times shown are in <strong className="text-white/60">audience local time</strong>{' '}
            ({AUDIENCE_TIMEZONES.find((t) => t.tz === audienceTz)?.label}).
            Click any cell to see the equivalent in your local timezone.
          </span>
        </div>
      </div>

      {/* ── Heatmap ─────────────────────────────────────────────────────────── */}
      <div className="card overflow-x-auto">
        <div className="min-w-[480px]">
          {/* Day headers */}
          <div className="flex mb-1 ml-14">
            {DAYS.map((d) => (
              <div key={d} className="flex-1 text-center text-[11px] font-semibold text-white/40 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Rows: one per hour */}
          <div className="space-y-0.5">
            {HOURS.map((hour) => (
              <div key={hour} className="flex items-center gap-0 h-6">
                {/* Hour label — show every 3 hours */}
                <div className="w-14 text-right pr-2 text-[10px] text-white/35 flex-shrink-0 leading-none">
                  {hour % 3 === 0 ? formatHour(hour) : ''}
                </div>

                {/* Day cells */}
                {DAYS.map((day, di) => {
                  const score   = scoreGrid[hour][di]
                  const isSelected =
                    selected?.day === day && selected?.hour === hour
                  return (
                    <button
                      key={day}
                      onClick={() => setSelected(isSelected ? null : { day, hour })}
                      title={`${day} ${formatHour(hour)} — score ${score}/100`}
                      className={cn(
                        'flex-1 h-full rounded-sm mx-0.5 transition-all duration-100',
                        isSelected && 'ring-2 ring-white ring-offset-1 ring-offset-surface-card'
                      )}
                      style={scoreToStyle(score)}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-4 justify-end text-[10px] text-white/40">
            <span>Low</span>
            <div className="flex gap-0.5">
              {[5, 20, 38, 55, 75, 92].map((s) => (
                <div key={s} className="w-5 h-3 rounded-sm" style={scoreToStyle(s)} />
              ))}
            </div>
            <span>High</span>
          </div>
        </div>
      </div>

      {/* ── Selected slot info ───────────────────────────────────────────────── */}
      {selected && selectedInfo ? (
        <div className={cn(
          'card border',
          selectedInfo.meta.bgClass
        )}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                {selected.day} · {formatHour(selected.hour)}{' '}
                <span className="text-white/40 font-normal text-xs">
                  ({AUDIENCE_TIMEZONES.find((t) => t.tz === audienceTz)?.label} audience time)
                </span>
              </p>
              <p className="text-xs text-white/50">
                Post at{' '}
                <strong className="text-white/80">
                  {formatHour(selectedInfo.creatorHour)}
                </strong>{' '}
                {selectedInfo.creatorTzLabel} time{selectedInfo.dayShiftNote}
              </p>
              <p className="text-xs text-white/50 mt-2 max-w-xl leading-relaxed">
                {profile.note}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className={cn('text-2xl font-bold tabular-nums', selectedInfo.meta.colorClass)}>
                {selectedInfo.score}
                <span className="text-sm font-normal text-white/30">/100</span>
              </span>
              <span className={cn('text-sm font-semibold', selectedInfo.meta.colorClass)}>
                {selectedInfo.meta.label}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card border-dashed text-center py-8 text-white/30 text-sm">
          Click any cell on the heatmap to see the score and your local posting time
        </div>
      )}

      {/* ── Platform note ────────────────────────────────────────────────────── */}
      <div className="card bg-surface/50 text-sm text-white/50 space-y-1">
        <p className="font-semibold text-white/70">About this data</p>
        <p>
          Recommendations are based on aggregated industry research across millions of posts.
          They reflect the best starting point for new accounts — once you have 90+ days of
          analytics data, Velocast will personalise these recommendations using your own
          audience's behaviour (Phase 2).
        </p>
        <p className="text-white/35 text-xs pt-1">
          Factors considered: platform algorithm behaviour · content type (image vs video) ·
          day-of-week audience activity patterns · niche content consumption habits ·
          audience timezone.
        </p>
      </div>
    </div>
  )
}
