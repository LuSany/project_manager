import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { PriorityDonut } from '@/components/dashboard/PriorityDonut'

const mockFetch = vi.fn()
global.fetch = mockFetch

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

const mockPriorityData = [
  { name: 'LOW', value: 5 },
  { name: 'MEDIUM', value: 8 },
  { name: 'HIGH', value: 3 },
  { name: 'CRITICAL', value: 2 },
]

describe('PriorityDonut', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it('renders donut chart when priority data is provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { priorityDistribution: mockPriorityData },
      }),
    })

    render(<PriorityDonut />)

    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })

    const slices = screen.getAllByTestId('pie-slice')
    expect(slices).toHaveLength(4)
  })

  it('shows center label with total count of all tasks', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { priorityDistribution: mockPriorityData },
      }),
    })

    render(<PriorityDonut />)

    await waitFor(() => {
      const label = screen.getByTestId('center-label')
      expect(label).toHaveTextContent('18')
    })
  })

  it('uses PRIORITY_COLORS map for slice colors (value-based)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { priorityDistribution: mockPriorityData },
      }),
    })

    render(<PriorityDonut />)

    await waitFor(() => {
      const cells = screen.getAllByTestId('cell')
      expect(cells[0]).toHaveAttribute('data-fill', '#60a5fa')
      expect(cells[0]).toHaveAttribute('data-name', 'LOW')
      expect(cells[1]).toHaveAttribute('data-fill', '#f59e0b')
      expect(cells[1]).toHaveAttribute('data-name', 'MEDIUM')
      expect(cells[2]).toHaveAttribute('data-fill', '#f97316')
      expect(cells[2]).toHaveAttribute('data-name', 'HIGH')
      expect(cells[3]).toHaveAttribute('data-fill', '#ef4444')
      expect(cells[3]).toHaveAttribute('data-name', 'CRITICAL')
    })
  })

  it('shows empty state when API returns empty array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { priorityDistribution: [] },
      }),
    })

    render(<PriorityDonut />)

    await waitFor(() => {
      expect(screen.getByText('暂无数据')).toBeInTheDocument()
    })
  })

  it('shows loading state before data is fetched', async () => {
    let resolvePromise: (value: unknown) => void
    mockFetch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve
      })
    )

    const { container } = render(<PriorityDonut />)

    expect(screen.queryAllByTestId('pie-slice')).toHaveLength(0)

    resolvePromise!({
      ok: true,
      json: async () => ({ success: true, data: { priorityDistribution: [] } }),
    })
  })

  it('shows percentage in legend for each priority', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { priorityDistribution: mockPriorityData },
      }),
    })

    render(<PriorityDonut />)

    await waitFor(() => {
      // Total: 5 + 8 + 3 + 2 = 18
      // LOW: (5/18) * 100 = 27.8%
      // MEDIUM: (8/18) * 100 = 44.4%
      // HIGH: (3/18) * 100 = 16.7%
      // CRITICAL: (2/18) * 100 = 11.1%
      expect(screen.getByText('低')).toBeInTheDocument()
      expect(screen.getByText('(27.8%)')).toBeInTheDocument()
      expect(screen.getByText('中')).toBeInTheDocument()
      expect(screen.getByText('(44.4%)')).toBeInTheDocument()
      expect(screen.getByText('高')).toBeInTheDocument()
      expect(screen.getByText('(16.7%)')).toBeInTheDocument()
      expect(screen.getByText('紧急')).toBeInTheDocument()
      expect(screen.getByText('(11.1%)')).toBeInTheDocument()
    })
  })

  it('shows 0.0% percentage when total is zero', async () => {
    const zeroData = [
      { name: 'LOW', value: 0 },
      { name: 'MEDIUM', value: 0 },
      { name: 'HIGH', value: 0 },
      { name: 'CRITICAL', value: 0 },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { priorityDistribution: zeroData },
      }),
    })

    render(<PriorityDonut />)

    await waitFor(() => {
      // All items should show 0.0% when total is zero
      const percentages = screen.getAllByText('(0.0%)')
      expect(percentages.length).toBeGreaterThanOrEqual(1)
    })
  })
})
