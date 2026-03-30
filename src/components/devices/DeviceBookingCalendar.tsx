'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
  setHours,
  setMinutes,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookingCreatePopover } from '@/components/devices/BookingCreatePopover'
import { DeviceStatus } from '@/stores/deviceStore'
import { cn } from '@/lib/utils'

interface DeviceBookingCalendarProps {
  deviceId: string
  deviceStatus: DeviceStatus
}

const HOUR_SLOTS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

export function DeviceBookingCalendar({ deviceId, deviceStatus }: DeviceBookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectionStart, setSelectionStart] = useState<Date | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const { data: bookings } = useQuery({
    queryKey: ['device-bookings', deviceId, currentMonth],
    queryFn: async () => {
      const params = new URLSearchParams({ deviceId, pageSize: '100' })
      const res = await fetch(`/api/v1/bookings?${params}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data.items.filter(
        (b: any) => b.status === 'RESERVED' || b.status === 'IN_PROGRESS'
      )
    },
  })

  const getBookingsForDay = (day: Date) => {
    return (
      bookings?.filter((b: any) => {
        const start = new Date(b.startTime)
        const end = new Date(b.endTime)
        return day >= startOfMonth(start) && day <= endOfMonth(end)
      }) || []
    )
  }

  const isSlotBooked = (day: Date, hour: number) => {
    return (
      bookings?.some((b: any) => {
        const start = new Date(b.startTime)
        const end = new Date(b.endTime)
        const slotTime = setHours(setMinutes(day, 0), hour)
        return slotTime >= start && slotTime < end
      }) || false
    )
  }

  const handleMouseDown = (day: Date, hour: number) => {
    if (deviceStatus === 'DISABLED' || deviceStatus === 'MAINTENANCE') return
    const time = setHours(setMinutes(day, 0), hour)
    setSelectionStart(time)
    setSelectionEnd(time)
    setIsDragging(true)
  }

  const handleMouseMove = (day: Date, hour: number) => {
    if (!isDragging || !selectionStart) return
    const time = setHours(setMinutes(day, 0), hour)
    if (time > selectionStart) {
      setSelectionEnd(time)
    } else if (time < selectionStart) {
      setSelectionStart(time)
      setSelectionEnd(selectionStart)
    }
  }

  const handleMouseUp = () => {
    if (isDragging && selectionStart && selectionEnd) {
      const actualEnd = new Date(selectionEnd.getTime() + 60 * 60 * 1000)
      setSelectionEnd(actualEnd)
      setPopoverOpen(true)
    }
    setIsDragging(false)
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp()
      }
    }
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [isDragging, selectionStart, selectionEnd])

  const isSlotInSelection = (day: Date, hour: number) => {
    if (!selectionStart || !selectionEnd) return false
    const slotTime = setHours(setMinutes(day, 0), hour)
    return slotTime >= selectionStart && slotTime < selectionEnd
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>预定时间</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">{format(currentMonth, 'yyyy年M月', { locale: zhCN })}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {deviceStatus === 'DISABLED' && (
          <p className="text-muted-foreground mb-4">设备已停用，无法预定</p>
        )}
        {deviceStatus === 'MAINTENANCE' && (
          <p className="text-muted-foreground mb-4">设备正在维护，无法预定</p>
        )}

        <div ref={calendarRef} className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="mb-2 grid grid-cols-[auto_repeat(7,1fr)] gap-1">
              <div className="w-12"></div>
              {days.slice(0, 7).map((day) => (
                <div key={day.toISOString()} className="text-center text-sm font-medium">
                  {format(day, 'E', { locale: zhCN })} {format(day, 'd')}
                </div>
              ))}
            </div>

            {HOUR_SLOTS.map((hour) => (
              <div key={hour} className="grid grid-cols-[auto_repeat(7,1fr)] gap-1">
                <div className="text-muted-foreground w-12 pr-2 text-right text-sm">{hour}:00</div>
                {days.slice(0, 7).map((day) => (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className={cn(
                      'h-8 cursor-pointer rounded border transition-colors',
                      isSlotBooked(day, hour) && 'cursor-not-allowed bg-blue-200',
                      isSlotInSelection(day, hour) && 'bg-primary/20 border-primary',
                      isToday(day) && 'bg-muted/50'
                    )}
                    onMouseDown={() => handleMouseDown(day, hour)}
                    onMouseMove={() => handleMouseMove(day, hour)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {selectionStart && selectionEnd && (
          <div className="mt-4 text-sm">
            已选择: {format(selectionStart, 'MM-dd HH:mm')} ~ {format(selectionEnd, 'MM-dd HH:mm')}
          </div>
        )}

        {selectionStart && selectionEnd && (
          <BookingCreatePopover
            deviceId={deviceId}
            startTime={selectionStart}
            endTime={selectionEnd}
            open={popoverOpen}
            onOpenChange={(open) => {
              setPopoverOpen(open)
              if (!open) {
                setSelectionStart(null)
                setSelectionEnd(null)
              }
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}
