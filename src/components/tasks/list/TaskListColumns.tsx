/**
 * TaskListColumns
 * 任务列表列定义 - 基于 TanStack Table
 */

'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { TaskStatusBadge } from '@/components/tasks/task-status-badge'
import { cn } from '@/lib/utils'
import { Calendar, User2 } from 'lucide-react'

// ============================================================================
// 类型定义
// ============================================================================

/** 任务类型（与 TaskKanban 保持一致） */
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
  assignees?: Array<{
    user: {
      id: string
      name: string
      email: string
    }
  }>
  tags?: Array<{
    id: string
    name: string
    color: string
  }>
}

/** 优先级标签映射 */
const PRIORITY_LABELS: Record<string, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  CRITICAL: '紧急',
}

/** 优先级颜色映射 */
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  MEDIUM: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  HIGH: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  CRITICAL: 'bg-red-100 text-red-800 hover:bg-red-200',
}

// ============================================================================
// 列定义
// ============================================================================

/**
 * 任务列表列定义
 * 6 列：任务名称、状态、优先级、截止日期、负责人、标签
 */
export const taskListColumns: ColumnDef<Task>[] = [
  // 任务名称 - flex-1 (min 200px), 左对齐, 可排序
  {
    id: 'title',
    accessorKey: 'title',
    header: '任务名称',
    cell: ({ row }) => (
      <div className="min-w-[200px] flex-1">
        <span className="font-medium">{row.getValue('title')}</span>
      </div>
    ),
    enableSorting: true,
  },
  // 状态 - 100px, 居中, 可排序
  {
    id: 'status',
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <div className="flex justify-center">
          <TaskStatusBadge status={status as 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'TESTING' | 'DONE' | 'CANCELLED' | 'DELAYED' | 'BLOCKED'} size="sm" />
        </div>
      )
    },
    size: 100,
    enableSorting: true,
  },
  // 优先级 - 80px, 居中, 可排序
  {
    id: 'priority',
    accessorKey: 'priority',
    header: '优先级',
    cell: ({ row }) => {
      const priority = row.getValue('priority') as string
      return (
        <div className="flex justify-center">
          <Badge variant="secondary" className={cn('text-xs', PRIORITY_COLORS[priority] || PRIORITY_COLORS.MEDIUM)}>
            {PRIORITY_LABELS[priority] || priority}
          </Badge>
        </div>
      )
    },
    size: 80,
    enableSorting: true,
  },
  // 截止日期 - 120px, 左对齐, 可排序
  {
    id: 'dueDate',
    accessorKey: 'dueDate',
    header: '截止日期',
    cell: ({ row }) => {
      const dueDate = row.getValue('dueDate') as string | null
      if (!dueDate) return <span className="text-muted-foreground">-</span>
      
      const date = new Date(dueDate)
      const isOverdue = date < new Date()
      
      return (
        <div className={cn('flex items-center gap-1 text-sm', isOverdue && 'text-destructive')}>
          <Calendar className="h-3 w-3" />
          <span>{date.toLocaleDateString('zh-CN')}</span>
        </div>
      )
    },
    size: 120,
    enableSorting: true,
  },
  // 负责人 - 120px, 左对齐, 不可排序
  {
    id: 'assignees',
    accessorKey: 'assignees',
    header: '负责人',
    cell: ({ row }) => {
      const assignees = row.original.assignees
      if (!assignees || assignees.length === 0) {
        return <span className="text-muted-foreground">-</span>
      }
      
      return (
        <div className="flex items-center gap-1">
          <User2 className="text-muted-foreground h-3 w-3" />
          <div className="flex -space-x-1">
            {assignees.slice(0, 3).map((assignee) => (
              <div
                key={assignee.user.id}
                className="bg-primary/10 border-background flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-medium"
                title={assignee.user.name}
              >
                {assignee.user.name.charAt(0)}
              </div>
            ))}
            {assignees.length > 3 && (
              <div className="bg-muted border-background flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs">
                +{assignees.length - 3}
              </div>
            )}
          </div>
        </div>
      )
    },
    size: 120,
    enableSorting: false,
  },
  // 标签 - 150px, 左对齐, 不可排序
  {
    id: 'tags',
    accessorKey: 'tags',
    header: '标签',
    cell: ({ row }) => {
      const tags = row.original.tags
      if (!tags || tags.length === 0) {
        return <span className="text-muted-foreground">-</span>
      }
      
      return (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 2).map((tag) => (
            <Badge key={tag.id} variant="outline" className="text-xs">
              {tag.name}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{tags.length - 2}
            </Badge>
          )}
        </div>
      )
    },
    size: 150,
    enableSorting: false,
  },
]
