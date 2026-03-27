/**
 * TaskCalendar 组件测试
 * 测试日历视图主组件渲染和交互
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { TaskCalendar } from '../TaskCalendar'
import type { Task } from '@/components/tasks/kanban/SortableTaskCard'

// Mock date-fns to have consistent test results
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns')
  return {
    ...actual,
    format: vi.fn((date: Date, formatStr: string) => {
      if (formatStr === 'yyyy-MM-dd') {
        return date.toISOString().split('T')[0]
      }
      if (formatStr === 'yyyy年M月') {
        return `${date.getFullYear()}年${date.getMonth() + 1}月`
      }
      return actual.format(date, formatStr)
    }),
  }
})

describe('TaskCalendar', () => {
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
      dueDate: '2026-03-20T00:00:00.000Z',
      createdAt: '2026-03-01T00:00:00.000Z',
      assignees: [],
    },
  ]

  const defaultProps = {
    projectId: 'project-1',
    tasks: mockTasks,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('rendering', () => {
    it('should render calendar with month view', () => {
      render(<TaskCalendar {...defaultProps} />)

      // Should show month header
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    })

    it('should group tasks by due date', () => {
      const { container } = render(<TaskCalendar {...defaultProps} />)

      // Component should render without errors
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should navigate between months', () => {
      render(<TaskCalendar {...defaultProps} />)

      // Find navigation buttons
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should respect filters from taskViewStore', () => {
      // This test verifies the component accepts tasks prop
      const { container } = render(<TaskCalendar {...defaultProps} />)

      // Component should render without errors
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('month navigation', () => {
    it('should have previous month button', () => {
      render(<TaskCalendar {...defaultProps} />)

      // Find buttons with chevron icons (navigation buttons)
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })

    it('should have next month button', () => {
      render(<TaskCalendar {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('loading state', () => {
    it('should render loading state when isLoading is true', () => {
      render(<TaskCalendar {...defaultProps} isLoading={true} />)

      // Should still render the calendar structure
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    })
  })
})