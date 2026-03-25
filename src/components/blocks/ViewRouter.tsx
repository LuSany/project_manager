'use client'

import * as React from 'react'
import type { ViewType } from '@/blocks/types'
import { KanbanBoard, type KanbanColumnConfig } from '@/components/kanban/KanbanBoard'
import type { Card as CardType } from '@/blocks/types'

interface Assignee {
  id: string
  name: string
  email: string
}

interface ViewRouterProps {
  viewType: ViewType
  cards: CardType[]
  assignees?: Assignee[]
  onCardDrop?: (cardId: string, targetStatus: string) => void
}

export function ViewRouter({ viewType, cards, assignees = [], onCardDrop }: ViewRouterProps) {
  const renderView = () => {
    switch (viewType) {
      case 'board':
        return <BoardView cards={cards} assignees={assignees} onCardDrop={onCardDrop} />
      case 'table':
        return <TableView cards={cards} />
      case 'calendar':
        return <CalendarView cards={cards} />
      case 'gallery':
        return <GalleryView cards={cards} />
      default:
        return <BoardView cards={cards} assignees={assignees} onCardDrop={onCardDrop} />
    }
  }

  return <div className="h-full">{renderView()}</div>
}

function BoardView({
  cards,
  assignees,
  onCardDrop,
}: {
  cards: CardType[]
  assignees: Assignee[]
  onCardDrop?: (cardId: string, targetStatus: string) => void
}) {
  const columns: KanbanColumnConfig[] = [
    { id: 'col-todo', title: '待办', status: 'todo' },
    { id: 'col-progress', title: '进行中', status: 'inProgress' },
    { id: 'col-review', title: '待评审', status: 'review' },
    { id: 'col-done', title: '已完成', status: 'done' },
  ]

  const handleDrop = (cardId: string, targetStatus: string) => {
    onCardDrop?.(cardId, targetStatus)
  }

  return (
    <KanbanBoard columns={columns} cards={cards} assignees={assignees} onCardDrop={handleDrop} />
  )
}

function TableView({ cards }: { cards: CardType[] }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-muted-foreground text-center">
        <p className="text-lg font-semibold">表格视图</p>
        <p className="text-sm">待实现</p>
      </div>
    </div>
  )
}

function CalendarView({ cards }: { cards: CardType[] }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-muted-foreground text-center">
        <p className="text-lg font-semibold">日历视图</p>
        <p className="text-sm">待实现</p>
      </div>
    </div>
  )
}

function GalleryView({ cards }: { cards: CardType[] }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-muted-foreground text-center">
        <p className="text-lg font-semibold">画廊视图</p>
        <p className="text-sm">待实现</p>
      </div>
    </div>
  )
}
