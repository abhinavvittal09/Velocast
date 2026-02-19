import { Metadata } from 'next'
import UploadClient from '@/components/dashboard/UploadClient'

export const metadata: Metadata = { title: 'Upload Content' }

export default function UploadPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Upload Content</h1>
        <p className="text-white/60 mt-1">
          Upload once — we&apos;ll resize and prepare it for every platform automatically.
        </p>
      </div>
      <UploadClient />
    </div>
  )
}
