import {
  parseISO,
  addDays,
  startOfMonth,
  endOfMonth,
  differenceInDays,
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from 'date-fns'
import type { GanttTask, GanttScaleMode, GanttConfig, TimeRange, TaskBarPosition } from './types'

export const DEFAULT_GANTT_CONFIG: GanttConfig = {
  rowHeight: 36,
  barHeight: 24,
  leftPanelPercent: 30,
  cellWidth: {
    day: 48,
    week: 120,
    month: 200,
  },
  headerHeight: 48,
  barGap: 6,
}

export function calculateTimeRange(tasks: GanttTask[], scaleMode: GanttScaleMode): TimeRange {
  if (tasks.length === 0) {
    const now = new Date()
    const start = startOfMonth(now)
    const end = endOfMonth(now)
    const totalDays = differenceInDays(end, start) + 1

    return { start, end, totalDays }
  }

  const validTasks = tasks.filter((task) => task.startDate && task.dueDate)

  if (validTasks.length === 0) {
    const now = new Date()
    const start = startOfMonth(now)
    const end = endOfMonth(now)
    const totalDays = differenceInDays(end, start) + 1

    return { start, end, totalDays }
  }

  const startDates = validTasks
    .map((task) => parseISO(task.startDate!))
    .sort((a, b) => a.getTime() - b.getTime())

  const endDates = validTasks
    .map((task) => parseISO(task.dueDate!))
    .sort((a, b) => b.getTime() - a.getTime())

  const start = addDays(startDates[0], -7)
  const end = addDays(endDates[0], 7)
  const totalDays = differenceInDays(end, start) + 1

  return { start, end, totalDays }
}

export function getTaskPosition(
  task: GanttTask,
  timeRange: TimeRange,
  config: GanttConfig,
  rowIndex: number,
  scaleMode: GanttScaleMode
): TaskBarPosition | null {
  if (!task.startDate || !task.dueDate) {
    return null
  }

  const startDate = parseISO(task.startDate)
  const endDate = parseISO(task.dueDate)

  const cellWidth = config.cellWidth[scaleMode]
  const msPerDay = 1000 * 60 * 60 * 24

  const startDiff = differenceInDays(startDate, timeRange.start)
  const durationDays = differenceInDays(endDate, startDate) + 1

  const x = startDiff * cellWidth
  const width = Math.max(durationDays * cellWidth, 20)

  const y = rowIndex * config.rowHeight + (config.rowHeight - config.barHeight) / 2
  const height = config.barHeight

  return { x, y, width, height }
}

export function formatScaleDate(date: Date, scaleMode: GanttScaleMode): string {
  switch (scaleMode) {
    case 'day':
      return format(date, 'M/d')
    case 'week':
      const weekNumber = Math.ceil(date.getDate() / 7)
      return `第 ${weekNumber} 周`
    case 'month':
      return format(date, 'yyyy年M月')
    default:
      return format(date, 'M/d')
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority.toUpperCase()) {
    case 'HIGH':
    case 'CRITICAL':
      return '#ef4444'
    case 'MEDIUM':
      return '#eab308'
    case 'LOW':
      return '#3b82f6'
    default:
      return '#eab308'
  }
}

export function getStatusIcon(status: string): string {
  switch (status.toUpperCase()) {
    case 'TODO':
      return '⏳'
    case 'IN_PROGRESS':
      return '🔄'
    case 'REVIEW':
      return '👀'
    case 'TESTING':
      return '🧪'
    case 'DONE':
      return '✅'
    default:
      return '📋'
  }
}

export function getScaleIntervals(timeRange: TimeRange, scaleMode: GanttScaleMode): Date[] {
  switch (scaleMode) {
    case 'day':
      return eachDayOfInterval({ start: timeRange.start, end: timeRange.end })
    case 'week':
      return eachWeekOfInterval({ start: timeRange.start, end: timeRange.end })
    case 'month':
      return eachMonthOfInterval({ start: timeRange.start, end: timeRange.end })
    default:
      return eachDayOfInterval({ start: timeRange.start, end: timeRange.end })
  }
}
