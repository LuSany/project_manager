'use client'

import * as React from 'react'
import { format, isToday, isSameMonth } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { CalendarTaskCard } from './CalendarTaskCard'
import type { Task } from '@/components/tasks/kanban/SortableTaskCard'

// ============================================================================
// 类型定义
// ============================================================================

interface CalendarDayCellProps {
  date: Date
  currentMonth: Date
  tasks: Task[]
  onOpenDetail?: (taskId: string) => void
  onCreateTask?: (date: Date) => void
}

// ============================================================================
// 常量
// ============================================================================

const MAX_VISIBLE_TASKS = 3

// ============================================================================
// CalendarDayCell 组件
// ============================================================================

export function CalendarDayCell({
  date,
  currentMonth,
  tasks,
  onOpenDetail,
  onCreateTask,
}: CalendarDayCellProps) {
  const dateKey = format(date, 'yyyy-MM-dd')

  const { setNodeRef, isOver } = useDroppable({
    id: dateKey,
    data: { type: 'calendar-day', date },
  })

  const isCurrentMonth = isSameMonth(date, currentMonth)
  const isTodayDate = isToday(date)
  const visibleTasks = tasks.slice(0, MAX_VISIBLE_TASKS)
  const remainingCount = tasks.length - MAX_VISIBLE_TASKS

  const handleDoubleClick = () => {
    onCreateTask?.(date)
  }

  return (
    <div
      ref={setNodeRef}
      onDoubleClick={handleDoubleClick}
      className={cn(
        'min-h-[80px] rounded border p-1 transition-colors',
        'flex flex-col',
        isCurrentMonth ? 'bg-background' : 'bg-muted/30',
        isOver && 'bg-primary/10 border-primary',
        !isCurrentMonth && 'text-muted-foreground',
        isTodayDate && 'ring-primary bg-primary/5 ring-2 ring-offset-1'
      )}
    >
      {/* 日期数字 */}
      <div className={cn('mb-1 text-xs font-medium', isTodayDate && 'text-primary font-bold')}>
        {format(date, 'd')}
      </div>

      {/* 任务列表 */}
      <div className="flex-1 space-y-1 overflow-hidden">
        {visibleTasks.map((task) => (
          <CalendarTaskCard key={task.id} task={task} onOpenDetail={onOpenDetail} />
        ))}
      </div>

      {/* 更多任务指示器 */}
      {remainingCount > 0 && (
        <div className="text-muted-foreground mt-1 text-center text-xs">+{remainingCount} 更多</div>
      )}
    </div>
  )
}
