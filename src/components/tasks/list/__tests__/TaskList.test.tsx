/**
 * TaskList 组件测试
 * 测试任务列表视图组件
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// 直接导入组件进行测试
import { taskListColumns } from '../TaskListColumns'

// Mock useTaskViewStore
vi.mock('@/stores/taskViewStore', () => ({
  useTaskViewStore: vi.fn((selector) => {
    const state = {
      viewMode: 'list',
      groupBy: null,
      filters: [],
      sorting: [{ id: 'priority', desc: true }, { id: 'dueDate', desc: false }],
      setSorting: vi.fn(),
    }
    return selector ? selector(state) : state
  }),
}))

describe('TaskListColumns', () => {
  describe('列定义测试', () => {
    it('TaskListColumns 包含 6 列定义', () => {
      expect(taskListColumns).toHaveLength(6)
    })

    it('TaskListColumns 包含任务名称列', () => {
      const titleColumn = taskListColumns.find((col) => col.id === 'title')
      expect(titleColumn).toBeDefined()
    })

    it('TaskListColumns 包含状态列', () => {
      const statusColumn = taskListColumns.find((col) => col.id === 'status')
      expect(statusColumn).toBeDefined()
    })

    it('TaskListColumns 包含优先级列', () => {
      const priorityColumn = taskListColumns.find((col) => col.id === 'priority')
      expect(priorityColumn).toBeDefined()
    })

    it('TaskListColumns 包含截止日期列', () => {
      const dueDateColumn = taskListColumns.find((col) => col.id === 'dueDate')
      expect(dueDateColumn).toBeDefined()
    })

    it('TaskListColumns 包含负责人列', () => {
      const assigneesColumn = taskListColumns.find((col) => col.id === 'assignees')
      expect(assigneesColumn).toBeDefined()
    })

    it('TaskListColumns 包含标签列', () => {
      const tagsColumn = taskListColumns.find((col) => col.id === 'tags')
      expect(tagsColumn).toBeDefined()
    })

    it('任务名称列可排序', () => {
      const titleColumn = taskListColumns.find((col) => col.id === 'title')
      expect(titleColumn?.enableSorting).toBe(true)
    })

    it('状态列可排序', () => {
      const statusColumn = taskListColumns.find((col) => col.id === 'status')
      expect(statusColumn?.enableSorting).toBe(true)
    })

    it('负责人列不可排序', () => {
      const assigneesColumn = taskListColumns.find((col) => col.id === 'assignees')
      expect(assigneesColumn?.enableSorting).toBe(false)
    })

    it('标签列不可排序', () => {
      const tagsColumn = taskListColumns.find((col) => col.id === 'tags')
      expect(tagsColumn?.enableSorting).toBe(false)
    })
  })
})

describe('TaskList', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  // 动态导入 TaskList 以确保 mock 生效
  it('TaskList 导出可用', async () => {
    const { TaskList } = await import('../TaskList')
    expect(TaskList).toBeDefined()
    expect(typeof TaskList).toBe('function')
  })
})
