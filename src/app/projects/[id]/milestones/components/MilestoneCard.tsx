'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, CheckCircle2, Link2, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Milestone, statusColors, statusLabels, Task } from './types'

interface MilestoneCardProps {
  milestone: Milestone
  projectId: string
  onEdit: (milestone: Milestone) => void
  onDelete: (id: string) => void
  onLinkTasks: (milestone: Milestone) => void
}

export function MilestoneCard({
  milestone,
  projectId,
  onEdit,
  onDelete,
  onLinkTasks,
}: MilestoneCardProps) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium">{milestone.title}</h3>
              <Badge className={statusColors[milestone.status]}>
                {statusLabels[milestone.status]}
              </Badge>
            </div>
            {milestone.description && (
              <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {milestone._count?.tasks || milestone.tasks?.length || 0} 个任务
              </span>
              {milestone.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(milestone.dueDate).toLocaleDateString('zh-CN')}
                </span>
              )}
            </div>
            {milestone.tasks && milestone.tasks.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-sm font-medium mb-2">关联任务:</div>
                <div className="flex flex-wrap gap-2">
                  {milestone.tasks.map((task: Task) => (
                    <Link
                      key={task.id}
                      href={`/projects/${projectId}/tasks/${task.id}`}
                      className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200 transition-colors"
                    >
                      {task.title}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {task.progress}%
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold">{milestone.progress}%</div>
              <p className="text-sm text-muted-foreground">完成进度</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onLinkTasks(milestone)}
                title="关联任务"
              >
                <Link2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(milestone)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDelete(milestone.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}