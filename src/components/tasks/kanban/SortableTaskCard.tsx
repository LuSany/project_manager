'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Calendar, GripVertical } from 'lucide-react'
import { PriorityInlineEdit, AssigneeInlineEdit, type TaskPriority, type Assignee } from './KanbanInlineEdit'

// ============================================================================
// 类型定义
// ============================================================================

export interface Task {
  id: string
  title: string
  description: string | null
  status: string
  progress: number
  priority: string
  startDate: string | null
  dueDate: string | null
  createdAt: string
  assignees?: Assignee[]
}

export interface SortableTaskCardProps {
  task: Task
  projectId?: string
  isDragging: boolean
  onUpdate?: (taskId: string, data: Partial<Task>) => void
  onOpenDetail?: (taskId: string) => void
}

// ============================================================================
// SortableTaskCard 组件
// ============================================================================

export function SortableTaskCard({
  task,
  projectId,
  isDragging,
  onUpdate,
  onOpenDetail,
}: SortableTaskCardProps) {
  const handleUpdate = (taskId: string, data: Partial<Task>) => {
    onUpdate?.(taskId, data)
  }

  const handleOpenDetail = () => {
    onOpenDetail?.(task.id)
  }

  return (
    <Card
      className={cn(
        'cursor-grab p-4 transition-all active:cursor-grabbing',
        'hover:border-primary/50 hover:shadow-md',
        isDragging && 'scale-95 rotate-2 opacity-50 shadow-xl'
      )}
    >
      {/* 拖拽手柄 + 标题 */}
      <div className="mb-2 flex items-start gap-2">
        <GripVertical className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={handleOpenDetail}
            className="cursor-pointer text-left hover:underline"
          >
            <h4 className="truncate text-sm font-semibold">{task.title}</h4>
          </button>
        </div>
      </div>

      {/* 优先级徽章 + 截止日期 */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <PriorityInlineEdit
          priority={task.priority as TaskPriority}
          taskId={task.id}
          onUpdate={handleUpdate}
        />

        {/* 截止日期 */}
        {task.dueDate && (
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" />
            <span>{new Date(task.dueDate).toLocaleDateString('zh-CN')}</span>
          </div>
        )}
      </div>

      {/* 负责人头像 + 进度条 */}
      <div className="flex items-center justify-between gap-3">
        <AssigneeInlineEdit
          assignees={task.assignees}
          projectId={projectId || task.id}
          taskId={task.id}
          onUpdate={(taskId, data) => onUpdate?.(taskId, data as Partial<Task>)}
        />

        {/* 进度条 */}
        {task.progress > 0 && (
          <div className="flex-1">
            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}