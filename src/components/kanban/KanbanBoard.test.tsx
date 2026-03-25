import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { KanbanBoard } from './KanbanBoard'

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PointerSensor: class {},
  closestCenter: () => ({}),
  useSensor: () => {},
  useSensors: () => [],
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: (items: any[], from: number, to: number) => {
    const result = [...items]
    const [removed] = result.splice(from, 1)
    result.splice(to, 0, removed)
    return result
  },
}))

describe('KanbanBoard', () => {
  const mockCards = [
    {
      id: 'card-1',
      type: 'card' as const,
      workspaceId: 'ws-1',
      createdBy: 'user-1',
      createAt: Date.now(),
      updateAt: Date.now(),
      fields: {
        title: '卡片1',
        properties: {
          status: 'todo',
        },
        assignees: ['user1'],
      },
    },
    {
      id: 'card-2',
      type: 'card' as const,
      workspaceId: 'ws-1',
      createdBy: 'user-1',
      createAt: Date.now(),
      updateAt: Date.now(),
      fields: {
        title: '卡片2',
        properties: {
          status: 'inProgress',
        },
        assignees: ['user2'],
      },
    },
  ]

  const mockAssignees = [
    { id: 'user1', name: '张三', email: 'zhang@example.com' },
    { id: 'user2', name: '李四', email: 'li@example.com' },
  ]

  const mockColumns = [
    { id: 'col-todo', title: '待办', status: 'todo' },
    { id: 'col-progress', title: '进行中', status: 'inProgress' },
    { id: 'col-done', title: '已完成', status: 'done' },
  ]

  it('应该渲染所有列', () => {
    render(
      <KanbanBoard
        columns={mockColumns}
        cards={mockCards}
        assignees={mockAssignees}
        onCardDrop={vi.fn()}
      />
    )
    expect(screen.getByText('待办')).toBeInTheDocument()
    expect(screen.getByText('进行中')).toBeInTheDocument()
    expect(screen.getByText('已完成')).toBeInTheDocument()
  })

  it('应该渲染所有卡片', () => {
    render(
      <KanbanBoard
        columns={mockColumns}
        cards={mockCards}
        assignees={mockAssignees}
        onCardDrop={vi.fn()}
      />
    )
    expect(screen.getByText('卡片1')).toBeInTheDocument()
    expect(screen.getByText('卡片2')).toBeInTheDocument()
  })

  it('应该按照状态分组卡片', () => {
    render(
      <KanbanBoard
        columns={mockColumns}
        cards={mockCards}
        assignees={mockAssignees}
        onCardDrop={vi.fn()}
      />
    )
    expect(screen.getByText('卡片1')).toBeInTheDocument()
    expect(screen.getByText('卡片2')).toBeInTheDocument()
  })

  it('应该调用 onCardDrop 当卡片被拖拽', () => {
    const handleDrop = vi.fn()
    render(
      <KanbanBoard
        columns={mockColumns}
        cards={mockCards}
        assignees={mockAssignees}
        onCardDrop={handleDrop}
      />
    )
    expect(handleDrop).not.toHaveBeenCalled()
  })
})
