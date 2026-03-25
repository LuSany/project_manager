'use client'

import * as React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, User2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Card as CardType } from '@/blocks/types'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  className?: string
}

function Badge({ children, className = '', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface Assignee {
  id: string
  name: string
  email: string
}

interface KanbanCardProps {
  card: CardType
  assignees?: Assignee[]
}

export function KanbanCard({ card, assignees = [] }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const title = card.fields.title
  const labels = card.fields.labels || []
  const dueDate = card.fields.dueDate
  const cardAssignees = card.fields.assignees || []
  const assigneeMap = new Map(assignees.map((a) => [a.id, a]))

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={cn(
          'cursor-grab p-4 transition-all active:cursor-grabbing',
          'hover:border-primary/50 hover:shadow-md',
          isDragging && 'rotate-2 scale-95 opacity-50 shadow-xl'
        )}
      >
        <h4 className="truncate text-sm font-semibold">{title}</h4>

        {labels.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {labels.map((label) => (
              <React.Fragment key={label}>
                <Badge className="border-transparent bg-secondary text-xs text-secondary-foreground hover:bg-secondary/80">
                  {label}
                </Badge>
              </React.Fragment>
            ))}
          </div>
        )}

        {dueDate && (
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{new Date(dueDate).toLocaleDateString('zh-CN')}</span>
          </div>
        )}

        {cardAssignees.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <User2 className="h-3 w-3" />
            <div className="flex -space-x-1">
              {cardAssignees.slice(0, 3).map((assigneeId) => {
                const assignee = assigneeMap.get(assigneeId)
                if (!assignee) return null
                return (
                  <div
                    key={assignee.id}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-xs font-medium"
                    title={assignee.name}
                  >
                    {assignee.name.charAt(0)}
                  </div>
                )
              })}
              {cardAssignees.length > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                  +{cardAssignees.length - 3}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
