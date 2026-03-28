import { useState, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { differenceInDays } from 'date-fns'
import type { GanttTask, GanttDependency, GanttScaleMode } from './types'
import { calculateTimeRange, DEFAULT_GANTT_CONFIG } from './utils'
import { useTaskViewStore } from '@/stores/taskViewStore'
import { GanttLeftPanel } from './GanttLeftPanel'
import { GanttTimeScaleHeader } from './GanttTimeScaleHeader'
import { GanttTimeline } from './GanttTimeline'
import { TaskDetailDrawer } from '@/components/tasks/detail/TaskDetailDrawer'
import { Button } from '@/components/ui/button'

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
  const setGanttScaleMode = useTaskViewStore((state) => state.setGanttScaleMode)
  const [scrollLeft, setScrollLeft] = useState(0)

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)
  const leftPanelRef = useRef<HTMLDivElement>(null)

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

  const scrollToToday = useCallback(() => {
    if (!timelineRef.current) return

    const today = new Date()
    const daysFromStart = differenceInDays(today, timeRange.start)
    const cellWidth = DEFAULT_GANTT_CONFIG.cellWidth[ganttScaleMode]
    const x = daysFromStart * cellWidth

    timelineRef.current.scrollTo({
      left: Math.max(0, x - timelineRef.current.clientWidth / 2),
      behavior: 'smooth',
    })
  }, [timeRange, ganttScaleMode])

  const handleTimelineScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    setScrollLeft(target.scrollLeft)
    if (leftPanelRef.current) {
      leftPanelRef.current.scrollTop = target.scrollTop
    }
  }, [])

  const handleLeftPanelScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = e.currentTarget.scrollTop
    }
  }, [])

  const handleOpenDetailDrawer = useCallback((taskId: string) => {
    setSelectedTaskId(taskId)
    setDrawerOpen(true)
  }, [])

  const handleDrawerOpenChange = useCallback((open: boolean) => {
    setDrawerOpen(open)
    if (!open) {
      setSelectedTaskId(null)
    }
  }, [])

  const scaleButtonClass = (mode: GanttScaleMode) =>
    `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
      ganttScaleMode === mode
        ? 'bg-background text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground'
    }`

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
      {/* 工具栏：刻度切换 + 今天按钮 */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        {/* 左侧：时间刻度切换 */}
        <div className="bg-muted flex rounded-md p-1">
          <button onClick={() => setGanttScaleMode('day')} className={scaleButtonClass('day')}>
            日
          </button>
          <button onClick={() => setGanttScaleMode('week')} className={scaleButtonClass('week')}>
            周
          </button>
          <button onClick={() => setGanttScaleMode('month')} className={scaleButtonClass('month')}>
            月
          </button>
        </div>

        {/* 右侧：今天按钮 */}
        <Button variant="outline" size="sm" onClick={scrollToToday}>
          今天
        </Button>
      </div>

      {/* 双栏布局 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧面板 */}
        <GanttLeftPanel
          ref={leftPanelRef}
          tasks={ganttTasks}
          rowHeight={DEFAULT_GANTT_CONFIG.rowHeight}
          onOpenDetail={handleOpenDetailDrawer}
          onScroll={handleLeftPanelScroll}
        />

        {/* 右侧时间线 */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <GanttTimeScaleHeader
            timeRange={timeRange}
            scaleMode={ganttScaleMode}
            config={DEFAULT_GANTT_CONFIG}
            scrollLeft={scrollLeft}
          />
          <div className="flex-1 overflow-auto" ref={timelineRef} onScroll={handleTimelineScroll}>
            <GanttTimeline
              tasks={ganttTasks}
              dependencies={ganttDependencies}
              timeRange={timeRange}
              scaleMode={ganttScaleMode}
              config={DEFAULT_GANTT_CONFIG}
              onOpenDetail={handleOpenDetailDrawer}
            />
          </div>
        </div>
      </div>

      {/* 详情抽屉 */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        open={drawerOpen}
        onOpenChange={handleDrawerOpenChange}
      />
    </div>
  )
}
