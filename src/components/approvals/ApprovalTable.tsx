'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ApprovalActions } from './ApprovalActions'

interface ApprovalRecord {
  id: string
  bookingId: string
  approverId: string
  level: number
  action: string
  comment?: string
  createdAt: string
  bookings: {
    id: string
    startTime: string
    endTime: string
    status: string
    devices: {
      name: string
      device_types: {
        name: string
      }
    }
    users: {
      id: string
      name: string
    }
    projects: {
      id: string
      name: string
    } | null
  }
  users: {
    id: string
    name: string
  }
}

interface ApprovalTableProps {
  records: ApprovalRecord[]
  onActionComplete?: () => void
}

const levelBadgeColors: Record<number, string> = {
  1: 'bg-blue-100 text-blue-800',
  2: 'bg-amber-100 text-amber-800',
  3: 'bg-red-100 text-red-800',
}

const actionBadgeColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  FORWARDED: 'bg-purple-100 text-purple-800',
}

const actionLabels: Record<string, string> = {
  PENDING: '待审批',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  FORWARDED: '已转交',
}

export function ApprovalTable({ records, onActionComplete }: ApprovalTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const toggleRow = (id: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
  }

  const toggleAll = () => {
    if (selectedRows.size === records.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(records.map((r) => r.bookingId)))
    }
  }

  const handleBulkApprove = async () => {
    for (const bookingId of selectedRows) {
      await fetch(`/api/v1/approval-records/${bookingId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVED' }),
      })
    }
    setSelectedRows(new Set())
    onActionComplete?.()
  }

  const handleBulkReject = async () => {
    const comment = window.prompt('请输入驳回理由:')
    if (!comment || comment.length < 5) {
      alert('驳回理由至少需要5个字符')
      return
    }
    for (const bookingId of selectedRows) {
      await fetch(`/api/v1/approval-records/${bookingId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECTED', comment }),
      })
    }
    setSelectedRows(new Set())
    onActionComplete?.()
  }

  return (
    <div>
      {selectedRows.size > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-muted-foreground text-sm">已选择 {selectedRows.size} 项</span>
          <Button size="sm" variant="default" onClick={handleBulkApprove}>
            批量通过
          </Button>
          <Button size="sm" variant="destructive" onClick={handleBulkReject}>
            批量驳回
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={selectedRows.size === records.length && records.length > 0}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead>设备</TableHead>
            <TableHead>申请人</TableHead>
            <TableHead>时间段</TableHead>
            <TableHead>项目</TableHead>
            <TableHead>级别</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                <Checkbox
                  checked={selectedRows.has(record.bookingId)}
                  onCheckedChange={() => toggleRow(record.bookingId)}
                />
              </TableCell>
              <TableCell className="font-medium">
                {record.bookings?.devices?.device_types?.name} - {record.bookings?.devices?.name}
              </TableCell>
              <TableCell>{record.bookings?.users?.name || '-'}</TableCell>
              <TableCell>
                {record.bookings?.startTime && record.bookings?.endTime ? (
                  <>
                    {format(new Date(record.bookings.startTime), 'MM-dd HH:mm', { locale: zhCN })}
                    {' ~ '}
                    {format(new Date(record.bookings.endTime), 'MM-dd HH:mm', { locale: zhCN })}
                  </>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>{record.bookings?.projects?.name || '-'}</TableCell>
              <TableCell>
                <Badge className={levelBadgeColors[record.level] || 'bg-gray-100 text-gray-800'}>
                  第 {record.level} 级
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={actionBadgeColors[record.action] || 'bg-gray-100 text-gray-800'}>
                  {actionLabels[record.action] || record.action}
                </Badge>
              </TableCell>
              <TableCell>
                {record.action === 'PENDING' && (
                  <ApprovalActions
                    recordId={record.bookingId}
                    onActionComplete={onActionComplete}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
