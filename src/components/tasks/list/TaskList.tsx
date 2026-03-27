/**
 * TaskList
 * 任务列表视图主组件 - 稳定版
 */

'use client'

import React, { useMemo, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table'
import { Loader2 } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTaskViewStore } from '@/stores/taskViewStore'
import { taskListColumns, Task } from './TaskListColumns'
import { cn } from '@/lib/utils'

// ============================================================================
// 类型定义
// ============================================================================

interface TaskListProps {
  projectId: string
  tasks: Task[]
  isLoading: boolean
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
  onOpenDetail?: (taskId: string) => void
}

// ============================================================================
// 主组件
// ============================================================================

export function TaskList({ tasks, isLoading, onOpenDetail }: TaskListProps) {
  // 使用 selectors 获取稳定值
  const sorting = useTaskViewStore(useCallback((state) => state.sorting, []))
  const setSorting = useTaskViewStore(useCallback((state) => state.setSorting, []))

  // 稳定的列定义
  const columns = useMemo(() => taskListColumns, [])

  // 使用 JSON.stringify 创建稳定 key
  const sortingKey = JSON.stringify(sorting)
  const stableSorting = useMemo(() => JSON.parse(sortingKey), [sortingKey])

  // 构建 TanStack Table - 简化配置
  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting: stableSorting,
    },
    onSortingChange: setSorting,
  })

  // 加载状态
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  // 空状态
  if (tasks.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">暂无任务</p>
          <p className="text-sm text-muted-foreground">点击"新建任务"开始创建第一个任务</p>
        </div>
      </div>
    )
  }

  const rows = table.getRowModel().rows

  return (
    <div className="w-full rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  className={cn(
                    header.column.getCanSort() && 'cursor-pointer select-none',
                    'hover:bg-accent/50'
                  )}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() && (
                    <span className="ml-1">
                      {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className="h-12 hover:bg-accent/50 cursor-pointer"
              onClick={() => onOpenDetail?.(row.original.id)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export type { TaskListProps }
