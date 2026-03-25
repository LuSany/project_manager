'use client'

import * as React from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { Card as CardType } from '@/blocks/types'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'

interface Assignee {
  id: string
  name: string
  email: string
}

export interface KanbanColumnConfig {
  id: string
  title: string
  status: string
}

interface KanbanBoardProps {
  columns: KanbanColumnConfig[]
  cards: CardType[]
  assignees?: Assignee[]
  onCardDrop: (cardId: string, targetStatus: string) => void
}

export function KanbanBoard({ columns, cards, assignees = [], onCardDrop }: KanbanBoardProps) {
  const [activeCard, setActiveCard] = React.useState<CardType | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const cardsByStatus = React.useMemo(() => {
    const grouped: Record<string, CardType[]> = {}
    columns.forEach((col) => {
      grouped[col.status] = cards.filter((card) => {
        const cardStatus = card.fields.properties?.status as string
        return cardStatus === col.status
      })
    })
    return grouped
  }, [cards, columns])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const card = cards.find((c) => c.id === active.id)
    if (card) {
      setActiveCard(card)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const cardId = active.id as string
    const targetColumn = columns.find((col) => col.id === over.id)

    if (targetColumn) {
      onCardDrop(cardId, targetColumn.status)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex h-full gap-6 px-1">
            {columns.map((column) => (
              <div key={column.id} className="flex-shrink-0">
                <KanbanColumn
                  id={column.id}
                  title={column.title}
                  cards={cardsByStatus[column.status] || []}
                  assignees={assignees}
                />
              </div>
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="scale-105 rotate-3">
              <KanbanCard card={activeCard} assignees={assignees} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
