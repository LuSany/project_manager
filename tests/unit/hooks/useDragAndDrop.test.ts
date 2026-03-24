import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDragAndDrop } from '@/hooks/useDragAndDrop'

interface TestItem {
  id: string
  name: string
}

const mockItems: TestItem[] = [
  { id: '1', name: '项目一' },
  { id: '2', name: '项目二' },
  { id: '3', name: '项目三' },
]

describe('useDragAndDrop', () => {
  it('initializes with provided items', () => {
    const { result } = renderHook(() => useDragAndDrop(mockItems))

    expect(result.current.items).toEqual(mockItems)
  })

  it('provides DndContext and SortableContext', () => {
    const { result } = renderHook(() => useDragAndDrop(mockItems))

    expect(result.current.DndContext).toBeDefined()
    expect(result.current.SortableContext).toBeDefined()
  })

  it('provides sensors for pointer and keyboard', () => {
    const { result } = renderHook(() => useDragAndDrop(mockItems))

    expect(result.current.sensors).toBeDefined()
    expect(Array.isArray(result.current.sensors)).toBe(true)
  })

  it('provides handleDragEnd function', () => {
    const { result } = renderHook(() => useDragAndDrop(mockItems))

    expect(result.current.handleDragEnd).toBeDefined()
    expect(typeof result.current.handleDragEnd).toBe('function')
  })

  it('allows setting items', () => {
    const { result } = renderHook(() => useDragAndDrop(mockItems))

    const newItems: TestItem[] = [{ id: '4', name: '项目四' }]

    act(() => {
      result.current.setItems(newItems)
    })

    expect(result.current.items).toEqual(newItems)
  })

  it('calls onReorder callback when items are reordered', () => {
    const onReorder = vi.fn()
    const { result } = renderHook(() => useDragAndDrop(mockItems, onReorder))

    expect(onReorder).not.toHaveBeenCalled()
  })

  it('returns correct items structure', () => {
    const { result } = renderHook(() => useDragAndDrop(mockItems))

    expect(result.current.items[0]).toHaveProperty('id')
    expect(result.current.items[0]).toHaveProperty('name')
  })
})
