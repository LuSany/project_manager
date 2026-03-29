import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { MilestoneProgressList } from '@/components/dashboard/MilestoneProgressList'

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      initial,
      animate,
      transition,
      className,
      children,
    }: {
      initial?: Record<string, unknown>
      animate?: Record<string, unknown>
      transition?: Record<string, unknown>
      className?: string
      children?: React.ReactNode
    }) => (
      <div
        data-testid="motion-div"
        data-initial={JSON.stringify(initial)}
        data-animate={JSON.stringify(animate)}
        data-transition={JSON.stringify(transition)}
        className={className}
      >
        {children}
      </div>
    ),
  },
}))

vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, fmt: string) => {
    const m = date.getMonth() + 1
    const d = date.getDate()
    return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`
  }),
}))

const mockMilestoneData = [
  {
    milestoneId: 'ms1',
    title: '里程碑 Alpha',
    status: 'IN_PROGRESS',
    progress: 65,
    dueDate: '2026-04-15T00:00:00.000Z',
    projectName: '项目A',
  },
  {
    milestoneId: 'ms2',
    title: '里程碑 Beta',
    status: 'COMPLETED',
    progress: 100,
    dueDate: '2026-03-20T00:00:00.000Z',
    projectName: '项目B',
  },
  {
    milestoneId: 'ms3',
    title: '里程碑 Gamma',
    status: 'NOT_STARTED',
    progress: 0,
    dueDate: null,
    projectName: '项目C',
  },
]

describe('MilestoneProgressList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it('renders milestone items with progress bars and status colors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { milestones: mockMilestoneData },
      }),
    })

    render(<MilestoneProgressList />)

    await waitFor(() => {
      expect(screen.getByText('里程碑 Alpha')).toBeInTheDocument()
    })

    expect(screen.getByText('里程碑 Beta')).toBeInTheDocument()
    expect(screen.getByText('里程碑 Gamma')).toBeInTheDocument()

    expect(screen.getByText('项目A')).toBeInTheDocument()
    expect(screen.getByText('项目B')).toBeInTheDocument()
  })

  it('shows status color indicator dots per MILESTONE_DOT_COLORS', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { milestones: mockMilestoneData },
      }),
    })

    render(<MilestoneProgressList />)

    await waitFor(() => {
      const dots = screen.getAllByTestId('status-dot')
      expect(dots).toHaveLength(3)
      expect(dots[0]).toHaveAttribute('data-status', 'IN_PROGRESS')
      expect(dots[1]).toHaveAttribute('data-status', 'COMPLETED')
      expect(dots[2]).toHaveAttribute('data-status', 'NOT_STARTED')
    })
  })

  it('formats due date as MM/dd format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { milestones: mockMilestoneData },
      }),
    })

    render(<MilestoneProgressList />)

    await waitFor(() => {
      expect(screen.getByText('04/15')).toBeInTheDocument()
    })

    expect(screen.getByText('03/20')).toBeInTheDocument()
  })

  it('shows "暂无里程碑数据" when API returns empty array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { milestones: [] },
      }),
    })

    render(<MilestoneProgressList />)

    await waitFor(() => {
      expect(screen.getByText('暂无里程碑数据')).toBeInTheDocument()
    })
  })

  it('animates progress bar width from 0 to value', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { milestones: [mockMilestoneData[0]] },
      }),
    })

    render(<MilestoneProgressList />)

    await waitFor(() => {
      const motionDivs = screen.getAllByTestId('motion-div')
      expect(motionDivs).toHaveLength(1)
      const motionDiv = motionDivs[0]
      expect(motionDiv).toHaveAttribute('data-initial', JSON.stringify({ width: 0 }))
      expect(motionDiv).toHaveAttribute('data-animate', JSON.stringify({ width: '65%' }))
      expect(motionDiv).toHaveAttribute(
        'data-transition',
        JSON.stringify({ duration: 0.5, ease: 'easeOut' })
      )
    })
  })

  it('fetches from /api/v1/dashboard/progress with credentials', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { milestones: mockMilestoneData },
      }),
    })

    render(<MilestoneProgressList />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/dashboard/progress',
        expect.objectContaining({
          credentials: 'include',
        })
      )
    })
  })
})
