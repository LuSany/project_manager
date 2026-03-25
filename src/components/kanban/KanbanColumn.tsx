'use client'

import * as React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import type { Card as CardType } from '@/blocks/types'
import { KanbanCard } from './KanbanCard'

interface Assignee {
  id: string
  name: string
  email: string
}

interface KanbanColumnProps {
  id: string
  title: string
  cards: CardType[]
  assignees?: Assignee[]
}

export function KanbanColumn({ id, title, cards, assignees = [] }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div className="flex max-w-[350px] min-w-[300px] flex-col">
      <div className="mb-4 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        {cards.length > 0 && (
          <span className="text-muted-foreground ml-2 text-sm">{cards.length}</span>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'min-h-[400px] flex-1 rounded-lg border-2 border-dashed p-3',
          'bg-muted/20 transition-colors',
          'hover:bg-muted/30',
          isOver && 'border-primary bg-primary/5'
        )}
      >
        {cards.length === 0 ? (
          <div className="text-muted-foreground flex h-full items-center justify-center py-8">
            <p className="text-xs">拖拽卡片到此处</p>
          </div>
        ) : (
          <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {cards.map((card) => (
                <KanbanCard key={card.id} card={card} assignees={assignees} />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  )
}
