/**
 * TaskListFilters 组件测试
 * 测试任务列表筛选栏组件
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock useTaskViewStore - 直接模拟返回值
vi.mock('@/stores/taskViewStore', () => ({
  useTaskViewStore: vi.fn((selector) => {
    const state = {
      viewMode: 'list' as const,
      groupBy: null as string | null,
      filters: [] as Array<{ field: string; operator: string; value: string }>,
      sorting: [{ id: 'priority', desc: true }, { id: 'dueDate', desc: false }],
      setViewMode: vi.fn(),
      setGroupBy: vi.fn(),
      addFilter: vi.fn(),
      removeFilter: vi.fn(),
      clearFilters: vi.fn(),
      setSorting: vi.fn(),
    }
    return selector ? selector(state) : state
  }),
}))

describe('TaskListFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('组件导出测试', () => {
    it('TaskListFilters 导出可用', async () => {
      const { TaskListFilters } = await import('../TaskListFilters')
      expect(TaskListFilters).toBeDefined()
      expect(typeof TaskListFilters).toBe('function')
    })
  })

  describe('筛选栏渲染', () => {
    it('渲染分组选择下拉', async () => {
      const { TaskListFilters } = await import('../TaskListFilters')
      render(React.createElement(TaskListFilters))
      // 检查分组选项存在
      expect(screen.getByText('分组:')).toBeInTheDocument()
    })

    it('渲染状态筛选下拉', async () => {
      const { TaskListFilters } = await import('../TaskListFilters')
      render(React.createElement(TaskListFilters))
      // 检查状态筛选选项存在
      const comboboxes = screen.getAllByRole('combobox')
      expect(comboboxes.length).toBeGreaterThanOrEqual(2)
    })

    it('渲染优先级筛选下拉', async () => {
      const { TaskListFilters } = await import('../TaskListFilters')
      render(React.createElement(TaskListFilters))
      // 检查优先级筛选选项存在
      const comboboxes = screen.getAllByRole('combobox')
      expect(comboboxes.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('筛选功能', () => {
    it('使用 useTaskViewStore 获取状态', async () => {
      const { TaskListFilters } = await import('../TaskListFilters')
      const { useTaskViewStore } = await import('@/stores/taskViewStore')
      
      render(React.createElement(TaskListFilters))
      
      // 验证 store 被调用
      expect(useTaskViewStore).toHaveBeenCalled()
    })
  })
})
