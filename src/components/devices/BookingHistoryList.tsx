'use client'

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

interface BookingHistoryListProps {
  deviceId: string
}

export function BookingHistoryList({ deviceId }: BookingHistoryListProps) {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['device-bookings', deviceId],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const params = new URLSearchParams({
        deviceId,
        pageSize: '50',
      })
      const res = await fetch(`/api/v1/bookings?${params}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data.items.filter(
        (b: any) => new Date(b.startTime) >= thirtyDaysAgo || b.status === 'RESERVED'
      )
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">加载中...</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>预定历史（最近30天）</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>预定人</TableHead>
              <TableHead>项目</TableHead>
              <TableHead>时间段</TableHead>
              <TableHead>状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings?.map((booking: any) => (
              <TableRow key={booking.id}>
                <TableCell>{booking.users?.name || '-'}</TableCell>
                <TableCell>{booking.projects?.name || '-'}</TableCell>
                <TableCell>
                  {format(new Date(booking.startTime), 'MM-dd HH:mm', { locale: zhCN })} ~{' '}
                  {format(new Date(booking.endTime), 'MM-dd HH:mm', { locale: zhCN })}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      bookingStatusColors[booking.status as keyof typeof bookingStatusColors]
                    }
                  >
                    {bookingStatusLabels[booking.status as keyof typeof bookingStatusLabels]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {(!bookings || bookings.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-center">
                  暂无预定记录
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
