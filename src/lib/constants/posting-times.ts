/**
 * Research-based optimal posting times.
 *
 * Key design decisions:
 *  - Times are stored in AUDIENCE local time (not creator's).
 *    The UI converts to the creator's timezone for actionable display.
 *  - Separate image vs video profiles per platform because video content
 *    (especially Reels/Shorts/TikTok) performs best during evening "lean-back"
 *    sessions, whereas image posts win mid-morning "quick scroll" windows.
 *  - Niche modifiers shift the hour weighting (e.g. fitness peaks 6-8am,
 *    business peaks 9-11am, entertainment peaks 8-10pm).
 *
 * Phase 2: override with creator's own analytics data once collected.
 */

// ── Core types ─────────────────────────────────────────────────────────────────

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
export const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const HOURS = Array.from({ length: 24 }, (_, i) => i)

export interface SlotProfile {
  /** Days of the week that outperform the platform average */
  best_days: DayOfWeek[]
  /** Days with consistently low engagement */
  worst_days?: DayOfWeek[]
  /** Hours (audience local, 0-23) with peak reach */
  best_hours: number[]
  /** Hours with very low audience activity */
  worst_hours?: number[]
  /** Human-readable reasoning shown in the UI */
  note: string
}

export interface PlatformPostingProfile {
  key: string
  label: string
  color: string
  /** Profile when posting image/photo content */
  image: SlotProfile
  /** Profile when posting video content */
  video: SlotProfile
}

// ── Niche modifiers ────────────────────────────────────────────────────────────

export type Niche =
  | 'general'
  | 'fitness'
  | 'business'
  | 'entertainment'
  | 'food'
  | 'education'
  | 'tech'
  | 'fashion'

export const NICHE_LABELS: Record<Niche, string> = {
  general:       'General',
  fitness:       'Fitness / Health',
  business:      'Business / Finance',
  entertainment: 'Entertainment',
  food:          'Food / Cooking',
  education:     'Education / Tutorials',
  tech:          'Tech / Gaming',
  fashion:       'Fashion / Beauty',
}

/**
 * Extra hours to boost per niche.
 * These are added to the platform's best_hours when scoring,
 * reflecting when that niche audience is most active.
 */
export const NICHE_BOOST_HOURS: Record<Niche, number[]> = {
  general:       [],
  fitness:       [5, 6, 7, 8, 17, 18, 19],   // morning workouts + post-gym evening
  business:      [7, 8, 9, 10, 11, 12, 13],   // pre-meeting & lunch browsing
  entertainment: [18, 19, 20, 21, 22],          // evening wind-down
  food:          [11, 12, 13, 18, 19, 20],      // lunch & dinner inspiration
  education:     [14, 15, 16, 17, 20, 21],      // after school / after work study
  tech:          [10, 11, 20, 21, 22, 23],       // mid-morning & late-night hackers
  fashion:       [10, 11, 12, 18, 19, 20],       // mid-morning & evening browsing
}

// ── Audience timezone list ─────────────────────────────────────────────────────

export const AUDIENCE_TIMEZONES: { label: string; tz: string }[] = [
  { label: 'US East  (EST/EDT)',          tz: 'America/New_York'      },
  { label: 'US Central (CST/CDT)',        tz: 'America/Chicago'       },
  { label: 'US Mountain (MST/MDT)',       tz: 'America/Denver'        },
  { label: 'US West (PST/PDT)',           tz: 'America/Los_Angeles'   },
  { label: 'UK (GMT/BST)',                tz: 'Europe/London'         },
  { label: 'Central Europe (CET/CEST)',   tz: 'Europe/Paris'          },
  { label: 'Eastern Europe (EET/EEST)',   tz: 'Europe/Athens'         },
  { label: 'India (IST)',                 tz: 'Asia/Kolkata'          },
  { label: 'Singapore / Malaysia (SGT)',  tz: 'Asia/Singapore'        },
  { label: 'China (CST)',                 tz: 'Asia/Shanghai'         },
  { label: 'Japan (JST)',                 tz: 'Asia/Tokyo'            },
  { label: 'Australia East (AEST/AEDT)', tz: 'Australia/Sydney'      },
  { label: 'Brazil (BRT/BRST)',           tz: 'America/Sao_Paulo'     },
  { label: 'UAE (GST)',                   tz: 'Asia/Dubai'            },
  { label: 'South Africa (SAST)',         tz: 'Africa/Johannesburg'   },
]

// ── Platform profiles ──────────────────────────────────────────────────────────

export const POSTING_PROFILES: PlatformPostingProfile[] = [
  {
    key:   'instagram',
    label: 'Instagram',
    color: '#E1306C',
    image: {
      best_days:   ['Tue', 'Wed', 'Thu'],
      best_hours:  [9, 11, 14, 17],
      worst_hours: [1, 2, 3, 4, 5, 6],
      note: 'Instagram Feed images peak during mid-morning coffee breaks and 5pm commute scrolls Tuesday–Thursday. Avoid late night — engagement tanks after 11pm.',
    },
    video: {
      best_days:   ['Mon', 'Tue', 'Fri'],
      best_hours:  [9, 12, 18, 19, 20],
      worst_hours: [2, 3, 4, 5, 6],
      note: 'Reels get surfaced aggressively at launch. Evening posts (6–8pm) catch people in lean-back mode; Monday and Friday see high Reels consumption.',
    },
  },
  {
    key:   'tiktok',
    label: 'TikTok',
    color: '#010101',
    image: {
      best_days:   ['Tue', 'Wed', 'Thu'],
      best_hours:  [9, 11, 14, 17],
      worst_hours: [1, 2, 3, 4],
      note: 'TikTok image posts (carousels) perform similarly to Instagram. Mid-morning and early afternoon on weekdays are safest.',
    },
    video: {
      best_days:   ['Tue', 'Thu', 'Fri'],
      best_hours:  [7, 8, 9, 19, 20, 21],
      worst_hours: [2, 3, 4, 5],
      note: "TikTok's algorithm distributes video broadly at launch. Posting during morning commute (7–9am) or evening wind-down (7–10pm) maximises initial velocity. Friday hits the weekend entertainment mood.",
    },
  },
  {
    key:   'youtube',
    label: 'YouTube',
    color: '#FF0000',
    image: {
      // Community posts / thumbnails
      best_days:   ['Wed', 'Thu', 'Fri'],
      best_hours:  [12, 15, 18],
      worst_hours: [2, 3, 4, 5],
      note: 'YouTube community posts perform best mid-week at lunch and afternoon when subscribers check their feed.',
    },
    video: {
      best_days:   ['Thu', 'Fri', 'Sat'],
      best_hours:  [15, 16, 17, 18],
      worst_hours: [2, 3, 4, 5],
      note: 'YouTube is search-driven so SEO matters more than timing — but publishing Thursday–Saturday afternoon catches weekend binge traffic. Videos indexed within 48h keep performing for weeks.',
    },
  },
  {
    key:   'linkedin',
    label: 'LinkedIn',
    color: '#0A66C2',
    image: {
      best_days:   ['Tue', 'Wed', 'Thu'],
      worst_days:  ['Sat', 'Sun'],
      best_hours:  [8, 9, 10, 12],
      worst_hours: [20, 21, 22, 23, 0, 1, 2, 3, 4],
      note: 'LinkedIn is strictly a business platform. Images (carousels, infographics) perform during pre-meeting morning scrolls and lunch breaks. Weekends are nearly dead — avoid.',
    },
    video: {
      best_days:   ['Tue', 'Wed', 'Thu'],
      worst_days:  ['Sat', 'Sun'],
      best_hours:  [7, 8, 9, 12],
      worst_hours: [21, 22, 23, 0, 1, 2, 3, 4],
      note: 'LinkedIn video gets boosted by the algorithm but still needs professional context. Early morning (7–9am commute) and lunch hour are the strongest windows.',
    },
  },
  {
    key:   'twitter',
    label: 'Twitter / X',
    color: '#000000',
    image: {
      best_days:   ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      best_hours:  [9, 12, 17, 18],
      worst_hours: [2, 3, 4, 5, 6],
      note: 'Twitter moves fast — image posts age quickly. Morning (9am), lunch (12pm) and end-of-workday (5–6pm) see consistent engagement all weekdays.',
    },
    video: {
      best_days:   ['Tue', 'Wed', 'Thu'],
      best_hours:  [12, 15, 17, 18],
      worst_hours: [2, 3, 4, 5],
      note: 'Twitter video benefits from mid-day sharing peaks. Posting Tue–Thu at lunch or late afternoon maximises retweets before the evening news cycle.',
    },
  },
  {
    key:   'facebook',
    label: 'Facebook',
    color: '#1877F2',
    image: {
      best_days:   ['Wed', 'Thu', 'Fri'],
      best_hours:  [9, 11, 13, 15],
      worst_hours: [0, 1, 2, 3, 4, 5],
      note: 'Facebook image reach peaks mid-week during work-break browsing. The Facebook algorithm rewards early engagement in the first hour — post when your audience is most awake.',
    },
    video: {
      best_days:   ['Fri', 'Sat', 'Sun'],
      best_hours:  [13, 14, 15, 19, 20],
      worst_hours: [0, 1, 2, 3, 4],
      note: 'Facebook video is weekend-heavy — people have more time to watch. Early afternoon and evening on Friday through Sunday outperform weekday posts significantly.',
    },
  },
]

// ── Scoring ────────────────────────────────────────────────────────────────────

/**
 * Returns a 0-100 engagement score for a given platform profile, day and hour.
 * Applies niche modifier on top of the platform baseline.
 */
export function getSlotScore(
  profile: SlotProfile,
  niche: Niche,
  day: DayOfWeek,
  hour: number
): number {
  let score = 30 // baseline

  // Day contribution
  if (profile.best_days.includes(day))   score += 22
  if (profile.worst_days?.includes(day)) score -= 18

  // Hour contribution (platform)
  if (profile.best_hours.includes(hour))   score += 30
  if (profile.worst_hours?.includes(hour)) score -= 22

  // Niche boost: extra +15 if hour is in niche's peak window
  if (NICHE_BOOST_HOURS[niche].includes(hour)) score += 13

  return Math.max(5, Math.min(98, score))
}

export type ScoreRating = 'great' | 'good' | 'average' | 'poor'

export function scoreRating(score: number): ScoreRating {
  if (score >= 75) return 'great'
  if (score >= 55) return 'good'
  if (score >= 38) return 'average'
  return 'poor'
}

export const RATING_META: Record<ScoreRating, { label: string; colorClass: string; bgClass: string }> = {
  great:   { label: 'Great time',  colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/15 border-emerald-700/40' },
  good:    { label: 'Good window', colorClass: 'text-teal-400',    bgClass: 'bg-teal-500/15 border-teal-700/40'       },
  average: { label: 'Average',     colorClass: 'text-amber-400',   bgClass: 'bg-amber-500/15 border-amber-700/40'     },
  poor:    { label: 'Poor window', colorClass: 'text-rose-400',    bgClass: 'bg-rose-500/15 border-rose-700/40'       },
}

/** Returns inline style for a heatmap cell based on score (smooth color gradient). */
export function scoreToStyle(score: number): React.CSSProperties {
  if (score >= 65) {
    const alpha = 0.35 + ((score - 65) / 33) * 0.55
    return { backgroundColor: `rgba(52, 211, 153, ${alpha.toFixed(2)})` }  // emerald
  }
  if (score >= 38) {
    const alpha = 0.15 + ((score - 38) / 27) * 0.35
    return { backgroundColor: `rgba(251, 191, 36, ${alpha.toFixed(2)})` }  // amber
  }
  const alpha = 0.08 + ((38 - score) / 33) * 0.22
  return { backgroundColor: `rgba(239, 68, 68, ${alpha.toFixed(2)})` }     // rose
}

/** Format hour 0-23 as "9 am", "12 pm", etc. */
export function formatHour(h: number): string {
  if (h === 0)  return '12 am'
  if (h === 12) return '12 pm'
  return h < 12 ? `${h} am` : `${h - 12} pm`
}
