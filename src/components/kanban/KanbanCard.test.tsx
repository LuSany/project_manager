import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { KanbanCard } from './KanbanCard'

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

describe('KanbanCard', () => {
  const mockCard = {
    id: 'card-1',
    type: 'card' as const,
    workspaceId: 'ws-1',
    createdBy: 'user-1',
    createAt: Date.now(),
    updateAt: Date.now(),
    fields: {
      title: '测试卡片',
      properties: {
        status: 'todo',
        priority: 'high',
      },
      assignees: ['user1', 'user2'],
      dueDate: 1741891200000,
      labels: ['bug', 'urgent'],
    },
  }

  const mockAssignees = [
    { id: 'user1', name: '张三', email: 'zhang@example.com' },
    { id: 'user2', name: '李四', email: 'li@example.com' },
  ]

  it('应该渲染卡片标题', () => {
    render(<KanbanCard card={mockCard} assignees={mockAssignees} />)
    expect(screen.getByText('测试卡片')).toBeInTheDocument()
  })

  it('应该显示标签', () => {
    render(<KanbanCard card={mockCard} assignees={mockAssignees} />)
    expect(screen.getByText('bug')).toBeInTheDocument()
    expect(screen.getByText('urgent')).toBeInTheDocument()
  })

  it('应该显示截止日期', () => {
    render(<KanbanCard card={mockCard} assignees={mockAssignees} />)
    expect(screen.getByText('2025')).toBeInTheDocument()
  })

  it('应该显示负责人头像', () => {
    render(<KanbanCard card={mockCard} assignees={mockAssignees} />)
    const avatarTexts = screen.getAllByText(/张|李/)
    expect(avatarTexts.length).toBeGreaterThanOrEqual(2)
  })

  it('应该没有标签时不显示标签区域', () => {
    const cardWithoutLabels = {
      ...mockCard,
      fields: { ...mockCard.fields, labels: undefined },
    }
    render(<KanbanCard card={cardWithoutLabels} assignees={mockAssignees} />)
    expect(screen.queryByText('bug')).not.toBeInTheDocument()
  })

  it('应该没有负责人时不显示头像区域', () => {
    render(<KanbanCard card={mockCard} assignees={[]} />)
    const avatarTexts = screen.queryAllByText(/张|李/)
    expect(avatarTexts).toHaveLength(0)
  })

  it('应该没有截止日期时不显示日期', () => {
    const cardWithoutDueDate = {
      ...mockCard,
      fields: { ...mockCard.fields, dueDate: undefined },
    }
    render(<KanbanCard card={cardWithoutDueDate} assignees={mockAssignees} />)
    expect(screen.queryByText(/2025-03-15/)).not.toBeInTheDocument()
  })
})
