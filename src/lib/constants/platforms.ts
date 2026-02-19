export type Platform =
  | 'instagram_feed'
  | 'instagram_reels'
  | 'instagram_story'
  | 'tiktok'
  | 'youtube'
  | 'youtube_shorts'
  | 'linkedin'
  | 'twitter'
  | 'facebook'

export interface PlatformSpec {
  label: string
  icon: string
  color: string
  image?: {
    width: number
    height: number
    ratio: string
    maxSizeMB?: number
    formats?: string[]
  }
  video?: {
    width: number
    height: number
    ratio: string
    maxDuration?: number // seconds
    maxSizeMB?: number
    formats?: string[]
  }
  captionLimit: number
  hashtagLimit?: number
}

export const PLATFORM_SPECS: Record<Platform, PlatformSpec> = {
  instagram_feed: {
    label: 'Instagram Feed',
    icon: '📸',
    color: '#E1306C',
    image: { width: 1080, height: 1080, ratio: '1:1', maxSizeMB: 8, formats: ['jpg', 'png'] },
    video: { width: 1080, height: 1080, ratio: '1:1', maxDuration: 60, maxSizeMB: 100, formats: ['mp4'] },
    captionLimit: 2200,
    hashtagLimit: 30,
  },
  instagram_reels: {
    label: 'Instagram Reels',
    icon: '🎬',
    color: '#E1306C',
    image: { width: 1080, height: 1920, ratio: '9:16' },
    video: { width: 1080, height: 1920, ratio: '9:16', maxDuration: 90, maxSizeMB: 650 },
    captionLimit: 2200,
    hashtagLimit: 30,
  },
  instagram_story: {
    label: 'Instagram Story',
    icon: '⭕',
    color: '#E1306C',
    image: { width: 1080, height: 1920, ratio: '9:16', maxSizeMB: 30 },
    video: { width: 1080, height: 1920, ratio: '9:16', maxDuration: 60, maxSizeMB: 100 },
    captionLimit: 0,
  },
  tiktok: {
    label: 'TikTok',
    icon: '🎵',
    color: '#000000',
    video: { width: 1080, height: 1920, ratio: '9:16', maxDuration: 600, maxSizeMB: 500 },
    captionLimit: 2200,
    hashtagLimit: 30,
  },
  youtube: {
    label: 'YouTube',
    icon: '▶️',
    color: '#FF0000',
    image: { width: 1280, height: 720, ratio: '16:9' }, // thumbnail
    video: { width: 1920, height: 1080, ratio: '16:9', maxSizeMB: 128000 },
    captionLimit: 5000,
    hashtagLimit: 15,
  },
  youtube_shorts: {
    label: 'YouTube Shorts',
    icon: '⚡',
    color: '#FF0000',
    video: { width: 1080, height: 1920, ratio: '9:16', maxDuration: 60, maxSizeMB: 256 },
    captionLimit: 5000,
    hashtagLimit: 15,
  },
  linkedin: {
    label: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    image: { width: 1200, height: 627, ratio: '1.91:1', maxSizeMB: 5 },
    video: { width: 1920, height: 1080, ratio: '16:9', maxDuration: 600, maxSizeMB: 200 },
    captionLimit: 3000,
    hashtagLimit: 5,
  },
  twitter: {
    label: 'Twitter / X',
    icon: '𝕏',
    color: '#000000',
    image: { width: 1200, height: 675, ratio: '16:9', maxSizeMB: 5 },
    video: { width: 1280, height: 720, ratio: '16:9', maxDuration: 140, maxSizeMB: 512 },
    captionLimit: 280,
    hashtagLimit: 2,
  },
  facebook: {
    label: 'Facebook',
    icon: '👍',
    color: '#1877F2',
    image: { width: 1200, height: 630, ratio: '1.91:1' },
    video: { width: 1280, height: 720, ratio: '16:9', maxDuration: 14400, maxSizeMB: 4096 },
    captionLimit: 63206,
    hashtagLimit: 30,
  },
}

export const ALL_PLATFORMS = Object.keys(PLATFORM_SPECS) as Platform[]

export const VERTICAL_PLATFORMS: Platform[] = [
  'instagram_reels',
  'instagram_story',
  'tiktok',
  'youtube_shorts',
]

export const HORIZONTAL_PLATFORMS: Platform[] = [
  'youtube',
  'linkedin',
  'twitter',
  'facebook',
]
