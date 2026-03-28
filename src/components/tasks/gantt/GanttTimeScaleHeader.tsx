import { isToday, isWeekend } from 'date-fns'
import type { TimeRange, GanttScaleMode, GanttConfig } from './types'
import { formatScaleDate } from './utils'

interface GanttTimeScaleHeaderProps {
  timeRange: TimeRange
  scaleMode: GanttScaleMode
  config: GanttConfig
  scrollLeft: number
}

export function GanttTimeScaleHeader({
  timeRange,
  scaleMode,
  config,
  scrollLeft,
}: GanttTimeScaleHeaderProps) {
  const cellWidth = config.cellWidth[scaleMode]
  const totalWidth = timeRange.totalDays * cellWidth

  const getDaysArray = (): Date[] => {
    const days: Date[] = []
    const current = new Date(timeRange.start)
    while (current <= timeRange.end) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return days
  }

  const days = getDaysArray()

  return (
    <div
      className="bg-muted relative flex-shrink-0 overflow-hidden border-b"
      style={{ height: config.headerHeight }}
    >
      <div
        className="flex"
        style={{
          width: totalWidth,
          transform: `translateX(-${scrollLeft}px)`,
        }}
      >
        {days.map((day, index) => {
          const isTodayDate = isToday(day)
          const isWeekendDate = isWeekend(day)

          return (
            <div
              key={index}
              className="text-muted-foreground flex flex-shrink-0 items-center justify-center border-r text-xs"
              style={{
                width: cellWidth,
                backgroundColor: isWeekendDate ? 'rgba(0,0,0,0.02)' : 'transparent',
                borderBottom: isTodayDate
                  ? '2px solid hsl(var(--primary))'
                  : '1px solid hsl(var(--border))',
              }}
              title={day.toISOString()}
            >
              {formatScaleDate(day, scaleMode)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
