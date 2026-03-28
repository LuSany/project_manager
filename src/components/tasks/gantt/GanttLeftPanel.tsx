import { forwardRef } from 'react'
import type { GanttTask } from './types'
import { getStatusIcon } from './utils'

interface GanttLeftPanelProps {
  tasks: GanttTask[]
  rowHeight: number
  onOpenDetail: (taskId: string) => void
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void
}

export const GanttLeftPanel = forwardRef<HTMLDivElement, GanttLeftPanelProps>(
  function GanttLeftPanel({ tasks, rowHeight, onOpenDetail, onScroll }, ref) {
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return `${date.getMonth() + 1}/${date.getDate()}`
    }

    return (
      <div className="flex-shrink-0" style={{ width: '30%' }}>
        <div className="bg-muted border-b" style={{ height: 48 }} />
        <div className="overflow-auto" ref={ref} onScroll={onScroll}>
          {tasks.map((task) => (
            <div
              key={task.id}
              className="hover:bg-accent/50 flex cursor-pointer items-center border-b px-4 transition-colors"
              style={{ height: rowHeight }}
              onClick={() => onOpenDetail(task.id)}
            >
              <div className="mr-2 flex-1 truncate text-sm">{task.title}</div>
              <div className="flex w-[60px] items-center justify-center" title={task.status}>
                <span className="text-sm">{getStatusIcon(task.status)}</span>
              </div>
              <div className="mr-2 flex w-[40px] items-center justify-center">
                {task.assignees && task.assignees.length > 0 && (
                  <div className="flex -space-x-2">
                    {task.assignees.slice(0, 2).map((assignee) => (
                      <div
                        key={assignee.user.id}
                        className="bg-primary text-primary-foreground border-background flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs"
                        title={assignee.user.name}
                      >
                        {assignee.user.name.charAt(0)}
                      </div>
                    ))}
                    {task.assignees.length > 2 && (
                      <div className="bg-muted text-muted-foreground border-background flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs">
                        +{task.assignees.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="text-muted-foreground w-[120px] text-xs">
                {task.startDate && task.dueDate ? (
                  <span>
                    {formatDate(task.startDate)} - {formatDate(task.dueDate)}
                  </span>
                ) : (
                  <span>-</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
)
