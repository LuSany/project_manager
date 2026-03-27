/**
 * Tasks Page Tests - Calendar View Integration
 * Tests for three-view toggle and calendar view rendering
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock the taskViewStore
const mockViewMode = { value: 'list' }
const mockSetViewMode = vi.fn((mode: string) => {
  mockViewMode.value = mode
})

vi.mock('@/stores/taskViewStore', () => ({
  useTaskViewStore: vi.fn((selector: (state: { viewMode: string; setViewMode: typeof mockSetViewMode }) => unknown) => {
    return selector({ viewMode: mockViewMode.value, setViewMode: mockSetViewMode })
  }),
}))

// Mock child components to simplify testing
vi.mock('@/components/tasks/TaskKanban', () => ({
  TaskKanban: () => <div data-testid="task-kanban">Kanban View</div>,
}))

vi.mock('@/components/tasks/list/TaskList', () => ({
  TaskList: () => <div data-testid="task-list">List View</div>,
}))

vi.mock('@/components/tasks/list/TaskListFilters', () => ({
  TaskListFilters: () => <div data-testid="task-list-filters">Filters</div>,
}))

vi.mock('@/components/tasks/detail/TaskDetailDrawer', () => ({
  TaskDetailDrawer: () => <div data-testid="task-detail-drawer">Detail Drawer</div>,
}))

vi.mock('@/components/tasks/calendar', () => ({
  TaskCalendar: () => <div data-testid="task-calendar">Calendar View</div>,
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock Link component
vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        success: true,
        data: {
          items: [],
          totalPages: 1,
        },
      }),
  })
) as unknown as typeof fetch

// Helper to create wrapper with providers
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('TasksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockViewMode.value = 'list'
    cleanup()
  })

  describe('View Toggle', () => {
    it('should render three view toggle buttons', async () => {
      // Dynamic import to apply mocks
      const { default: TasksPage } = await import('../page')

      const params = Promise.resolve({ id: 'project-1' })
      renderWithProviders(<TasksPage params={params} />)

      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByText('列表视图')).toBeInTheDocument()
      })

      expect(screen.getByText('看板视图')).toBeInTheDocument()
      expect(screen.getByText('日历视图')).toBeInTheDocument()
    })

    it('should show list view by default', async () => {
      const { default: TasksPage } = await import('../page')

      const params = Promise.resolve({ id: 'project-1' })
      renderWithProviders(<TasksPage params={params} />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('task-list')).toBeInTheDocument()
      })
    })

    it('should show calendar view when viewMode is calendar', async () => {
      mockViewMode.value = 'calendar'
      const { default: TasksPage } = await import('../page')

      const params = Promise.resolve({ id: 'project-1' })
      renderWithProviders(<TasksPage params={params} />)

      // Calendar should be rendered when viewMode is calendar
      await waitFor(() => {
        expect(screen.getByTestId('task-calendar')).toBeInTheDocument()
      })
    })

    it('should call setViewMode when clicking calendar button', async () => {
      const { default: TasksPage } = await import('../page')

      const params = Promise.resolve({ id: 'project-1' })
      renderWithProviders(<TasksPage params={params} />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('日历视图')).toBeInTheDocument()
      })

      // Click calendar view button
      const calendarButton = screen.getByText('日历视图')
      fireEvent.click(calendarButton)

      // Verify setViewMode was called with 'calendar'
      expect(mockSetViewMode).toHaveBeenCalledWith('calendar')
    })
  })
})