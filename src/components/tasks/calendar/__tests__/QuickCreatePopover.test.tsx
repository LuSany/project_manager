/**
 * QuickCreatePopover 组件测试
 * 测试快速创建任务弹窗渲染和交互
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { QuickCreatePopover } from '../QuickCreatePopover'

describe('QuickCreatePopover', () => {
  const mockDate = new Date('2026-03-15T00:00:00.000Z')
  const mockOnCreate = vi.fn()
  const mockOnOpenChange = vi.fn()

  const defaultProps = {
    date: mockDate,
    open: true,
    onOpenChange: mockOnOpenChange,
    onCreate: mockOnCreate,
  }

  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should open on trigger click', () => {
      render(
        <QuickCreatePopover
          date={mockDate}
          open={false}
          onOpenChange={mockOnOpenChange}
          onCreate={mockOnCreate}
        >
          <button>触发按钮</button>
        </QuickCreatePopover>
      )

      // Click trigger button
      fireEvent.click(screen.getByText('触发按钮'))

      // Should call onOpenChange with true
      expect(mockOnOpenChange).toHaveBeenCalledWith(true)
    })

    it('should display selected date', () => {
      render(<QuickCreatePopover {...defaultProps} />)

      // Should show formatted date (2026年3月15日)
      expect(screen.getByText(/2026年3月15日/)).toBeInTheDocument()
    })

    it('should show title input with placeholder', () => {
      render(<QuickCreatePopover {...defaultProps} />)

      // Should have input with placeholder
      const input = screen.getByPlaceholderText('输入任务标题...')
      expect(input).toBeInTheDocument()
    })

    it('should show cancel and create buttons', () => {
      render(<QuickCreatePopover {...defaultProps} />)

      expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '创建任务' })).toBeInTheDocument()
    })
  })

  describe('form validation', () => {
    it('should require title before submit', () => {
      render(<QuickCreatePopover {...defaultProps} />)

      // Submit button should be disabled when title is empty
      const submitButton = screen.getByRole('button', { name: '创建任务' })
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit when title has value', () => {
      render(<QuickCreatePopover {...defaultProps} />)

      // Type in input
      const input = screen.getByPlaceholderText('输入任务标题...')
      fireEvent.change(input, { target: { value: '新任务标题' } })

      // Submit button should now be enabled
      const submitButton = screen.getByRole('button', { name: '创建任务' })
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('interactions', () => {
    it('should create task with title', () => {
      render(<QuickCreatePopover {...defaultProps} />)

      // Type in input
      const input = screen.getByPlaceholderText('输入任务标题...')
      fireEvent.change(input, { target: { value: '新任务标题' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: '创建任务' })
      fireEvent.click(submitButton)

      // Should call onCreate with title and date
      expect(mockOnCreate).toHaveBeenCalledWith('新任务标题', mockDate)
    })

    it('should close after creation', () => {
      render(<QuickCreatePopover {...defaultProps} />)

      // Type and submit
      const input = screen.getByPlaceholderText('输入任务标题...')
      fireEvent.change(input, { target: { value: '新任务标题' } })

      const submitButton = screen.getByRole('button', { name: '创建任务' })
      fireEvent.click(submitButton)

      // Should close popover
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('should cancel on escape key', () => {
      render(<QuickCreatePopover {...defaultProps} />)

      // Press Escape
      const input = screen.getByPlaceholderText('输入任务标题...')
      fireEvent.keyDown(input, { key: 'Escape' })

      // Should close popover
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('should close on cancel button click', () => {
      render(<QuickCreatePopover {...defaultProps} />)

      // Click cancel button
      const cancelButton = screen.getByRole('button', { name: '取消' })
      fireEvent.click(cancelButton)

      // Should close popover
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })
})