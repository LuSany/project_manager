'use client'

import { useEffect, useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import type { UsageRecordItem, UsageRecordsResponse } from '@/types/equipment-stats'

interface UsageRecordsTableProps {
  projectId?: string
  deviceId?: string
  userId?: string
  startDate?: string
  endDate?: string
  loading?: boolean
}

const bookingStatusLabels: Record<string, string> = {
  RESERVED: '已预约',
  IN_PROGRESS: '使用中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  PENDING_APPROVAL: '待审批',
}

const bookingStatusColors: Record<string, string> = {
  RESERVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  IN_PROGRESS: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  CANCELLED: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  PENDING_APPROVAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const columns: ColumnDef<UsageRecordItem>[] = [
  {
    accessorKey: 'deviceName',
    header: '设备',
    cell: ({ row }) => <span className="font-medium">{row.getValue('deviceName')}</span>,
  },
  {
    accessorKey: 'deviceTypeName',
    header: '设备类型',
  },
  {
    accessorKey: 'projectName',
    header: '项目',
    cell: ({ row }) => row.getValue('projectName') || '-',
  },
  {
    accessorKey: 'userName',
    header: '使用者',
  },
  {
    accessorKey: 'startTime',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          开始时间
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => formatDateTime(row.getValue('startTime')),
  },
  {
    accessorKey: 'endTime',
    header: '结束时间',
    cell: ({ row }) => formatDateTime(row.getValue('endTime')),
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${bookingStatusColors[status] || 'bg-slate-100 text-slate-800'}`}
        >
          {bookingStatusLabels[status] || status}
        </span>
      )
    },
  },
  {
    accessorKey: 'hours',
    header: '时长(小时)',
    cell: ({ row }) => {
      const hours = row.getValue('hours') as number
      return <span className="font-mono">{hours.toFixed(1)}</span>
    },
  },
]

export function UsageRecordsTable({
  projectId,
  deviceId,
  userId,
  startDate,
  endDate,
  loading: externalLoading,
}: UsageRecordsTableProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<UsageRecordItem[]>([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [sorting, setSorting] = useState<SortingState>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', '1')
        params.set('pageSize', '20')
        if (projectId) params.set('projectId', projectId)
        if (deviceId) params.set('deviceId', deviceId)
        if (userId) params.set('userId', userId)
        if (startDate) params.set('startDate', startDate)
        if (endDate) params.set('endDate', endDate)
        if (sorting.length > 0) {
          params.set('sortBy', sorting[0].id)
          params.set('sortOrder', sorting[0].desc ? 'desc' : 'asc')
        }

        const response = await fetch(`/api/v1/equipment/stats/usage-records?${params}`, {
          credentials: 'include',
        })
        const result = await response.json()
        if (result.success) {
          setData(result.data.items || [])
          setPagination({
            page: result.data.page,
            totalPages: result.data.totalPages,
            total: result.data.total,
          })
        }
      } catch (e) {
        console.error('获取使用记录失败:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [projectId, deviceId, userId, startDate, endDate, sorting])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  const loadingState = externalLoading ?? loading

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loadingState ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  暂无使用记录
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!loadingState && pagination.total > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            共 {pagination.total} 条记录，第 {pagination.page} / {pagination.totalPages} 页
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={pagination.page <= 1}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={pagination.page >= pagination.totalPages}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
