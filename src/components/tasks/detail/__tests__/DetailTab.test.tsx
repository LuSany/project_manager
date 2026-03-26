/**
 * DetailTab 组件测试
 * 测试任务详情标签页渲染和交互
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
  description: '这是一个测试任务描述',
  status: 'TODO',
  progress: 50,
  priority: 'HIGH',
  startDate: '2024-01-01T00:00:00.000Z',
  dueDate: '2024-12-31T00:00:00.000Z',
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
import { DetailTab } from '../DetailTab'

describe('DetailTab', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('标题渲染', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockTask }),
    })

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <DetailTab taskId="task-1" />
      </QueryClientProvider>
    )

    // 等待数据加载 - 检查创建时间作为加载完成的标志
    await waitFor(() => {
      const createTimeElements = screen.getAllByText(/创建时间/)
      expect(createTimeElements.length).toBeGreaterThan(0)
    })

    // 验证任务标题存在
    const titleElements = screen.getAllByText('测试任务标题')
    expect(titleElements.length).toBeGreaterThan(0)
  })

  it('标题编辑', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockTask }),
    })

    // Mock update API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { ...mockTask, title: '新标题' } }),
    })

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <DetailTab taskId="task-1" />
      </QueryClientProvider>
    )

    // 等待数据加载
    await waitFor(() => {
      expect(screen.getAllByText(/创建时间/)[0]).toBeInTheDocument()
    })

    // 点击标题进入编辑模式
    const titleDisplay = screen.getAllByText('测试任务标题').find((el) => el.closest('div.cursor-pointer'))
    expect(titleDisplay).toBeInTheDocument()
    fireEvent.click(titleDisplay!.closest('div')!)

    // 验证输入框出现
    const inputs = screen.getAllByRole('textbox')
    const titleInput = inputs.find((input) => input.getAttribute('value') === '测试任务标题')
    expect(titleInput).toBeInTheDocument()

    // 修改标题
    fireEvent.change(titleInput!, { target: { value: '新标题' } })
    fireEvent.keyDown(titleInput!, { key: 'Enter' })

    // 验证 API 被调用
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/tasks/task-1',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('新标题'),
        })
      )
    })
  })

  it('状态选择', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockTask }),
    })

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <DetailTab taskId="task-1" />
      </QueryClientProvider>
    )

    // 等待数据加载
    await waitFor(() => {
      expect(screen.getAllByText(/创建时间/)[0]).toBeInTheDocument()
    })

    // 验证状态标签存在
    const statusLabels = screen.getAllByText('状态')
    expect(statusLabels.length).toBeGreaterThan(0)
    // 验证状态值存在
    const statusElements = screen.getAllByText('TODO')
    expect(statusElements.length).toBeGreaterThan(0)
  })

  it('截止日期选择', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockTask }),
    })

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <DetailTab taskId="task-1" />
      </QueryClientProvider>
    )

    // 等待数据加载
    await waitFor(() => {
      expect(screen.getAllByText(/创建时间/)[0]).toBeInTheDocument()
    })

    // 验证截止日期标签存在
    const dueDateLabels = screen.getAllByText('截止日期')
    expect(dueDateLabels.length).toBeGreaterThan(0)
  })
})