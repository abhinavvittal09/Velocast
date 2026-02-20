'use client'

import { type Platform } from '@/lib/constants/platforms'
import {
  YouTubeLogo,
  YouTubeShortsLogo,
  TikTokLogo,
  InstagramLogo,
  LinkedInLogo,
  TwitterXLogo,
  FacebookLogo,
} from '@/components/icons/PlatformLogos'
import { cn } from '@/lib/utils/cn'

interface PlatformSelectorProps {
  platforms: Platform[]
  selected: Platform[]
  onChange: (selected: Platform[]) => void
  className?: string
}

// Short display labels for chips
const PLATFORM_SHORT_LABELS: Record<Platform, string> = {
  instagram_feed: 'IG Feed',
  instagram_reels: 'IG Reels',
  instagram_story: 'IG Story',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  youtube_shorts: 'YT Shorts',
  linkedin: 'LinkedIn',
  twitter: 'Twitter / X',
  facebook: 'Facebook',
}

// Logo component map
const PLATFORM_LOGOS: Record<Platform, (props: { className?: string }) => React.ReactElement | null> = {
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

export default function PlatformSelector({
  platforms,
  selected,
  onChange,
  className,
}: PlatformSelectorProps) {
  const selectedSet = new Set(selected)

  function toggle(platform: Platform) {
    if (selectedSet.has(platform)) {
      onChange(selected.filter((p) => p !== platform))
    } else {
      onChange([...selected, platform])
    }
  }

  function selectAll() {
    onChange([...platforms])
  }

  function clearAll() {
    onChange([])
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Platform chips */}
      {platforms.map((platform) => {
        const isSelected = selectedSet.has(platform)
        const Logo = PLATFORM_LOGOS[platform]
        const label = PLATFORM_SHORT_LABELS[platform]

        return (
          <button
            key={platform}
            type="button"
            onClick={() => toggle(platform)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer',
              isSelected
                ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                : 'border border-surface-border text-white/50 hover:text-white/80 hover:border-surface-border/80 bg-transparent'
            )}
          >
            <Logo className="w-3.5 h-3.5 flex-shrink-0" />
            {label}
          </button>
        )
      })}

      {/* Select all / Clear controls */}
      {platforms.length > 0 && (
        <div className="flex items-center gap-1 ml-auto pl-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-white/40 hover:text-brand-400 transition-colors"
          >
            Select all
          </button>
          <span className="text-white/20 text-xs">·</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
