'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Upload, FileVideo, Clock, Layers, Search,
  Grid3X3, List, ChevronRight, Trash2, Loader2,
  CheckSquare, Square, X, SlidersHorizontal,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import { formatDistanceToNow } from 'date-fns'
import { PLATFORM_SPECS, ALL_PLATFORMS, type Platform } from '@/lib/constants/platforms'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContentVariantMeta {
  id: string
  platform: string
}

interface ContentItem {
  id: string
  title: string | null
  type: 'image' | 'video'
  original_url: string
  file_size: number
  width: number | null
  height: number | null
  duration_seconds: number | null
  status: string
  created_at: string
  content_variants: ContentVariantMeta[]
}

type Fit = 'native' | 'crop' | 'incompatible'

interface PlatformFit {
  platform: Platform
  fit: Fit
  reason?: string
}

type RatioCategory = '9:16' | '1:1' | '16:9' | '4:5' | '1.91:1' | 'other'

// ── Platform suitability logic ─────────────────────────────────────────────────

function getRatioCategory(w: number | null, h: number | null): RatioCategory {
  if (!w || !h) return 'other'
  const r = w / h
  if (Math.abs(r - 9 / 16)  < 0.06) return '9:16'
  if (Math.abs(r - 1)        < 0.06) return '1:1'
  if (Math.abs(r - 16 / 9)  < 0.06) return '16:9'
  if (Math.abs(r - 4 / 5)   < 0.06) return '4:5'
  if (Math.abs(r - 1.91)    < 0.06) return '1.91:1'
  return 'other'
}

function getRatioLabel(cat: RatioCategory): string {
  const map: Record<RatioCategory, string> = {
    '9:16': '9:16', '1:1': '1:1', '16:9': '16:9',
    '4:5': '4:5', '1.91:1': '1.91:1', 'other': 'Custom',
  }
  return map[cat]
}

function getPlatformFits(item: ContentItem): PlatformFit[] {
  const { type, width, height, duration_seconds, file_size } = item
  const fileMB = file_size / 1024 / 1024
  const itemRatio = width && height ? width / height : null

  return ALL_PLATFORMS.map((platform) => {
    const spec   = PLATFORM_SPECS[platform]
    const target = type === 'video' ? spec.video : spec.image

    if (!target) {
      return { platform, fit: 'incompatible', reason: `No ${type} format` }
    }
    if (target.maxSizeMB && fileMB > target.maxSizeMB) {
      return { platform, fit: 'incompatible', reason: `Too large (${fileMB.toFixed(0)} MB)` }
    }
    if (type === 'video' && spec.video?.maxDuration && duration_seconds && duration_seconds > spec.video.maxDuration) {
      return { platform, fit: 'incompatible', reason: `Too long (${Math.round(duration_seconds)}s)` }
    }
    if (!itemRatio) return { platform, fit: 'crop' }

    const targetRatio = target.width / target.height
    const native = Math.abs(itemRatio - targetRatio) < 0.06
    return { platform, fit: native ? 'native' : 'crop' }
  })
}

// ── Platform grouping for the platform filter ──────────────────────────────────

const PLATFORM_GROUPS: { key: string; label: string; color: string; platforms: Platform[] }[] = [
  { key: 'instagram', label: 'Instagram', color: '#E1306C',
    platforms: ['instagram_feed', 'instagram_reels', 'instagram_story'] },
  { key: 'tiktok',    label: 'TikTok',    color: '#69C9D0', platforms: ['tiktok'] },
  { key: 'youtube',   label: 'YouTube',   color: '#FF0000', platforms: ['youtube', 'youtube_shorts'] },
  { key: 'linkedin',  label: 'LinkedIn',  color: '#0A66C2', platforms: ['linkedin'] },
  { key: 'twitter',   label: 'X',         color: '#8B8B8B', platforms: ['twitter'] },
  { key: 'facebook',  label: 'Facebook',  color: '#1877F2', platforms: ['facebook'] },
]

const PAGE_SIZE = 20

// ── Component ─────────────────────────────────────────────────────────────────

export default function ContentLibraryClient({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), [])

  const [items,          setItems]          = useState<ContentItem[]>([])
  const [page,           setPage]           = useState(0)
  const [hasMore,        setHasMore]        = useState(true)
  const [isLoading,      setIsLoading]      = useState(true)
  const [isLoadingMore,  setIsLoadingMore]  = useState(false)
  const [isDeleting,     setIsDeleting]     = useState(false)

  // Filters
  const [search,         setSearch]         = useState('')
  const [typeFilter,     setTypeFilter]     = useState<'all' | 'image' | 'video'>('all')
  const [ratioFilter,    setRatioFilter]    = useState<RatioCategory | 'all'>('all')
  const [coverageFilter, setCoverageFilter] = useState<'all' | 'has' | 'none'>('all')
  const [platformFilter, setPlatformFilter] = useState<Set<string>>(new Set())
  const [sort,           setSort]           = useState<'newest' | 'oldest' | 'largest' | 'variants'>('newest')
  const [viewMode,       setViewMode]       = useState<'grid' | 'list'>('grid')
  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set())

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchItems = useCallback(
    async (pageNum: number, reset = false) => {
      if (pageNum === 0) setIsLoading(true)
      else setIsLoadingMore(true)

      const order =
        sort === 'oldest'  ? { col: 'created_at', asc: true }
        : sort === 'largest' ? { col: 'file_size',  asc: false }
        : { col: 'created_at', asc: false }

      const { data } = await supabase
        .from('content_items')
        .select('id, title, type, original_url, file_size, width, height, duration_seconds, status, created_at, content_variants(id, platform)')
        .eq('user_id', userId)
        .order(order.col, { ascending: order.asc })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

      if (data) {
        const typed = data as ContentItem[]
        setItems(reset ? typed : (prev) => [...prev, ...typed])
        setHasMore(data.length === PAGE_SIZE)
      }
      setIsLoading(false)
      setIsLoadingMore(false)
    },
    [sort, userId, supabase]
  )

  useEffect(() => {
    setPage(0)
    setSelectedIds(new Set())
    fetchItems(0, true)
  }, [fetchItems])

  // ── Client-side filtering + sorting ───────────────────────────────────────
  const displayItems = useMemo(() => {
    let filtered = items

    if (typeFilter !== 'all') {
      filtered = filtered.filter((i) => i.type === typeFilter)
    }
    if (ratioFilter !== 'all') {
      filtered = filtered.filter((i) => getRatioCategory(i.width, i.height) === ratioFilter)
    }
    if (coverageFilter === 'has') {
      filtered = filtered.filter((i) => i.content_variants.length > 0)
    } else if (coverageFilter === 'none') {
      filtered = filtered.filter((i) => i.content_variants.length === 0)
    }
    if (platformFilter.size > 0) {
      const selectedGroupPlatforms = PLATFORM_GROUPS
        .filter((g) => platformFilter.has(g.key))
        .flatMap((g) => g.platforms)
      filtered = filtered.filter((i) =>
        i.content_variants.some((v) => selectedGroupPlatforms.includes(v.platform as Platform))
      )
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter((i) => (i.title ?? '').toLowerCase().includes(q))
    }
    if (sort === 'variants') {
      filtered = [...filtered].sort((a, b) => b.content_variants.length - a.content_variants.length)
    }
    return filtered
  }, [items, typeFilter, ratioFilter, coverageFilter, platformFilter, search, sort])

  const activeFilterCount = [
    typeFilter !== 'all',
    ratioFilter !== 'all',
    coverageFilter !== 'all',
    platformFilter.size > 0,
    search.trim() !== '',
  ].filter(Boolean).length

  function clearAllFilters() {
    setTypeFilter('all')
    setRatioFilter('all')
    setCoverageFilter('all')
    setPlatformFilter(new Set())
    setSearch('')
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  async function handleLoadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    await fetchItems(nextPage)
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === displayItems.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(displayItems.map((i) => i.id)))
    }
  }

  async function handleBulkDelete() {
    if (!selectedIds.size) return
    if (!confirm(`Delete ${selectedIds.size} item${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`)) return

    setIsDeleting(true)
    let deletedCount = 0
    for (const id of Array.from(selectedIds)) {
      const res = await fetch(`/api/content/${id}`, { method: 'DELETE' })
      if (res.ok) {
        deletedCount++
        setItems((prev) => prev.filter((i) => i.id !== id))
      }
    }
    setSelectedIds(new Set())
    setIsDeleting(false)
    toast.success(`Deleted ${deletedCount} item${deletedCount > 1 ? 's' : ''}`)
  }

  const imageCount = displayItems.filter((i) => i.type === 'image').length
  const videoCount = displayItems.filter((i) => i.type === 'video').length

  // ── Skeleton ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card p-0 overflow-hidden animate-pulse">
            <div className="aspect-video bg-surface-border" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-surface-border rounded w-3/4" />
              <div className="h-2 bg-surface-border rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <div className="card space-y-3">
        {/* Row 1: search + sort + view */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title…"
              className="input pl-9 pr-8"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-white/30 hover:text-white/60" />
              </button>
            )}
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className={cn('input w-auto bg-surface-card', typeFilter !== 'all' && 'border-brand-500')}
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>

          <PlatformDropdown selected={platformFilter} onChange={setPlatformFilter} />

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="input w-auto bg-surface-card"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="largest">Largest file</option>
            <option value="variants">Most variants</option>
          </select>

          <div className="flex items-center bg-surface-card border border-surface-border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-1.5 rounded-md transition-colors', viewMode === 'grid' ? 'bg-brand-600' : 'text-white/40 hover:text-white')}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-brand-600' : 'text-white/40 hover:text-white')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: filter chips */}
        <div className="flex flex-wrap gap-x-3 gap-y-2 items-center">
          <SlidersHorizontal className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />

          {/* Aspect ratio */}
          <FilterGroup label="Ratio">
            {([
              ['all',   'Any'],
              ['9:16',  '9:16'],
              ['1:1',   '1:1'],
              ['16:9',  '16:9'],
              ['4:5',   '4:5'],
            ] as [RatioCategory | 'all', string][]).map(([val, label]) => (
              <FilterChip key={val} active={ratioFilter === val} onClick={() => setRatioFilter(val)}>
                {label}
              </FilterChip>
            ))}
          </FilterGroup>

          <Divider />

          {/* Coverage */}
          <FilterGroup label="Variants">
            {([
              ['all',  'Any'],
              ['has',  'Has variants'],
              ['none', 'None yet'],
            ] as [typeof coverageFilter, string][]).map(([val, label]) => (
              <FilterChip key={val} active={coverageFilter === val} onClick={() => setCoverageFilter(val)}>
                {label}
              </FilterChip>
            ))}
          </FilterGroup>

          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="ml-2 text-xs text-white/40 hover:text-white transition-colors underline underline-offset-2"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      {displayItems.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-white/40 px-1">
          <span><span className="text-white/70 font-medium">{displayItems.length}</span> item{displayItems.length !== 1 ? 's' : ''}</span>
          {imageCount > 0 && <span>· <span className="text-emerald-400">{imageCount}</span> image{imageCount !== 1 ? 's' : ''}</span>}
          {videoCount > 0 && <span>· <span className="text-brand-400">{videoCount}</span> video{videoCount !== 1 ? 's' : ''}</span>}
          {activeFilterCount > 0 && <span className="text-white/25">· filtered</span>}
        </div>
      )}

      {/* ── Bulk action bar ───────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-brand-950/50 border border-brand-800/50 rounded-xl">
          <span className="text-sm text-brand-300">{selectedIds.size} selected</span>
          <button onClick={toggleSelectAll} className="text-xs text-white/50 hover:text-white transition-colors">
            {selectedIds.size === displayItems.length ? 'Deselect all' : `Select all ${displayItems.length}`}
          </button>
          <div className="flex-1" />
          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
          >
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Delete selected
          </button>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {displayItems.length === 0 && (
        <div className="card text-center py-20">
          <div className="w-16 h-16 bg-surface-border rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-white/40" />
          </div>
          <h3 className="font-semibold text-lg mb-2">
            {activeFilterCount > 0 ? 'No results match your filters' : 'No content yet'}
          </h3>
          <p className="text-white/50 text-sm mb-6">
            {activeFilterCount > 0
              ? 'Try adjusting your filters or search.'
              : 'Upload your first video or image to get started.'}
          </p>
          {activeFilterCount > 0 ? (
            <button onClick={clearAllFilters} className="btn-secondary mx-auto">Clear filters</button>
          ) : (
            <Link href="/dashboard/upload" className="btn-primary mx-auto">Upload your first file</Link>
          )}
        </div>
      )}

      {/* ── Grid view ─────────────────────────────────────────────────────── */}
      {viewMode === 'grid' && displayItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayItems.map((item) => (
            <GridCard
              key={item.id}
              item={item}
              fits={getPlatformFits(item)}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {/* ── List view ─────────────────────────────────────────────────────── */}
      {viewMode === 'list' && displayItems.length > 0 && (
        <div className="space-y-2">
          {displayItems.map((item) => (
            <ListRow
              key={item.id}
              item={item}
              fits={getPlatformFits(item)}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {/* ── Load more ─────────────────────────────────────────────────────── */}
      {hasMore && !activeFilterCount && displayItems.length > 0 && (
        <div className="flex justify-center pt-2">
          <button onClick={handleLoadMore} disabled={isLoadingMore} className="btn-secondary">
            {isLoadingMore ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</> : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Platform multi-select dropdown ────────────────────────────────────────────

function PlatformDropdown({
  selected,
  onChange,
}: {
  selected: Set<string>
  onChange: (next: Set<string>) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function toggle(key: string) {
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange(next)
  }

  const label =
    selected.size === 0
      ? 'All Platforms'
      : selected.size === 1
      ? PLATFORM_GROUPS.find((g) => selected.has(g.key))?.label ?? '1 platform'
      : `${selected.size} platforms`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'input w-auto bg-surface-card flex items-center gap-2 pr-7 relative',
          selected.size > 0 && 'border-brand-500 text-white'
        )}
      >
        <span className="text-sm truncate max-w-[120px]">{label}</span>
        <svg className={cn('w-3 h-3 text-white/40 absolute right-2 transition-transform', open && 'rotate-180')} viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-surface-card border border-surface-border rounded-xl shadow-xl min-w-[160px] py-1 overflow-hidden">
          {PLATFORM_GROUPS.map((g) => (
            <label key={g.key} className="flex items-center gap-2.5 px-3 py-2 hover:bg-surface-border/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={selected.has(g.key)}
                onChange={() => toggle(g.key)}
                className="w-3.5 h-3.5 rounded accent-brand-500"
              />
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
              <span className="text-sm text-white/80">{g.label}</span>
            </label>
          ))}
          {selected.size > 0 && (
            <button
              onClick={() => { onChange(new Set()); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-xs text-white/40 hover:text-white/70 border-t border-surface-border/40 transition-colors mt-0.5"
            >
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tiny UI helpers ────────────────────────────────────────────────────────────

function Divider() {
  return <div className="w-px h-4 bg-surface-border/60 flex-shrink-0" />
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] text-white/25 uppercase tracking-wider font-medium whitespace-nowrap">{label}:</span>
      {children}
    </div>
  )
}

function FilterChip({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition-colors',
        active
          ? 'border-brand-500 bg-brand-500/15 text-white'
          : 'border-surface-border/60 text-white/40 hover:text-white hover:border-surface-border'
      )}
    >
      {children}
    </button>
  )
}

// ── Platform dot ──────────────────────────────────────────────────────────────

function PlatformDot({ platform, dim }: { platform: Platform; dim: boolean }) {
  const spec  = PLATFORM_SPECS[platform]
  const color = spec.color === '#000000' || spec.color === '#010101' ? '#8B8B8B' : spec.color
  return (
    <span
      title={`${spec.label}: ${dim ? 'Needs crop/transform' : 'Native fit'}`}
      className="inline-block w-2 h-2 rounded-sm flex-shrink-0"
      style={{ backgroundColor: color, opacity: dim ? 0.28 : 1 }}
    />
  )
}

// ── Platform compatibility block ──────────────────────────────────────────────

function PlatformCompatibility({ fits }: { fits: PlatformFit[] }) {
  const native = fits.filter((f) => f.fit === 'native')
  const crop   = fits.filter((f) => f.fit === 'crop')

  return (
    <div className="space-y-1">
      {native.length > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {native.map(({ platform }) => <PlatformDot key={platform} platform={platform} dim={false} />)}
          </div>
          <span className="text-[10px] text-emerald-400/70">Native ({native.length})</span>
        </div>
      )}
      {crop.length > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {crop.map(({ platform }) => <PlatformDot key={platform} platform={platform} dim={true} />)}
          </div>
          <span className="text-[10px] text-white/25">Needs crop ({crop.length})</span>
        </div>
      )}
    </div>
  )
}

// ── Grid card ─────────────────────────────────────────────────────────────────

function GridCard({
  item, fits, isSelected, onToggleSelect,
}: {
  item: ContentItem; fits: PlatformFit[]
  isSelected: boolean; onToggleSelect: (id: string) => void
}) {
  const variantCount  = item.content_variants.length
  const ratioCategory = getRatioCategory(item.width, item.height)

  return (
    <div className={cn(
      'card p-0 overflow-hidden group transition-colors relative',
      isSelected ? 'border-brand-500' : 'hover:border-brand-600/50'
    )}>
      <button
        onClick={(e) => { e.preventDefault(); onToggleSelect(item.id) }}
        className="absolute top-2 left-2 z-10"
        aria-label="Select"
      >
        {isSelected
          ? <CheckSquare className="w-4 h-4 text-brand-400" />
          : <Square className="w-4 h-4 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded" />}
      </button>

      <Link href={`/dashboard/transform/${item.id}`} className="block">
        {/* Thumbnail */}
        <div className="aspect-video bg-surface flex items-center justify-center relative overflow-hidden">
          {item.type === 'video' ? (
            <FileVideo className="w-10 h-10 text-white/20" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.original_url}
              alt={item.title ?? ''}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
          {/* Bottom overlay: type + ratio — replaces the old floating emoji badge */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1.5 bg-gradient-to-t from-black/70 to-transparent">
            <span className="text-[10px] font-semibold text-white/80 bg-black/30 px-1.5 py-0.5 rounded">
              {item.type === 'video' ? 'Video' : 'Image'}
            </span>
            {ratioCategory !== 'other' && (
              <span className="text-[10px] font-mono text-white/60 bg-black/30 px-1.5 py-0.5 rounded">
                {getRatioLabel(ratioCategory)}
              </span>
            )}
          </div>
        </div>

        {/* Card body */}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm truncate flex-1">{item.title ?? 'Untitled'}</p>
            <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-brand-400 transition-colors flex-shrink-0 ml-1" />
          </div>

          <PlatformCompatibility fits={fits} />

          <div className="flex items-center justify-between text-xs text-white/35 pt-0.5">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </div>
            <div className="flex items-center gap-2">
              <span>{(item.file_size / 1024 / 1024).toFixed(1)} MB</span>
              {variantCount > 0 && (
                <span className="flex items-center gap-0.5 text-brand-400">
                  <Layers className="w-3 h-3" />{variantCount}
                </span>
              )}
            </div>
          </div>

          {/* Existing variant dots */}
          {variantCount > 0 && (
            <div className="flex items-center gap-1 flex-wrap pt-0.5 border-t border-surface-border/30">
              <span className="text-[9px] text-white/25 uppercase tracking-wider">Variants:</span>
              {item.content_variants.map((v) => {
                const spec = PLATFORM_SPECS[v.platform as Platform]
                if (!spec) return null
                const c = spec.color === '#000000' || spec.color === '#010101' ? '#8B8B8B' : spec.color
                return (
                  <span key={v.id} title={spec.label}
                    className="inline-block w-2 h-2 rounded-sm"
                    style={{ backgroundColor: c }}
                  />
                )
              })}
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}

// ── List row ──────────────────────────────────────────────────────────────────

function ListRow({
  item, fits, isSelected, onToggleSelect,
}: {
  item: ContentItem; fits: PlatformFit[]
  isSelected: boolean; onToggleSelect: (id: string) => void
}) {
  const variantCount  = item.content_variants.length
  const ratioCategory = getRatioCategory(item.width, item.height)
  const native        = fits.filter((f) => f.fit === 'native')
  const crop          = fits.filter((f) => f.fit === 'crop')

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors',
      isSelected ? 'border-brand-500 bg-surface-card' : 'border-surface-border bg-surface-card hover:border-brand-600/40'
    )}>
      <button onClick={() => onToggleSelect(item.id)} className="flex-shrink-0" aria-label="Select">
        {isSelected ? <CheckSquare className="w-4 h-4 text-brand-400" /> : <Square className="w-4 h-4 text-white/30" />}
      </button>

      {/* Thumbnail */}
      <div className="w-11 h-11 rounded-lg bg-surface overflow-hidden flex items-center justify-center flex-shrink-0">
        {item.type === 'video' ? (
          <FileVideo className="w-5 h-5 text-white/20" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.original_url} alt="" className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.title ?? 'Untitled'}</p>
        <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5 flex-wrap">
          <span className={cn('font-medium', item.type === 'video' ? 'text-brand-400' : 'text-emerald-400')}>
            {item.type === 'video' ? 'Video' : 'Image'}
          </span>
          {ratioCategory !== 'other' && (
            <span className="font-mono text-white/30">{getRatioLabel(ratioCategory)}</span>
          )}
          <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
          <span>{(item.file_size / 1024 / 1024).toFixed(1)} MB</span>
        </div>
      </div>

      {/* Compatibility (hidden on mobile) */}
      <div className="hidden md:flex flex-col gap-1 flex-shrink-0">
        {native.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              {native.map(({ platform }) => <PlatformDot key={platform} platform={platform} dim={false} />)}
            </div>
            <span className="text-[10px] text-emerald-400/60">{native.length} native</span>
          </div>
        )}
        {crop.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              {crop.map(({ platform }) => <PlatformDot key={platform} platform={platform} dim={true} />)}
            </div>
            <span className="text-[10px] text-white/25">{crop.length} crop</span>
          </div>
        )}
      </div>

      {variantCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-brand-400 flex-shrink-0">
          <Layers className="w-3 h-3" />{variantCount}
        </div>
      )}

      <Link
        href={`/dashboard/transform/${item.id}`}
        className="flex-shrink-0 flex items-center gap-1 text-xs btn-secondary py-1.5 px-3"
      >
        View <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
