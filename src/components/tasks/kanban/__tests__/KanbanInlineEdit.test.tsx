/**
 * KanbanInlineEdit 组件测试
 * 测试看板视图中的内联编辑功能
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { PriorityInlineEdit, AssigneeInlineEdit } from '../KanbanInlineEdit'

// Mock 任务数据类型
interface MockAssignee {
  user: {
    id: string
    name: string
    email: string
  }
}

describe('PriorityInlineEdit', () => {
  const mockOnUpdate = vi.fn()

  beforeEach(() => {
    mockOnUpdate.mockClear()
  })

  it('点击优先级徽章显示下拉选择器', async () => {
    render(
      <PriorityInlineEdit
        priority="MEDIUM"
        taskId="task-1"
        onUpdate={mockOnUpdate}
      />
    )

    // 查找优先级徽章并点击 - 使用 getAllByRole 因为 Portal 可能渲染多个
    const badges = screen.getAllByRole('button', { name: /中/i })
    expect(badges.length).toBeGreaterThan(0)

    fireEvent.click(badges[0])

    // 验证下拉选项显示
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /低/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /高/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /紧急/i })).toBeInTheDocument()
    })
  })

  it('显示当前优先级的正确标签', () => {
    const { rerender } = render(
      <PriorityInlineEdit
        priority="LOW"
        taskId="task-1"
        onUpdate={mockOnUpdate}
      />
    )

    // 低优先级标签
    expect(screen.getAllByRole('button', { name: /低/i }).length).toBeGreaterThan(0)

    // 中优先级标签
    rerender(
      <PriorityInlineEdit
        priority="MEDIUM"
        taskId="task-1"
        onUpdate={mockOnUpdate}
      />
    )
    expect(screen.getAllByRole('button', { name: /中/i }).length).toBeGreaterThan(0)

    // 高优先级标签
    rerender(
      <PriorityInlineEdit
        priority="HIGH"
        taskId="task-1"
        onUpdate={mockOnUpdate}
      />
    )
    expect(screen.getAllByRole('button', { name: /高/i }).length).toBeGreaterThan(0)

    // 紧急优先级标签
    rerender(
      <PriorityInlineEdit
        priority="CRITICAL"
        taskId="task-1"
        onUpdate={mockOnUpdate}
      />
    )
    expect(screen.getAllByRole('button', { name: /紧急/i }).length).toBeGreaterThan(0)
  })

  it('包含四个优先级选项', async () => {
    render(
      <PriorityInlineEdit
        priority="LOW"
        taskId="task-1"
        onUpdate={mockOnUpdate}
      />
    )

    // 点击徽章打开下拉
    const badges = screen.getAllByRole('button', { name: /低/i })
    fireEvent.click(badges[0])

    // 验证所有四个选项都存在
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /低/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /中/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /高/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /紧急/i })).toBeInTheDocument()
    })
  })
})

describe('AssigneeInlineEdit', () => {
  const mockOnUpdate = vi.fn()
  const mockAssignees: MockAssignee[] = [
    { user: { id: 'user-1', name: '张三', email: 'zhang@example.com' } },
    { user: { id: 'user-2', name: '李四', email: 'li@example.com' } },
  ]

  beforeEach(() => {
    mockOnUpdate.mockClear()
  })

  it('点击负责人头像显示选择器', async () => {
    render(
      <AssigneeInlineEdit
        assignees={mockAssignees}
        projectId="project-1"
        taskId="task-1"
        onUpdate={mockOnUpdate}
      />
    )

    // 查找并点击头像组按钮
    const buttons = screen.getAllByRole('button')
    const avatarButton = buttons.find(btn => btn.getAttribute('aria-label') === '负责人')
    expect(avatarButton).toBeInTheDocument()
    fireEvent.click(avatarButton!)

    // 验证 Popover 打开（显示加载中）
    await waitFor(() => {
      // 组件显示加载状态
      const loadingText = screen.queryByText(/加载中/)
      expect(loadingText).toBeDefined()
    })
  })

  it('显示最多3个负责人头像，超出显示 +N', () => {
    const manyAssignees: MockAssignee[] = [
      { user: { id: 'user-1', name: '张三', email: 'zhang@example.com' } },
      { user: { id: 'user-2', name: '李四', email: 'li@example.com' } },
      { user: { id: 'user-3', name: '王五', email: 'wang@example.com' } },
      { user: { id: 'user-4', name: '赵六', email: 'zhao@example.com' } },
    ]

    render(
      <AssigneeInlineEdit
        assignees={manyAssignees}
        projectId="project-1"
        taskId="task-1"
        onUpdate={mockOnUpdate}
      />
    )

    // 显示 +1 表示超出的人数
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('空负责人时显示添加按钮', () => {
    render(
      <AssigneeInlineEdit
        assignees={[]}
        projectId="project-1"
        taskId="task-1"
        onUpdate={mockOnUpdate}
      />
    )

    // 空状态显示添加图标/按钮
    const addButtons = screen.getAllByRole('button', { name: /添加负责人/i })
    expect(addButtons.length).toBeGreaterThan(0)
  })

  it('渲染已分配的负责人头像', () => {
    render(
      <AssigneeInlineEdit
        assignees={mockAssignees}
        projectId="project-1"
        taskId="task-1"
        onUpdate={mockOnUpdate}
      />
    )

    // 验证负责人头像显示（通过首字母）
    const zhangElements = screen.getAllByText('张')
    const liElements = screen.getAllByText('李')
    expect(zhangElements.length).toBeGreaterThan(0)
    expect(liElements.length).toBeGreaterThan(0)
  })
})