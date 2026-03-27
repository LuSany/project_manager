/**
 * UnscheduledTaskList 组件测试
 * 测试未排期任务列表渲染和交互
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { UnscheduledTaskList } from '../UnscheduledTaskList'
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

describe('UnscheduledTaskList', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Task Without Due Date',
      description: null,
      status: 'TODO',
      progress: 0,
      priority: 'HIGH',
      startDate: null,
      dueDate: null,
      createdAt: '2026-03-01T00:00:00.000Z',
      assignees: [],
    },
    {
      id: 'task-2',
      title: 'Another Unscheduled Task',
      description: null,
      status: 'IN_PROGRESS',
      progress: 50,
      priority: 'MEDIUM',
      startDate: null,
      dueDate: null,
      createdAt: '2026-03-02T00:00:00.000Z',
      assignees: [],
    },
    {
      id: 'task-3',
      title: 'Task With Due Date',
      description: null,
      status: 'TODO',
      progress: 0,
      priority: 'LOW',
      startDate: null,
      dueDate: '2026-03-15T00:00:00.000Z',
      createdAt: '2026-03-03T00:00:00.000Z',
      assignees: [],
    },
  ]

  beforeEach(() => {
    cleanup()
  })

  describe('rendering', () => {
    it('should render tasks without due date', () => {
      render(
        <DndContext>
          <UnscheduledTaskList tasks={mockTasks} />
        </DndContext>
      )

      // Should show the header with count - text is split, use regex
      expect(screen.getByText(/未安排日期/)).toBeInTheDocument()
    })

    it('should show collapsible header with count', () => {
      render(
        <DndContext>
          <UnscheduledTaskList tasks={mockTasks} />
        </DndContext>
      )

      // Header should exist with aria-label
      const header = screen.getByRole('button', { name: /未安排日期.*2/ })
      expect(header).toBeInTheDocument()
    })

    it('should show empty state when no tasks', () => {
      render(
        <DndContext>
          <UnscheduledTaskList tasks={[]} />
        </DndContext>
      )

      // Should show (0) in aria-label
      const header = screen.getByRole('button', { name: /未安排日期.*0/ })
      expect(header).toBeInTheDocument()
    })

    it('should be collapsed by default', () => {
      render(
        <DndContext>
          <UnscheduledTaskList tasks={mockTasks} />
        </DndContext>
      )

      // Tasks should not be visible initially
      expect(screen.queryByText('Task Without Due Date')).not.toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('should expand when header is clicked', () => {
      render(
        <DndContext>
          <UnscheduledTaskList tasks={mockTasks} />
        </DndContext>
      )

      // Click the header to expand
      const header = screen.getByRole('button', { name: /未安排日期/ })
      fireEvent.click(header)

      // Tasks should now be visible
      expect(screen.getByText('Task Without Due Date')).toBeInTheDocument()
      expect(screen.getByText('Another Unscheduled Task')).toBeInTheDocument()
    })

    it('should collapse when header is clicked again', () => {
      render(
        <DndContext>
          <UnscheduledTaskList tasks={mockTasks} />
        </DndContext>
      )

      // Click to expand
      const header = screen.getByRole('button', { name: /未安排日期/ })
      fireEvent.click(header)
      expect(screen.getByText('Task Without Due Date')).toBeInTheDocument()

      // Click again to collapse
      fireEvent.click(header)
      expect(screen.queryByText('Task Without Due Date')).not.toBeInTheDocument()
    })

    it('should show empty state message when expanded with no tasks', () => {
      render(
        <DndContext>
          <UnscheduledTaskList tasks={[]} />
        </DndContext>
      )

      // Click to expand
      const header = screen.getByRole('button', { name: /未安排日期/ })
      fireEvent.click(header)

      // Should show empty state message
      expect(screen.getByText('暂无未安排日期的任务')).toBeInTheDocument()
    })
  })

  describe('drag support', () => {
    it('should support drag to calendar', () => {
      const { container } = render(
        <DndContext>
          <UnscheduledTaskList tasks={mockTasks} />
        </DndContext>
      )

      // Expand the list first
      const header = screen.getByRole('button', { name: /未安排日期/ })
      fireEvent.click(header)

      // Should have draggable items with useDraggable
      // The mock provides aria-roledescription
      const draggableItems = container.querySelectorAll('[aria-roledescription="draggable"]')
      expect(draggableItems.length).toBeGreaterThan(0)
    })

    it('should call onOpenDetail when task is clicked', () => {
      const onOpenDetail = vi.fn()
      render(
        <DndContext>
          <UnscheduledTaskList tasks={mockTasks} onOpenDetail={onOpenDetail} />
        </DndContext>
      )

      // Expand the list
      const header = screen.getByRole('button', { name: /未安排日期/ })
      fireEvent.click(header)

      // Click on a task item
      const taskItem = screen.getByText('Task Without Due Date')
      fireEvent.click(taskItem)

      expect(onOpenDetail).toHaveBeenCalledWith('task-1')
    })
  })
})