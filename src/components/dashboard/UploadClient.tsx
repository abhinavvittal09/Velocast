'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, FileVideo, FileImage, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

interface FilePreview {
  file: File
  previewUrl: string
  type: 'image' | 'video'
}

const MAX_IMAGE_SIZE = 50 * 1024 * 1024   // 50 MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024  // 500 MB
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']

export default function UploadClient() {
  const [preview, setPreview] = useState<FilePreview | null>(null)
  const [title, setTitle] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function validateFile(file: File): string | null {
    if (!ACCEPTED.includes(file.type)) {
      return 'Unsupported file type. Use JPEG, PNG, WebP, MP4, MOV, or WebM.'
    }
    const isVideo = file.type.startsWith('video/')
    if (isVideo && file.size > MAX_VIDEO_SIZE) return 'Video must be under 500 MB.'
    if (!isVideo && file.size > MAX_IMAGE_SIZE) return 'Image must be under 50 MB.'
    return null
  }

  function loadFile(file: File) {
    const error = validateFile(file)
    if (error) { toast.error(error); return }

    const previewUrl = URL.createObjectURL(file)
    const type = file.type.startsWith('video/') ? 'video' : 'image'
    setPreview({ file, previewUrl, type })
    setTitle(file.name.replace(/\.[^.]+$/, ''))
    setStatus('idle')
    setErrorMsg('')
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) loadFile(file)
  }, [])

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }

  function clearPreview() {
    if (preview) URL.revokeObjectURL(preview.previewUrl)
    setPreview(null)
    setTitle('')
    setStatus('idle')
    setProgress(0)
    setErrorMsg('')
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleUpload() {
    if (!preview) return
    setStatus('uploading')
    setProgress(0)
    setErrorMsg('')

    try {
      const formData = new FormData()
      formData.append('file', preview.file)
      formData.append('title', title || preview.file.name)

      // ── Step 1: Upload original ──────────────────────────
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 8, 75))
      }, 300)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      clearInterval(progressInterval)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Upload failed')
      }

      const { contentItemId, type } = await res.json()
      setProgress(80)

      // ── Step 2: Generate platform variants ───────────────
      if (type === 'image' || type === 'video') {
        setStatus('processing')

        const transformEndpoint = type === 'image'
          ? '/api/transform/image'
          : '/api/transform/video'

        const transformRes = await fetch(transformEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentItemId }),
        })

        if (transformRes.ok) {
          const result = await transformRes.json()
          toast.success(`Uploaded + generated ${result.succeeded} platform variants!`)
        } else {
          // Non-fatal — upload succeeded, transforms failed
          toast.success('Uploaded! Platform variants will be generated shortly.')
        }
      }

      setProgress(100)
      setStatus('done')

      setTimeout(() => {
        router.push(`/dashboard/content?new=${contentItemId}`)
      }, 1200)
    } catch (err: unknown) {
      setStatus('error')
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setErrorMsg(msg)
      toast.error(msg)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Drop zone */}
      {!preview ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center gap-4',
            'cursor-pointer transition-all duration-200 text-center',
            isDragging
              ? 'border-brand-500 bg-brand-950/30'
              : 'border-surface-border hover:border-brand-600/60 hover:bg-surface-card'
          )}
        >
          <div className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
            isDragging ? 'bg-brand-600' : 'bg-surface-border'
          )}>
            <Upload className={cn('w-8 h-8', isDragging ? 'text-white' : 'text-white/60')} />
          </div>
          <div>
            <p className="text-lg font-semibold mb-1">
              {isDragging ? 'Drop it here' : 'Drag & drop your file'}
            </p>
            <p className="text-sm text-white/50">
              or <span className="text-brand-400">browse files</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {['JPEG', 'PNG', 'WebP', 'MP4', 'MOV', 'WebM'].map((fmt) => (
              <span key={fmt} className="badge badge-brand">{fmt}</span>
            ))}
          </div>
          <p className="text-xs text-white/30">Images up to 50 MB · Videos up to 500 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            onChange={onFileInput}
            className="hidden"
          />
        </div>
      ) : (
        <div className="card space-y-5">
          {/* Preview */}
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
            {preview.type === 'video' ? (
              <video
                src={preview.previewUrl}
                className="max-h-64 max-w-full rounded-lg"
                controls
                muted
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.previewUrl}
                alt="Preview"
                className="max-h-64 max-w-full object-contain rounded-lg"
              />
            )}
            {status === 'idle' && (
              <button
                onClick={clearPreview}
                className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* File info */}
          <div className="flex items-center gap-3">
            {preview.type === 'video'
              ? <FileVideo className="w-5 h-5 text-brand-400 flex-shrink-0" />
              : <FileImage className="w-5 h-5 text-brand-400 flex-shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{preview.file.name}</p>
              <p className="text-xs text-white/40">
                {(preview.file.size / 1024 / 1024).toFixed(1)} MB · {preview.type}
              </p>
            </div>
          </div>

          {/* Title input */}
          <div>
            <label className="label">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your content a title..."
              className="input"
              disabled={status === 'uploading' || status === 'done'}
            />
          </div>

          {/* Progress bar */}
          {(status === 'uploading' || status === 'processing' || status === 'done') && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/60">
                <span>
                  {status === 'done'
                    ? 'Complete!'
                    : status === 'processing'
                    ? 'Generating platform variants...'
                    : 'Uploading...'}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    status === 'processing' ? 'bg-purple-500' : 'bg-brand-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {status === 'processing' && (
                <p className="text-[11px] text-white/35">
                  {preview?.type === 'video'
                    ? 'Converting for TikTok, Reels, YouTube, LinkedIn, Twitter & more…'
                    : 'Resizing for Instagram, YouTube, TikTok, LinkedIn, Twitter & Facebook…'}
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/30 border border-red-800/50 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {status === 'idle' || status === 'error' ? (
              <>
                <button onClick={clearPreview} className="btn-secondary flex-1 justify-center">
                  <X className="w-4 h-4" /> Change file
                </button>
                <button onClick={handleUpload} className="btn-primary flex-1 justify-center">
                  <Upload className="w-4 h-4" /> Upload
                </button>
              </>
            ) : status === 'uploading' ? (
              <button disabled className="btn-primary flex-1 justify-center opacity-70">
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
              </button>
            ) : status === 'processing' ? (
              <button disabled className="btn-primary flex-1 justify-center opacity-70" style={{ background: 'rgb(126 34 206 / 0.8)' }}>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating variants...
              </button>
            ) : status === 'done' ? (
              <div className="flex items-center gap-2 text-emerald-400 font-medium w-full justify-center">
                <CheckCircle2 className="w-5 h-5" /> Redirecting to content library...
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="card bg-surface/50">
        <h3 className="text-sm font-semibold mb-3 text-white/80">What happens after upload?</h3>
        <ul className="space-y-2 text-sm text-white/60">
          <li className="flex items-start gap-2">
            <span className="text-brand-400 mt-0.5">1.</span>
            Your original file is stored securely in Supabase Storage
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-400 mt-0.5">2.</span>
            We auto-resize it for every platform (Instagram, TikTok, YouTube, LinkedIn, Twitter)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-400 mt-0.5">3.</span>
            AI generates captions and hashtags for each platform
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-400 mt-0.5">4.</span>
            You review, edit, and schedule or publish — all from one place
          </li>
        </ul>
      </div>
    </div>
  )
}
