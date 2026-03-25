# 项目管理系统 Focalboard 风格重构设计文档

> 创建日期：2026-03-25
> 目的：系统性借鉴 Focalboard 架构设计，重构项目管理系统前端
> 目标：彻底重构（前后端数据模型 + 前端完整重建）

---

## 一、重构愿景

### 1.1 核心目标

将当前项目管理系统重构为类似 Focalboard/Linear 的现代化项目管理工具，具备：

- **统一的数据模型** - Block 模式抽象所有实体
- **多视图切换** - 看板/列表/日历/画廊无缝切换
- **流畅的拖拽交互** - 卡片拖拽排序、跨列移动
- **属性系统插件化** - 16+ 属性类型按需加载
- **命令面板** - Cmd+K 快速导航
- **撤销/重做** - 完整的操作历史管理

### 1.2 与 Focalboard 的对比

| 特性     | Focalboard         | 当前项目（重构后）       |
| -------- | ------------------ | ------------------------ |
| 框架     | React 17 + Webpack | Next.js 15 (App Router)  |
| 状态     | Redux Toolkit      | Zustand + TanStack Query |
| 样式     | SCSS               | Tailwind CSS 4           |
| 拖拽     | React DnD          | @dnd-kit (更现代)        |
| 国际化   | 46+ 语言           | 按需集成                 |
| 数据模型 | Block 模式         | Block 模式               |

---

## 二、架构设计

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │
│  │   Kanban    │ │    List     │ │  Calendar   │ │  Gallery  │  │
│  │    View     │ │    View     │ │    View     │ │   View    │  │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────┬─────┘  │
│         │              │              │               │        │
│         └──────────────┴──────────────┴───────────────┘        │
│                               │                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    View Controller                         │  │
│  │  - 视图切换逻辑                                            │  │
│  │  - 视图配置管理                                            │  │
│  │  - 筛选/排序/分组                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                        Business Layer                            │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │  Property      │  │    Mutator     │  │    History      │  │
│  │   System       │  │   (State Mgmt) │  │   (Undo/Redo)   │  │
│  │                │  │                │  │                │  │
│  │ - text         │  │ - 批量操作     │  │ - 操作记录      │  │
│  │ - number       │  │ - 乐观更新     │  │ - 撤销/重做     │  │
│  │ - select       │  │ - 错误回滚     │  │ - 时间旅行      │  │
│  │ - person       │  │                │  │                │  │
│  │ - date         │  │                │  │                │  │
│  │ - ...          │  │                │  │                │  │
│  └────────────────┘  └────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                          Data Layer                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Block Store (Zustand)                  │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────┐  │   │
│  │  │  Board  │ │   Card  │ │   View  │ │ Comment│ │ User │  │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └──────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                               │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   API Layer (TanStack Query)              │   │
│  │  - 数据缓存                                               │   │
│  │  - 乐观更新                                               │   │
│  │  - 后台同步                                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈

| 层级       | 技术选型              | 说明                |
| ---------- | --------------------- | ------------------- |
| 框架       | Next.js 15            | App Router, SSR/SSG |
| UI         | React 18              | 服务端组件          |
| 语言       | TypeScript 5.x        | 严格类型            |
| 样式       | Tailwind CSS 4        | OKLCH 色彩空间      |
| 组件库     | shadcn/ui             | 可定制组件          |
| 状态       | Zustand 5.x           | 客户端状态          |
| 服务端状态 | TanStack Query 5.x    | 数据缓存与同步      |
| 拖拽       | @dnd-kit              | 现代拖拽库          |
| 表单       | React Hook Form + Zod | 表单验证            |
| 动画       | Framer Motion         | 交互动画            |
| 测试       | Vitest + Playwright   | 单元 + E2E          |

---

## 三、数据模型设计

### 3.1 Block 架构

Focalboard 的核心设计是**统一的数据抽象**，所有实体都继承自 Block：

```typescript
// src/blocks/types.ts

// 基础 Block 接口
interface Block {
  id: string
  workspaceId: string
  createdBy: string
  createAt: number
  updateAt: number
  deletedAt?: number
}

// 项目 Block
interface Board extends Block {
  type: 'board'
  fields: BoardFields
}

interface BoardFields {
  title: string
  description?: string
  icon?: string
  cardProperties: Property[]
  defaultViewId?: string
  showDescription?: boolean
  isPublic?: boolean
}

// 任务/卡片 Block
interface Card extends Block {
  type: 'card'
  fields: CardFields
}

interface CardFields {
  title: string
  content?: JSON
  properties: Record<string, PropertyValue>
  parentId?: string
  assignees?: string[]
  dueDate?: number
  labels?: string[]
}

// 视图 Block
interface View extends Block {
  type: 'view'
  fields: ViewFields
}

type ViewType = 'board' | 'table' | 'gallery' | 'calendar'

interface ViewFields {
  viewType: ViewType
  title: string
  groupById?: string
  dateDisplayPropertyId?: string
  sortOptions: SortOption[]
  visiblePropertyIds: string[]
  filter: FilterGroup
  cardOrder: string[]
  columnWidths: Record<string, number>
}
```

### 3.2 属性系统

```typescript
// src/properties/types.ts

type PropertyType =
  | 'text' // 文本
  | 'number' // 数字
  | 'select' // 单选
  | 'multiSelect' // 多选
  | 'date' // 日期
  | 'person' // 人员
  | 'multiPerson' // 多人
  | 'file' // 文件
  | 'checkbox' // 复选框
  | 'url' // 链接
  | 'email' // 邮箱
  | 'phone' // 电话
  | 'createdTime' // 创建时间
  | 'createdBy' // 创建人
  | 'updatedTime' // 更新时间
  | 'updatedBy' // 更新人

interface Property {
  id: string
  type: PropertyType
  name: string
  options?: SelectOption[] // select/multiselect 用
  dateFormat?: string // 日期格式
  fullWidth?: boolean // 是否占满宽度
}

// 属性组件注册表
interface PropertyRegistry {
  [type: string]: {
    component: React.ComponentType<PropertyProps>
    validator: (value: any) => boolean
    serializer: (value: any) => string
  }
}
```

### 3.3 筛选系统

```typescript
// src/blocks/filter.ts

type FilterCondition =
  | 'is'
  | 'isNot'
  | 'contains'
  | 'notContains'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'before'
  | 'after'

interface Filter {
  propertyId: string
  condition: FilterCondition
  value: any
}

interface FilterGroup {
  filters: Filter[]
  operator: 'and' | 'or'
  groups?: FilterGroup[]
}
```

---

## 四、组件架构

### 4.1 组件层级

```
src/components/
├── blocks/                    # Block 渲染组件
│   ├── BoardView.tsx         # 看板主视图
│   ├── CardView.tsx          # 列表视图
│   ├── CalendarView.tsx      # 日历视图
│   └── GalleryView.tsx      # 画廊视图
│
├── kanban/                    # 看板组件
│   ├── KanbanBoard.tsx       # 看板容器
│   ├── KanbanColumn.tsx      # 列组件
│   ├── KanbanCard.tsx        # 卡片组件
│   └── KanbanCardModal.tsx   # 卡片详情弹窗
│
├── properties/                # 属性组件
│   ├── Property编辑组件...
│   └── index.ts              # 属性注册表
│
├── widgets/                  # 基础组件
│   ├── Button.tsx
│   ├── Input.tsx
│   └── ...
│
└── ui/                        # shadcn/ui 组件
    └── ...
```

### 4.2 多视图切换实现

```typescript
// src/components/blocks/ViewRouter.tsx
'use client'

import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { CardView } from '@/components/blocks/CardView'
import { CalendarView } from '@/components/blocks/CalendarView'
import { GalleryView } from '@/components/blocks/GalleryView'
import { useView } from '@/hooks/useView'

export function ViewRouter() {
  const { activeView, viewType } = useView()

  switch (viewType) {
    case 'board':
      return <KanbanBoard view={activeView} />
    case 'table':
      return <CardView view={activeView} />
    case 'calendar':
      return <CalendarView view={activeView} />
    case 'gallery':
      return <GalleryView view={activeView} />
    default:
      return <KanbanBoard view={activeView} />
  }
}
```

### 4.3 拖拽实现

```typescript
// src/hooks/useKanbanDragDrop.ts
'use client'

import { useCallback } from 'react'
import {
  DndContext,
  closestCorners,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'

export function useKanbanDragDrop<T extends { id: string }>(
  items: Record<string, T[]>,
  onReorder: (items: Record<string, T[]>) => void
) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (!over) return

      const sourceColumn = active.data.current?.columnId
      const destColumn = over.data.current?.columnId || over.id

      if (sourceColumn === destColumn) {
        // 同列排序
        const columnItems = items[sourceColumn]
        const oldIndex = columnItems.findIndex((i) => i.id === active.id)
        const newIndex = columnItems.findIndex((i) => i.id === over.id)

        const newItems = {
          ...items,
          [sourceColumn]: arrayMove(columnItems, oldIndex, newIndex),
        }
        onReorder(newItems)
      } else {
        // 跨列移动
        const sourceItems = [...items[sourceColumn]]
        const destItems = [...items[destColumn]]

        const [movedItem] = sourceItems.splice(
          sourceItems.findIndex((i) => i.id === active.id),
          1
        )
        destItems.push(movedItem)

        onReorder({
          ...items,
          [sourceColumn]: sourceItems,
          [destColumn]: destItems,
        })
      }
    },
    [items, onReorder]
  )

  return { sensors, handleDragEnd, DndContext }
}
```

---

## 五、状态管理

### 5.1 Zustand Store 结构

```typescript
// src/stores/boardStore.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { persist } from 'zustand/middleware'

interface BoardState {
  // 当前看板
  activeBoard: Board | null
  boards: Map<string, Board>

  // 视图
  activeView: View | null
  views: Map<string, View>

  // 卡片
  cards: Map<string, Card>
  cardsByBoard: Record<string, Card[]>

  // 视图状态
  viewStates: Record<string, ViewState>

  // 操作
  setActiveBoard: (board: Board) => void
  setActiveView: (view: View) => void
  addCard: (card: Card) => void
  updateCard: (id: string, updates: Partial<Card>) => void
  moveCard: (cardId: string, fromColumn: string, toColumn: string, newIndex: number) => void
  deleteCard: (id: string) => void
}

export const useBoardStore = create<BoardState>()(
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

        setActiveBoard: (board) => set({ activeBoard: board }),

        setActiveView: (view) => set({ activeView: view }),

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

        updateCard: (id, updates) =>
          set((state) => {
            const card = state.cards.get(id)
            if (!card) return state
            const updated = { ...card, ...updates, updateAt: Date.now() }
            return {
              cards: new Map(state.cards).set(id, updated),
            }
          }),

        moveCard: (cardId, fromColumn, toColumn, newIndex) =>
          set((state) => {
            // 实现卡片移动逻辑
            return state
          }),

        deleteCard: (id) =>
          set((state) => {
            const newCards = new Map(state.cards)
            newCards.delete(id)
            return { cards: newCards }
          }),
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
```

### 5.2 撤销/重做系统 (Mutator)

```typescript
// src/stores/historyStore.ts
import { create } from 'zustand'

interface HistoryEntry {
  id: string
  timestamp: number
  description: string
  undo: () => Promise<void>
  redo: () => Promise<void>
}

interface HistoryState {
  undoStack: HistoryEntry[]
  redoStack: HistoryEntry[]
  maxHistory: number

  pushEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void
  undo: () => Promise<void>
  redo: () => Promise<void>
  canUndo: () => boolean
  canRedo: () => boolean
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  maxHistory: 50,

  pushEntry: (entry) =>
    set((state) => ({
      undoStack: [
        ...state.undoStack.slice(-state.maxHistory + 1),
        {
          ...entry,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        },
      ],
      redoStack: [], // 新操作清除重做栈
    })),

  undo: async () => {
    const { undoStack } = get()
    const entry = undoStack[undoStack.length - 1]
    if (!entry) return

    await entry.undo()
    set((state) => ({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, entry],
    }))
  },

  redo: async () => {
    const { redoStack } = get()
    const entry = redoStack[redoStack.length - 1]
    if (!entry) return

    await entry.redo()
    set((state) => ({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, entry],
    }))
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,
}))
```

---

## 六、路由设计

### 6.1 URL 结构

```
/                                                # 首页/仪表盘
/boards                                         # 所有看板列表
/boards/:boardId                                # 看板视图
/boards/:boardId/:viewId                        # 指定视图
/boards/:boardId/:viewId/card/:cardId           # 卡片详情

# 兼容旧路由
/projects                                       # 项目列表 → 看板列表
/projects/:projectId/tasks                      # 任务看板
/projects/:projectId/reviews                    # 评审看板
/projects/:projectId/risks                      # 风险看板
```

### 6.2 路由组件

```typescript
// src/app/boards/[boardId]/page.tsx
import { BoardPage } from '@/components/BoardPage'

export default function Page({ params }: { params: { boardId: string } }) {
  return <BoardPage boardId={params.boardId} />
}
```

---

## 七、实施计划

### 7.1 阶段划分

#### 阶段一：数据模型重构（Week 1）

- [ ] 创建 Block 类型定义
- [ ] 创建 Property 系统
- [ ] 创建 Filter 系统
- [ ] 创建 Zustand store
- [ ] 创建 History store (撤销/重做)

#### 阶段二：组件层重构（Week 1-2）

- [ ] 重构 KanbanBoard 组件
- [ ] 创建多视图切换组件
- [ ] 实现 TableView 列表视图
- [ ] 实现 CalendarView 日历视图
- [ ] 实现 GalleryView 画廊视图

#### 阶段三：交互增强（Week 2）

- [ ] 集成 @dnd-kit 拖拽
- [ ] 实现卡片拖拽排序
- [ ] 实现跨列移动
- [ ] 添加拖拽动画

#### 阶段四：体验优化（Week 2-3）

- [ ] 添加命令面板 (Cmd+K)
- [ ] 添加快捷键支持
- [ ] 添加键盘导航
- [ ] 添加撤销/重做 UI
- [ ] 添加骨架屏加载状态
- [ ] 添加 Framer Motion 动画

### 7.2 文件变更清单

```
# 新建文件
src/
├── blocks/
│   ├── types.ts           # Block 类型定义
│   ├── board.ts           # 看板模型
│   ├── card.ts            # 卡片模型
│   ├── view.ts            # 视图模型
│   └── filter.ts          # 筛选模型
│
├── properties/
│   ├── types.ts           # 属性类型定义
│   ├── registry.ts        # 属性注册表
│   ├── text/              # 文本属性
│   ├── number/            # 数字属性
│   ├── select/            # 单选属性
│   ├── date/              # 日期属性
│   └── person/            # 人员属性
│
├── stores/
│   ├── boardStore.ts      # 看板状态
│   ├── historyStore.ts    # 历史记录
│   └── viewStore.ts       # 视图状态
│
├── hooks/
│   ├── useView.ts         # 视图切换
│   ├── useKanbanDragDrop.ts # 看板拖拽
│   ├── useHistory.ts      # 撤销/重做
│   └── useCommandPalette.ts # 命令面板
│
├── components/
│   ├── blocks/
│   │   ├── ViewRouter.tsx # 视图路由
│   │   ├── KanbanBoard.tsx
│   │   ├── CardView.tsx
│   │   ├── CalendarView.tsx
│   │   └── GalleryView.tsx
│   │
│   ├── kanban/
│   │   ├── KanbanColumn.tsx
│   │   ├── KanbanCard.tsx
│   │   └── KanbanCardModal.tsx
│   │
│   └── command-palette/
│       └── CommandPalette.tsx
│
└── app/
    └── boards/
        └── [boardId]/
            └── page.tsx   # 新路由

# 修改文件
src/
├── app/providers.tsx     # 添加 CommandPalette
├── lib/utils.ts          # 添加工具函数
├── stores/               # 整合到新 store
└── components/tasks/     # 重构为新架构
```

---

## 八、风险与对策

### 8.1 主要风险

| 风险         | 影响 | 对策                     |
| ------------ | ---- | ------------------------ |
| 数据迁移复杂 | 高   | 分阶段迁移，保持向后兼容 |
| 性能问题     | 中   | 使用虚拟列表优化大数据   |
| 测试覆盖     | 中   | TDD 优先编写测试         |
| 用户学习成本 | 低   | 提供迁移指南和教程       |

### 8.2 回滚计划

- 保留现有 API 路由
- 新旧组件并行运行
- 使用功能开关控制
- 随时可回滚到旧版本

---

## 九、验证标准

### 9.1 功能验收

- [ ] 看板视图正常显示和交互
- [ ] 列表/日历/画廊视图正常切换
- [ ] 卡片拖拽排序功能正常
- [ ] 跨列移动功能正常
- [ ] 命令面板 Cmd+K 正常打开
- [ ] 撤销/重做功能正常
- [ ] 骨架屏加载状态正常

### 9.2 性能验收

- [ ] 页面首屏加载 < 2s
- [ ] 拖拽操作响应 < 100ms
- [ ] 1000+ 卡片列表流畅滚动
- [ ] 无内存泄漏

### 9.3 兼容性验收

- [ ] Chrome/Firefox/Safari 正常
- [ ] 移动端基本可用
- [ ] 暗色/亮色主题正常

---

## 十、参考资源

- **Focalboard GitHub**: https://github.com/mattermost/focalboard
- **Focalboard Demo**: https://boards.focalboard.com
- **dnd-kit 文档**: https://docs.dndkit.com
- **TanStack Table**: https://tanstack.com/table
- **Framer Motion**: https://www.framer.com/motion

---

_本文档将作为重构工作的指导文件，后续根据实施情况持续更新。_
