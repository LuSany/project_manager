/**
 * CommentsTab 组件测试
 * 测试任务评论标签页渲染和交互
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock comments data
const mockComments = [
  {
    id: 'comment-1',
    content: '这是第一条评论',
    userId: 'user-1',
    user: { id: 'user-1', name: '用户A', email: 'a@example.com' },
    createdAt: '2024-01-01T10:00:00.000Z',
  },
  {
    id: 'comment-2',
    content: '这是第二条评论',
    userId: 'user-2',
    user: { id: 'user-2', name: '用户B', email: 'b@example.com' },
    createdAt: '2024-01-01T11:00:00.000Z',
  },
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
import { CommentsTab } from '../CommentsTab'

describe('CommentsTab', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('评论列表渲染', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockComments }),
    })

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <CommentsTab taskId="task-1" />
      </QueryClientProvider>
    )

    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText('这是第一条评论')).toBeInTheDocument()
    })

    // 验证两条评论都显示
    expect(screen.getByText('这是第二条评论')).toBeInTheDocument()
    expect(screen.getByText('用户A')).toBeInTheDocument()
    expect(screen.getByText('用户B')).toBeInTheDocument()
  })

  it('添加评论', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    })

    // Mock create comment API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          id: 'comment-3',
          content: '新评论内容',
          userId: 'user-1',
          user: { id: 'user-1', name: '当前用户', email: 'c@example.com' },
          createdAt: new Date().toISOString(),
        },
      }),
    })

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <CommentsTab taskId="task-1" />
      </QueryClientProvider>
    )

    // 等待空状态
    await waitFor(() => {
      expect(screen.getByText('暂无评论')).toBeInTheDocument()
    })

    // 输入评论
    const inputs = screen.getAllByPlaceholderText('添加评论...')
    fireEvent.change(inputs[0], { target: { value: '新评论内容' } })

    // 点击发送按钮 (查找带有 Send 图标的按钮)
    const buttons = screen.getAllByRole('button')
    const sendButton = buttons.find((btn) => btn.querySelector('svg.lucide-send') || btn.closest('button')?.querySelector('svg'))
    fireEvent.click(sendButton!)

    // 验证 API 被调用
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/tasks/task-1/comments',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('新评论内容'),
        })
      )
    })
  })

  it('时间排序', async () => {
    // 按时间倒序返回
    const commentsInOrder = [...mockComments].reverse()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: commentsInOrder }),
    })

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <CommentsTab taskId="task-1" />
      </QueryClientProvider>
    )

    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText('这是第一条评论')).toBeInTheDocument()
    })

    // 评论列表中的元素顺序
    const comments = screen.getAllByText(/这是第.*条评论/)
    // 验证倒序显示（最新的在前）
    expect(comments[0]).toHaveTextContent('这是第二条评论')
    expect(comments[1]).toHaveTextContent('这是第一条评论')
  })

  it('空状态', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    })

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <CommentsTab taskId="task-1" />
      </QueryClientProvider>
    )

    // 等待空状态显示
    await waitFor(() => {
      expect(screen.getByText('暂无评论')).toBeInTheDocument()
    })

    expect(screen.getByText('成为第一个评论者')).toBeInTheDocument()
  })
})