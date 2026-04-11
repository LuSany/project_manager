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
  startOfWeek,
  endOfWeek,
  getDay,
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

// 获取日历网格所需的所有日期（包含上月和下月的部分日期以填满网格）
function getCalendarDays(month: Date): Date[] {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)

  // 获取当月第一天是周几（0=周日，1=周一...）
  const firstDayOfWeek = getDay(monthStart)

  // 计算需要从哪天开始（周一为一周的开始）
  // 如果第一天是周日(0)，需要补充6天；如果是周一(1)，不需要补充
  const offsetDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  const calendarStart = new Date(monthStart)
  calendarStart.setDate(calendarStart.getDate() - offsetDays)

  // 计算日历结束日期（确保填满6周网格，共42天）
  const calendarEnd = new Date(calendarStart)
  calendarEnd.setDate(calendarEnd.getDate() + 41) // 6周 * 7天 - 1

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
}

export function DeviceBookingCalendar({ deviceId, deviceStatus }: DeviceBookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectionStart, setSelectionStart] = useState<Date | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  const calendarDays = getCalendarDays(currentMonth)
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

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
    setSelectedDay(day)
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

  const isCurrentMonthDay = (day: Date) => {
    return day >= monthStart && day <= monthEnd
  }

  // 将日期按周分组
  const weeks: Date[][] = []
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7))
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
            {/* 星期标题行 */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="w-12 text-muted-foreground text-right text-sm">时间</div>
              {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((dayName) => (
                <div key={dayName} className="text-center text-sm font-medium">
                  {dayName}
                </div>
              ))}
            </div>

            {/* 按周显示日历网格 */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="mb-1">
                {/* 显示该周的日期标题 */}
                <div className="grid grid-cols-8 gap-1 mb-1">
                  <div className="w-12"></div>
                  {week.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'text-center text-sm py-1',
                        isCurrentMonthDay(day)
                          ? 'font-medium text-foreground'
                          : 'text-gray-400 opacity-50'
                      )}
                    >
                      {format(day, 'd')}
                    </div>
                  ))}
                </div>

                {/* 该周每天的时间槽 */}
                {HOUR_SLOTS.map((hour) => (
                  <div key={`${weekIndex}-${hour}`} className="grid grid-cols-8 gap-1">
                    <div className="text-muted-foreground w-12 pr-2 text-right text-sm">{hour}:00</div>
                    {week.map((day) => (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className={cn(
                          'h-8 rounded border transition-colors',
                          !isCurrentMonthDay(day) && 'bg-gray-100 opacity-40 cursor-not-allowed pointer-events-none',
                          isCurrentMonthDay(day) && !isSlotBooked(day, hour) && 'cursor-pointer hover:bg-accent',
                          isSlotBooked(day, hour) && 'cursor-not-allowed bg-blue-200',
                          isSlotInSelection(day, hour) && 'bg-primary/20 border-primary',
                          isToday(day) && isCurrentMonthDay(day) && 'bg-muted/50'
                        )}
                        onMouseDown={() => isCurrentMonthDay(day) && handleMouseDown(day, hour)}
                        onMouseMove={() => isCurrentMonthDay(day) && handleMouseMove(day, hour)}
                      />
                    ))}
                  </div>
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
                setSelectedDay(null)
              }
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}
