'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Loader2, Move } from 'lucide-react'
import { toast } from 'sonner'

interface CropEditorProps {
  isOpen: boolean
  onClose: () => void
  originalUrl: string
  targetWidth: number
  targetHeight: number
  platform: string
  platformLabel: string
  contentItemId: string
  onSuccess: () => void
}

interface DragState {
  isDragging: boolean
  startX: number
  startY: number
  startObjX: number
  startObjY: number
}

export default function CropEditor({
  isOpen,
  onClose,
  originalUrl,
  targetWidth,
  targetHeight,
  platform,
  platformLabel,
  contentItemId,
  onSuccess,
}: CropEditorProps) {
  // objectPosition stored as percentage [0, 100] for both axes
  const [objPosX, setObjPosX] = useState(50)
  const [objPosY, setObjPosY] = useState(50)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dragState = useRef<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startObjX: 50,
    startObjY: 50,
  })
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset position when modal opens
  useEffect(() => {
    if (isOpen) {
      setObjPosX(50)
      setObjPosY(50)
      setError(null)
    }
  }, [isOpen])

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // ── Drag: mouse ────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      dragState.current = {
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startObjX: objPosX,
        startObjY: objPosY,
      }
    },
    [objPosX, objPosY]
  )

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState.current.isDragging) return
    const container = containerRef.current
    if (!container) return

    const { width: cw, height: ch } = container.getBoundingClientRect()
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY

    // Convert pixel drag delta to percentage offset (inverted: dragging right moves the crop left)
    const deltaXPct = (dx / cw) * 100
    const deltaYPct = (dy / ch) * 100

    const newX = Math.min(100, Math.max(0, dragState.current.startObjX - deltaXPct))
    const newY = Math.min(100, Math.max(0, dragState.current.startObjY - deltaYPct))

    setObjPosX(newX)
    setObjPosY(newY)
  }, [])

  const handleMouseUp = useCallback(() => {
    dragState.current.isDragging = false
  }, [])

  // ── Drag: touch ────────────────────────────────────────────────────────────
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0]
      if (!touch) return
      dragState.current = {
        isDragging: true,
        startX: touch.clientX,
        startY: touch.clientY,
        startObjX: objPosX,
        startObjY: objPosY,
      }
    },
    [objPosX, objPosY]
  )

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!dragState.current.isDragging) return
    const touch = e.touches[0]
    if (!touch) return
    const container = containerRef.current
    if (!container) return

    const { width: cw, height: ch } = container.getBoundingClientRect()
    const dx = touch.clientX - dragState.current.startX
    const dy = touch.clientY - dragState.current.startY

    const deltaXPct = (dx / cw) * 100
    const deltaYPct = (dy / ch) * 100

    const newX = Math.min(100, Math.max(0, dragState.current.startObjX - deltaXPct))
    const newY = Math.min(100, Math.max(0, dragState.current.startObjY - deltaYPct))

    setObjPosX(newX)
    setObjPosY(newY)
  }, [])

  const handleTouchEnd = useCallback(() => {
    dragState.current.isDragging = false
  }, [])

  // ── Apply Crop ─────────────────────────────────────────────────────────────
  const handleApplyCrop = useCallback(async () => {
    setIsSaving(true)
    setError(null)

    try {
      // Load image to get natural dimensions
      const naturalDims = await new Promise<{ naturalWidth: number; naturalHeight: number }>(
        (resolve, reject) => {
          const img = new Image()
          img.onload = () =>
            resolve({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight })
          img.onerror = () => reject(new Error('Failed to load image'))
          img.crossOrigin = 'anonymous'
          img.src = originalUrl
        }
      )

      const { naturalWidth, naturalHeight } = naturalDims
      const aspectRatio = targetWidth / targetHeight

      let cropX: number
      let cropY: number
      let cropW: number
      let cropH: number

      if (naturalWidth / naturalHeight > aspectRatio) {
        // Image is wider than target ratio — crop width
        cropH = naturalHeight
        cropW = Math.round(cropH * aspectRatio)
        cropX = Math.round((objPosX / 100) * (naturalWidth - cropW))
        cropY = 0
      } else {
        // Image is taller than target ratio — crop height
        cropW = naturalWidth
        cropH = Math.round(cropW / aspectRatio)
        cropX = 0
        cropY = Math.round((objPosY / 100) * (naturalHeight - cropH))
      }

      const res = await fetch('/api/transform/image/crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentItemId,
          platform,
          cropX,
          cropY,
          cropW,
          cropH,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const msg = (data as { error?: string }).error ?? 'Crop failed'
        setError(msg)
        toast.error(msg)
        return
      }

      toast.success(`${platformLabel} crop saved`)
      onSuccess()
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }, [
    originalUrl,
    targetWidth,
    targetHeight,
    objPosX,
    objPosY,
    contentItemId,
    platform,
    platformLabel,
    onSuccess,
    onClose,
  ])

  if (!isOpen) return null

  // Preview container: max 500px wide, max 70vh tall, correct aspect ratio
  const aspectRatioStyle = `${targetWidth} / ${targetHeight}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative z-10 flex flex-col bg-surface-card border border-surface-border rounded-xl shadow-2xl w-full max-w-[540px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-surface-border flex-shrink-0">
          <p className="text-sm font-semibold text-white">
            Edit crop &mdash; {platformLabel}
          </p>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-md text-white/50 hover:text-white hover:bg-surface-border transition-colors"
            aria-label="Close crop editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview area */}
        <div className="flex flex-col items-center gap-3 px-5 pt-5">
          {/* Crop preview container */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              aspectRatio: aspectRatioStyle,
              maxWidth: '500px',
              maxHeight: '70vh',
              cursor: 'grab',
            }}
            className="w-full rounded-lg overflow-hidden border border-surface-border select-none active:cursor-grabbing ring-1 ring-brand-500/20"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={originalUrl}
              alt="Crop preview"
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: `${objPosX}% ${objPosY}%`,
                display: 'block',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Hint */}
          <p className="flex items-center gap-1.5 text-xs text-white/40">
            <Move className="w-3.5 h-3.5" />
            Drag to reposition
          </p>

          {/* Crop info */}
          <p className="text-xs text-white/50 text-center">
            <span className="font-medium text-white/70">{platformLabel}</span>
            {': '}
            {targetWidth} &times; {targetHeight}
          </p>

          {/* Error message */}
          {error && (
            <p className="text-xs text-rose-400 text-center px-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isSaving}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Apply Crop'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
