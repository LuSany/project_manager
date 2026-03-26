/**
 * TagsTab 组件测试
 * 测试任务标签标签页渲染和交互
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock tags data
const mockTags = [
  { id: 'tag-1', name: '前端', color: 'bg-blue-100 text-blue-800' },
  { id: 'tag-2', name: '后端', color: 'bg-green-100 text-green-800' },
]

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
import { TagsTab } from '../TagsTab'

describe('TagsTab', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('标签列表渲染', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockTags }),
    })

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <TagsTab taskId="task-1" />
      </QueryClientProvider>
    )

    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText('前端')).toBeInTheDocument()
    })

    // 验证两个标签都显示
    expect(screen.getByText('后端')).toBeInTheDocument()
  })

  it('添加标签', async () => {
    // First call returns empty tags
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      })
      // Second call is the POST to create tag
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'tag-3', name: '新标签', color: 'bg-purple-100 text-purple-800' },
        }),
      })

    const queryClient = createTestQueryClient()
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <TagsTab taskId="task-1" />
      </QueryClientProvider>
    )

    // 等待空状态
    await waitFor(() => {
      expect(screen.getByText('暂无标签')).toBeInTheDocument()
    })

    // 输入标签名
    const input = container.querySelector('input[placeholder="添加新标签..."]') as HTMLInputElement
    expect(input).toBeInTheDocument()
    fireEvent.change(input, { target: { value: '新标签' } })
    expect(input.value).toBe('新标签')
  })

  it('删除标签', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockTags }),
    })

    // Mock delete tag API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <TagsTab taskId="task-1" />
      </QueryClientProvider>
    )

    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText('前端')).toBeInTheDocument()
    })

    // 点击删除按钮 (X 按钮)
    const deleteButtons = screen.getAllByRole('button', { name: '' })
    // 找到标签内的 X 按钮
    const xButtons = deleteButtons.filter((btn) => btn.querySelector('svg.lucide-x') || btn.closest('button')?.querySelector('svg.lucide-x'))
    if (xButtons.length > 0) {
      fireEvent.click(xButtons[0])
    }

    // 验证删除 API 被调用
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/tasks/task-1/tags/'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  it('空状态', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    })

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <TagsTab taskId="task-1" />
      </QueryClientProvider>
    )

    // 等待空状态显示
    await waitFor(() => {
      expect(screen.getByText('暂无标签')).toBeInTheDocument()
    })

    expect(screen.getByText('添加标签以便分类管理')).toBeInTheDocument()
  })
})