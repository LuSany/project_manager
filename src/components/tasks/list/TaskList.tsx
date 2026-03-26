/**
 * TaskList
 * 任务列表视图主组件 - 基于 TanStack Table
 */

'use client'

import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  flexRender,
  SortingState,
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
  /** 项目 ID */
  projectId: string
  /** 任务列表 */
  tasks: Task[]
  /** 是否加载中 */
  isLoading: boolean
  /** 更新任务的回调 */
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
}

// ============================================================================
// 分组标题渲染
// ============================================================================

interface GroupHeaderProps {
  groupBy: string
  value: string
  count: number
}

function GroupHeader({ groupBy, value, count }: GroupHeaderProps) {
  const getGroupLabel = () => {
    switch (groupBy) {
      case 'status':
        return `状态: ${value}`
      case 'priority':
        return `优先级: ${value}`
      case 'assignee':
        return `负责人: ${value}`
      default:
        return value
    }
  }

  return (
    <div className="bg-muted/50 flex h-10 items-center px-4 text-sm font-medium">
      <span>{getGroupLabel()}</span>
      <span className="text-muted-foreground ml-2">({count})</span>
    </div>
  )
}

// ============================================================================
// 主组件
// ============================================================================

export function TaskList({ projectId, tasks, isLoading, onTaskUpdate }: TaskListProps) {
  // 从 store 获取视图状态
  const groupBy = useTaskViewStore((state) => state.groupBy)
  const sorting = useTaskViewStore((state) => state.sorting)
  const setSorting = useTaskViewStore((state) => state.setSorting)
  const filters = useTaskViewStore((state) => state.filters)

  // 构建列定义
  const columns = useMemo(() => taskListColumns, [])

  // 构建 TanStack Table
  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    state: {
      sorting,
      columnFilters: filters.map((f) => ({
        id: f.field,
        value: f.value,
      })),
      grouping: groupBy ? [groupBy] : [],
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

  // 获取分组后的行
  const rows = table.getRowModel().rows
  const groupedRows = groupBy ? table.getGroupedRowModel().rows : null

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
          {groupedRows ? (
            // 分组渲染
            groupedRows.map((groupRow) => (
              <>
                <TableRow key={`group-${groupRow.id}`}>
                  <TableCell colSpan={columns.length} className="p-0">
                    <GroupHeader
                      groupBy={groupBy!}
                      value={groupRow.getValue(groupBy!)}
                      count={groupRow.subRows.length}
                    />
                  </TableCell>
                </TableRow>
                {groupRow.subRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="h-12 hover:bg-accent/50"
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            ))
          ) : (
            // 非分组渲染
            rows.map((row) => (
              <TableRow
                key={row.id}
                className="h-12 hover:bg-accent/50"
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// 导出类型
export type { TaskListProps }
