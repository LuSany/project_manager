import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { GanttTask, GanttDependency, GanttScaleMode } from './types'
import { calculateTimeRange, DEFAULT_GANTT_CONFIG } from './utils'
import { useTaskViewStore } from '@/stores/taskViewStore'
import { GanttLeftPanel } from './GanttLeftPanel'
import { GanttTimeScaleHeader } from './GanttTimeScaleHeader'
import { GanttTimeline } from './GanttTimeline'

interface Task {
  id: string
  title: string
  status: string
  progress?: number
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

interface TaskGanttProps {
  projectId: string
  tasks: Task[]
  isLoading: boolean
  onOpenDetail: (taskId: string) => void
}

export function TaskGantt({ projectId, tasks, isLoading, onOpenDetail }: TaskGanttProps) {
  const ganttScaleMode = useTaskViewStore((state) => state.ganttScaleMode)
  const [scrollLeft, setScrollLeft] = useState(0)

  const { data: dependencies = [] } = useQuery({
    queryKey: ['gantt-dependencies', projectId],
    queryFn: async () => {
      if (tasks.length === 0) return []

      const dependencyPromises = tasks.map(async (task) => {
        try {
          const response = await fetch(`/api/v1/tasks/${task.id}/dependencies`)
          if (!response.ok) return []
          const data = await response.json()
          return data.data || data || []
        } catch {
          return []
        }
      })

      const allDependencies = await Promise.all(dependencyPromises)
      return allDependencies.flat()
    },
    enabled: tasks.length > 0,
  })

  const ganttTasks: GanttTask[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    progress: task.progress || 0,
    priority: task.priority,
    startDate: task.startDate,
    dueDate: task.dueDate,
    assignees: task.assignees,
  }))

  const ganttDependencies: GanttDependency[] = dependencies.map((dep: any) => ({
    id: dep.id,
    sourceTaskId: dep.dependsOnId,
    targetTaskId: dep.taskId,
    dependencyType: dep.dependencyType,
  }))

  const timeRange = calculateTimeRange(ganttTasks, ganttScaleMode)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft)
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4">
        <div className="text-muted-foreground text-lg font-medium">暂无任务</div>
        <div className="text-muted-foreground text-sm">创建任务后可在甘特图中查看时间线</div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <GanttLeftPanel
          tasks={ganttTasks}
          rowHeight={DEFAULT_GANTT_CONFIG.rowHeight}
          onOpenDetail={onOpenDetail}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <GanttTimeScaleHeader
            timeRange={timeRange}
            scaleMode={ganttScaleMode}
            config={DEFAULT_GANTT_CONFIG}
            scrollLeft={scrollLeft}
          />
          <div className="flex-1 overflow-auto" onScroll={handleScroll}>
            <GanttTimeline
              tasks={ganttTasks}
              dependencies={ganttDependencies}
              timeRange={timeRange}
              scaleMode={ganttScaleMode}
              config={DEFAULT_GANTT_CONFIG}
              onOpenDetail={onOpenDetail}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
