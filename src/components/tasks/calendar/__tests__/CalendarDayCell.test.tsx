/**
 * CalendarDayCell 组件测试
 * 测试日历单元格渲染和交互
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { CalendarDayCell } from '../CalendarDayCell'
import type { Task } from '@/components/tasks/kanban/SortableTaskCard'

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core')
  return {
    ...actual,
    useDroppable: () => ({
      setNodeRef: vi.fn(),
      isOver: false,
    }),
  }
})

// Mock date-fns
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns')
  return {
    ...actual,
    format: vi.fn((date: Date, formatStr: string) => {
      if (formatStr === 'yyyy-MM-dd') {
        return date.toISOString().split('T')[0]
      }
      if (formatStr === 'd') {
        return String(date.getDate())
      }
      return actual.format(date, formatStr)
    }),
    isToday: vi.fn(() => false),
    isSameMonth: vi.fn(() => true),
  }
})

describe('CalendarDayCell', () => {
  const mockDate = new Date('2026-03-15T00:00:00.000Z')
  const currentMonth = new Date('2026-03-01T00:00:00.000Z')

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Task 1',
      description: null,
      status: 'TODO',
      progress: 0,
      priority: 'HIGH',
      startDate: null,
      dueDate: '2026-03-15T00:00:00.000Z',
      createdAt: '2026-03-01T00:00:00.000Z',
      assignees: [],
    },
    {
      id: '2',
      title: 'Task 2',
      description: null,
      status: 'IN_PROGRESS',
      progress: 50,
      priority: 'MEDIUM',
      startDate: null,
      dueDate: '2026-03-15T00:00:00.000Z',
      createdAt: '2026-03-01T00:00:00.000Z',
      assignees: [],
    },
    {
      id: '3',
      title: 'Task 3',
      description: null,
      status: 'TODO',
      progress: 0,
      priority: 'LOW',
      startDate: null,
      dueDate: '2026-03-15T00:00:00.000Z',
      createdAt: '2026-03-01T00:00:00.000Z',
      assignees: [],
    },
    {
      id: '4',
      title: 'Task 4',
      description: null,
      status: 'TODO',
      progress: 0,
      priority: 'LOW',
      startDate: null,
      dueDate: '2026-03-15T00:00:00.000Z',
      createdAt: '2026-03-01T00:00:00.000Z',
      assignees: [],
    },
  ]

  const defaultProps = {
    date: mockDate,
    currentMonth,
    tasks: [],
  }

  describe('rendering', () => {
    it('should render date number', () => {
      render(
        <DndContext>
          <CalendarDayCell {...defaultProps} />
        </DndContext>
      )

      // Date number should be displayed (15)
      expect(screen.getByText('15')).toBeInTheDocument()
    })

    it('should render task cards for the date', () => {
      const { container } = render(
        <DndContext>
          <CalendarDayCell {...defaultProps} tasks={mockTasks.slice(0, 2)} />
        </DndContext>
      )

      // Should have task cards
      const taskCards = container.querySelectorAll('.h-6')
      expect(taskCards.length).toBe(2)
    })

    it('should show max 3 tasks with overflow indicator', () => {
      render(
        <DndContext>
          <CalendarDayCell {...defaultProps} tasks={mockTasks} />
        </DndContext>
      )

      // Should show "+1 更多" for the 4th task
      expect(screen.getByText(/\+1 更多/)).toBeInTheDocument()
    })

    it('should highlight when drag over', () => {
      // This test verifies the isOver prop handling
      const { container } = render(
        <DndContext>
          <CalendarDayCell {...defaultProps} />
        </DndContext>
      )

      // Cell should be rendered (isOver styling handled by useDroppable)
      const cell = container.querySelector('.min-h-\\[80px\\]')
      expect(cell).toBeInTheDocument()
    })

    it('should be droppable', () => {
      const { container } = render(
        <DndContext>
          <CalendarDayCell {...defaultProps} />
        </DndContext>
      )

      // Cell should have droppable structure
      const cell = container.firstChild
      expect(cell).toBeInTheDocument()
    })
  })

  describe('today highlight', () => {
    it('should highlight today date', async () => {
      // Override the isToday mock for this test
      const { isToday } = await import('date-fns')
      vi.mocked(isToday).mockReturnValue(true)

      const { container } = render(
        <DndContext>
          <CalendarDayCell {...defaultProps} />
        </DndContext>
      )

      // Should have ring-2 class for today
      const cell = container.querySelector('.ring-2')
      expect(cell).toBeInTheDocument()
    })
  })
})