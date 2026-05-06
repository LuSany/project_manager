'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Calendar, CheckSquare, Archive } from 'lucide-react'

interface ProjectStatsProps {
  stats: {
    total: number
    active: number
    completed: number
  }
}

export function ProjectStats({ stats }: ProjectStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">总项目数</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20 text-green-600 dark:text-green-400">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">进行中</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-500/20 text-gray-600 dark:text-gray-400">
              <Archive className="h-6 w-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">已完成</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}