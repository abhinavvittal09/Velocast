'use client'

import { useState } from 'react'
import { PLATFORM_SPECS, ALL_PLATFORMS, type Platform } from '@/lib/constants/platforms'
import { Check, Image, Video, Hash, AlignLeft, Clock, HardDrive } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

function formatSize(mb: number | undefined) {
  if (!mb) return null
  if (mb >= 1000) return `${(mb / 1024).toFixed(0)} GB`
  return `${mb} MB`
}

function formatDuration(seconds: number | undefined) {
  if (!seconds) return null
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h`
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m`
  return `${seconds}s`
}

export default function PlatformGrid() {
  const [enabled, setEnabled] = useState<Set<Platform>>(
    new Set(ALL_PLATFORMS)
  )

  function toggle(p: Platform) {
    setEnabled((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  return (
    <div className="space-y-8">
      {/* Summary bar */}
      <div className="card flex items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-2xl font-bold">{enabled.size}</div>
            <div className="text-xs text-white/50">platforms active</div>
          </div>
          <div className="w-px h-10 bg-surface-border" />
          <div>
            <div className="text-2xl font-bold">{ALL_PLATFORMS.length}</div>
            <div className="text-xs text-white/50">total supported</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEnabled(new Set(ALL_PLATFORMS))}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Select all
          </button>
          <button
            onClick={() => setEnabled(new Set())}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Platform cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ALL_PLATFORMS.map((platform) => {
          const spec = PLATFORM_SPECS[platform]
          const active = enabled.has(platform)

          return (
            <div
              key={platform}
              onClick={() => toggle(platform)}
              className={cn(
                'card cursor-pointer transition-all duration-200 select-none relative overflow-hidden',
                active
                  ? 'border-brand-600/60 bg-surface-card'
                  : 'opacity-50 hover:opacity-70'
              )}
            >
              {/* Active checkmark */}
              {active && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Color accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: spec.color }}
              />

              {/* Header */}
              <div className="flex items-center gap-3 mb-4 pt-1">
                <span className="text-2xl">{spec.icon}</span>
                <div>
                  <div className="font-semibold text-sm">{spec.label}</div>
                  <div className="text-xs text-white/40">{active ? 'Active' : 'Inactive'}</div>
                </div>
              </div>

              {/* Specs */}
              <div className="space-y-2">
                {spec.image && (
                  <div className="flex items-start gap-2">
                    <Image className="w-3.5 h-3.5 text-white/30 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-white/60">
                      <span className="text-white/80">Image</span>
                      {' · '}
                      {spec.image.width}×{spec.image.height}
                      {' · '}
                      {spec.image.ratio}
                      {spec.image.maxSizeMB && ` · max ${formatSize(spec.image.maxSizeMB)}`}
                      {spec.image.formats && ` · ${spec.image.formats.join(', ')}`}
                    </div>
                  </div>
                )}

                {spec.video && (
                  <div className="flex items-start gap-2">
                    <Video className="w-3.5 h-3.5 text-white/30 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-white/60">
                      <span className="text-white/80">Video</span>
                      {' · '}
                      {spec.video.width}×{spec.video.height}
                      {' · '}
                      {spec.video.ratio}
                      {spec.video.maxDuration && (
                        <span className="inline-flex items-center gap-0.5 ml-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatDuration(spec.video.maxDuration)}
                        </span>
                      )}
                      {spec.video.maxSizeMB && (
                        <span className="inline-flex items-center gap-0.5 ml-1">
                          <HardDrive className="w-2.5 h-2.5" />
                          {formatSize(spec.video.maxSizeMB)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-surface-border/50">
                  <div className="flex items-center gap-1 text-xs text-white/50">
                    <AlignLeft className="w-3 h-3" />
                    {spec.captionLimit === 0
                      ? 'No caption'
                      : `${spec.captionLimit.toLocaleString()} chars`}
                  </div>
                  {spec.hashtagLimit && (
                    <>
                      <div className="w-px h-3 bg-surface-border" />
                      <div className="flex items-center gap-1 text-xs text-white/50">
                        <Hash className="w-3 h-3" />
                        {spec.hashtagLimit} hashtags
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-white/30 text-center">
        Click a platform card to activate or deactivate it. Active platforms will be available when scheduling posts.
      </p>
    </div>
  )
}
