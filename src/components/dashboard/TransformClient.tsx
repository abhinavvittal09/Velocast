'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PLATFORM_SPECS, ALL_PLATFORMS, type Platform } from '@/lib/constants/platforms'
import {
  YouTubeLogo,
  TikTokLogo,
  InstagramLogo,
  LinkedInLogo,
  TwitterXLogo,
  FacebookLogo,
  YouTubeShortsLogo,
} from '@/components/icons/PlatformLogos'
import {
  ArrowLeft,
  Zap,
  Download,
  CheckCircle2,
  Loader2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import { formatDistanceToNow } from 'date-fns'

// ── Types ────────────────────────────────────────────────────────────────────
interface ContentVariant {
  id: string
  content_item_id: string
  platform: string
  variant_url: string
  storage_path: string
  width: number
  height: number
  file_size: number
  hashtags: string[]
  created_at: string
}

interface TransformJob {
  id: string
  content_item_id: string
  platform: string
  type: string
  status: 'pending' | 'processing' | 'done' | 'failed'
  error_message: string | null
  created_at: string
}

interface ContentItem {
  id: string
  title: string | null
  type: 'image' | 'video'
  original_url: string
  file_size: number
  status: string
  created_at: string
}

// ── Platform logo map ─────────────────────────────────────────────────────────
const PLATFORM_LOGOS: Partial<Record<Platform, React.FC<{ className?: string }>>> = {
  youtube: YouTubeLogo,
  youtube_shorts: YouTubeShortsLogo,
  tiktok: TikTokLogo,
  instagram_feed: InstagramLogo,
  instagram_reels: InstagramLogo,
  instagram_story: InstagramLogo,
  linkedin: LinkedInLogo,
  twitter: TwitterXLogo,
  facebook: FacebookLogo,
}

const IMAGE_PLATFORMS = ALL_PLATFORMS.filter((p) => PLATFORM_SPECS[p].image != null)
const VIDEO_PLATFORMS = ALL_PLATFORMS.filter((p) => PLATFORM_SPECS[p].video != null)

// ── Component ─────────────────────────────────────────────────────────────────
export default function TransformClient({
  item,
  initialVariants,
  initialJobs,
}: {
  item: ContentItem
  initialVariants: ContentVariant[]
  initialJobs: TransformJob[]
}) {
  const [variantMap, setVariantMap] = useState<Map<string, ContentVariant>>(
    new Map(initialVariants.map((v) => [v.platform, v]))
  )
  const [jobMap, setJobMap] = useState<Map<string, TransformJob>>(
    new Map(initialJobs.map((j) => [j.platform, j]))
  )
  const [isQueuing, setIsQueuing] = useState(false)

  const supabase = useMemo(() => createClient(), [])
  const targetPlatforms = item.type === 'image' ? IMAGE_PLATFORMS : VIDEO_PLATFORMS
  const doneCount = targetPlatforms.filter((p) => variantMap.has(p)).length
  const activeJobCount = targetPlatforms.filter((p) => {
    const job = jobMap.get(p)
    return job?.status === 'pending' || job?.status === 'processing'
  }).length

  // ── Realtime: content_variants ────────────────────────────────────────────
  useEffect(() => {
    const variantChannel = supabase
      .channel(`variants:${item.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'content_variants', filter: `content_item_id=eq.${item.id}` },
        (payload) => {
          const variant = payload.new as ContentVariant
          if (variant?.platform) {
            setVariantMap((prev) => new Map(prev).set(variant.platform, variant))
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') console.error('Realtime variants error:', item.id)
      })

    return () => { supabase.removeChannel(variantChannel) }
  }, [item.id, supabase])

  // ── Realtime: transform_jobs ──────────────────────────────────────────────
  useEffect(() => {
    const jobChannel = supabase
      .channel(`jobs:${item.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transform_jobs', filter: `content_item_id=eq.${item.id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const old = payload.old as { platform?: string }
            if (old?.platform) {
              setJobMap((prev) => {
                const next = new Map(prev)
                next.delete(old.platform!)
                return next
              })
            }
          } else {
            const job = payload.new as TransformJob
            if (job?.platform) {
              setJobMap((prev) => new Map(prev).set(job.platform, job))
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') console.error('Realtime jobs error:', item.id)
      })

    return () => { supabase.removeChannel(jobChannel) }
  }, [item.id, supabase])

  // ── Queue all platforms ───────────────────────────────────────────────────
  async function handleGenerate() {
    setIsQueuing(true)
    try {
      const endpoint = item.type === 'image' ? '/api/transform/image' : '/api/transform/video'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentItemId: item.id }),
      })

      if (res.ok) {
        const result = await res.json()
        toast.success(
          `Queued ${result.queued} platform${result.queued !== 1 ? 's' : ''} — processing will start shortly`
        )
      } else {
        toast.error('Failed to queue jobs. Please try again.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsQueuing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/content" className="btn-secondary p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{item.title ?? 'Untitled'}</h1>
          <p className="text-sm text-white/50">
            {doneCount} of {targetPlatforms.length} platforms ready
            {activeJobCount > 0 && (
              <span className="ml-2 text-brand-400">
                · {activeJobCount} processing
              </span>
            )}
          </p>
        </div>
        <button onClick={handleGenerate} disabled={isQueuing} className="btn-primary">
          {isQueuing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Queuing…</>
          ) : (
            <><Zap className="w-4 h-4" /> Generate All</>
          )}
        </button>
      </div>

      {/* ── Main layout ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
        {/* Left: original preview */}
        <div className="space-y-4">
          <div className="card p-0 overflow-hidden">
            <div className="bg-black aspect-video flex items-center justify-center">
              {item.type === 'video' ? (
                <video src={item.original_url} className="max-h-full max-w-full" controls muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.original_url}
                  alt={item.title ?? ''}
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>
            <div className="p-4 space-y-3">
              <p className="font-semibold truncate">{item.title ?? 'Untitled'}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span className="text-white/40">Type</span>
                <span className="capitalize">{item.type}</span>
                <span className="text-white/40">Size</span>
                <span>{(item.file_size / 1024 / 1024).toFixed(1)} MB</span>
                <span className="text-white/40">Uploaded</span>
                <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="card">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/60">Platforms ready</span>
              <span className="font-medium">{doneCount}/{targetPlatforms.length}</span>
            </div>
            <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-700"
                style={{ width: `${(doneCount / targetPlatforms.length) * 100}%` }}
              />
            </div>
            {activeJobCount > 0 && (
              <p className="text-xs text-white/40 mt-2 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                {activeJobCount} job{activeJobCount !== 1 ? 's' : ''} in queue — updating in real-time
              </p>
            )}
          </div>

          {/* Queue status legend */}
          {(activeJobCount > 0 || jobMap.size > 0) && (
            <div className="card text-xs space-y-1.5">
              <p className="text-white/40 font-medium uppercase tracking-wider mb-2">Queue status</p>
              {(['pending', 'processing', 'done', 'failed'] as const).map((s) => {
                const count = targetPlatforms.filter((p) => jobMap.get(p)?.status === s).length
                if (!count) return null
                const colors: Record<string, string> = {
                  pending: 'text-white/40',
                  processing: 'text-brand-400',
                  done: 'text-emerald-400',
                  failed: 'text-rose-400',
                }
                return (
                  <div key={s} className={`flex justify-between ${colors[s]}`}>
                    <span className="capitalize">{s}</span>
                    <span>{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: platform variant grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {targetPlatforms.map((platform) => {
            const spec = PLATFORM_SPECS[platform]
            const variant = variantMap.get(platform)
            const job = jobMap.get(platform)
            const Logo = PLATFORM_LOGOS[platform]
            const dims = item.type === 'image' ? spec.image : spec.video

            // Determine card state
            const isProcessing = job?.status === 'processing'
            const isPending = job?.status === 'pending'
            const isFailed = job?.status === 'failed' && !variant

            return (
              <div
                key={platform}
                className={cn(
                  'card p-0 overflow-hidden flex flex-col transition-all duration-300',
                  variant && 'border-emerald-800/40',
                  isFailed && 'border-rose-800/40',
                  (isProcessing || isPending) && 'border-brand-800/40'
                )}
              >
                {/* Card header */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-surface-border">
                  {Logo && <Logo className="w-4 h-4 flex-shrink-0" />}
                  <span className="text-xs font-medium truncate flex-1">{spec.label}</span>
                  {variant ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  ) : isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 text-brand-400 animate-spin flex-shrink-0" />
                  ) : isPending ? (
                    <Clock className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                  ) : isFailed ? (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
                  )}
                </div>

                {/* Preview area */}
                <div className="aspect-square bg-surface relative overflow-hidden flex items-center justify-center">
                  {variant ? (
                    item.type === 'video' ? (
                      <video src={variant.variant_url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={variant.variant_url} alt={spec.label} className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
                      {Logo && <Logo className="w-10 h-10 opacity-10" />}
                      <span className={cn(
                        'text-[11px] text-center px-2',
                        isProcessing && 'text-brand-400/60 animate-pulse',
                        isPending && 'text-white/30',
                        isFailed && 'text-rose-400/60',
                        !job && 'text-white/20'
                      )}>
                        {isProcessing ? 'Converting…' : isPending ? 'In queue…' : isFailed ? 'Failed' : 'Not generated yet'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="px-3 py-2.5 space-y-1.5">
                  <p className="text-[10px] text-white/40">
                    {dims ? `${dims.width} × ${dims.height} · ${dims.ratio}` : '—'}
                  </p>
                  {variant ? (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/30">
                        {(variant.file_size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <a
                        href={variant.variant_url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[10px] text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        <Download className="w-3 h-3" /> Save
                      </a>
                    </div>
                  ) : isFailed && job?.error_message ? (
                    <p className="text-[10px] text-rose-400/70 truncate" title={job.error_message}>
                      {job.error_message}
                    </p>
                  ) : (
                    <span className="text-[10px] text-white/20">
                      {isPending || isProcessing ? '—' : 'Click Generate All'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
