import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { KanbanColumn } from './KanbanColumn'

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  verticalListSortingStrategy: 'vertical',
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

vi.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({
    setNodeRef: vi.fn(),
    isOver: false,
  }),
}))

describe('KanbanColumn', () => {
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
        properties: {},
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
        properties: {},
      },
    },
  ]

  const mockAssignees = [
    { id: 'user1', name: '张三', email: 'zhang@example.com' },
    { id: 'user2', name: '李四', email: 'li@example.com' },
  ]

  it('应该渲染列标题', () => {
    render(<KanbanColumn id="col-1" title="待办" cards={mockCards} assignees={mockAssignees} />)
    expect(screen.getByText('待办')).toBeInTheDocument()
  })

  it('应该显示卡片数量', () => {
    render(<KanbanColumn id="col-1" title="待办" cards={mockCards} assignees={mockAssignees} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('应该渲染所有卡片', () => {
    render(<KanbanColumn id="col-1" title="待办" cards={mockCards} assignees={mockAssignees} />)
    expect(screen.getByText('卡片1')).toBeInTheDocument()
    expect(screen.getByText('卡片2')).toBeInTheDocument()
  })

  it('应该没有卡片时显示空状态提示', () => {
    render(<KanbanColumn id="col-1" title="待办" cards={[]} assignees={mockAssignees} />)
    expect(screen.getByText('拖拽卡片到此处')).toBeInTheDocument()
  })

  it('应该没有卡片时不显示数量', () => {
    render(<KanbanColumn id="col-1" title="待办" cards={[]} assignees={mockAssignees} />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})
