import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { TaskStatusDonut } from '@/components/dashboard/TaskStatusDonut'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock Recharts components to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({
    data,
    children,
    innerRadius,
    outerRadius,
    paddingAngle,
  }: {
    data: Array<{ name: string; value: number }>
    children: React.ReactNode
    innerRadius?: number
    outerRadius?: number
    paddingAngle?: number
  }) => (
    <div
      data-testid="pie"
      data-inner-radius={innerRadius}
      data-outer-radius={outerRadius}
      data-padding-angle={paddingAngle}
    >
      {data?.map((entry: { name: string; value: number }) => (
        <span
          key={entry.name}
          data-testid="pie-slice"
          data-name={entry.name}
          data-value={entry.value}
        />
      ))}
      {children}
    </div>
  ),
  Cell: ({ fill, name }: { fill: string; name?: string }) => (
    <span data-testid="cell" data-fill={fill} data-name={name} />
  ),
  Tooltip: ({ contentStyle }: { contentStyle?: Record<string, string> }) => (
    <div data-testid="tooltip" />
  ),
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Label: ({ value }: { value: number | string }) => <span data-testid="center-label">{value}</span>,
}))

const mockStatusData = [
  { name: 'TODO', value: 10 },
  { name: 'IN_PROGRESS', value: 5 },
  { name: 'DONE', value: 8 },
]

describe('TaskStatusDonut', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it('renders donut chart when data is provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { taskStatusDistribution: mockStatusData },
      }),
    })

    render(<TaskStatusDonut />)

    // Wait for fetch to complete and data to render
    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })

    // Verify slices rendered
    const slices = screen.getAllByTestId('pie-slice')
    expect(slices).toHaveLength(3)
  })

  it('shows center label with total count of all tasks', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { taskStatusDistribution: mockStatusData },
      }),
    })

    render(<TaskStatusDonut />)

    await waitFor(() => {
      const label = screen.getByTestId('center-label')
      // Total: 10 + 5 + 8 = 23
      expect(label).toHaveTextContent('23')
    })
  })

  it('uses TASK_STATUS_COLORS map for slice colors (value-based, NOT index-based)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { taskStatusDistribution: mockStatusData },
      }),
    })

    render(<TaskStatusDonut />)

    await waitFor(() => {
      const cells = screen.getAllByTestId('cell')
      // Verify colors come from TASK_STATUS_COLORS, not from index
      // TODO -> #94a3b8, IN_PROGRESS -> #3b82f6, DONE -> #22c55e
      expect(cells[0]).toHaveAttribute('data-fill', '#94a3b8')
      expect(cells[0]).toHaveAttribute('data-name', 'TODO')
      expect(cells[1]).toHaveAttribute('data-fill', '#3b82f6')
      expect(cells[1]).toHaveAttribute('data-name', 'IN_PROGRESS')
      expect(cells[2]).toHaveAttribute('data-fill', '#22c55e')
      expect(cells[2]).toHaveAttribute('data-name', 'DONE')
    })
  })

  it('shows empty state when API returns empty array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { taskStatusDistribution: [] },
      }),
    })

    render(<TaskStatusDonut />)

    await waitFor(() => {
      expect(screen.getByText('暂无任务数据')).toBeInTheDocument()
    })
  })

  it('shows loading state before data is fetched', async () => {
    let resolvePromise: (value: unknown) => void
    mockFetch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve
      })
    )

    const { container } = render(<TaskStatusDonut />)

    // ChartCard shows Skeleton during loading — no pie slices should be visible
    expect(screen.queryAllByTestId('pie-slice')).toHaveLength(0)

    resolvePromise!({
      ok: true,
      json: async () => ({ success: true, data: { taskStatusDistribution: [] } }),
    })
  })

  it('fetches from /api/v1/dashboard/stats with credentials', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { taskStatusDistribution: mockStatusData },
      }),
    })

    render(<TaskStatusDonut />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/dashboard/stats',
        expect.objectContaining({
          credentials: 'include',
        })
      )
    })
  })
})
