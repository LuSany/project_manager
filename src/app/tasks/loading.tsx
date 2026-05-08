import { Skeleton, SkeletonCard, SkeletonTable } from '@/components/ui/skeleton'

export default function TasksLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>

      {/* Task table skeleton */}
      <SkeletonTable rows={8} cols={6} />
    </div>
  )
}