'use client'

import { LucideIcon, PieChart as PieChartIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ChartCardProps {
  title: string
  icon: LucideIcon
  iconColor?: string
  children: React.ReactNode
  loading?: boolean
  empty?: boolean
  emptyMessage?: string
}

export function ChartCard({
  title,
  icon: Icon = PieChartIcon,
  iconColor = 'text-blue-500',
  children,
  loading = false,
  empty = false,
  emptyMessage = '暂无数据',
}: ChartCardProps) {
  return (
    <Card className="h-[280px] shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {loading ? (
          <div className="flex h-[200px] items-center justify-center">
            <Skeleton className="h-[180px] w-full" />
          </div>
        ) : empty ? (
          <div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm">
            {emptyMessage}
          </div>
        ) : (
          <div className="h-[200px]">{children}</div>
        )}
      </CardContent>
    </Card>
  )
}
