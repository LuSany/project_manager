import { Skeleton, SkeletonCard, SkeletonMetric } from '@/components/ui/skeleton'

export default function ProjectDetailLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Metrics skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonMetric key={i} />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid gap-6 md:grid-cols-3">
        <SkeletonCard className="md:col-span-2" />
        <SkeletonCard />
      </div>
    </div>
  )
}