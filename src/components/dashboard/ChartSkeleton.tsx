'use client'

export function ChartSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-full w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
    </div>
  )
}