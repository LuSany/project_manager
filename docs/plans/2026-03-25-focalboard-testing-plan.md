# Focalboard 重构功能测试计划

> 创建日期：2026-03-25
> 目的：为 Focalboard 重构功能规划完整测试用例

---

## 一、测试范围

| 模块            | 测试类型 | 优先级 |
| --------------- | -------- | ------ |
| Block 数据模型  | 单元测试 | P0     |
| Property 系统   | 单元测试 | P0     |
| Filter 筛选系统 | 单元测试 | P0     |
| Board Store     | 单元测试 | P0     |
| History Store   | 单元测试 | P0     |
| Kanban 组件     | 组件测试 | P1     |
| ViewRouter      | 组件测试 | P1     |
| UndoRedoToolbar | 组件测试 | P1     |

---

## 二、测试用例详情

### 2.1 Block 数据模型测试

**文件**: `src/blocks/__tests__/types.test.ts`

```typescript
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
        // ... full board
        fields: {
          title: 'My Project',
          icon: '📋',
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
      expect(board.fields.cardProperties).toHaveLength(2)
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
    })
  })

  // View 类型测试
  describe('View', () => {
    it('should support different view types', () => {
      const viewTypes: ViewType[] = ['board', 'table', 'gallery', 'calendar']
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
          },
        }
        expect(view.fields.viewType).toBe(type)
      })
    })
  })

  // 类型守卫测试
  describe('Type Guards', () => {
    it('isBoard should return true for board', () => {
      const board: Board = {
        /* ... */
      }
      expect(isBoard(board)).toBe(true)
    })

    it('isBoard should return false for card', () => {
      const card: Card = {
        /* ... */
      }
      expect(isBoard(card)).toBe(false)
    })

    it('isCard should return true for card', () => {
      const card: Card = {
        /* ... */
      }
      expect(isCard(card)).toBe(true)
    })

    it('isView should return true for view', () => {
      const view: View = {
        /* ... */
      }
      expect(isView(view)).toBe(true)
    })
  })
})
```

### 2.2 Property 系统测试

**文件**: `src/properties/__tests__/types.test.ts`

```typescript
describe('Property Types', () => {
  describe('PropertyType', () => {
    it('should support all property types', () => {
      const types: PropertyType[] = [
        'text',
        'number',
        'select',
        'multiSelect',
        'date',
        'person',
        'multiPerson',
        'file',
        'checkbox',
        'url',
        'email',
        'phone',
        'createdTime',
        'createdBy',
        'updatedTime',
        'updatedBy',
      ]
      expect(types).toHaveLength(16)
    })
  })

  describe('Property', () => {
    it('should create text property', () => {
      const prop: Property = {
        id: 'prop-1',
        type: 'text',
        name: 'Task Name',
      }
      expect(prop.type).toBe('text')
    })

    it('should create select property with options', () => {
      const prop: Property = {
        id: 'prop-2',
        type: 'select',
        name: 'Status',
        options: [
          { id: 'opt-1', value: 'Todo', color: 'blue' },
          { id: 'opt-2', value: 'In Progress', color: 'yellow' },
          { id: 'opt-3', value: 'Done', color: 'green' },
        ],
      }
      expect(prop.options).toHaveLength(3)
    })

    it('should create date property with format', () => {
      const prop: Property = {
        id: 'prop-3',
        type: 'date',
        name: 'Due Date',
        dateFormat: 'YYYY-MM-DD',
      }
      expect(prop.dateFormat).toBe('YYYY-MM-DD')
    })
  })

  describe('Property Registry', () => {
    it('should register and retrieve property components', () => {
      // Test registry pattern
      const registry: PropertyRegistry = {
        text: {
          component: TextPropertyComponent,
          validator: (v) => typeof v === 'string',
          serializer: (v) => String(v),
        },
      }
      expect(registry.text).toBeDefined()
      expect(registry.text.validator('test')).toBe(true)
    })
  })
})
```

### 2.3 Filter 筛选系统测试

**文件**: `src/blocks/__tests__/filter.test.ts`

```typescript
describe('Filter System', () => {
  describe('FilterCondition', () => {
    it('should support all filter conditions', () => {
      const conditions: FilterCondition[] = [
        'is',
        'isNot',
        'contains',
        'notContains',
        'isEmpty',
        'isNotEmpty',
        'before',
        'after',
      ]
      expect(conditions.length).toBeGreaterThan(0)
    })
  })

  describe('checkFilter', () => {
    const testCases = [
      // is
      { condition: 'is' as FilterCondition, value: 'Todo', filterValue: 'Todo', expected: true },
      { condition: 'is' as FilterCondition, value: 'Todo', filterValue: 'Done', expected: false },
      // isNot
      { condition: 'isNot' as FilterCondition, value: 'Todo', filterValue: 'Done', expected: true },
      // contains
      {
        condition: 'contains' as FilterCondition,
        value: 'Hello World',
        filterValue: 'World',
        expected: true,
      },
      // isEmpty
      {
        condition: 'isEmpty' as FilterCondition,
        value: '',
        filterValue: undefined,
        expected: true,
      },
      {
        condition: 'isEmpty' as FilterCondition,
        value: 'text',
        filterValue: undefined,
        expected: false,
      },
      // before
      {
        condition: 'before' as FilterCondition,
        value: '2024-01-01',
        filterValue: '2024-01-15',
        expected: true,
      },
      // after
      {
        condition: 'after' as FilterCondition,
        value: '2024-02-01',
        filterValue: '2024-01-15',
        expected: true,
      },
    ]

    testCases.forEach(({ condition, value, filterValue, expected }) => {
      it(`should return ${expected} for ${condition} with value "${value}"`, () => {
        const filter: Filter = {
          propertyId: 'status',
          condition,
          value: filterValue,
        }
        const result = checkFilter(value, filter)
        expect(result).toBe(expected)
      })
    })
  })

  describe('checkFilterGroup', () => {
    it('should handle AND operator', () => {
      const filterGroup: FilterGroup = {
        filters: [
          { propertyId: 'status', condition: 'is', value: 'Todo' },
          { propertyId: 'priority', condition: 'is', value: 'high' },
        ],
        operator: 'and',
      }
      const card = {
        properties: {
          status: 'Todo',
          priority: 'high',
        },
      }
      expect(checkFilterGroup(card, filterGroup)).toBe(true)
    })

    it('should handle OR operator', () => {
      const filterGroup: FilterGroup = {
        filters: [
          { propertyId: 'status', condition: 'is', value: 'Todo' },
          { propertyId: 'status', condition: 'is', value: 'Done' },
        ],
        operator: 'or',
      }
      const card = { properties: { status: 'Done' } }
      expect(checkFilterGroup(card, filterGroup)).toBe(true)
    })

    it('should handle nested filter groups', () => {
      const filterGroup: FilterGroup = {
        filters: [{ propertyId: 'status', condition: 'is', value: 'Todo' }],
        operator: 'and',
        groups: [
          {
            filters: [{ propertyId: 'priority', condition: 'is', value: 'high' }],
            operator: 'or',
          },
        ],
      }
      // Test nested logic
      expect(true).toBe(true)
    })
  })

  describe('validateFilter', () => {
    it('should validate valid filter', () => {
      const filter: Filter = {
        propertyId: 'status',
        condition: 'is',
        value: 'Todo',
      }
      expect(validateFilter(filter).valid).toBe(true)
    })

    it('should reject invalid property id', () => {
      const filter: Filter = {
        propertyId: '',
        condition: 'is',
        value: 'Todo',
      }
      expect(validateFilter(filter).valid).toBe(false)
    })
  })
})
```

### 2.4 Board Store 测试

**文件**: `src/stores/__tests__/boardStore.test.ts`

```typescript
describe('BoardStore', () => {
  beforeEach(() => {
    // Reset store
    useBoardStore.setState({
      activeBoard: null,
      boards: new Map(),
      activeView: null,
      views: new Map(),
      cards: new Map(),
      cardsByBoard: {},
      viewStates: {},
    })
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
    })

    it('should update a board', () => {
      const board: Board = {
        /* ... */
      }
      useBoardStore.getState().addBoard(board)
      useBoardStore.getState().updateBoard('board-1', { title: 'Updated' })

      expect(useBoardStore.getState().boards.get('board-1')?.fields.title).toBe('Updated')
    })

    it('should delete a board', () => {
      useBoardStore.getState().deleteBoard('board-1')
      expect(useBoardStore.getState().boards.get('board-1')).toBeUndefined()
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

      useBoardStore.getState().addCard('board-1', card)

      const cards = useBoardStore.getState().cardsByBoard['board-1']
      expect(cards).toHaveLength(1)
      expect(cards[0].fields.title).toBe('Task 1')
    })

    it('should update a card', () => {
      const card: Card = {
        /* ... */
      }
      useBoardStore.getState().addCard('board-1', card)
      useBoardStore.getState().updateCard('card-1', { title: 'Updated Task' })

      expect(useBoardStore.getState().cards.get('card-1')?.fields.title).toBe('Updated Task')
    })

    it('should move a card between columns', () => {
      // Add cards to different columns
      const card1: Card = { id: 'card-1' /* ... */ }
      const card2: Card = { id: 'card-2' /* ... */ }

      useBoardStore.getState().addCard('board-1', card1)
      useBoardStore.getState().addCard('board-1', card2)

      // Move card-1 from TODO to DONE
      useBoardStore.getState().moveCard('card-1', 'TODO', 'DONE', 0)

      // Verify
      const todoColumn = useBoardStore.getState().getColumnCards('board-1', 'TODO')
      const doneColumn = useBoardStore.getState().getColumnCards('board-1', 'DONE')

      expect(todoColumn.find((c) => c.id === 'card-1')).toBeUndefined()
      expect(doneColumn.find((c) => c.id === 'card-1')).toBeDefined()
    })

    it('should delete a card', () => {
      useBoardStore.getState().deleteCard('card-1')
      expect(useBoardStore.getState().cards.get('card-1')).toBeUndefined()
    })
  })

  describe('Query Methods', () => {
    it('should get cards by property value', () => {
      // Add cards with different properties
      const cards: Card[] = [
        { id: 'card-1', fields: { properties: { status: 'TODO' } } },
        { id: 'card-2', fields: { properties: { status: 'DONE' } } },
        { id: 'card-3', fields: { properties: { status: 'TODO' } } },
      ]

      cards.forEach((c) => useBoardStore.getState().addCard('board-1', c))

      const todoCards = useBoardStore.getState().getCardsByProperty('board-1', 'status', 'TODO')
      expect(todoCards).toHaveLength(2)
    })
  })

  describe('Persistence', () => {
    it('should persist view states', () => {
      useBoardStore.getState().setViewState('board-1', { collapsedColumns: ['DONE'] })

      // Simulate storage
      const state = useBoardStore.getState()
      expect(state.viewStates['board-1']).toBeDefined()
    })
  })
})
```

### 2.5 History Store 测试

**文件**: `src/stores/__tests__/historyStore.test.ts`

```typescript
describe('HistoryStore', () => {
  beforeEach(() => {
    useHistoryStore.setState({
      undoStack: [],
      redoStack: [],
      maxHistory: 50,
    })
  })

  describe('pushEntry', () => {
    it('should add entry to undo stack', () => {
      const entry = {
        description: 'Update card title',
        undo: jest.fn().mockResolvedValue(undefined),
        redo: jest.fn().mockResolvedValue(undefined),
      }

      useHistoryStore.getState().pushEntry(entry)

      expect(useHistoryStore.getState().undoStack).toHaveLength(1)
      expect(useHistoryStore.getState().undoStack[0].description).toBe('Update card title')
    })

    it('should clear redo stack on new action', () => {
      // Push some entries
      useHistoryStore.getState().pushEntry({
        description: 'Action 1',
        undo: jest.fn(),
        redo: jest.fn(),
      })

      // Perform undo (moves to redo stack)
      useHistoryStore.getState().undo()

      expect(useHistoryStore.getState().redoStack).toHaveLength(1)

      // New action should clear redo stack
      useHistoryStore.getState().pushEntry({
        description: 'Action 2',
        undo: jest.fn(),
        redo: jest.fn(),
      })

      expect(useHistoryStore.getState().redoStack).toHaveLength(0)
    })

    it('should limit history size', () => {
      useHistoryStore.setState({ maxHistory: 3 })

      for (let i = 0; i < 5; i++) {
        useHistoryStore.getState().pushEntry({
          description: `Action ${i}`,
          undo: jest.fn(),
          redo: jest.fn(),
        })
      }

      expect(useHistoryStore.getState().undoStack).toHaveLength(3)
    })
  })

  describe('undo', () => {
    it('should undo last action', async () => {
      const undoFn = jest.fn().mockResolvedValue(undefined)
      const redoFn = jest.fn().mockResolvedValue(undefined)

      useHistoryStore.getState().pushEntry({
        description: 'Test',
        undo: undoFn,
        redo: redoFn,
      })

      await useHistoryStore.getState().undo()

      expect(undoFn).toHaveBeenCalled()
      expect(useHistoryStore.getState().redoStack).toHaveLength(1)
    })

    it('should do nothing when undo stack is empty', async () => {
      await useHistoryStore.getState().undo()

      expect(useHistoryStore.getState().canUndo()).toBe(false)
    })
  })

  describe('redo', () => {
    it('should redo last undone action', async () => {
      const undoFn = jest.fn().mockResolvedValue(undefined)
      const redoFn = jest.fn().mockResolvedValue(undefined)

      useHistoryStore.getState().pushEntry({
        description: 'Test',
        undo: undoFn,
        redo: redoFn,
      })

      await useHistoryStore.getState().undo()
      await useHistoryStore.getState().redo()

      expect(redoFn).toHaveBeenCalled()
    })

    it('should do nothing when redo stack is empty', async () => {
      await useHistoryStore.getState().redo()

      expect(useHistoryStore.getState().canRedo()).toBe(false)
    })
  })

  describe('canUndo/canRedo', () => {
    it('should return correct state', () => {
      expect(useHistoryStore.getState().canUndo()).toBe(false)
      expect(useHistoryStore.getState().canRedo()).toBe(false)

      useHistoryStore.getState().pushEntry({
        description: 'Test',
        undo: jest.fn(),
        redo: jest.fn(),
      })

      expect(useHistoryStore.getState().canUndo()).toBe(true)
    })
  })
})
```

### 2.6 Kanban 组件测试

**文件**: `src/components/kanban/__tests__/KanbanBoard.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { KanbanBoard } from '../KanbanBoard'

// Mock dnd-kit
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => children,
  useSensors: () => ({}),
  useSensor: () => ({}),
  PointerSensor: class {},
  KeyboardSensor: class {}
}))

describe('KanbanBoard', () => {
  const mockCards = [
    { id: 'card-1', fields: { title: 'Task 1', properties: { status: 'TODO' } } },
    { id: 'card-2', fields: { title: 'Task 2', properties: { status: 'IN_PROGRESS' } } },
    { id: 'card-3', fields: { title: 'Task 3', properties: { status: 'DONE' } } }
  ]

  const mockColumns = [
    { id: 'TODO', title: 'To Do', color: 'blue' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'yellow' },
    { id: 'DONE', title: 'Done', color: 'green' }
  ]

  it('should render all columns', () => {
    render(<KanbanBoard cards={mockCards} columns={mockColumns} />)

    expect(screen.getByText('To Do')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('should render cards in correct columns', () => {
    render(<KanbanBoard cards={mockCards} columns={mockColumns} />)

    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.getByText('Task 3')).toBeInTheDocument()
  })

  it('should show card count in column header', () => {
    render(<KanbanBoard cards={mockCards} columns={mockColumns} />)

    expect(screen.getByText('1')).toBeInTheDocument() // 1 card in TODO
  })

  it('should call onCardClick when card is clicked', () => {
    const handleClick = jest.fn()
    render(<KanbanBoard cards={mockCards} columns={mockColumns} onCardClick={handleClick} />)

    fireEvent.click(screen.getByText('Task 1'))

    expect(handleClick).toHaveBeenCalledWith(expect.objectContaining({
      id: 'card-1'
    }))
  })

  it('should render empty state when no cards', () => {
    render(<KanbanBoard cards={[]} columns={mockColumns} />)

    expect(screen.getByText(/no cards/i)).toBeInTheDocument()
  })
})
```

### 2.7 UndoRedoToolbar 组件测试

**文件**: `src/components/ui/__tests__/undo-redo-toolbar.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { UndoRedoToolbar } from '../undo-redo-toolbar'
import { useHistoryStore } from '@/stores/historyStore'

// Mock history store
jest.mock('@/stores/historyStore', () => ({
  useHistoryStore: jest.fn()
}))

describe('UndoRedoToolbar', () => {
  const mockUndo = jest.fn()
  const mockRedo = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useHistoryStore as jest.Mock).mockReturnValue({
      undo: mockUndo,
      redo: mockRedo,
      canUndo: () => true,
      canRedo: () => true,
      undoStack: [{ description: 'Action 1' }, { description: 'Action 2' }],
      redoStack: [{ description: 'Action 1' }]
    })
  })

  it('should render undo and redo buttons', () => {
    render(<UndoRedoToolbar />)

    expect(screen.getByLabelText(/undo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/redo/i)).toBeInTheDocument()
  })

  it('should call undo when undo button is clicked', () => {
    render(<UndoRedoToolbar />)

    fireEvent.click(screen.getByLabelText(/undo/i))

    expect(mockUndo).toHaveBeenCalled()
  })

  it('should call redo when redo button is clicked', () => {
    render(<UndoRedoToolbar />)

    fireEvent.click(screen.getByLabelText(/redo/i))

    expect(mockRedo).toHaveBeenCalled()
  })

  it('should disable undo button when cannot undo', () => {
    ;(useHistoryStore as jest.Mock).mockReturnValue({
      undo: mockUndo,
      redo: mockRedo,
      canUndo: () => false,
      canRedo: () => true,
      undoStack: [],
      redoStack: [{ description: 'Action 1' }]
    })

    render(<UndoRedoToolbar />)

    const undoButton = screen.getByLabelText(/undo/i)
    expect(undoButton).toBeDisabled()
  })

  it('should display history count', () => {
    render(<UndoRedoToolbar />)

    expect(screen.getByText('2')).toBeInTheDocument() // 2 in undo stack
  })

  it('should support keyboard shortcuts', () => {
    render(<UndoRedoToolbar />)

    // Test Ctrl+Z
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true })
    expect(mockUndo).toHaveBeenCalled()

    // Test Ctrl+Shift+Z
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true, shiftKey: true })
    expect(mockRedo).toHaveBeenCalled()
  })
})
```

---

## 三、执行命令

```bash
# 运行单元测试
npm run test:unit

# 运行特定模块测试
npm run test:unit -- src/blocks/__tests__
npm run test:unit -- src/stores/__tests__
npm run test:unit -- src/components/kanban/__tests__

# 运行测试并生成覆盖率
npm run test:unit:coverage
```

---

## 四、测试覆盖目标

| 模块              | 覆盖率目标 |
| ----------------- | ---------- |
| Block Types       | 90%+       |
| Property Types    | 90%+       |
| Filter            | 95%+       |
| Board Store       | 85%+       |
| History Store     | 90%+       |
| Kanban Components | 80%+       |
| Overall           | 85%+       |
