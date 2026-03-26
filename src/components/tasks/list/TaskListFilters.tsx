/**
 * TaskListFilters
 * 任务列表筛选栏组件
 */

'use client'

import React from 'react'
import { useTaskViewStore, type FilterCondition } from '@/stores/taskViewStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// 类型定义
// ============================================================================

interface TaskListFiltersProps {
  className?: string
}

// ============================================================================
// 常量定义
// ============================================================================

/** 状态选项 */
const STATUS_OPTIONS = [
  { value: 'TODO', label: '待办' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'REVIEW', label: '待评审' },
  { value: 'TESTING', label: '测试中' },
  { value: 'DONE', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
  { value: 'DELAYED', label: '延期' },
  { value: 'BLOCKED', label: '阻塞' },
]

/** 优先级选项 */
const PRIORITY_OPTIONS = [
  { value: 'LOW', label: '低' },
  { value: 'MEDIUM', label: '中' },
  { value: 'HIGH', label: '高' },
  { value: 'CRITICAL', label: '紧急' },
]

/** 分组选项 */
const GROUP_BY_OPTIONS = [
  { value: 'none', label: '不分组' },
  { value: 'status', label: '按状态' },
  { value: 'priority', label: '按优先级' },
  { value: 'assignee', label: '按负责人' },
]

/** 状态标签映射 */
const STATUS_LABELS: Record<string, string> = {
  TODO: '待办',
  IN_PROGRESS: '进行中',
  REVIEW: '待评审',
  TESTING: '测试中',
  DONE: '已完成',
  CANCELLED: '已取消',
  DELAYED: '延期',
  BLOCKED: '阻塞',
}

/** 优先级标签映射 */
const PRIORITY_LABELS: Record<string, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  CRITICAL: '紧急',
}

/** 字段标签映射 */
const FIELD_LABELS: Record<string, string> = {
  status: '状态',
  priority: '优先级',
  assignee: '负责人',
}

// ============================================================================
// 筛选标签组件
// ============================================================================

interface FilterTagProps {
  filter: FilterCondition
  onRemove: (field: string) => void
}

function FilterTag({ filter, onRemove }: FilterTagProps) {
  const getDisplayValue = () => {
    if (filter.field === 'status') {
      return STATUS_LABELS[filter.value] || filter.value
    }
    if (filter.field === 'priority') {
      return PRIORITY_LABELS[filter.value] || filter.value
    }
    return filter.value
  }

  const label = FIELD_LABELS[filter.field] || filter.field
  const displayValue = getDisplayValue()

  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      <span>
        {label}: {displayValue}
      </span>
      <button
        onClick={() => onRemove(filter.field)}
        className="hover:bg-accent/50 ml-1 rounded-sm p-0.5"
        aria-label={`移除 ${label} 筛选`}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  )
}

// ============================================================================
// 主组件
// ============================================================================

export function TaskListFilters({ className }: TaskListFiltersProps) {
  // 从 store 获取状态和方法
  const groupBy = useTaskViewStore((state) => state.groupBy)
  const filters = useTaskViewStore((state) => state.filters)
  const setGroupBy = useTaskViewStore((state) => state.setGroupBy)
  const addFilter = useTaskViewStore((state) => state.addFilter)
  const removeFilter = useTaskViewStore((state) => state.removeFilter)
  const clearFilters = useTaskViewStore((state) => state.clearFilters)

  // 处理分组变更
  const handleGroupByChange = (value: string) => {
    setGroupBy(value === 'none' ? null : (value as 'status' | 'priority' | 'assignee'))
  }

  // 处理状态筛选
  const handleStatusFilter = (value: string) => {
    if (value === 'all') {
      removeFilter('status')
    } else {
      addFilter({ field: 'status', operator: 'eq', value })
    }
  }

  // 处理优先级筛选
  const handlePriorityFilter = (value: string) => {
    if (value === 'all') {
      removeFilter('priority')
    } else {
      addFilter({ field: 'priority', operator: 'eq', value })
    }
  }

  // 获取当前筛选值
  const statusFilter = filters.find((f) => f.field === 'status')?.value
  const priorityFilter = filters.find((f) => f.field === 'priority')?.value

  return (
    <div className={cn('flex h-12 items-center gap-4 border-b bg-background px-4', className)}>
      {/* 左侧：分组选择 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">分组:</span>
        <Select value={groupBy || 'none'} onValueChange={handleGroupByChange}>
          <SelectTrigger className="h-8 w-32">
            <SelectValue placeholder="不分组" />
          </SelectTrigger>
          <SelectContent>
            {GROUP_BY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 分隔线 */}
      <div className="h-6 w-px bg-border" />

      {/* 中间：筛选下拉 */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        
        {/* 状态筛选 */}
        <Select value={statusFilter || 'all'} onValueChange={handleStatusFilter}>
          <SelectTrigger className="h-8 w-28">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 优先级筛选 */}
        <Select value={priorityFilter || 'all'} onValueChange={handlePriorityFilter}>
          <SelectTrigger className="h-8 w-28">
            <SelectValue placeholder="优先级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部优先级</SelectItem>
            {PRIORITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 右侧：筛选标签 */}
      {filters.length > 0 && (
        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="flex items-center gap-1">
            {filters.map((filter) => (
              <FilterTag key={filter.field} filter={filter} onRemove={removeFilter} />
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={clearFilters}
          >
            清除筛选
          </Button>
        </div>
      )}
    </div>
  )
}

// 导出类型
export type { TaskListFiltersProps }
