import { useState, useMemo } from 'react'
import { isToday } from 'date-fns'
import type {
  GanttTask,
  GanttDependency,
  GanttScaleMode,
  GanttConfig,
  TimeRange,
  TaskBarPosition,
} from './types'
import { getTaskPosition, getPriorityColor } from './utils'
import { GanttTaskBar } from './GanttTaskBar'
import { GanttDependencyLine } from './GanttDependencyLine'
import { GanttDependencyTooltip } from './GanttDependencyTooltip'
import { calculateCriticalPath } from './GanttCriticalPath'

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

  const [hoveredDependencyId, setHoveredDependencyId] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)

  const criticalTaskIds = useMemo(
    () => calculateCriticalPath(tasks, dependencies),
    [tasks, dependencies]
  )

  const taskPositionMap = useMemo(() => {
    const map = new Map<string, TaskBarPosition>()
    tasks.forEach((task, index) => {
      const position = getTaskPosition(task, timeRange, config, index, scaleMode)
      if (position) {
        map.set(task.id, position)
      }
    })
    return map
  }, [tasks, timeRange, config, scaleMode])

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

        {dependencies.map((dep) => {
          const sourcePos = taskPositionMap.get(dep.sourceTaskId)
          const targetPos = taskPositionMap.get(dep.targetTaskId)
          if (!sourcePos || !targetPos) return null

          const isOnCriticalPath =
            criticalTaskIds.has(dep.sourceTaskId) && criticalTaskIds.has(dep.targetTaskId)

          const handleHover = (id: string | null) => {
            setHoveredDependencyId(id)
            if (id) {
              const midX = (sourcePos.x + sourcePos.width + targetPos.x) / 2
              const midY = (sourcePos.y + targetPos.y) / 2
              setTooltipPosition({ x: midX, y: midY })
            } else {
              setTooltipPosition(null)
            }
          }

          return (
            <GanttDependencyLine
              key={dep.id}
              dependency={dep}
              sourcePosition={sourcePos}
              targetPosition={targetPos}
              dependencyType={dep.dependencyType}
              isCritical={isOnCriticalPath}
              isHovered={hoveredDependencyId === dep.id}
              onHover={handleHover}
            />
          )
        })}

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
              isCritical={criticalTaskIds.has(task.id)}
              onClick={() => onOpenDetail(task.id)}
            />
          )
        })}
      </svg>

      <GanttDependencyTooltip
        dependency={
          hoveredDependencyId
            ? dependencies.find((d) => d.id === hoveredDependencyId) || null
            : null
        }
        sourceTask={
          hoveredDependencyId
            ? tasks.find(
                (t) => t.id === dependencies.find((d) => d.id === hoveredDependencyId)?.sourceTaskId
              )
            : undefined
        }
        targetTask={
          hoveredDependencyId
            ? tasks.find(
                (t) => t.id === dependencies.find((d) => d.id === hoveredDependencyId)?.targetTaskId
              )
            : undefined
        }
        position={tooltipPosition}
      />

      <div
        className="pointer-events-none absolute top-0 left-0"
        style={{ width: totalWidth, height: totalHeight }}
      ></div>
    </div>
  )
}
