'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Upload, FileVideo, Clock, Layers, Search,
  Grid3X3, List, ChevronRight, Trash2, Loader2,
  CheckSquare, Square, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import { formatDistanceToNow } from 'date-fns'

// ── Types ────────────────────────────────────────────────────────────────────
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
  status: string
  created_at: string
  content_variants: ContentVariantMeta[]
}

const PAGE_SIZE = 20

// ── Component ─────────────────────────────────────────────────────────────────
export default function ContentLibraryClient({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), [])

  const [items, setItems] = useState<ContentItem[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchItems = useCallback(
    async (pageNum: number, reset = false) => {
      if (pageNum === 0) setIsLoading(true)
      else setIsLoadingMore(true)

      const { data } = await supabase
        .from('content_items')
        .select('*, content_variants(id, platform)')
        .eq('user_id', userId)
        .order('created_at', { ascending: sort === 'oldest' })
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

  // ── Client-side filtering ─────────────────────────────────────────────────
  const displayItems = useMemo(() => {
    let filtered = items
    if (typeFilter !== 'all') {
      filtered = filtered.filter((i) => i.type === typeFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter((i) => (i.title ?? '').toLowerCase().includes(q))
    }
    return filtered
  }, [items, typeFilter, search])

  // ── Actions ───────────────────────────────────────────────────────────────
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
    if (
      !confirm(
        `Delete ${selectedIds.size} item${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`
      )
    )
      return

    setIsDeleting(true)
    let deletedCount = 0

    for (const id of selectedIds) {
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

  // ── Skeleton loader ───────────────────────────────────────────────────────
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
    <div className="space-y-5">
      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title…"
            className="input pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5 text-white/30 hover:text-white/60" />
            </button>
          )}
        </div>

        {/* Type filter tabs */}
        <div className="flex items-center bg-surface-card border border-surface-border rounded-lg p-0.5">
          {(['all', 'image', 'video'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize',
                typeFilter === f
                  ? 'bg-brand-600 text-white'
                  : 'text-white/50 hover:text-white'
              )}
            >
              {f === 'all' ? 'All' : f === 'image' ? 'Images' : 'Videos'}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')}
          className="input w-auto bg-surface-card"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>

        {/* View mode toggle */}
        <div className="flex items-center bg-surface-card border border-surface-border rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              viewMode === 'grid' ? 'bg-brand-600' : 'text-white/40 hover:text-white'
            )}
            aria-label="Grid view"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              viewMode === 'list' ? 'bg-brand-600' : 'text-white/40 hover:text-white'
            )}
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Bulk action bar ───────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-brand-950/50 border border-brand-800/50 rounded-xl">
          <span className="text-sm text-brand-300">
            {selectedIds.size} selected
          </span>
          <button
            onClick={toggleSelectAll}
            className="text-xs text-white/50 hover:text-white transition-colors"
          >
            {selectedIds.size === displayItems.length
              ? 'Deselect all'
              : `Select all ${displayItems.length}`}
          </button>
          <div className="flex-1" />
          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
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
            {search || typeFilter !== 'all' ? 'No results found' : 'No content yet'}
          </h3>
          <p className="text-white/50 text-sm mb-6">
            {search || typeFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Upload your first video or image to get started.'}
          </p>
          {!search && typeFilter === 'all' && (
            <Link href="/dashboard/upload" className="btn-primary mx-auto">
              Upload your first file
            </Link>
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
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {/* ── Load more ─────────────────────────────────────────────────────── */}
      {hasMore && !search && typeFilter === 'all' && displayItems.length > 0 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="btn-secondary"
          >
            {isLoadingMore ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</>
            ) : (
              'Load more'
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Grid card ─────────────────────────────────────────────────────────────────
function GridCard({
  item,
  isSelected,
  onToggleSelect,
}: {
  item: ContentItem
  isSelected: boolean
  onToggleSelect: (id: string) => void
}) {
  const variantCount = item.content_variants?.length ?? 0

  return (
    <div
      className={cn(
        'card p-0 overflow-hidden group transition-colors relative',
        isSelected ? 'border-brand-500' : 'hover:border-brand-600/50'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.preventDefault()
          onToggleSelect(item.id)
        }}
        className="absolute top-2 left-2 z-10"
        aria-label="Select"
      >
        {isSelected ? (
          <CheckSquare className="w-4 h-4 text-brand-400" />
        ) : (
          <Square className="w-4 h-4 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded" />
        )}
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
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          )}
          <div className="absolute top-2 right-2">
            <span
              className={`badge ${item.type === 'video' ? 'badge-brand' : 'badge-success'}`}
            >
              {item.type === 'video' ? '🎬' : '🖼'}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-sm truncate flex-1">
              {item.title ?? 'Untitled'}
            </p>
            <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-brand-400 transition-colors flex-shrink-0 ml-1" />
          </div>
          <div className="flex items-center justify-between text-xs text-white/40">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </div>
            {variantCount > 0 && (
              <div className="flex items-center gap-1 text-brand-400">
                <Layers className="w-3 h-3" />
                {variantCount}
              </div>
            )}
          </div>
          <p className="text-xs text-white/30 mt-0.5">
            {(item.file_size / 1024 / 1024).toFixed(1)} MB
          </p>
        </div>
      </Link>
    </div>
  )
}

// ── List row ──────────────────────────────────────────────────────────────────
function ListRow({
  item,
  isSelected,
  onToggleSelect,
}: {
  item: ContentItem
  isSelected: boolean
  onToggleSelect: (id: string) => void
}) {
  const variantCount = item.content_variants?.length ?? 0

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors',
        isSelected
          ? 'border-brand-500 bg-surface-card'
          : 'border-surface-border bg-surface-card hover:border-brand-600/40'
      )}
    >
      <button
        onClick={() => onToggleSelect(item.id)}
        className="flex-shrink-0"
        aria-label="Select"
      >
        {isSelected ? (
          <CheckSquare className="w-4 h-4 text-brand-400" />
        ) : (
          <Square className="w-4 h-4 text-white/30" />
        )}
      </button>

      {/* Mini thumbnail */}
      <div className="w-11 h-11 rounded-lg bg-surface overflow-hidden flex items-center justify-center flex-shrink-0">
        {item.type === 'video' ? (
          <FileVideo className="w-5 h-5 text-white/20" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.original_url}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        )}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.title ?? 'Untitled'}</p>
        <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
          <span
            className={`badge text-[10px] py-0 px-1.5 ${item.type === 'video' ? 'badge-brand' : 'badge-success'}`}
          >
            {item.type}
          </span>
          <span>
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </span>
          <span>{(item.file_size / 1024 / 1024).toFixed(1)} MB</span>
        </div>
      </div>

      {/* Variant count */}
      {variantCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-brand-400 flex-shrink-0">
          <Layers className="w-3 h-3" />
          {variantCount} platform{variantCount !== 1 ? 's' : ''}
        </div>
      )}

      {/* View action */}
      <Link
        href={`/dashboard/transform/${item.id}`}
        className="flex-shrink-0 flex items-center gap-1 text-xs btn-secondary py-1.5 px-3"
      >
        View <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
