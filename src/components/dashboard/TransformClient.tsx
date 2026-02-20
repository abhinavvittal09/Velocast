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
  Copy,
  Check,
  Archive,
  X,
  Crop,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import { formatDistanceToNow } from 'date-fns'
import ImagePreviewModal from '@/components/dashboard/ImagePreviewModal'
import PlatformSelector from '@/components/dashboard/PlatformSelector'
import CropEditor from '@/components/dashboard/CropEditor'

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
    () => {
      // On initial load, exclude failed jobs so they don't show error state on refresh
      const filtered = initialJobs.filter((j) => j.status !== 'failed')
      return new Map(filtered.map((j) => [j.platform, j]))
    }
  )
  const [isQueuing, setIsQueuing] = useState(false)
  const [downloadingPlatform, setDownloadingPlatform] = useState<string | null>(null)
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null)
  const [isZipping, setIsZipping] = useState(false)
  const [previewVariant, setPreviewVariant] = useState<ContentVariant | null>(null)
  const [cropTarget, setCropTarget] = useState<{ platform: Platform; variant: ContentVariant } | null>(null)

  const supabase = useMemo(() => createClient(), [])
  const targetPlatforms = item.type === 'image' ? IMAGE_PLATFORMS : VIDEO_PLATFORMS

  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(targetPlatforms)

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

  // ── Single file download (direct fetch — processed bucket is public) ──────
  async function handleDownload(variant: ContentVariant) {
    setDownloadingPlatform(variant.platform)
    try {
      const res = await fetch(variant.variant_url)
      const blob = await res.blob()
      const ext = variant.variant_url.split('.').pop()?.split('?')[0] ?? 'jpg'
      const platformLabel = PLATFORM_SPECS[variant.platform as Platform]?.label
        .toLowerCase().replace(/[\s/]+/g, '_') ?? variant.platform
      const filename = `velocast_${platformLabel}_${variant.width}x${variant.height}.${ext}`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Download failed')
    } finally {
      setDownloadingPlatform(null)
    }
  }

  // ── Copy public URL ───────────────────────────────────────────────────────
  async function handleCopyLink(variant: ContentVariant) {
    try {
      await navigator.clipboard.writeText(variant.variant_url)
      setCopiedPlatform(variant.platform)
      toast.success('Link copied!')
      setTimeout(() => setCopiedPlatform(null), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  // ── Bulk ZIP download ─────────────────────────────────────────────────────
  async function handleDownloadAll() {
    setIsZipping(true)
    try {
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()

      const readyVariants = targetPlatforms
        .map((p) => variantMap.get(p))
        .filter(Boolean) as ContentVariant[]

      await Promise.all(
        readyVariants.map(async (variant) => {
          const res = await fetch(variant.variant_url)
          const blob = await res.blob()
          const ext = variant.variant_url.split('.').pop()?.split('?')[0] ?? 'jpg'
          const platformLabel = PLATFORM_SPECS[variant.platform as Platform]?.label
            .toLowerCase().replace(/[\s/]+/g, '_') ?? variant.platform
          const filename = `velocast_${platformLabel}_${variant.width}x${variant.height}.${ext}`
          zip.file(filename, blob)
        })
      )

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `velocast_${(item.title ?? 'content').replace(/[^a-zA-Z0-9_-]/g, '_')}_all_platforms.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`Downloaded ${readyVariants.length} platform variants`)
    } catch {
      toast.error('Failed to create ZIP')
    } finally {
      setIsZipping(false)
    }
  }

  // ── Queue selected platforms ──────────────────────────────────────────────
  async function handleGenerate() {
    if (selectedPlatforms.length === 0) return
    setIsQueuing(true)
    // Optimistically clear failed state for selected platforms
    setJobMap(prev => {
      const next = new Map(prev)
      selectedPlatforms.forEach(p => {
        const j = next.get(p)
        if (j?.status === 'failed') next.delete(p)
      })
      return next
    })
    try {
      const endpoint = item.type === 'image' ? '/api/transform/image' : '/api/transform/video'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentItemId: item.id, platforms: selectedPlatforms }),
      })
      if (res.ok) {
        const result = await res.json()
        toast.success(`Queued ${result.queued} platform${result.queued !== 1 ? 's' : ''} — processing shortly`)
      } else {
        toast.error('Failed to queue jobs. Please try again.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsQueuing(false)
    }
  }

  // ── Dismiss a failed job from local state ─────────────────────────────────
  function handleDismissFailedJob(platform: string) {
    setJobMap(prev => {
      const next = new Map(prev)
      next.delete(platform)
      return next
    })
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
        <div className="flex items-center gap-2">
          {doneCount > 0 && (
            <button onClick={handleDownloadAll} disabled={isZipping} className="btn-secondary">
              {isZipping ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Zipping…</>
              ) : (
                <><Archive className="w-4 h-4" /> Download All</>
              )}
            </button>
          )}
        </div>
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

        {/* Right: platform filter + variant grid */}
        <div className="space-y-4">
          {/* Platform filter / generate section */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-white/70">Select platforms to generate</p>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={isQueuing || selectedPlatforms.length === 0}
                  className="btn-primary"
                >
                  {isQueuing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Queuing…</>
                  ) : (
                    <><Zap className="w-4 h-4" /> Generate{selectedPlatforms.length > 0 ? ` (${selectedPlatforms.length})` : ''}</>
                  )}
                </button>
              </div>
            </div>
            <PlatformSelector
              platforms={targetPlatforms}
              selected={selectedPlatforms}
              onChange={setSelectedPlatforms}
            />
          </div>

          {/* Platform variant grid */}
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

                  {/* Preview area — clickable when variant exists */}
                  <div
                    className={cn(
                      'aspect-square bg-surface relative overflow-hidden flex items-center justify-center',
                      variant && 'cursor-pointer'
                    )}
                    onClick={() => {
                      if (variant) setPreviewVariant(variant)
                    }}
                  >
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
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-white/30">
                          {(variant.file_size / 1024 / 1024).toFixed(1)} MB
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleDownload(variant)}
                            disabled={downloadingPlatform === variant.platform}
                            className="flex-1 flex items-center justify-center gap-1 text-[10px] bg-brand-600/20 hover:bg-brand-600/40 text-brand-400 hover:text-brand-300 rounded px-1.5 py-1 transition-colors disabled:opacity-50"
                          >
                            {downloadingPlatform === variant.platform
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Download className="w-3 h-3" />}
                            Save
                          </button>
                          <button
                            onClick={() => handleCopyLink(variant)}
                            className="flex items-center justify-center gap-1 text-[10px] bg-surface-border/60 hover:bg-surface-border text-white/50 hover:text-white/80 rounded px-1.5 py-1 transition-colors"
                            title="Copy public link"
                          >
                            {copiedPlatform === variant.platform
                              ? <Check className="w-3 h-3 text-emerald-400" />
                              : <Copy className="w-3 h-3" />}
                          </button>
                          {item.type === 'image' && (
                            <button
                              onClick={() => setCropTarget({ platform, variant })}
                              className="flex items-center justify-center gap-1 text-[10px] bg-surface-border/60 hover:bg-surface-border text-white/50 hover:text-white/80 rounded px-1.5 py-1 transition-colors"
                              title="Edit crop"
                            >
                              <Crop className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : isFailed ? (
                      <div className="space-y-1.5">
                        {job?.error_message && (
                          <p className="text-[10px] text-rose-400/70 truncate" title={job.error_message}>
                            {job.error_message}
                          </p>
                        )}
                        <button
                          onClick={() => handleDismissFailedJob(platform)}
                          className="w-full flex items-center justify-center gap-1 text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400/70 hover:text-rose-400 rounded px-1.5 py-1 transition-colors"
                          title="Dismiss error"
                        >
                          <X className="w-3 h-3" />
                          Dismiss
                        </button>
                      </div>
                    ) : isPending || isProcessing ? (
                      <span className="text-[10px] text-white/20">—</span>
                    ) : (
                      <p className="text-[10px] text-white/20">Select above to generate</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Image preview modal ───────────────────────────────────────────── */}
      {previewVariant && (
        <ImagePreviewModal
          isOpen={true}
          onClose={() => setPreviewVariant(null)}
          imageUrl={previewVariant.variant_url}
          platform={previewVariant.platform}
          platformLabel={PLATFORM_SPECS[previewVariant.platform as Platform]?.label ?? previewVariant.platform}
          width={previewVariant.width}
          height={previewVariant.height}
        />
      )}

      {/* ── Crop editor modal ─────────────────────────────────────────────── */}
      {cropTarget && (
        <CropEditor
          isOpen={true}
          onClose={() => setCropTarget(null)}
          originalUrl={item.original_url}
          targetWidth={PLATFORM_SPECS[cropTarget.platform]?.image?.width ?? 1080}
          targetHeight={PLATFORM_SPECS[cropTarget.platform]?.image?.height ?? 1080}
          platform={cropTarget.platform}
          platformLabel={PLATFORM_SPECS[cropTarget.platform]?.label ?? cropTarget.platform}
          contentItemId={item.id}
          onSuccess={() => setCropTarget(null)}
        />
      )}
    </div>
  )
}
