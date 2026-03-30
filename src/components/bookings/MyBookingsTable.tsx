'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BookingCancelDialog } from '@/components/bookings/BookingCancelDialog'
import { X } from 'lucide-react'

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
  projects: {
    name: string
  } | null
}

export function MyBookingsTable() {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string>('')

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const res = await fetch('/api/v1/users/me')
      const userJson = await res.json()
      if (!userJson.success) throw new Error(userJson.error)

      const params = new URLSearchParams({ userId: userJson.data.id, pageSize: '50' })
      const bookingsRes = await fetch(`/api/v1/bookings?${params}`)
      const bookingsJson = await bookingsRes.json()
      if (!bookingsJson.success) throw new Error(bookingsJson.error)
      return bookingsJson.data.items as Booking[]
    },
  })

  const handleCancelClick = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    setCancelDialogOpen(true)
  }

  const canCancel = (booking: Booking) => {
    return booking.status === 'RESERVED'
  }

  if (isLoading) {
    return <div className="p-4">加载中...</div>
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>设备</TableHead>
            <TableHead>时间段</TableHead>
            <TableHead>项目</TableHead>
            <TableHead>状态</TableHead>
            <TableHead className="w-[80px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings?.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell className="font-medium">
                {booking.devices?.device_types?.name} - {booking.devices?.name}
              </TableCell>
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
              <TableCell>
                {canCancel(booking) && (
                  <Button variant="ghost" size="sm" onClick={() => handleCancelClick(booking.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
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

      <BookingCancelDialog
        bookingId={selectedBookingId}
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
      />
    </>
  )
}
