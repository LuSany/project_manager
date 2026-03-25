/**
 * History Store 测试
 * 测试撤销/重做状态管理功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useHistoryStore } from '../historyStore'

describe('HistoryStore', () => {
  beforeEach(() => {
    useHistoryStore.setState({
      undoStack: [],
      redoStack: [],
      maxHistory: 50,
      isUndoingOrRedoing: false,
    })
  })

  afterEach(() => {
    useHistoryStore.setState({
      undoStack: [],
      redoStack: [],
      maxHistory: 50,
      isUndoingOrRedoing: false,
    })
  })

  describe('pushEntry', () => {
    it('should add entry to undo stack', () => {
      const entry = {
        description: 'Update card title',
        undo: vi.fn().mockResolvedValue(undefined),
        redo: vi.fn().mockResolvedValue(undefined),
      }

      useHistoryStore.getState().pushEntry(entry)

      expect(useHistoryStore.getState().undoStack).toHaveLength(1)
      expect(useHistoryStore.getState().undoStack[0].description).toBe('Update card title')
      expect(useHistoryStore.getState().redoStack).toHaveLength(0)
    })

    it('should generate unique id and timestamp', () => {
      const entry = {
        description: 'Test action',
        undo: vi.fn().mockResolvedValue(undefined),
        redo: vi.fn().mockResolvedValue(undefined),
      }

      useHistoryStore.getState().pushEntry(entry)

      const historyEntry = useHistoryStore.getState().undoStack[0]
      expect(historyEntry.id).toBeDefined()
      expect(historyEntry.timestamp).toBeDefined()
      expect(historyEntry.timestamp).toBeGreaterThan(0)
    })

    it('should clear redo stack on new action', async () => {
      const entry1 = {
        description: 'Action 1',
        undo: vi.fn().mockResolvedValue(undefined),
        redo: vi.fn().mockResolvedValue(undefined),
      }

      useHistoryStore.getState().pushEntry(entry1)

      const undoFn = vi.fn().mockResolvedValue(undefined)
      const redoFn = vi.fn().mockResolvedValue(undefined)

      useHistoryStore.getState().pushEntry({
        description: 'Test',
        undo: undoFn,
        redo: redoFn,
      })

      expect(useHistoryStore.getState().undoStack).toHaveLength(2)

      await useHistoryStore.getState().undo()

      expect(useHistoryStore.getState().redoStack).toHaveLength(1)
      expect(useHistoryStore.getState().undoStack).toHaveLength(1)

      useHistoryStore.getState().pushEntry({
        description: 'Action 2',
        undo: vi.fn().mockResolvedValue(undefined),
        redo: vi.fn().mockResolvedValue(undefined),
      })

      expect(useHistoryStore.getState().redoStack).toHaveLength(0)
      expect(useHistoryStore.getState().undoStack).toHaveLength(2)
    })

    it('should limit history size', () => {
      useHistoryStore.setState({ maxHistory: 3 })

      for (let i = 0; i < 5; i++) {
        useHistoryStore.getState().pushEntry({
          description: `Action ${i}`,
          undo: vi.fn().mockResolvedValue(undefined),
          redo: vi.fn().mockResolvedValue(undefined),
        })
      }

      expect(useHistoryStore.getState().undoStack).toHaveLength(3)
      expect(useHistoryStore.getState().undoStack[0].description).toBe('Action 2')
      expect(useHistoryStore.getState().undoStack[2].description).toBe('Action 4')
    })

    it('should not push entry while undoing or redoing', () => {
      useHistoryStore.setState({ isUndoingOrRedoing: true })

      const entry = {
        description: 'Test action',
        undo: vi.fn().mockResolvedValue(undefined),
        redo: vi.fn().mockResolvedValue(undefined),
      }

      useHistoryStore.getState().pushEntry(entry)

      expect(useHistoryStore.getState().undoStack).toHaveLength(0)
    })
  })

  describe('pushBatchEntries', () => {
    it('should add multiple entries to undo stack', () => {
      const entries = [
        {
          description: 'Action 1',
          undo: vi.fn().mockResolvedValue(undefined),
          redo: vi.fn().mockResolvedValue(undefined),
        },
        {
          description: 'Action 2',
          undo: vi.fn().mockResolvedValue(undefined),
          redo: vi.fn().mockResolvedValue(undefined),
        },
      ]

      useHistoryStore.getState().pushBatchEntries(entries)

      expect(useHistoryStore.getState().undoStack).toHaveLength(2)
      expect(useHistoryStore.getState().redoStack).toHaveLength(0)
    })

    it('should clear redo stack when pushing batch', async () => {
      const entry1 = {
        description: 'Action 1',
        undo: vi.fn().mockResolvedValue(undefined),
        redo: vi.fn().mockResolvedValue(undefined),
      }

      useHistoryStore.getState().pushEntry(entry1)

      await useHistoryStore.getState().undo()

      expect(useHistoryStore.getState().redoStack).toHaveLength(1)

      const entries = [
        {
          description: 'Action 2',
          undo: vi.fn().mockResolvedValue(undefined),
          redo: vi.fn().mockResolvedValue(undefined),
        },
      ]

      useHistoryStore.getState().pushBatchEntries(entries)

      expect(useHistoryStore.getState().redoStack).toHaveLength(0)
      expect(useHistoryStore.getState().undoStack).toHaveLength(1)
    })

    it('should not push while undoing or redoing', () => {
      useHistoryStore.setState({ isUndoingOrRedoing: true })

      const entries = [
        {
          description: 'Action 1',
          undo: vi.fn().mockResolvedValue(undefined),
          redo: vi.fn().mockResolvedValue(undefined),
        },
      ]

      useHistoryStore.getState().pushBatchEntries(entries)

      expect(useHistoryStore.getState().undoStack).toHaveLength(0)
    })
  })

  describe('undo', () => {
    it('should undo last action', async () => {
      const undoFn = vi.fn().mockResolvedValue(undefined)
      const redoFn = vi.fn().mockResolvedValue(undefined)

      useHistoryStore.getState().pushEntry({
        description: 'Test',
        undo: undoFn,
        redo: redoFn,
      })

      await useHistoryStore.getState().undo()

      expect(undoFn).toHaveBeenCalled()
      expect(useHistoryStore.getState().redoStack).toHaveLength(1)
      expect(useHistoryStore.getState().undoStack).toHaveLength(0)
    })

    it('should move entry to redo stack after undo', async () => {
      const undoFn = vi.fn().mockResolvedValue(undefined)
      const redoFn = vi.fn().mockResolvedValue(undefined)

      useHistoryStore.getState().pushEntry({
        description: 'Test',
        undo: undoFn,
        redo: redoFn,
      })

      await useHistoryStore.getState().undo()

      expect(useHistoryStore.getState().redoStack[0].description).toBe('Test')
    })

    it('should do nothing when undo stack is empty', async () => {
      await useHistoryStore.getState().undo()

      expect(useHistoryStore.getState().canUndo()).toBe(false)
      expect(useHistoryStore.getState().undoStack).toHaveLength(0)
    })

    it('should do nothing while undoing or redoing', async () => {
      const undoFn = vi.fn().mockResolvedValue(undefined)
      const redoFn = vi.fn().mockResolvedValue(undefined)

      useHistoryStore.getState().pushEntry({
        description: 'Test',
        undo: undoFn,
        redo: redoFn,
      })

      useHistoryStore.setState({ isUndoingOrRedoing: true })

      await useHistoryStore.getState().undo()

      expect(undoFn).not.toHaveBeenCalled()
    })

    it('should reset isUndoingOrRedoing flag after undo', async () => {
      const undoFn = vi.fn().mockResolvedValue(undefined)
      const redoFn = vi.fn().mockResolvedValue(undefined)

      useHistoryStore.getState().pushEntry({
        description: 'Test',
        undo: undoFn,
        redo: redoFn,
      })

      await useHistoryStore.getState().undo()

      expect(useHistoryStore.getState().isUndoingOrRedoing).toBe(false)
    })
  })

  describe('redo', () => {
    it('should redo last undone action', async () => {
      const undoFn = vi.fn().mockResolvedValue(undefined)
      const redoFn = vi.fn().mockResolvedValue(undefined)

      useHistoryStore.getState().pushEntry({
        description: 'Test',
        undo: undoFn,
        redo: redoFn,
      })

      await useHistoryStore.getState().undo()
      await useHistoryStore.getState().redo()

      expect(redoFn).toHaveBeenCalled()
      expect(useHistoryStore.getState().undoStack).toHaveLength(1)
      expect(useHistoryStore.getState().redoStack).toHaveLength(0)
    })

    it('should move entry back to undo stack after redo', async () => {
      const undoFn = vi.fn().mockResolvedValue(undefined)
      const redoFn = vi.fn().mockResolvedValue(undefined)

      useHistoryStore.getState().pushEntry({
        description: 'Test',
        undo: undoFn,
        redo: redoFn,
      })

      await useHistoryStore.getState().undo()
      await useHistoryStore.getState().redo()

      expect(useHistoryStore.getState().undoStack[0].description).toBe('Test')
    })

    it('should do nothing when redo stack is empty', async () => {
      await useHistoryStore.getState().redo()

      expect(useHistoryStore.getState().canRedo()).toBe(false)
      expect(useHistoryStore.getState().redoStack).toHaveLength(0)
    })

    it('should do nothing while undoing or redoing', async () => {
      const undoFn = vi.fn().mockResolvedValue(undefined)
      const redoFn = vi.fn().mockResolvedValue(undefined)

      useHistoryStore.getState().pushEntry({
        description: 'Test',
        undo: undoFn,
        redo: redoFn,
      })

      await useHistoryStore.getState().undo()

      useHistoryStore.setState({ isUndoingOrRedoing: true })

      await useHistoryStore.getState().redo()

      expect(redoFn).not.toHaveBeenCalled()
    })

    it('should reset isUndoingOrRedoing flag after redo', async () => {
      const undoFn = vi.fn().mockResolvedValue(undefined)
      const redoFn = vi.fn().mockResolvedValue(undefined)

      useHistoryStore.getState().pushEntry({
        description: 'Test',
        undo: undoFn,
        redo: redoFn,
      })

      await useHistoryStore.getState().undo()
      await useHistoryStore.getState().redo()

      expect(useHistoryStore.getState().isUndoingOrRedoing).toBe(false)
    })
  })

  describe('canUndo', () => {
    it('should return false when undo stack is empty', () => {
      expect(useHistoryStore.getState().canUndo()).toBe(false)
    })

    it('should return true when undo stack has entries', () => {
      useHistoryStore.getState().pushEntry({
        description: 'Test',
        undo: vi.fn().mockResolvedValue(undefined),
        redo: vi.fn().mockResolvedValue(undefined),
      })

      expect(useHistoryStore.getState().canUndo()).toBe(true)
    })
  })

  describe('canRedo', () => {
    it('should return false when redo stack is empty', () => {
      expect(useHistoryStore.getState().canRedo()).toBe(false)
    })

    it('should return true when redo stack has entries', async () => {
      useHistoryStore.getState().pushEntry({
        description: 'Test',
        undo: vi.fn().mockResolvedValue(undefined),
        redo: vi.fn().mockResolvedValue(undefined),
      })

      await useHistoryStore.getState().undo()

      expect(useHistoryStore.getState().canRedo()).toBe(true)
    })
  })

  describe('getUndoStackSize', () => {
    it('should return 0 when empty', () => {
      expect(useHistoryStore.getState().getUndoStackSize()).toBe(0)
    })

    it('should return correct size', () => {
      useHistoryStore.getState().pushEntry({
        description: 'Test',
        undo: vi.fn().mockResolvedValue(undefined),
        redo: vi.fn().mockResolvedValue(undefined),
      })

      useHistoryStore.getState().pushEntry({
        description: 'Test 2',
        undo: vi.fn().mockResolvedValue(undefined),
        redo: vi.fn().mockResolvedValue(undefined),
      })

      expect(useHistoryStore.getState().getUndoStackSize()).toBe(2)
    })
  })

  describe('getRedoStackSize', () => {
    it('should return 0 when empty', () => {
      expect(useHistoryStore.getState().getRedoStackSize()).toBe(0)
    })

    it('should return correct size', async () => {
      useHistoryStore.getState().pushEntry({
        description: 'Test',
        undo: vi.fn().mockResolvedValue(undefined),
        redo: vi.fn().mockResolvedValue(undefined),
      })

      await useHistoryStore.getState().undo()

      expect(useHistoryStore.getState().getRedoStackSize()).toBe(1)
    })
  })

  describe('clear', () => {
    it('should clear all stacks', () => {
      useHistoryStore.getState().pushEntry({
        description: 'Test',
        undo: vi.fn().mockResolvedValue(undefined),
        redo: vi.fn().mockResolvedValue(undefined),
      })

      useHistoryStore.getState().clear()

      expect(useHistoryStore.getState().undoStack).toHaveLength(0)
      expect(useHistoryStore.getState().redoStack).toHaveLength(0)
    })
  })

  describe('Integration Tests', () => {
    it('should support multiple undo and redo operations', async () => {
      const entries = [
        {
          description: 'Action 1',
          undo: vi.fn().mockResolvedValue(undefined),
          redo: vi.fn().mockResolvedValue(undefined),
        },
        {
          description: 'Action 2',
          undo: vi.fn().mockResolvedValue(undefined),
          redo: vi.fn().mockResolvedValue(undefined),
        },
        {
          description: 'Action 3',
          undo: vi.fn().mockResolvedValue(undefined),
          redo: vi.fn().mockResolvedValue(undefined),
        },
      ]

      entries.forEach((entry) => useHistoryStore.getState().pushEntry(entry))

      expect(useHistoryStore.getState().undoStack).toHaveLength(3)

      await useHistoryStore.getState().undo()
      await useHistoryStore.getState().undo()

      expect(useHistoryStore.getState().undoStack).toHaveLength(1)
      expect(useHistoryStore.getState().redoStack).toHaveLength(2)

      await useHistoryStore.getState().redo()

      expect(useHistoryStore.getState().undoStack).toHaveLength(2)
      expect(useHistoryStore.getState().redoStack).toHaveLength(1)
    })

    it('should handle undo/redo with max history limit', async () => {
      useHistoryStore.setState({ maxHistory: 2 })

      for (let i = 0; i < 3; i++) {
        useHistoryStore.getState().pushEntry({
          description: `Action ${i}`,
          undo: vi.fn().mockResolvedValue(undefined),
          redo: vi.fn().mockResolvedValue(undefined),
        })
      }

      expect(useHistoryStore.getState().undoStack).toHaveLength(2)

      await useHistoryStore.getState().undo()

      expect(useHistoryStore.getState().redoStack).toHaveLength(1)
    })
  })
})
