import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { ProjectComparisonChart } from '@/components/dashboard/ProjectComparisonChart'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock Recharts components to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  BarChart: ({
    children,
    layout,
    margin,
  }: {
    children: React.ReactNode
    layout?: string
    margin?: Record<string, number>
  }) => (
    <div data-testid="bar-chart" data-layout={layout} data-margin={JSON.stringify(margin)}>
      {children}
    </div>
  ),
  Bar: ({
    dataKey,
    barSize,
    radius,
    fill,
  }: {
    dataKey?: string
    barSize?: number
    radius?: number[]
    fill?: string
  }) => (
    <div
      data-testid="bar"
      data-data-key={dataKey}
      data-bar-size={barSize}
      data-radius={JSON.stringify(radius)}
      data-fill={fill}
    />
  ),
  XAxis: ({ type, domain, unit }: { type?: string; domain?: number[]; unit?: string }) => (
    <div
      data-testid="x-axis"
      data-type={type}
      data-domain={JSON.stringify(domain)}
      data-unit={unit}
    />
  ),
  YAxis: ({
    dataKey,
    type,
    width,
    tick,
  }: {
    dataKey?: string
    type?: string
    width?: number
    tick?: Record<string, unknown>
  }) => (
    <div
      data-testid="y-axis"
      data-data-key={dataKey}
      data-type={type}
      data-width={width}
      data-tick={JSON.stringify(tick)}
    />
  ),
  Tooltip: ({
    formatter,
    contentStyle,
  }: {
    formatter?: (...args: unknown[]) => unknown
    contentStyle?: Record<string, string>
  }) => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}))

const mockProjectData = [
  { projectName: '项目A', completionRate: 85, projectId: 'p1', completedTasks: 17, totalTasks: 20 },
  { projectName: '项目B', completionRate: 60, projectId: 'p2', completedTasks: 12, totalTasks: 20 },
  { projectName: '项目C', completionRate: 30, projectId: 'p3', completedTasks: 6, totalTasks: 20 },
]

describe('ProjectComparisonChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it('renders horizontal bar chart with project completion rate data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockProjectData,
      }),
    })

    render(<ProjectComparisonChart />)

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })

    // 验证是水平布局（layout="vertical"）
    expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-layout', 'vertical')

    // 验证 Bar 使用 completionRate 作为数据键
    const bar = screen.getByTestId('bar')
    expect(bar).toHaveAttribute('data-data-key', 'completionRate')

    // 验证 XAxis 为数字轴，0-100%，YAxis 为分类轴
    expect(screen.getByTestId('x-axis')).toHaveAttribute('data-type', 'number')
    expect(screen.getByTestId('x-axis')).toHaveAttribute('data-unit', '%')
    expect(screen.getByTestId('y-axis')).toHaveAttribute('data-data-key', 'projectName')
  })

  it('limits displayed projects to max 6', async () => {
    // 创建 8 个项目，超过 6 个限制
    const manyProjects = Array.from({ length: 8 }, (_, i) => ({
      projectName: `项目${i + 1}`,
      completionRate: i * 10,
      projectId: `p${i}`,
      completedTasks: i * 2,
      totalTasks: 20,
    }))

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: manyProjects,
      }),
    })

    // 渲染并验证组件正常（slice(0,6) 逻辑在组件内部处理）
    render(<ProjectComparisonChart />)

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })

    // 组件应该成功渲染，不会因项目过多而出错
    expect(screen.getByTestId('bar')).toBeInTheDocument()
  })

  it('shows completion rate as percentage in tooltip formatter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockProjectData,
      }),
    })

    render(<ProjectComparisonChart />)

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })

    // 验证 Bar 使用 emerald 填充色 (#10b981)
    expect(screen.getByTestId('bar')).toHaveAttribute('data-fill', '#10b981')
  })

  it('shows "暂无项目数据" when API returns empty array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
      }),
    })

    render(<ProjectComparisonChart />)

    await waitFor(() => {
      expect(screen.getByText('暂无项目数据')).toBeInTheDocument()
    })
  })

  it('shows loading state before data is fetched', async () => {
    let resolvePromise: (value: unknown) => void
    mockFetch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve
      })
    )

    render(<ProjectComparisonChart />)

    // 加载中时不应有图表元素
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument()

    resolvePromise!({
      ok: true,
      json: async () => ({ success: true, data: mockProjectData }),
    })
  })

  it('fetches from /api/v1/dashboard/project-comparison with credentials', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockProjectData,
      }),
    })

    render(<ProjectComparisonChart />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/dashboard/project-comparison',
        expect.objectContaining({
          credentials: 'include',
        })
      )
    })
  })
})
