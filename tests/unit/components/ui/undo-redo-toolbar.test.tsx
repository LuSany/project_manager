import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { UndoRedoToolbar } from '@/components/ui/undo-redo-toolbar'
import { useHistoryStore } from '@/stores/historyStore'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('UndoRedoToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useHistoryStore.getState().clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders undo and redo buttons', () => {
    const { container } = render(<UndoRedoToolbar />)
    const buttons = container.querySelectorAll('button')
    expect(buttons).toHaveLength(2)
  })

  it('disables undo button when history is empty', () => {
    const { container } = render(<UndoRedoToolbar />)
    const buttons = container.querySelectorAll('button')
    expect(buttons[0]).toBeDisabled()
  })

  it('enables undo button when there is history', () => {
    const store = useHistoryStore.getState()
    store.pushEntry({
      description: 'Test action',
      undo: async () => {},
      redo: async () => {},
    })

    const { container } = render(<UndoRedoToolbar />)
    const buttons = container.querySelectorAll('button')
    expect(buttons[0]).not.toBeDisabled()
  })

  it('calls undo when undo button is clicked', async () => {
    const store = useHistoryStore.getState()
    const mockUndo = vi.fn()
    store.pushEntry({
      description: 'Test action',
      undo: mockUndo,
      redo: async () => {},
    })

    const { container } = render(<UndoRedoToolbar />)
    const buttons = container.querySelectorAll('button')
    fireEvent.click(buttons[0])

    expect(mockUndo).toHaveBeenCalled()
  })

  it('registers keyboard shortcuts', async () => {
    const store = useHistoryStore.getState()
    const mockUndo = vi.fn()
    store.pushEntry({
      description: 'Test action',
      undo: mockUndo,
      redo: async () => {},
    })

    render(<UndoRedoToolbar />)

    fireEvent.keyDown(document, { metaKey: true, key: 'z' })
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mockUndo).toHaveBeenCalled()
  })
})
