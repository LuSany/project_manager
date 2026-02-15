'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  startDate?: Date
  dueDate?: Date
  projectId: string
}

interface TaskTimelineProps {
  tasks: Task[]
}

export function TaskTimeline({ tasks }: TaskTimelineProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-200 text-gray-800'
      case 'IN_PROGRESS':
        return 'bg-blue-200 text-blue-800'
      case 'REVIEW':
        return 'bg-yellow-200 text-yellow-800'
      case 'TESTING':
        return 'bg-purple-200 text-purple-800'
      case 'DONE':
        return 'bg-green-200 text-green-800'
      default:
        return 'bg-gray-200 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-600'
      case 'HIGH':
        return 'text-orange-600'
      case 'MEDIUM':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  // 按日期排序任务
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = a.startDate || a.dueDate || new Date(0)
    const dateB = b.startDate || b.dueDate || new Date(0)
    return dateA.getTime() - dateB.getTime()
  })

  // 按日期分组
  const groupedByDate = sortedTasks.reduce(
    (groups, task) => {
      const date = task.startDate || task.dueDate || new Date(0)
      const dateKey = date.toISOString().split('T')[0]
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(task)
      return groups
    },
    {} as Record<string, Task[]>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>任务时间线</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-8">
          {Object.entries(groupedByDate).map(([date, dateTasks]) => (
            <div key={date} className="mb-8">
              <h3 className="mb-4 text-lg font-semibold">
                {date === '1970-01-01' ? '无日期' : new Date(date).toLocaleDateString('zh-CN')}
              </h3>
              <div className="relative">
                {/* 时间线 */}
                <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-300" />
                {dateTasks.map((task, index) => (
                  <div
                    key={task.id}
                    className={`relative pl-8 ${index !== dateTasks.length - 1 ? 'pb-8' : ''}`}
                  >
                    {/* 任务点 */}
                    <div
                      className={`flex items-center gap-3 rounded-lg border-2 p-3 ${getStatusColor(task.status)}`}
                    >
                      <div className="flex-1">
                        <div
                          className={`h-3 w-3 rounded-full ${getPriorityColor(task.priority)}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-muted-foreground mt-1 text-xs">{task.projectId}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline">{task.status}</Badge>
                          <Badge variant="outline">{task.priority}</Badge>
                          {task.dueDate && (
                            <span className="text-muted-foreground ml-2 text-xs">
                              截止: {new Date(task.dueDate).toLocaleDateString('zh-CN')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* 连接线 */}
                    {index !== dateTasks.length - 1 && (
                      <div className="absolute top-6 left-4 h-px w-0.5 bg-gray-300" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
