'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  X, Loader2, ZoomIn, ZoomOut, RotateCcw, RotateCw,
  FlipHorizontal, RefreshCw, Move,
} from 'lucide-react'
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

interface TransformState {
  zoom: number       // 0.25–5
  rotation: number   // 0, 90, 180, 270
  invert: boolean
  panX: number       // pixels from center on the PREVIEW canvas
  panY: number
}

const DEFAULT_STATE: TransformState = {
  zoom: 1,
  rotation: 0,
  invert: false,
  panX: 0,
  panY: 0,
}

function drawFrame(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  state: TransformState
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { zoom, rotation, panX, panY, invert } = state
  const cw = canvas.width
  const ch = canvas.height
  const rotRad = (rotation * Math.PI) / 180

  // When rotated 90/270 the effective image dims swap
  const isTransposed = rotation === 90 || rotation === 270
  const effW = isTransposed ? img.naturalHeight : img.naturalWidth
  const effH = isTransposed ? img.naturalWidth : img.naturalHeight

  ctx.clearRect(0, 0, cw, ch)

  // ── 1. Blurred background (scale to cover + a little extra so blur edges don't show) ──
  ctx.save()
  ctx.filter = 'blur(24px)'
  const bgScale = Math.max(cw / effW, ch / effH) * 1.15
  ctx.translate(cw / 2, ch / 2)
  ctx.rotate(rotRad)
  ctx.drawImage(
    img,
    (-img.naturalWidth / 2) * bgScale,
    (-img.naturalHeight / 2) * bgScale,
    img.naturalWidth * bgScale,
    img.naturalHeight * bgScale
  )
  ctx.restore()

  // Darken the blur layer slightly so main image pops
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(0, 0, cw, ch)

  // ── 2. Main image (fit-contain × zoom, panned) ──
  ctx.save()
  if (invert) ctx.filter = 'invert(1)'
  const fitScale = Math.min(cw / effW, ch / effH) * zoom
  ctx.translate(cw / 2 + panX, ch / 2 + panY)
  ctx.rotate(rotRad)
  ctx.drawImage(
    img,
    (-img.naturalWidth / 2) * fitScale,
    (-img.naturalHeight / 2) * fitScale,
    img.naturalWidth * fitScale,
    img.naturalHeight * fitScale
  )
  ctx.restore()
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
  const [transform, setTransform] = useState<TransformState>(DEFAULT_STATE)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  // Drag / pinch state
  const pointerState = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    // pinch
    pinching: false,
    startDist: 0,
    startZoom: 1,
  })

  // ── Load image when modal opens ────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    setTransform(DEFAULT_STATE)
    setError(null)
    setImgLoaded(false)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imgRef.current = img
      setImgLoaded(true)
    }
    img.onerror = () => setError('Failed to load image')
    img.src = originalUrl
  }, [isOpen, originalUrl])

  // ── Re-draw canvas whenever transform or imgLoaded changes ─────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !imgLoaded) return
    drawFrame(canvas, img, transform)
  }, [transform, imgLoaded])

  // ── Escape key ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // ── Toolbar actions ─────────────────────────────────────────────────────────
  function rotateCW() {
    setTransform((s) => ({ ...s, rotation: (s.rotation + 90) % 360, panX: 0, panY: 0 }))
  }
  function rotateCCW() {
    setTransform((s) => ({ ...s, rotation: (s.rotation - 90 + 360) % 360, panX: 0, panY: 0 }))
  }
  function zoomIn() {
    setTransform((s) => ({ ...s, zoom: Math.min(5, parseFloat((s.zoom + 0.25).toFixed(2))) }))
  }
  function zoomOut() {
    setTransform((s) => ({ ...s, zoom: Math.max(0.25, parseFloat((s.zoom - 0.25).toFixed(2))) }))
  }
  function toggleInvert() {
    setTransform((s) => ({ ...s, invert: !s.invert }))
  }
  function resetTransform() {
    setTransform(DEFAULT_STATE)
  }

  // ── Mouse wheel zoom ────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    setTransform((s) => ({
      ...s,
      zoom: Math.min(5, Math.max(0.25, parseFloat((s.zoom * factor).toFixed(3)))),
    }))
  }, [])

  // ── Mouse drag ──────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    pointerState.current.dragging = true
    pointerState.current.startX = e.clientX
    pointerState.current.startY = e.clientY
    pointerState.current.startPanX = transform.panX
    pointerState.current.startPanY = transform.panY
  }, [transform.panX, transform.panY])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!pointerState.current.dragging) return
    const dx = e.clientX - pointerState.current.startX
    const dy = e.clientY - pointerState.current.startY
    setTransform((s) => ({
      ...s,
      panX: pointerState.current.startPanX + dx,
      panY: pointerState.current.startPanY + dy,
    }))
  }, [])

  const handleMouseUp = useCallback(() => {
    pointerState.current.dragging = false
  }, [])

  // ── Touch: single-finger drag + two-finger pinch ───────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0]
      pointerState.current.dragging = true
      pointerState.current.pinching = false
      pointerState.current.startX = t.clientX
      pointerState.current.startY = t.clientY
      pointerState.current.startPanX = transform.panX
      pointerState.current.startPanY = transform.panY
    } else if (e.touches.length === 2) {
      pointerState.current.dragging = false
      pointerState.current.pinching = true
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      pointerState.current.startDist = Math.hypot(dx, dy)
      pointerState.current.startZoom = transform.zoom
    }
  }, [transform.panX, transform.panY, transform.zoom])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1 && pointerState.current.dragging) {
      const t = e.touches[0]
      const dx = t.clientX - pointerState.current.startX
      const dy = t.clientY - pointerState.current.startY
      setTransform((s) => ({
        ...s,
        panX: pointerState.current.startPanX + dx,
        panY: pointerState.current.startPanY + dy,
      }))
    } else if (e.touches.length === 2 && pointerState.current.pinching) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      const dist = Math.hypot(dx, dy)
      const ratio = dist / pointerState.current.startDist
      const newZoom = Math.min(5, Math.max(0.25, parseFloat((pointerState.current.startZoom * ratio).toFixed(3))))
      setTransform((s) => ({ ...s, zoom: newZoom }))
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    pointerState.current.dragging = false
    pointerState.current.pinching = false
  }, [])

  // ── Apply: render at target resolution and upload ──────────────────────────
  const handleApply = useCallback(async () => {
    const img = imgRef.current
    if (!img) return
    setIsSaving(true)
    setError(null)

    try {
      // Build an offscreen canvas at full target resolution
      const offscreen = document.createElement('canvas')
      offscreen.width = targetWidth
      offscreen.height = targetHeight

      // Scale pan from preview canvas size → target size
      const previewCanvas = canvasRef.current
      const scaleX = previewCanvas ? targetWidth / previewCanvas.width : 1
      const scaleY = previewCanvas ? targetHeight / previewCanvas.height : 1

      drawFrame(offscreen, img, {
        ...transform,
        panX: transform.panX * scaleX,
        panY: transform.panY * scaleY,
      })

      const blob = await new Promise<Blob>((resolve, reject) =>
        offscreen.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
          'image/jpeg',
          0.95
        )
      )

      const formData = new FormData()
      formData.append('image', blob, `${platform}.jpg`)
      formData.append('contentItemId', contentItemId)
      formData.append('platform', platform)

      const res = await fetch('/api/transform/image/crop', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const msg = (data as { error?: string }).error ?? 'Crop failed'
        setError(msg)
        toast.error(msg)
        return
      }

      toast.success(`${platformLabel} variant saved`)
      onSuccess()
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }, [transform, targetWidth, targetHeight, platform, platformLabel, contentItemId, onSuccess, onClose])

  if (!isOpen) return null

  const aspectRatio = `${targetWidth} / ${targetHeight}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative z-10 flex flex-col bg-surface-card border border-surface-border rounded-xl shadow-2xl w-full max-w-[560px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-surface-border flex-shrink-0">
          <p className="text-sm font-semibold text-white">
            Edit — <span className="text-brand-400">{platformLabel}</span>
          </p>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-md text-white/50 hover:text-white hover:bg-surface-border transition-colors"
            aria-label="Close editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-center gap-1 px-4 py-2 border-b border-surface-border bg-surface-card/50 flex-wrap">
          {/* Rotate */}
          <ToolbarGroup label="Rotate">
            <ToolBtn onClick={rotateCCW} title="Rotate counter-clockwise"><RotateCcw className="w-3.5 h-3.5" /></ToolBtn>
            <ToolBtn onClick={rotateCW}  title="Rotate clockwise"><RotateCw  className="w-3.5 h-3.5" /></ToolBtn>
          </ToolbarGroup>

          <div className="w-px h-5 bg-surface-border/60 mx-1" />

          {/* Zoom */}
          <ToolbarGroup label="Zoom">
            <ToolBtn onClick={zoomOut} title="Zoom out"><ZoomOut className="w-3.5 h-3.5" /></ToolBtn>
            <span className="text-xs text-white/50 w-10 text-center tabular-nums">{transform.zoom.toFixed(2)}×</span>
            <ToolBtn onClick={zoomIn} title="Zoom in"><ZoomIn className="w-3.5 h-3.5" /></ToolBtn>
          </ToolbarGroup>

          <div className="w-px h-5 bg-surface-border/60 mx-1" />

          {/* Invert */}
          <ToolBtn
            onClick={toggleInvert}
            title="Invert colours"
            active={transform.invert}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            <span className="text-[10px] ml-0.5">Invert</span>
          </ToolBtn>

          <div className="w-px h-5 bg-surface-border/60 mx-1" />

          {/* Reset */}
          <ToolBtn onClick={resetTransform} title="Reset all">
            <RefreshCw className="w-3 h-3" />
            <span className="text-[10px] ml-0.5">Reset</span>
          </ToolBtn>
        </div>

        {/* Canvas preview */}
        <div className="flex flex-col items-center gap-2 px-5 pt-4">
          <div
            style={{ aspectRatio, maxWidth: '500px', maxHeight: '65vh', width: '100%' }}
            className="relative rounded-lg overflow-hidden border border-surface-border ring-1 ring-brand-500/20 select-none"
          >
            <canvas
              ref={canvasRef}
              width={500}
              height={Math.round(500 * (targetHeight / targetWidth))}
              style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }}
              className="active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
            />
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface-card">
                <Loader2 className="w-6 h-6 animate-spin text-white/30" />
              </div>
            )}
          </div>

          {/* Hints */}
          <div className="flex items-center gap-3 text-[10px] text-white/30">
            <span className="flex items-center gap-1"><Move className="w-3 h-3" /> Drag to pan</span>
            <span>· Scroll / pinch to zoom</span>
          </div>

          <p className="text-xs text-white/40">
            <span className="font-medium text-white/60">{platformLabel}</span>{' '}
            {targetWidth} × {targetHeight}px
          </p>

          {error && <p className="text-xs text-rose-400 text-center">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 mt-2">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={isSaving}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isSaving || !imgLoaded}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
            ) : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tiny toolbar components ──────────────────────────────────────────────────

function ToolbarGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-0.5">
      <span className="text-[9px] text-white/20 uppercase tracking-wider mr-1 hidden sm:inline">{label}</span>
      {children}
    </div>
  )
}

function ToolBtn({
  onClick, title, children, active = false,
}: {
  onClick: () => void; title: string; children: React.ReactNode; active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex items-center px-2 py-1.5 rounded-md text-xs transition-colors ${
        active
          ? 'bg-brand-500/30 text-white border border-brand-500/50'
          : 'text-white/50 hover:text-white hover:bg-surface-border'
      }`}
    >
      {children}
    </button>
  )
}
