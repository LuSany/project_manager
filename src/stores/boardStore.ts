/**
 * Board Store
 * 看板状态管理 - 基于 Zustand
 */

import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import type { Board, Card, View, ViewState } from '../blocks/types'
import type { Property } from '../properties/types'
import type { FilterGroup } from '../blocks/filter'

/**
 * Board State 接口
 */
interface BoardState {
  /** 当前激活的看板 */
  activeBoard: Board | null
  /** 所有看板映射 */
  boards: Map<string, Board>

  /** 当前激活的视图 */
  activeView: View | null
  /** 所有视图映射 */
  views: Map<string, View>

  /** 所有卡片映射 */
  cards: Map<string, Card>
  /** 按看板分组的卡片列表 */
  cardsByBoard: Record<string, Card[]>

  /** 视图状态映射 */
  viewStates: Record<string, ViewState>

  /** 按视图分组的卡片列表 (用于视图筛选、排序) */
  cardsByView: Record<string, Card[]>
}

/**
 * Board Actions 接口
 */
interface BoardActions {
  /** 设置激活看板 */
  setActiveBoard: (board: Board) => void

  /** 设置激活视图 */
  setActiveView: (view: View) => void

  /** 添加看板 */
  addBoard: (board: Board) => void

  /** 更新看板 */
  updateBoard: (id: string, updates: Partial<Board>) => void

  /** 删除看板 */
  deleteBoard: (id: string) => void

  /** 添加卡片 */
  addCard: (card: Card) => void

  /** 批量添加卡片 */
  addCards: (cards: Card[]) => void

  /** 更新卡片 */
  updateCard: (id: string, updates: Partial<Card>) => void

  /** 批量更新卡片 */
  updateCards: (updates: Record<string, Partial<Card>>) => void

  /** 删除卡片 */
  deleteCard: (id: string) => void

  /** 移动卡片 (拖拽) */
  moveCard: (cardId: string, fromColumn: string, toColumn: string, newIndex: number) => void

  /** 添加视图 */
  addView: (view: View) => void

  /** 更新视图 */
  updateView: (id: string, updates: Partial<View>) => void

  /** 删除视图 */
  deleteView: (id: string) => void

  /** 更新视图状态 */
  updateViewState: (viewId: string, state: Partial<ViewState>) => void

  /** 应用视图筛选 */
  applyViewFilter: (viewId: string, filter: FilterGroup) => void

  /** 排序视图卡片 */
  sortViewCards: (viewId: string) => void

  /** 清空所有数据 */
  clearAll: () => void

  /** 按属性查询卡片 */
  getCardsByProperty: (propertyId: string, value: any) => Card[]

  /** 获取看板的卡片 */
  getBoardCards: (boardId: string) => Card[]
}

/**
 * Board Store
 */
export const useBoardStore = create<BoardState & BoardActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        activeBoard: null,
        boards: new Map(),
        activeView: null,
        views: new Map(),
        cards: new Map(),
        cardsByBoard: {},
        viewStates: {},
        cardsByView: {},

        setActiveBoard: (board) => set({ activeBoard: board }),

        setActiveView: (view) => set({ activeView: view }),

        addBoard: (board) =>
          set((state) => ({
            boards: new Map(state.boards).set(board.id, board),
          })),

        updateBoard: (id, updates) =>
          set((state) => {
            const board = state.boards.get(id)
            if (!board) return state
            const updated = { ...board, ...updates, updateAt: Date.now() }
            return {
              boards: new Map(state.boards).set(id, updated),
              activeBoard: state.activeBoard?.id === id ? updated : state.activeBoard,
            }
          }),

        deleteBoard: (id) =>
          set((state) => {
            const newBoards = new Map(state.boards)
            newBoards.delete(id)
            return {
              boards: newBoards,
              activeBoard: state.activeBoard?.id === id ? null : state.activeBoard,
              cards: new Map([...state.cards].filter(([_, card]) => card.boardId !== id)),
            }
          }),

        addCard: (card) =>
          set((state) => {
            const boardCards = state.cardsByBoard[card.boardId] || []
            return {
              cards: new Map(state.cards).set(card.id, card),
              cardsByBoard: {
                ...state.cardsByBoard,
                [card.boardId]: [...boardCards, card],
              },
            }
          }),

        addCards: (cards) =>
          set((state) => {
            const newCards = new Map(state.cards)
            const newCardsByBoard = { ...state.cardsByBoard }

            for (const card of cards) {
              newCards.set(card.id, card)
              newCardsByBoard[card.boardId] = [...(newCardsByBoard[card.boardId] || []), card]
            }

            return {
              cards: newCards,
              cardsByBoard: newCardsByBoard,
            }
          }),

        updateCard: (id, updates) =>
          set((state) => {
            const card = state.cards.get(id)
            if (!card) return state
            const updated = {
              ...card,
              ...updates,
              updateAt: Date.now(),
            } as Card
            return {
              cards: new Map(state.cards).set(id, updated),
            }
          }),

        updateCards: (updates) =>
          set((state) => {
            const newCards = new Map(state.cards)
            for (const [id, updatesForCard] of Object.entries(updates)) {
              const card = state.cards.get(id)
              if (card) {
                const updated = Object.assign({}, card, updatesForCard, { updateAt: Date.now() })
                newCards.set(id, updated as Card)
              }
            }
            return { cards: newCards }
          }),

        deleteCard: (id) =>
          set((state) => {
            const newCards = new Map(state.cards)
            newCards.delete(id)
            return { cards: newCards }
          }),

        moveCard: (cardId, fromColumn, toColumn, newIndex) =>
          set((state) => {
            const card = state.cards.get(cardId)
            if (!card) return state

            return state
          }),

        addView: (view) =>
          set((state) => ({
            views: new Map(state.views).set(view.id, view),
          })),

        updateView: (id, updates) =>
          set((state) => {
            const view = state.views.get(id)
            if (!view) return state
            const updated = { ...view, ...updates, updateAt: Date.now() }
            return {
              views: new Map(state.views).set(id, updated),
              activeView: state.activeView?.id === id ? updated : state.activeView,
            }
          }),

        deleteView: (id) =>
          set((state) => {
            const newViews = new Map(state.views)
            newViews.delete(id)
            return {
              views: newViews,
              activeView: state.activeView?.id === id ? null : state.activeView,
            }
          }),

        updateViewState: (viewId, stateUpdate) =>
          set((state) => ({
            viewStates: {
              ...state.viewStates,
              [viewId]: { ...state.viewStates[viewId], ...stateUpdate },
            },
          })),

        applyViewFilter: (viewId, filter) =>
          set((state) => {
            const view = state.views.get(viewId)
            if (!view) return state

            const updated = { ...view, fields: { ...view.fields, filter }, updateAt: Date.now() }
            return {
              views: new Map(state.views).set(viewId, updated),
              activeView: state.activeView?.id === viewId ? updated : state.activeView,
            }
          }),

        sortViewCards: (viewId) => set((state) => state),

        clearAll: () =>
          set({
            activeBoard: null,
            boards: new Map(),
            activeView: null,
            views: new Map(),
            cards: new Map(),
            cardsByBoard: {},
            viewStates: {},
            cardsByView: {},
          }),

        getCardsByProperty: (propertyId, value) => {
          const { cards } = get()
          const result: Card[] = []
          for (const card of cards.values()) {
            if (card.fields.properties[propertyId] === value) {
              result.push(card)
            }
          }
          return result
        },

        getBoardCards: (boardId) => {
          const { cards } = get()
          const result: Card[] = []
          for (const card of cards.values()) {
            if (card.boardId === boardId) {
              result.push(card)
            }
          }
          return result
        },
      }),
      {
        name: 'board-storage',
        partialize: (state) => ({
          viewStates: state.viewStates,
        }),
      }
    )
  )
)
