import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import Link from 'next/link'
import { Upload, FileVideo, Clock, Layers, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export const metadata: Metadata = { title: 'Content Library' }

export default async function ContentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch items with variant counts
  const { data: items } = await supabase
    .from('content_items')
    .select('*, content_variants(id, platform)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Library</h1>
          <p className="text-white/60 mt-1">{items?.length ?? 0} items</p>
        </div>
        <Link href="/dashboard/upload" className="btn-primary">
          <Upload className="w-4 h-4" /> Upload
        </Link>
      </div>

      {!items || items.length === 0 ? (
        <div className="card text-center py-20">
          <div className="w-16 h-16 bg-surface-border rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-white/40" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No content yet</h3>
          <p className="text-white/50 text-sm mb-6">
            Upload your first video or image to get started.
          </p>
          <Link href="/dashboard/upload" className="btn-primary mx-auto">
            Upload your first file
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => {
            const variantCount = (item.content_variants as { id: string; platform: string }[] | null)?.length ?? 0

            return (
              <Link
                key={item.id}
                href={`/dashboard/transform/${item.id}`}
                className="card p-0 overflow-hidden group hover:border-brand-600/50 transition-colors block"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-surface flex items-center justify-center relative">
                  {item.type === 'video' ? (
                    <FileVideo className="w-10 h-10 text-white/20" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.original_url}
                      alt={item.title ?? ''}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  )}
                  <div className="absolute top-2 left-2">
                    <span className={`badge ${item.type === 'video' ? 'badge-brand' : 'badge-success'}`}>
                      {item.type === 'video' ? '🎬 Video' : '🖼 Image'}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className={`badge ${
                      item.status === 'ready' ? 'badge-success' :
                      item.status === 'error' ? 'badge-error' : 'badge-warning'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm truncate flex-1">{item.title ?? 'Untitled'}</p>
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
                        {variantCount} variant{variantCount !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">
                    {(item.file_size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
