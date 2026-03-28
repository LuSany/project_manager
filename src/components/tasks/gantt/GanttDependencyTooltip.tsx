import type { GanttTask, GanttDependency } from './types'
import { DependencyType } from '@/types/task-dependency'

const DEPENDENCY_LABELS: Record<DependencyType, string> = {
  [DependencyType.FINISH_TO_START]: 'FS (完成→开始)',
  [DependencyType.START_TO_START]: 'SS (开始→开始)',
  [DependencyType.FINISH_TO_FINISH]: 'FF (完成→完成)',
  [DependencyType.START_TO_FINISH]: 'SF (开始→完成)',
}

const DEPENDENCY_COLORS: Record<DependencyType, string> = {
  [DependencyType.FINISH_TO_START]: 'bg-blue-500',
  [DependencyType.START_TO_START]: 'bg-green-500',
  [DependencyType.FINISH_TO_FINISH]: 'bg-purple-500',
  [DependencyType.START_TO_FINISH]: 'bg-orange-500',
}

interface GanttDependencyTooltipProps {
  dependency: GanttDependency | null
  sourceTask?: GanttTask
  targetTask?: GanttTask
  position: { x: number; y: number } | null
}

export function GanttDependencyTooltip({
  dependency,
  sourceTask,
  targetTask,
  position,
}: GanttDependencyTooltipProps) {
  if (!dependency || !sourceTask || !targetTask || !position) {
    return null
  }

  return (
    <div
      className="bg-popover pointer-events-none absolute z-50 rounded-md border px-3 py-2 shadow-md"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{sourceTask.title}</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-sm font-medium">{targetTask.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded px-1.5 py-0.5 text-xs text-white ${DEPENDENCY_COLORS[dependency.dependencyType]}`}
          >
            {DEPENDENCY_LABELS[dependency.dependencyType]}
          </span>
        </div>
        <div className="text-muted-foreground text-xs">
          状态: {sourceTask.status === 'DONE' ? '已完成' : '未完成'}
        </div>
      </div>
    </div>
  )
}
