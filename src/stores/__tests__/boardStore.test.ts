/**
 * Board Store 测试
 * 测试看板状态管理功能
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useBoardStore } from '../boardStore'
import type { Board, Card, View } from '../../blocks/types'

describe('BoardStore', () => {
  beforeEach(() => {
    useBoardStore.getState().clearAll()
  })

  describe('Board Operations', () => {
    it('should add a board', () => {
      const board: Board = {
        id: 'board-1',
        workspaceId: 'ws-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'board',
        fields: { title: 'Test', cardProperties: [] },
      }

      useBoardStore.getState().addBoard(board)

      expect(useBoardStore.getState().boards.get('board-1')).toBeDefined()
      expect(useBoardStore.getState().boards.get('board-1')?.id).toBe('board-1')
    })

    it('should update a board', () => {
      const board: Board = {
        id: 'board-1',
        workspaceId: 'ws-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'board',
        fields: { title: 'Test', cardProperties: [] },
      }

      useBoardStore.getState().addBoard(board)
      useBoardStore.getState().updateBoard('board-1', {
        fields: { title: 'Updated', cardProperties: [] },
      } as Partial<Board>)

      expect(useBoardStore.getState().boards.get('board-1')?.fields.title).toBe('Updated')
    })

    it('should update updateAt timestamp when board is updated', async () => {
      const initialTime = Date.now()
      const board: Board = {
        id: 'board-1',
        workspaceId: 'ws-1',
        createdBy: 'user-1',
        createAt: initialTime,
        updateAt: initialTime,
        type: 'board',
        fields: { title: 'Test', cardProperties: [] },
      }

      useBoardStore.getState().addBoard(board)
      await new Promise((resolve) => setTimeout(resolve, 10))
      useBoardStore.getState().updateBoard('board-1', {
        fields: { title: 'Updated', cardProperties: [] },
      } as Partial<Board>)

      expect(useBoardStore.getState().boards.get('board-1')?.updateAt).toBeGreaterThan(initialTime)
    })

    it('should delete a board', () => {
      const board: Board = {
        id: 'board-1',
        workspaceId: 'ws-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'board',
        fields: { title: 'Test', cardProperties: [] },
      }

      useBoardStore.getState().addBoard(board)
      expect(useBoardStore.getState().boards.get('board-1')).toBeDefined()

      useBoardStore.getState().deleteBoard('board-1')
      expect(useBoardStore.getState().boards.get('board-1')).toBeUndefined()
    })

    it('should set active board', () => {
      const board: Board = {
        id: 'board-1',
        workspaceId: 'ws-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'board',
        fields: { title: 'Test', cardProperties: [] },
      }

      useBoardStore.getState().addBoard(board)
      useBoardStore.getState().setActiveBoard(board)

      expect(useBoardStore.getState().activeBoard?.id).toBe('board-1')
    })

    it('should clear active board when deleted', () => {
      const board: Board = {
        id: 'board-1',
        workspaceId: 'ws-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'board',
        fields: { title: 'Test', cardProperties: [] },
      }

      useBoardStore.getState().addBoard(board)
      useBoardStore.getState().setActiveBoard(board)
      useBoardStore.getState().deleteBoard('board-1')

      expect(useBoardStore.getState().activeBoard).toBeNull()
    })
  })

  describe('Card Operations', () => {
    it('should add a card', () => {
      const card: Card = {
        id: 'card-1',
        workspaceId: 'ws-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'card',
        fields: { title: 'Task 1', properties: {} },
      }

      useBoardStore.getState().addCard(card)

      expect(useBoardStore.getState().cards.get('card-1')).toBeDefined()
      expect(useBoardStore.getState().cards.get('card-1')?.fields.title).toBe('Task 1')
    })

    it('should update a card', () => {
      const card: Card = {
        id: 'card-1',
        workspaceId: 'ws-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'card',
        fields: { title: 'Task 1', properties: {} },
      }

      useBoardStore.getState().addCard(card)
      useBoardStore.getState().updateCard('card-1', {
        fields: { title: 'Updated Task', properties: {} },
      } as Partial<Card>)

      expect(useBoardStore.getState().cards.get('card-1')?.fields.title).toBe('Updated Task')
    })

    it('should update updateAt timestamp when card is updated', async () => {
      const initialTime = Date.now()
      const card: Card = {
        id: 'card-1',
        workspaceId: 'ws-1',
        createdBy: 'user-1',
        createAt: initialTime,
        updateAt: initialTime,
        type: 'card',
        fields: { title: 'Task 1', properties: {} },
      }

      useBoardStore.getState().addCard(card)
      await new Promise((resolve) => setTimeout(resolve, 10))
      useBoardStore
        .getState()
        .updateCard('card-1', { fields: { title: 'Updated', properties: {} } } as Partial<Card>)

      expect(useBoardStore.getState().cards.get('card-1')?.updateAt).toBeGreaterThan(initialTime)
    })

    it('should delete a card', () => {
      const card: Card = {
        id: 'card-1',
        workspaceId: 'ws-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'card',
        fields: { title: 'Task 1', properties: {} },
      }

      useBoardStore.getState().addCard(card)
      expect(useBoardStore.getState().cards.get('card-1')).toBeDefined()

      useBoardStore.getState().deleteCard('card-1')
      expect(useBoardStore.getState().cards.get('card-1')).toBeUndefined()
    })

    it('should add multiple cards', () => {
      const cards: Card[] = [
        {
          id: 'card-1',
          workspaceId: 'ws-1',
          createdBy: 'user-1',
          createAt: Date.now(),
          updateAt: Date.now(),
          type: 'card',
          fields: { title: 'Task 1', properties: {} },
        },
        {
          id: 'card-2',
          workspaceId: 'ws-1',
          createdBy: 'user-1',
          createAt: Date.now(),
          updateAt: Date.now(),
          type: 'card',
          fields: { title: 'Task 2', properties: {} },
        },
      ]

      useBoardStore.getState().addCards(cards)

      expect(useBoardStore.getState().cards.size).toBe(2)
      expect(useBoardStore.getState().cards.get('card-1')).toBeDefined()
      expect(useBoardStore.getState().cards.get('card-2')).toBeDefined()
    })

    it('should batch update cards', () => {
      const cards: Card[] = [
        {
          id: 'card-1',
          workspaceId: 'ws-1',
          createdBy: 'user-1',
          createAt: Date.now(),
          updateAt: Date.now(),
          type: 'card',
          fields: { title: 'Task 1', properties: {} },
        },
        {
          id: 'card-2',
          workspaceId: 'ws-1',
          createdBy: 'user-1',
          createAt: Date.now(),
          updateAt: Date.now(),
          type: 'card',
          fields: { title: 'Task 2', properties: {} },
        },
      ]

      useBoardStore.getState().addCards(cards)
      useBoardStore.getState().updateCards({
        'card-1': { fields: { title: 'Updated 1', properties: {} } } as Partial<Card>,
        'card-2': { fields: { title: 'Updated 2', properties: {} } } as Partial<Card>,
      })

      expect(useBoardStore.getState().cards.get('card-1')?.fields.title).toBe('Updated 1')
      expect(useBoardStore.getState().cards.get('card-2')?.fields.title).toBe('Updated 2')
    })

    it('should not update non-existent card', () => {
      useBoardStore.getState().updateCard('non-existent', {
        fields: { title: 'Updated', properties: {} },
      } as Partial<Card>)

      expect(useBoardStore.getState().cards.get('non-existent')).toBeUndefined()
    })
  })

  describe('View Operations', () => {
    it('should add a view', () => {
      const view: View = {
        id: 'view-1',
        workspaceId: 'ws-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'view',
        fields: {
          viewType: 'board',
          title: 'Test View',
          sortOptions: [],
          visiblePropertyIds: [],
          filter: { filters: [], operator: 'and' },
          cardOrder: [],
          columnWidths: {},
        },
      }

      useBoardStore.getState().addView(view)

      expect(useBoardStore.getState().views.get('view-1')).toBeDefined()
      expect(useBoardStore.getState().views.get('view-1')?.fields.title).toBe('Test View')
    })

    it('should update a view', () => {
      const view: View = {
        id: 'view-1',
        workspaceId: 'ws-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'view',
        fields: {
          viewType: 'board',
          title: 'Test View',
          sortOptions: [],
          visiblePropertyIds: [],
          filter: { filters: [], operator: 'and' },
          cardOrder: [],
          columnWidths: {},
        },
      }

      useBoardStore.getState().addView(view)
      useBoardStore.getState().updateView('view-1', {
        fields: {
          viewType: 'board',
          title: 'Updated View',
          sortOptions: [],
          visiblePropertyIds: [],
          filter: { filters: [], operator: 'and' },
          cardOrder: [],
          columnWidths: {},
        },
      } as Partial<View>)

      expect(useBoardStore.getState().views.get('view-1')?.fields.title).toBe('Updated View')
    })

    it('should delete a view', () => {
      const view: View = {
        id: 'view-1',
        workspaceId: 'ws-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'view',
        fields: {
          viewType: 'board',
          title: 'Test View',
          sortOptions: [],
          visiblePropertyIds: [],
          filter: { filters: [], operator: 'and' },
          cardOrder: [],
          columnWidths: {},
        },
      }

      useBoardStore.getState().addView(view)
      expect(useBoardStore.getState().views.get('view-1')).toBeDefined()

      useBoardStore.getState().deleteView('view-1')
      expect(useBoardStore.getState().views.get('view-1')).toBeUndefined()
    })

    it('should set active view', () => {
      const view: View = {
        id: 'view-1',
        workspaceId: 'ws-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'view',
        fields: {
          viewType: 'board',
          title: 'Test View',
          sortOptions: [],
          visiblePropertyIds: [],
          filter: { filters: [], operator: 'and' },
          cardOrder: [],
          columnWidths: {},
        },
      }

      useBoardStore.getState().addView(view)
      useBoardStore.getState().setActiveView(view)

      expect(useBoardStore.getState().activeView?.id).toBe('view-1')
    })

    it('should clear active view when deleted', () => {
      const view: View = {
        id: 'view-1',
        workspaceId: 'ws-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'view',
        fields: {
          viewType: 'board',
          title: 'Test View',
          sortOptions: [],
          visiblePropertyIds: [],
          filter: { filters: [], operator: 'and' },
          cardOrder: [],
          columnWidths: {},
        },
      }

      useBoardStore.getState().addView(view)
      useBoardStore.getState().setActiveView(view)
      useBoardStore.getState().deleteView('view-1')

      expect(useBoardStore.getState().activeView).toBeNull()
    })
  })

  describe('Query Methods', () => {
    beforeEach(() => {
      const cards: Card[] = [
        {
          id: 'card-1',
          workspaceId: 'ws-1',
          createdBy: 'user-1',
          createAt: Date.now(),
          updateAt: Date.now(),
          type: 'card',
          fields: { title: 'Task 1', properties: { status: 'TODO' } },
        },
        {
          id: 'card-2',
          workspaceId: 'ws-1',
          createdBy: 'user-1',
          createAt: Date.now(),
          updateAt: Date.now(),
          type: 'card',
          fields: { title: 'Task 2', properties: { status: 'DONE' } },
        },
        {
          id: 'card-3',
          workspaceId: 'ws-1',
          createdBy: 'user-1',
          createAt: Date.now(),
          updateAt: Date.now(),
          type: 'card',
          fields: { title: 'Task 3', properties: { status: 'TODO' } },
        },
      ]

      useBoardStore.getState().addCards(cards)
    })

    it('should get cards by property value', () => {
      const todoCards = useBoardStore.getState().getCardsByProperty('status', 'TODO')
      expect(todoCards).toHaveLength(2)
      expect(todoCards[0].id).toBe('card-1')
      expect(todoCards[1].id).toBe('card-3')
    })

    it('should return empty array for non-existent property value', () => {
      const result = useBoardStore.getState().getCardsByProperty('status', 'NON_EXISTENT')
      expect(result).toHaveLength(0)
    })

    it('should get board cards', () => {
      const boardCards = useBoardStore.getState().getBoardCards('card-1')
      expect(boardCards).toHaveLength(1)
      expect(boardCards[0].id).toBe('card-1')
    })
  })

  describe('View State Management', () => {
    it('should update view state', () => {
      useBoardStore.getState().updateViewState('view-1', { scrollPosition: 100 })

      const state = useBoardStore.getState()
      expect(state.viewStates['view-1']).toBeDefined()
      expect(state.viewStates['view-1']?.scrollPosition).toBe(100)
    })

    it('should merge view state updates', () => {
      useBoardStore.getState().updateViewState('view-1', { scrollPosition: 100 })
      useBoardStore.getState().updateViewState('view-1', { expandedCardIds: ['card-1'] })

      const state = useBoardStore.getState()
      expect(state.viewStates['view-1']?.scrollPosition).toBe(100)
      expect(state.viewStates['view-1']?.expandedCardIds).toEqual(['card-1'])
    })
  })

  describe('Clear All', () => {
    it('should clear all data', () => {
      const board: Board = {
        id: 'board-1',
        workspaceId: 'ws-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'board',
        fields: { title: 'Test', cardProperties: [] },
      }

      const card: Card = {
        id: 'card-1',
        workspaceId: 'ws-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'card',
        fields: { title: 'Task 1', properties: {} },
      }

      useBoardStore.getState().addBoard(board)
      useBoardStore.getState().addCard(card)
      useBoardStore.getState().setActiveBoard(board)

      useBoardStore.getState().clearAll()

      expect(useBoardStore.getState().boards.size).toBe(0)
      expect(useBoardStore.getState().cards.size).toBe(0)
      expect(useBoardStore.getState().activeBoard).toBeNull()
    })
  })
})
