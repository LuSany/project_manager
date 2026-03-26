/**
 * InlineEditCell
 * 任务列表内联编辑单元格组件
 */

'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TaskStatusBadge } from '@/components/tasks/task-status-badge'
import { cn } from '@/lib/utils'
import { Calendar, ChevronDown } from 'lucide-react'

// ============================================================================
// 类型定义
// ============================================================================

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'TESTING' | 'DONE' | 'CANCELLED' | 'DELAYED' | 'BLOCKED'
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

interface StatusCellProps {
  status: string
  taskId: string
  onUpdate: (taskId: string, updates: { status: string }) => void
}

interface PriorityCellProps {
  priority: string
  taskId: string
  onUpdate: (taskId: string, updates: { priority: string }) => void
}

interface DueDateCellProps {
  dueDate: string | null
  taskId: string
  onUpdate: (taskId: string, updates: { dueDate: string | null }) => void
}

// ============================================================================
// 常量定义
// ============================================================================

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'TODO', label: '待办' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'REVIEW', label: '待评审' },
  { value: 'TESTING', label: '测试中' },
  { value: 'DONE', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
  { value: 'DELAYED', label: '延期' },
  { value: 'BLOCKED', label: '阻塞' },
]

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'LOW', label: '低' },
  { value: 'MEDIUM', label: '中' },
  { value: 'HIGH', label: '高' },
  { value: 'CRITICAL', label: '紧急' },
]

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  MEDIUM: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  HIGH: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  CRITICAL: 'bg-red-100 text-red-800 hover:bg-red-200',
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  CRITICAL: '紧急',
}

// ============================================================================
// StatusCell 组件
// ============================================================================

export function StatusCell({ status, taskId, onUpdate }: StatusCellProps) {
  const [open, setOpen] = useState(false)

  const handleStatusChange = (value: string) => {
    onUpdate(taskId, { status: value })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded hover:bg-accent/50"
          onClick={() => setOpen(true)}
        >
          <TaskStatusBadge
            status={status as TaskStatus}
            size="sm"
            showIcon={false}
            showLabel={true}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-2" align="start">
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-8">
            <SelectValue placeholder="选择状态" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PopoverContent>
    </Popover>
  )
}

// ============================================================================
// PriorityCell 组件
// ============================================================================

export function PriorityCell({ priority, taskId, onUpdate }: PriorityCellProps) {
  const [open, setOpen] = useState(false)

  const handlePriorityChange = (value: string) => {
    onUpdate(taskId, { priority: value })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded hover:bg-accent/50"
          onClick={() => setOpen(true)}
        >
          <Badge
            variant="secondary"
            className={cn('text-xs', PRIORITY_COLORS[priority] || PRIORITY_COLORS.MEDIUM)}
          >
            {PRIORITY_LABELS[priority] || priority}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-32 p-2" align="start">
        <Select value={priority} onValueChange={handlePriorityChange}>
          <SelectTrigger className="h-8">
            <SelectValue placeholder="选择优先级" />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PopoverContent>
    </Popover>
  )
}

// ============================================================================
// DueDateCell 组件
// ============================================================================

export function DueDateCell({ dueDate, taskId, onUpdate }: DueDateCellProps) {
  const [open, setOpen] = useState(false)

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const dateStr = date.toISOString().split('T')[0]
      onUpdate(taskId, { dueDate: dateStr })
    }
    setOpen(false)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const isOverdue = dueDate && new Date(dueDate) < new Date()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center gap-1 rounded px-2 hover:bg-accent/50"
          onClick={() => setOpen(true)}
        >
          {dueDate ? (
            <span className={cn('text-sm', isOverdue && 'text-destructive')}>
              <Calendar className="mr-1 inline h-3 w-3" />
              {formatDate(dueDate)}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-2">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                handleDateSelect(undefined)
                onUpdate(taskId, { dueDate: null })
                setOpen(false)
              }}
            >
              清除
            </Button>
            <Button
              size="sm"
              onClick={() => {
                handleDateSelect(new Date())
              }}
            >
              今天
            </Button>
          </div>
          {/* 简化的日期选择器 - 实际项目中使用 react-day-picker */}
          <div className="mt-2">
            <input
              type="date"
              className="w-full rounded border p-2 text-sm"
              defaultValue={dueDate || ''}
              onChange={(e) => {
                if (e.target.value) {
                  onUpdate(taskId, { dueDate: e.target.value })
                  setOpen(false)
                }
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// 导出类型
export type { StatusCellProps, PriorityCellProps, DueDateCellProps }
