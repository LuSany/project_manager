/**
 * History Store
 * 撤销/重做状态管理 - 基于 Zustand
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

/**
 * 历史记录条目
 */
export interface HistoryEntry {
  /** 条目 ID */
  id: string
  /** 时间戳 */
  timestamp: number
  /** 操作描述 */
  description: string
  /** 撤销操作 */
  undo: () => Promise<void>
  /** 重做操作 */
  redo: () => Promise<void>
}

/**
 * History State 接口
 */
interface HistoryState {
  /** 撤销栈 */
  undoStack: HistoryEntry[]
  /** 重做栈 */
  redoStack: HistoryEntry[]
  /** 最大历史记录数 */
  maxHistory: number
  /** 是否正在执行撤销/重做 (防止递归) */
  isUndoingOrRedoing: boolean
}

/**
 * History Actions 接口
 */
interface HistoryActions {
  /** 推入历史记录 */
  pushEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void

  /** 执行撤销 */
  undo: () => Promise<void>

  /** 执行重做 */
  redo: () => Promise<void>

  /** 清空历史 */
  clear: () => void

  /** 检查是否可以撤销 */
  canUndo: () => boolean

  /** 检查是否可以重做 */
  canRedo: () => boolean

  /** 获取撤销栈大小 */
  getUndoStackSize: () => number

  /** 获取重做栈大小 */
  getRedoStackSize: () => number

  /** 批量推入历史记录 */
  pushBatchEntries: (entries: Omit<HistoryEntry, 'id' | 'timestamp'>[]) => void
}

/**
 * History Store
 */
export const useHistoryStore = create<HistoryState & HistoryActions>()(
  subscribeWithSelector((set, get) => ({
    undoStack: [],
    redoStack: [],
    maxHistory: 50,
    isUndoingOrRedoing: false,

    pushEntry: (entry) =>
      set((state) => {
        if (state.isUndoingOrRedoing) return state

        const newEntry: HistoryEntry = {
          ...entry,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        }

        return {
          undoStack: [...state.undoStack.slice(-state.maxHistory + 1), newEntry],
          redoStack: [],
        }
      }),

    undo: async () => {
      const { undoStack, isUndoingOrRedoing } = get()
      if (isUndoingOrRedoing || undoStack.length === 0) return

      const entry = undoStack[undoStack.length - 1]
      if (!entry) return

      set({ isUndoingOrRedoing: true })

      try {
        await entry.undo()
        set((state) => ({
          undoStack: state.undoStack.slice(0, -1),
          redoStack: [...state.redoStack, entry],
        }))
      } finally {
        set({ isUndoingOrRedoing: false })
      }
    },

    redo: async () => {
      const { redoStack, isUndoingOrRedoing } = get()
      if (isUndoingOrRedoing || redoStack.length === 0) return

      const entry = redoStack[redoStack.length - 1]
      if (!entry) return

      set({ isUndoingOrRedoing: true })

      try {
        await entry.redo()
        set((state) => ({
          redoStack: state.redoStack.slice(0, -1),
          undoStack: [...state.undoStack, entry],
        }))
      } finally {
        set({ isUndoingOrRedoing: false })
      }
    },

    clear: () =>
      set({
        undoStack: [],
        redoStack: [],
      }),

    canUndo: () => get().undoStack.length > 0,

    canRedo: () => get().redoStack.length > 0,

    getUndoStackSize: () => get().undoStack.length,

    getRedoStackSize: () => get().redoStack.length,

    pushBatchEntries: (entries) =>
      set((state) => {
        if (state.isUndoingOrRedoing) return state

        const newEntries: HistoryEntry[] = entries.map((entry) => ({
          ...entry,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        }))

        return {
          undoStack: [...state.undoStack.slice(-state.maxHistory + 1), ...newEntries],
          redoStack: [],
        }
      }),
  }))
)
