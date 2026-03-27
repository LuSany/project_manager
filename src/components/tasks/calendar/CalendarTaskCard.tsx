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
// 优先级颜色映射 (D-03, UI-SPEC) - 使用内联样式避免 Tailwind purge
// ============================================================================

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: '#ef4444',    // red-500
  MEDIUM: '#eab308',  // yellow-500
  LOW: '#3b82f6',     // blue-500
  CRITICAL: '#b91c1c', // red-700
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

  const priorityColor = PRIORITY_COLORS[task.priority] || '#9ca3af' // gray-400

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
        className="w-1 h-4 rounded-full flex-shrink-0"
        style={{ backgroundColor: priorityColor }}
      />
      {/* 任务标题 */}
      <span className="truncate flex-1">{task.title}</span>
    </div>
  )
}