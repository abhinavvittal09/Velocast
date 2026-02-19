import { Metadata } from 'next'
import PostingTimeHeatmap from '@/components/dashboard/PostingTimeHeatmap'

export const metadata: Metadata = { title: 'Best Times to Post' }

export default function PostingTimesPage() {
  return (
    <div className="animate-fade-in">
      <PostingTimeHeatmap />
    </div>
  )
}
