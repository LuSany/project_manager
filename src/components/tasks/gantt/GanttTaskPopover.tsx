import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import type { GanttTask } from './types'

interface GanttTaskPopoverProps {
  task: GanttTask | null
}

export function GanttTaskPopover({ task }: GanttTaskPopoverProps) {
  if (!task) return null

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'TODO':
        return 'default'
      case 'IN_PROGRESS':
        return 'bg-blue-500'
      case 'REVIEW':
        return 'bg-purple-500'
      case 'TESTING':
        return 'bg-yellow-500'
      case 'DONE':
        return 'bg-green-500'
      default:
        return 'default'
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  }

  return (
    <Popover open={!!task}>
      <PopoverTrigger asChild>
        <div />
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <Card className="border-0 p-0 shadow-none">
          <div className="space-y-3">
            <div className="text-sm font-semibold">{task.title}</div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
              <span className="text-muted-foreground text-xs">进度 {task.progress}%</span>
            </div>
            <div className="text-muted-foreground text-xs">
              {formatDate(task.startDate)} - {formatDate(task.dueDate)}
            </div>
            {task.assignees && task.assignees.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {task.assignees.slice(0, 3).map((assignee) => (
                    <Avatar key={assignee.user.id} className="h-6 w-6 border-2">
                      <AvatarFallback className="text-xs">
                        {assignee.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {task.assignees.length > 3 && (
                  <span className="text-muted-foreground text-xs">
                    +{task.assignees.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
