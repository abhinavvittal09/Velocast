import { Metadata } from 'next'
import PlatformGrid from '@/components/platforms/PlatformGrid'

export const metadata: Metadata = { title: 'Platforms' }

export default function PlatformsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Platforms</h1>
        <p className="text-white/60 mt-1">
          Supported platforms and their content specifications
        </p>
      </div>
      <PlatformGrid />
    </div>
  )
}
