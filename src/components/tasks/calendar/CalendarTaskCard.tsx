'use client'

import * as React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import type { Task } from '@/components/tasks/kanban/SortableTaskCard'

// ============================================================================
// 类型定义
// ============================================================================

interface CalendarTaskCardProps {
  task: Task
  onOpenDetail?: (taskId: string) => void
}

// ============================================================================
// 优先级颜色映射 (D-03, UI-SPEC)
// ============================================================================

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-blue-500',
  CRITICAL: 'bg-red-700',
}

// ============================================================================
// CalendarTaskCard 组件
// ============================================================================

export function CalendarTaskCard({ task, onOpenDetail }: CalendarTaskCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { type: 'calendar-task', task },
  })

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onOpenDetail?.(task.id)
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'h-6 px-1 rounded flex items-center gap-1 cursor-grab',
        'bg-card/80 hover:bg-accent/50 transition-colors',
        'text-xs truncate',
        isDragging && 'opacity-50'
      )}
      onClick={handleClick}
    >
      {/* 优先级颜色条 */}
      <div
        className={cn(
          'w-1 h-4 rounded-full flex-shrink-0',
          PRIORITY_COLORS[task.priority] || 'bg-gray-400'
        )}
      />
      {/* 任务标题 */}
      <span className="truncate flex-1">{task.title}</span>
    </div>
  )
}