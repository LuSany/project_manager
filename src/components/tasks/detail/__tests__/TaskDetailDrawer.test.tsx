/**
 * TaskDetailDrawer 组件测试
 * 测试任务详情抽屉渲染和交互
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock task data
const mockTask = {
  id: 'task-1',
  title: '测试任务标题',
  description: '这是一个测试任务',
  status: 'TODO',
  progress: 0,
  priority: 'MEDIUM',
  startDate: null,
  dueDate: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  assignees: [],
}

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

// Import after mocks are set up
import { TaskDetailDrawer } from '../TaskDetailDrawer'

describe('TaskDetailDrawer', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('Tab 按钮渲染', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockTask }),
    })

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDetailDrawer taskId="task-1" open={true} onOpenChange={() => {}} />
      </QueryClientProvider>
    )

    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText('详情')).toBeInTheDocument()
    })

    // 检查四个 Tab 按钮都存在
    expect(screen.getByText('详情')).toBeInTheDocument()
    expect(screen.getByText('子任务')).toBeInTheDocument()
    expect(screen.getByText('评论')).toBeInTheDocument()
    expect(screen.getByText('标签')).toBeInTheDocument()
  })

  it('open 状态', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockTask }),
    })

    const queryClient = createTestQueryClient()

    // open=true 时渲染
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDetailDrawer taskId="task-1" open={true} onOpenChange={() => {}} />
      </QueryClientProvider>
    )

    // 等待内容显示
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '测试任务标题' })).toBeInTheDocument()
    })

    // 验证 Tab 按钮可见（使用 getAllByText 因为可能有多个实例）
    const detailTabs = screen.getAllByText('详情')
    expect(detailTabs.length).toBeGreaterThan(0)
  })

  it('Tab 切换', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockTask }),
    })

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDetailDrawer taskId="task-1" open={true} onOpenChange={() => {}} />
      </QueryClientProvider>
    )

    // 等待初始渲染 - 使用 heading 查询
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '测试任务标题' })).toBeInTheDocument()
    })

    // 点击子任务 Tab
    fireEvent.click(screen.getByRole('button', { name: /子任务/ }))

    // 验证 Tab 切换（子任务 Tab 应该被激活）
    await waitFor(() => {
      const subtasksTab = screen.getByRole('button', { name: /子任务/ })
      expect(subtasksTab).toHaveClass('bg-background')
    })
  })

  it('数据获取', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockTask }),
    })

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDetailDrawer taskId="task-1" open={true} onOpenChange={() => {}} />
      </QueryClientProvider>
    )

    // 验证 API 调用
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/tasks/task-1')

    // 等待数据显示
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '测试任务标题' })).toBeInTheDocument()
    })
  })

  it('ESC 关闭', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockTask }),
    })

    const onOpenChange = vi.fn()
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDetailDrawer taskId="task-1" open={true} onOpenChange={onOpenChange} />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '测试任务标题' })).toBeInTheDocument()
    })

    // 按 ESC 键
    fireEvent.keyDown(document, { key: 'Escape' })

    // 验证 onOpenChange 被调用
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })
})