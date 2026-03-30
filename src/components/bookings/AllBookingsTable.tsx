'use client'

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const bookingStatusColors = {
  RESERVED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

const bookingStatusLabels = {
  RESERVED: '已预约',
  IN_PROGRESS: '使用中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}

interface Booking {
  id: string
  startTime: string
  endTime: string
  status: 'RESERVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  devices: {
    name: string
    device_types: {
      name: string
    }
  }
  users: {
    name: string
  } | null
  projects: {
    name: string
  } | null
}

export function AllBookingsTable() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['all-bookings'],
    queryFn: async () => {
      const params = new URLSearchParams({ pageSize: '100' })
      const res = await fetch(`/api/v1/bookings?${params}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data.items as Booking[]
    },
  })

  if (isLoading) {
    return <div className="p-4">加载中...</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>设备</TableHead>
          <TableHead>预定人</TableHead>
          <TableHead>时间段</TableHead>
          <TableHead>项目</TableHead>
          <TableHead>状态</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings?.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell className="font-medium">
              {booking.devices?.device_types?.name} - {booking.devices?.name}
            </TableCell>
            <TableCell>{booking.users?.name || '-'}</TableCell>
            <TableCell>
              {format(new Date(booking.startTime), 'MM-dd HH:mm', { locale: zhCN })}
              {' ~ '}
              {format(new Date(booking.endTime), 'MM-dd HH:mm', { locale: zhCN })}
            </TableCell>
            <TableCell>{booking.projects?.name || '-'}</TableCell>
            <TableCell>
              <Badge className={bookingStatusColors[booking.status]}>
                {bookingStatusLabels[booking.status]}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
        {(!bookings || bookings.length === 0) && (
          <TableRow>
            <TableCell colSpan={5} className="text-muted-foreground text-center">
              暂无预定记录
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
