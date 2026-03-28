import { isToday } from 'date-fns'
import type { GanttTask, GanttDependency, GanttScaleMode, GanttConfig, TimeRange } from './types'
import { getTaskPosition, getPriorityColor } from './utils'
import { GanttTaskBar } from './GanttTaskBar'

interface GanttTimelineProps {
  tasks: GanttTask[]
  dependencies: GanttDependency[]
  timeRange: TimeRange
  scaleMode: GanttScaleMode
  config: GanttConfig
  onOpenDetail: (taskId: string) => void
}

export function GanttTimeline({
  tasks,
  dependencies,
  timeRange,
  scaleMode,
  config,
  onOpenDetail,
}: GanttTimelineProps) {
  const cellWidth = config.cellWidth[scaleMode]
  const totalWidth = timeRange.totalDays * cellWidth
  const totalHeight = tasks.length * config.rowHeight

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
  const todayX = isToday(new Date())
    ? Math.ceil(
        (new Date().setHours(0, 0, 0, 0) - timeRange.start.setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24)
      ) * cellWidth
    : null

  return (
    <div className="relative" style={{ minWidth: totalWidth }}>
      <svg width={totalWidth} height={totalHeight} className="block" role="img">
        <defs>
          <pattern
            id="grid"
            width={cellWidth}
            height={config.rowHeight}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${cellWidth} 0 L ${cellWidth} ${config.rowHeight}`}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="1"
            />
            <path
              d={`M 0 ${config.rowHeight} L ${cellWidth} ${config.rowHeight}`}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </pattern>
        </defs>

        <rect width={totalWidth} height={totalHeight} fill="url(#grid)" />

        {todayX !== null && (
          <line
            x1={todayX}
            y1={0}
            x2={todayX}
            y2={totalHeight}
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        )}

        {tasks.map((task, index) => {
          const position = getTaskPosition(task, timeRange, config, index, scaleMode)
          if (!position) return null

          const color = getPriorityColor(task.priority)

          return (
            <GanttTaskBar
              key={task.id}
              task={task}
              position={position}
              color={color}
              onClick={() => onOpenDetail(task.id)}
            />
          )
        })}
      </svg>

      <div
        className="pointer-events-none absolute top-0 left-0"
        style={{ width: totalWidth, height: totalHeight }}
      ></div>
    </div>
  )
}
