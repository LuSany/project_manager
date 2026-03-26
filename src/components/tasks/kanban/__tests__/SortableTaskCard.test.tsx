/**
 * SortableTaskCard 组件测试
 * 测试可排序任务卡片渲染和交互
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { SortableTaskCard } from '../SortableTaskCard'

// Mock 任务数据
const mockTask = {
  id: 'task-1',
  title: '测试任务标题',
  description: '任务描述',
  status: 'TODO',
  progress: 50,
  priority: 'HIGH',
  startDate: null,
  dueDate: '2026-04-01',
  createdAt: '2026-03-01',
  assignees: [
    { user: { id: 'user-1', name: '张三', email: 'zhang@example.com' } },
    { user: { id: 'user-2', name: '李四', email: 'li@example.com' } },
  ],
}

const mockOnUpdate = vi.fn()
const mockOnOpenDetail = vi.fn()

describe('SortableTaskCard', () => {
  beforeEach(() => {
    mockOnUpdate.mockClear()
    mockOnOpenDetail.mockClear()
  })

  it('渲染任务标题', () => {
    render(
      <DndContext>
        <SortableTaskCard
          task={mockTask}
          isDragging={false}
          onUpdate={mockOnUpdate}
          onOpenDetail={mockOnOpenDetail}
        />
      </DndContext>
    )

    expect(screen.getByText('测试任务标题')).toBeInTheDocument()
  })

  it('显示优先级徽章', async () => {
    render(
      <DndContext>
        <SortableTaskCard
          task={mockTask}
          isDragging={false}
          onUpdate={mockOnUpdate}
          onOpenDetail={mockOnOpenDetail}
        />
      </DndContext>
    )

    // 查找高优先级徽章
    const badges = screen.getAllByRole('button', { name: /高/i })
    expect(badges.length).toBeGreaterThan(0)
  })

  it('点击优先级徽章触发内联编辑', async () => {
    render(
      <DndContext>
        <SortableTaskCard
          task={mockTask}
          isDragging={false}
          onUpdate={mockOnUpdate}
          onOpenDetail={mockOnOpenDetail}
        />
      </DndContext>
    )

    // 点击优先级徽章
    const badges = screen.getAllByRole('button', { name: /高/i })
    fireEvent.click(badges[0])

    // 应该显示优先级选项（低、中、高、紧急）
    const options = screen.getAllByRole('option')
    expect(options.length).toBe(4)
  })

  it('isDragging=true 时应用拖拽样式', () => {
    const { container } = render(
      <DndContext>
        <SortableTaskCard
          task={mockTask}
          isDragging={true}
          onUpdate={mockOnUpdate}
          onOpenDetail={mockOnOpenDetail}
        />
      </DndContext>
    )

    // 查找卡片元素
    const card = container.querySelector('[class*="cursor-grab"]')
    expect(card).toHaveClass('scale-95', 'rotate-2', 'opacity-50', 'shadow-xl')
  })

  it('isDragging=false 时应用正常样式', () => {
    const { container } = render(
      <DndContext>
        <SortableTaskCard
          task={mockTask}
          isDragging={false}
          onUpdate={mockOnUpdate}
          onOpenDetail={mockOnOpenDetail}
        />
      </DndContext>
    )

    const card = container.querySelector('[class*="cursor-grab"]')
    expect(card).not.toHaveClass('scale-95', 'rotate-2', 'opacity-50', 'shadow-xl')
    expect(card).toHaveClass('cursor-grab')
  })

  it('显示截止日期', () => {
    render(
      <DndContext>
        <SortableTaskCard
          task={mockTask}
          isDragging={false}
          onUpdate={mockOnUpdate}
          onOpenDetail={mockOnOpenDetail}
        />
      </DndContext>
    )

    // 显示截止日期 - 使用 getAllByText 因为可能有多个匹配
    const dateElements = screen.getAllByText(/2026/)
    expect(dateElements.length).toBeGreaterThan(0)
  })

  it('显示负责人头像', () => {
    render(
      <DndContext>
        <SortableTaskCard
          task={mockTask}
          isDragging={false}
          onUpdate={mockOnUpdate}
          onOpenDetail={mockOnOpenDetail}
        />
      </DndContext>
    )

    // 显示负责人首字母
    expect(screen.getAllByText('张').length).toBeGreaterThan(0)
    expect(screen.getAllByText('李').length).toBeGreaterThan(0)
  })

  it('显示进度条', () => {
    const { container } = render(
      <DndContext>
        <SortableTaskCard
          task={mockTask}
          isDragging={false}
          onUpdate={mockOnUpdate}
          onOpenDetail={mockOnOpenDetail}
        />
      </DndContext>
    )

    // 查找进度条
    const progressBar = container.querySelector('[style*="width: 50%"]')
    expect(progressBar).toBeInTheDocument()
  })
})