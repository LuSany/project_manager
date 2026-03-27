/**
 * CalendarTaskCard 组件测试
 * 测试日历任务卡片渲染和交互
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { CalendarTaskCard } from '../CalendarTaskCard'
import type { Task } from '@/components/tasks/kanban/SortableTaskCard'

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core')
  return {
    ...actual,
    useDraggable: () => ({
      attributes: { 'aria-roledescription': 'draggable' },
      listeners: { onPointerDown: vi.fn() },
      setNodeRef: vi.fn(),
      isDragging: false,
    }),
  }
})

describe('CalendarTaskCard', () => {
  const mockTask: Task = {
    id: 'task-1',
    title: 'Test Task Title That Is Very Long',
    description: null,
    status: 'TODO',
    progress: 0,
    priority: 'HIGH',
    startDate: null,
    dueDate: '2026-03-15T00:00:00.000Z',
    createdAt: '2026-03-01T00:00:00.000Z',
    assignees: [],
  }

  const defaultProps = {
    task: mockTask,
  }

  describe('rendering', () => {
    it('should render task title truncated', () => {
      render(
        <DndContext>
          <CalendarTaskCard {...defaultProps} />
        </DndContext>
      )

      // Task title should be displayed
      expect(screen.getByText(/Test Task Title/)).toBeInTheDocument()
    })

    it('should show priority color indicator', () => {
      const { container } = render(
        <DndContext>
          <CalendarTaskCard {...defaultProps} />
        </DndContext>
      )

      // Should have a colored indicator element
      const indicator = container.querySelector('.rounded-full')
      expect(indicator).toBeInTheDocument()
    })

    it('should apply compact styling for calendar cell', () => {
      const { container } = render(
        <DndContext>
          <CalendarTaskCard {...defaultProps} />
        </DndContext>
      )

      // Should have h-6 class for compact height (24px)
      const card = container.querySelector('.h-6')
      expect(card).toBeInTheDocument()
    })
  })

  describe('priority colors', () => {
    it('should show red for HIGH priority', () => {
      const { container } = render(
        <DndContext>
          <CalendarTaskCard task={{ ...mockTask, priority: 'HIGH' }} />
        </DndContext>
      )

      // 检查内联样式 backgroundColor
      const indicator = container.querySelector('[style*="background-color"]')
      expect(indicator).toHaveStyle({ backgroundColor: '#ef4444' })
    })

    it('should show yellow for MEDIUM priority', () => {
      const { container } = render(
        <DndContext>
          <CalendarTaskCard task={{ ...mockTask, priority: 'MEDIUM' }} />
        </DndContext>
      )

      const indicator = container.querySelector('[style*="background-color"]')
      expect(indicator).toHaveStyle({ backgroundColor: '#eab308' })
    })

    it('should show blue for LOW priority', () => {
      const { container } = render(
        <DndContext>
          <CalendarTaskCard task={{ ...mockTask, priority: 'LOW' }} />
        </DndContext>
      )

      const indicator = container.querySelector('[style*="background-color"]')
      expect(indicator).toHaveStyle({ backgroundColor: '#3b82f6' })
    })
  })

  describe('interactions', () => {
    it('should call onOpenDetail when clicked', () => {
      const onOpenDetail = vi.fn()
      const { container } = render(
        <DndContext>
          <CalendarTaskCard {...defaultProps} onOpenDetail={onOpenDetail} />
        </DndContext>
      )

      // Find clickable card element
      const card = container.querySelector('.h-6')
      card?.click()

      expect(onOpenDetail).toHaveBeenCalledWith('task-1')
    })
  })
})