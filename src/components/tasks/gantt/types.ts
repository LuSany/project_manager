import { DependencyType } from '@/types/task-dependency'

export type GanttScaleMode = 'day' | 'week' | 'month'

export interface GanttTask {
  id: string
  title: string
  status: string
  progress: number
  priority: string
  startDate: string | null
  dueDate: string | null
  assignees?: Array<{
    user: {
      id: string
      name: string
      email: string
      avatar?: string
    }
  }>
}

export interface GanttDependency {
  id: string
  sourceTaskId: string
  targetTaskId: string
  dependencyType: DependencyType
}

export interface GanttConfig {
  rowHeight: number
  barHeight: number
  leftPanelPercent: number
  cellWidth: {
    day: number
    week: number
    month: number
  }
  headerHeight: number
  barGap: number
}

export interface TimeRange {
  start: Date
  end: Date
  totalDays: number
}

export interface TaskBarPosition {
  x: number
  y: number
  width: number
  height: number
}
