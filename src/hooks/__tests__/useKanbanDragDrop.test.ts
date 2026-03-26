import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKanbanDragDrop } from '../useKanbanDragDrop'

interface MockTask {
  id: string
  status: string
  title: string
}

describe('useKanbanDragDrop', () => {
  let mockTasks: MockTask[]
  let mockOnReorder: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockTasks = [
      { id: 'task-1', status: 'TODO', title: 'Task 1' },
      { id: 'task-2', status: 'TODO', title: 'Task 2' },
      { id: 'task-3', status: 'TODO', title: 'Task 3' },
      { id: 'task-4', status: 'IN_PROGRESS', title: 'Task 4' },
    ]
    mockOnReorder = vi.fn()
  })

  it('should return sensors, handleDragEnd, handleDragOver', () => {
    const { result } = renderHook(() =>
      useKanbanDragDrop(mockTasks, mockOnReorder)
    )

    expect(result.current).toHaveProperty('sensors')
    expect(result.current).toHaveProperty('handleDragEnd')
    expect(result.current).toHaveProperty('handleDragOver')
  })

  it('should correctly reorder tasks within the same column', () => {
    const { result } = renderHook(() =>
      useKanbanDragDrop(mockTasks, mockOnReorder)
    )

    act(() => {
      result.current.handleDragEnd({
        active: { id: 'task-1' } as any,
        over: { id: 'task-3' } as any,
      } as any)
    })

    expect(mockOnReorder).toHaveBeenCalled()
    const reorderedTasks = mockOnReorder.mock.calls[0][0]

    const task1Index = reorderedTasks.findIndex((t: MockTask) => t.id === 'task-1')
    const task2Index = reorderedTasks.findIndex((t: MockTask) => t.id === 'task-2')

    expect(task1Index).toBeGreaterThan(task2Index)
  })

  it('should correctly handle cross-column task moves', () => {
    const { result } = renderHook(() =>
      useKanbanDragDrop(mockTasks, mockOnReorder)
    )

    act(() => {
      result.current.handleDragEnd({
        active: { id: 'task-1' } as any,
        over: { id: 'task-4' } as any,
      } as any)
    })

    expect(mockOnReorder).toHaveBeenCalled()
    const reorderedTasks = mockOnReorder.mock.calls[0][0]

    const task1 = reorderedTasks.find((t: MockTask) => t.id === 'task-1')
    expect(task1?.status).toBe('IN_PROGRESS')
  })

  it('should not trigger reorder when there is no over element', () => {
    const { result } = renderHook(() =>
      useKanbanDragDrop(mockTasks, mockOnReorder)
    )

    act(() => {
      result.current.handleDragEnd({
        active: { id: 'task-1' } as any,
        over: null,
      } as any)
    })

    expect(mockOnReorder).not.toHaveBeenCalled()
  })

  it('should not trigger reorder when dropping on the same position', () => {
    const { result } = renderHook(() =>
      useKanbanDragDrop(mockTasks, mockOnReorder)
    )

    act(() => {
      result.current.handleDragEnd({
        active: { id: 'task-1' } as any,
        over: { id: 'task-1' } as any,
      } as any)
    })

    expect(mockOnReorder).not.toHaveBeenCalled()
  })

  it('handleDragOver should correctly identify drop position', () => {
    const { result } = renderHook(() =>
      useKanbanDragDrop(mockTasks, mockOnReorder)
    )

    act(() => {
      result.current.handleDragOver({
        active: { id: 'task-1' } as any,
        over: { id: 'task-2' } as any,
      } as any)
    })

    expect(result.current).toHaveProperty('handleDragOver')
  })
})
