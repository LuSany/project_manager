import * as React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'text' | 'rectangular'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    { className, variant = 'default', width, height, animation = 'pulse', style, ...props },
    ref
  ) => {
    const variantStyles = {
      default: 'rounded-md',
      circular: 'rounded-full',
      text: 'rounded h-4',
      rectangular: 'rounded-lg',
    }

    const animationStyles = {
      pulse: 'animate-pulse',
      wave: 'animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]',
      none: '',
    }

    return (
      <div
        ref={ref}
        className={cn('bg-muted', variantStyles[variant], animationStyles[animation], className)}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          ...style,
        }}
        {...props}
      />
    )
  }
)
Skeleton.displayName = 'Skeleton'

const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn('space-y-3 rounded-xl border p-4', className)}>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-20 w-full" />
  </div>
)

const SkeletonList = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
        <Skeleton variant="circular" className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
)

const SkeletonTable = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="overflow-hidden rounded-lg border">
    <div className="bg-muted/50 flex gap-4 p-3">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 border-t p-3">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
)

const SkeletonMetric = () => (
  <div className="rounded-xl border p-5">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton variant="circular" className="h-12 w-12" />
    </div>
  </div>
)

const SkeletonRiskOverview = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg p-2 text-center">
          <Skeleton className="mx-auto h-6 w-8" />
          <Skeleton className="mx-auto mt-1 h-3 w-6" />
        </div>
      ))}
    </div>
    <div className="bg-muted/50 rounded-lg p-3">
      <Skeleton className="mb-2 h-3 w-16" />
      <div className="grid grid-cols-5 gap-1">
        {Array.from({ length: 25 }).map((_, i) => (
          <Skeleton key={i} className="h-3 rounded-sm" />
        ))}
      </div>
      <div className="mt-1 flex justify-between">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-2 w-2 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  </div>
)

export { Skeleton, SkeletonCard, SkeletonList, SkeletonTable, SkeletonMetric, SkeletonRiskOverview }
