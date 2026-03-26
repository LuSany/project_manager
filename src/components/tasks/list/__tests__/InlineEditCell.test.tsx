/**
 * InlineEditCell 组件测试
 * 测试任务列表内联编辑单元格组件
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock react-day-picker
vi.mock('react-day-picker', () => ({
  DayPicker: ({ onDayClick }: { onDayClick: (date: Date) => void }) => (
    <div data-testid="day-picker">
      <button onClick={() => onDayClick(new Date('2024-01-15'))}>Select Date</button>
    </div>
  ),
}))

// Mock @/components/ui/popover
vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popover-content">{children}</div>
  ),
}))

// Mock @/components/ui/select
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: { children: React.ReactNode; value: string; onValueChange: (v: string) => void }) => (
    <div data-testid="select" data-value={value}>
      {children}
      <button onClick={() => onValueChange('IN_PROGRESS')}>Change Value</button>
    </div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-value={value}>{children}</div>
  ),
}))

describe('InlineEditCell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('组件导出测试', () => {
    it('StatusCell 导出可用', async () => {
      const { StatusCell } = await import('../InlineEditCell')
      expect(StatusCell).toBeDefined()
      expect(typeof StatusCell).toBe('function')
    })

    it('PriorityCell 导出可用', async () => {
      const { PriorityCell } = await import('../InlineEditCell')
      expect(PriorityCell).toBeDefined()
      expect(typeof PriorityCell).toBe('function')
    })

    it('DueDateCell 导出可用', async () => {
      const { DueDateCell } = await import('../InlineEditCell')
      expect(DueDateCell).toBeDefined()
      expect(typeof DueDateCell).toBe('function')
    })
  })

  describe('StatusCell 测试', () => {
    it('渲染状态徽章', async () => {
      const { StatusCell } = await import('../InlineEditCell')
      const onUpdate = vi.fn()
      render(React.createElement(StatusCell, { status: 'TODO', taskId: 'test-1', onUpdate }))
      // 应该显示状态相关的元素
      expect(screen.getAllByText('待办').length).toBeGreaterThan(0)
    })
  })

  describe('PriorityCell 测试', () => {
    it('渲染优先级徽章', async () => {
      const { PriorityCell } = await import('../InlineEditCell')
      const onUpdate = vi.fn()
      render(React.createElement(PriorityCell, { priority: 'HIGH', taskId: 'test-1', onUpdate }))
      // 应该显示优先级相关的元素（在 badge 和 select option 中都会出现）
      const highElements = screen.getAllByText('高')
      expect(highElements.length).toBeGreaterThan(0)
    })
  })

  describe('DueDateCell 测试', () => {
    it('渲染日期文本', async () => {
      const { DueDateCell } = await import('../InlineEditCell')
      const onUpdate = vi.fn()
      render(React.createElement(DueDateCell, { dueDate: '2024-01-15', taskId: 'test-1', onUpdate }))
      // 应该显示日期
      expect(screen.getByText(/2024/)).toBeInTheDocument()
    })

    it('无日期时显示占位符', async () => {
      const { DueDateCell } = await import('../InlineEditCell')
      const onUpdate = vi.fn()
      render(React.createElement(DueDateCell, { dueDate: null, taskId: 'test-1', onUpdate }))
      // 应该显示占位符
      expect(screen.getByText('-')).toBeInTheDocument()
    })
  })
})
