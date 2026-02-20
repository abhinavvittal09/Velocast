'use client'

import { useEffect, useCallback, useState } from 'react'
import { X, Download, Copy, Check, Loader2 } from 'lucide-react'

interface ImagePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  platform: string
  platformLabel: string
  width: number
  height: number
}

export default function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  platform,
  platformLabel,
  width,
  height,
}: ImagePreviewModalProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  const handleDownload = useCallback(async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const sanitizedPlatform = platform.replace(/[^a-zA-Z0-9_-]/g, '_')
      const ext = imageUrl.split('.').pop()?.split('?')[0] ?? 'jpg'
      const filename = `velocast_${sanitizedPlatform}_${width}x${height}.${ext}`
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)
    } catch {
      // silently fail — user can right-click and save manually
    } finally {
      setIsDownloading(false)
    }
  }, [imageUrl, platform, width, height])

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(imageUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }, [imageUrl])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative z-10 flex flex-col bg-surface-card border border-surface-border rounded-xl shadow-2xl max-w-[90vw] max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-surface-border flex-shrink-0">
          <p className="text-sm font-semibold text-white truncate">
            {platformLabel}
            <span className="ml-2 text-white/40 font-normal">
              {width} &times; {height}
            </span>
          </p>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-md text-white/50 hover:text-white hover:bg-surface-border transition-colors"
            aria-label="Close preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image area */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-black/40 p-4 min-h-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`${platformLabel} variant`}
            style={{ maxHeight: '80vh', maxWidth: '90vw' }}
            className="object-contain rounded-lg"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-surface-border flex-shrink-0">
          <button
            onClick={handleCopyLink}
            className="btn-secondary flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy link
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Downloading…
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
