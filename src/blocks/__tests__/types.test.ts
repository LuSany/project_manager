/**
 * Block 数据模型测试
 * 测试 Board、Card、View 类型及类型守卫
 */

import { describe, it, expect } from 'vitest'
import type { Block, Board, Card, View, SelectOption } from '../types'
import { isBoard, isCard, isView } from '../types'

describe('Block Types', () => {
  // Block 基础接口测试
  describe('Block', () => {
    it('should create a Block with required fields', () => {
      const block: Block = {
        id: 'block-1',
        workspaceId: 'workspace-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
      }
      expect(block.id).toBeDefined()
      expect(block.workspaceId).toBeDefined()
      expect(block.createdBy).toBeDefined()
      expect(block.createAt).toBeDefined()
      expect(block.updateAt).toBeDefined()
    })

    it('should allow optional deletedAt field', () => {
      const block: Block = {
        id: 'block-1',
        workspaceId: 'workspace-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        deletedAt: Date.now(),
      }
      expect(block.deletedAt).toBeDefined()
    })
  })

  // Board 类型测试
  describe('Board', () => {
    it('should create a Board with board type', () => {
      const board: Board = {
        id: 'board-1',
        workspaceId: 'workspace-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'board',
        fields: {
          title: 'Test Board',
          cardProperties: [],
        },
      }
      expect(board.type).toBe('board')
      expect(board.fields.title).toBe('Test Board')
    })

    it('should validate board fields', () => {
      const board: Board = {
        id: 'board-1',
        workspaceId: 'workspace-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'board',
        fields: {
          title: 'My Project',
          icon: '📋',
          description: 'Project description',
          cardProperties: [
            { id: 'prop-1', type: 'text', name: 'Title' },
            {
              id: 'prop-2',
              type: 'select',
              name: 'Status',
              options: [{ id: 'opt-1', value: 'Todo', color: 'blue' }],
            },
          ],
        },
      }
      expect(board.fields.title).toBe('My Project')
      expect(board.fields.icon).toBe('📋')
      expect(board.fields.description).toBe('Project description')
      expect(board.fields.cardProperties).toHaveLength(2)
    })

    it('should support optional board fields', () => {
      const board: Board = {
        id: 'board-1',
        workspaceId: 'workspace-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'board',
        fields: {
          title: 'Test Board',
          cardProperties: [],
          defaultViewId: 'view-1',
          showDescription: true,
          isPublic: false,
        },
      }
      expect(board.fields.defaultViewId).toBe('view-1')
      expect(board.fields.showDescription).toBe(true)
      expect(board.fields.isPublic).toBe(false)
    })
  })

  // Card 类型测试
  describe('Card', () => {
    it('should create a Card with properties', () => {
      const card: Card = {
        id: 'card-1',
        workspaceId: 'workspace-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'card',
        fields: {
          title: 'Task 1',
          properties: {
            status: 'TODO',
            priority: 'high',
            assignee: 'user-1',
          },
        },
      }
      expect(card.fields.title).toBe('Task 1')
      expect(card.fields.properties.status).toBe('TODO')
      expect(card.fields.properties.priority).toBe('high')
    })

    it('should support optional card fields', () => {
      const card: Card = {
        id: 'card-1',
        workspaceId: 'workspace-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'card',
        fields: {
          title: 'Task 1',
          content: { type: 'text', text: 'Card content' } as any,
          properties: { status: 'TODO' },
          parentId: 'card-0',
          assignees: ['user-1', 'user-2'],
          dueDate: Date.now() + 86400000,
          labels: ['label-1', 'label-2'],
        },
      }
      expect(card.fields.content).toBeDefined()
      expect(card.fields.parentId).toBe('card-0')
      expect(card.fields.assignees).toHaveLength(2)
      expect(card.fields.dueDate).toBeDefined()
      expect(card.fields.labels).toHaveLength(2)
    })

    it('should handle empty properties', () => {
      const card: Card = {
        id: 'card-1',
        workspaceId: 'workspace-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'card',
        fields: {
          title: 'Task 1',
          properties: {},
        },
      }
      expect(Object.keys(card.fields.properties)).toHaveLength(0)
    })
  })

  // View 类型测试
  describe('View', () => {
    it('should support different view types', () => {
      const viewTypes = ['board', 'table', 'gallery', 'calendar'] as const

      viewTypes.forEach((type) => {
        const view: View = {
          id: 'view-1',
          workspaceId: 'workspace-1',
          createdBy: 'user-1',
          createAt: Date.now(),
          updateAt: Date.now(),
          type: 'view',
          fields: {
            viewType: type,
            title: `${type} view`,
            sortOptions: [],
            visiblePropertyIds: [],
            filter: { filters: [], operator: 'and' },
            cardOrder: [],
            columnWidths: {},
          },
        }
        expect(view.fields.viewType).toBe(type)
        expect(view.fields.title).toBe(`${type} view`)
      })
    })

    it('should support view grouping and filtering', () => {
      const view: View = {
        id: 'view-1',
        workspaceId: 'workspace-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'view',
        fields: {
          viewType: 'board',
          title: 'Grouped View',
          groupById: 'status',
          dateDisplayPropertyId: 'dueDate',
          sortOptions: [
            { propertyId: 'priority', ascending: false },
            { propertyId: 'title', ascending: true },
          ],
          visiblePropertyIds: ['title', 'status', 'priority'],
          filter: {
            filters: [{ propertyId: 'status', condition: 'is', value: 'TODO' }],
            operator: 'and',
          },
          cardOrder: ['card-1', 'card-2'],
          columnWidths: {
            title: 200,
            status: 150,
          },
        },
      }
      expect(view.fields.groupById).toBe('status')
      expect(view.fields.dateDisplayPropertyId).toBe('dueDate')
      expect(view.fields.sortOptions).toHaveLength(2)
      expect(view.fields.visiblePropertyIds).toHaveLength(3)
      expect(view.fields.filter.filters).toHaveLength(1)
      expect(view.fields.cardOrder).toHaveLength(2)
      expect(view.fields.columnWidths.title).toBe(200)
    })

    it('should handle minimal view configuration', () => {
      const view: View = {
        id: 'view-1',
        workspaceId: 'workspace-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'view',
        fields: {
          viewType: 'table',
          title: 'Simple View',
          sortOptions: [],
          visiblePropertyIds: [],
          filter: { filters: [], operator: 'and' },
          cardOrder: [],
          columnWidths: {},
        },
      }
      expect(view.fields.viewType).toBe('table')
      expect(view.fields.groupById).toBeUndefined()
    })
  })

  // SortOption 测试
  describe('SortOption', () => {
    it('should define ascending sort', () => {
      const sortOption = { propertyId: 'title', ascending: true }
      expect(sortOption.propertyId).toBe('title')
      expect(sortOption.ascending).toBe(true)
    })

    it('should define descending sort', () => {
      const sortOption = { propertyId: 'priority', ascending: false }
      expect(sortOption.ascending).toBe(false)
    })
  })

  // SelectOption 测试
  describe('SelectOption', () => {
    it('should create select option with value and color', () => {
      const option: SelectOption = {
        id: 'opt-1',
        value: 'Done',
        color: 'green',
      }
      expect(option.id).toBe('opt-1')
      expect(option.value).toBe('Done')
      expect(option.color).toBe('green')
    })

    it('should allow select option without color', () => {
      const option: SelectOption = { id: 'opt-1', value: 'Done' }
      expect(option.color).toBeUndefined()
    })
  })

  // 类型守卫测试
  describe('Type Guards', () => {
    it('isBoard should return true for board', () => {
      const board: Board = {
        id: 'board-1',
        workspaceId: 'workspace-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'board',
        fields: { title: 'Test Board', cardProperties: [] },
      }
      expect(isBoard(board)).toBe(true)
    })

    it('isBoard should return false for card', () => {
      const card: Card = {
        id: 'card-1',
        workspaceId: 'workspace-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'card',
        fields: { title: 'Task 1', properties: {} },
      }
      expect(isBoard(card)).toBe(false)
    })

    it('isBoard should return false for view', () => {
      const view: View = {
        id: 'view-1',
        workspaceId: 'workspace-1',
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
      expect(isBoard(view)).toBe(false)
    })

    it('isCard should return true for card', () => {
      const card: Card = {
        id: 'card-1',
        workspaceId: 'workspace-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'card',
        fields: { title: 'Task 1', properties: {} },
      }
      expect(isCard(card)).toBe(true)
    })

    it('isCard should return false for board', () => {
      const board: Board = {
        id: 'board-1',
        workspaceId: 'workspace-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'board',
        fields: { title: 'Test Board', cardProperties: [] },
      }
      expect(isCard(board)).toBe(false)
    })

    it('isView should return true for view', () => {
      const view: View = {
        id: 'view-1',
        workspaceId: 'workspace-1',
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
      expect(isView(view)).toBe(true)
    })

    it('isView should return false for board', () => {
      const board: Board = {
        id: 'board-1',
        workspaceId: 'workspace-1',
        createdBy: 'user-1',
        createAt: Date.now(),
        updateAt: Date.now(),
        type: 'board',
        fields: { title: 'Test Board', cardProperties: [] },
      }
      expect(isView(board)).toBe(false)
    })

    it('type guard should narrow type correctly', () => {
      const blocks: Block[] = [
        {
          id: 'board-1',
          workspaceId: 'workspace-1',
          createdBy: 'user-1',
          createAt: Date.now(),
          updateAt: Date.now(),
        },
        {
          id: 'card-1',
          workspaceId: 'workspace-1',
          createdBy: 'user-1',
          createAt: Date.now(),
          updateAt: Date.now(),
        },
      ]

      const boards = blocks.filter(isBoard)
      const cards = blocks.filter(isCard)

      expect(boards).toHaveLength(0)
      expect(cards).toHaveLength(0)
    })
  })
})
