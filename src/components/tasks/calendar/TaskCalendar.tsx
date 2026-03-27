'use client'

import React, { useState, useMemo } from 'react'
import { format, addMonths, subMonths } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Task } from '@/components/tasks/kanban/SortableTaskCard'

// ============================================================================
// 类型定义
// ============================================================================

interface TaskCalendarProps {
  projectId: string
  tasks: Task[]
  isLoading?: boolean
  onOpenDetail?: (taskId: string) => void
  onUpdateDueDate?: (taskId: string, dueDate: Date) => void
  onCreateTask?: (date: Date) => void
}

// ============================================================================
// TaskCalendar 组件
// ============================================================================

export function TaskCalendar({
  projectId,
  tasks,
  isLoading,
  onOpenDetail,
  onUpdateDueDate,
  onCreateTask,
}: TaskCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // 按日期分组任务 (D-04)
  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, Task[]>()
    tasks.forEach((task) => {
      if (!task.dueDate) return
      const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd')
      if (!grouped.has(dateKey)) grouped.set(dateKey, [])
      grouped.get(dateKey)!.push(task)
    })
    return grouped
  }, [tasks])

  // 月份导航
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  return (
    <div className="flex h-full flex-col">
      {/* 月份导航头 */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'yyyy年M月', { locale: zhCN })}
        </h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 日历主体 - 后续 Plan 实现 */}
      <div className="flex-1 p-4">
        <div className="py-8 text-center text-muted-foreground">
          日历视图开发中...
        </div>
      </div>
    </div>
  )
}