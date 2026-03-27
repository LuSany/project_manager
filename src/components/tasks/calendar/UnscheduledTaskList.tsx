'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import type { Task } from '@/components/tasks/kanban/SortableTaskCard'

// 优先级颜色
const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'border-l-red-500',
  MEDIUM: 'border-l-yellow-500',
  LOW: 'border-l-blue-500',
  CRITICAL: 'border-l-red-700',
}

interface UnscheduledTaskListProps {
  tasks: Task[]
  onOpenDetail?: (taskId: string) => void
}

export function UnscheduledTaskList({ tasks, onOpenDetail }: UnscheduledTaskListProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)

  // 筛选无截止日期的任务
  const unscheduledTasks = tasks.filter(task => !task.dueDate)

  return (
    <div className="border-t">
      {/* 折叠头 */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
        aria-label={`未安排日期 (${unscheduledTasks.length})`}
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <span className="font-medium">
            未安排日期 ({unscheduledTasks.length})
          </span>
        </div>
      </button>

      {/* 任务列表 */}
      {!isCollapsed && (
        <div className="px-4 pb-3 space-y-2 max-h-[200px] overflow-y-auto">
          {unscheduledTasks.length === 0 ? (
            <div className="text-muted-foreground text-sm text-center py-4">
              暂无未安排日期的任务
            </div>
          ) : (
            unscheduledTasks.map(task => (
              <UnscheduledTaskItem
                key={task.id}
                task={task}
                onOpenDetail={onOpenDetail}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// 单个任务项（可拖拽）
function UnscheduledTaskItem({
  task,
  onOpenDetail,
}: {
  task: Task
  onOpenDetail?: (taskId: string) => void
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `unscheduled-${task.id}`,
    data: { type: 'unscheduled-task', task },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-2 p-2 rounded border-l-2 bg-card cursor-grab',
        'hover:bg-accent/50 transition-colors',
        PRIORITY_COLORS[task.priority] || 'border-l-gray-400',
      )}
      onClick={() => onOpenDetail?.(task.id)}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="text-sm truncate flex-1">{task.title}</span>
    </div>
  )
}