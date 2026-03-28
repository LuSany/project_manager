# Phase 3: 列表与看板视图 - Research

**Researched:** 2026-03-26
**Domain:** 任务视图组件（列表视图、看板视图、任务详情抽屉）
**Confidence:** HIGH

## Summary

Phase 3 需要在现有的 TanStack Table 和 @dnd-kit 基础设施上构建完整的任务管理视图体验。项目已有成熟的看板组件（`KanbanBoard`, `KanbanCard`, `KanbanColumn`）和表格组件（`DataTable`），以及完整的任务 API（`/api/v1/tasks`）。主要工作是扩展列表视图功能（排序、筛选、分组、内联编辑）、增强看板视图交互、以及实现右侧任务详情抽屉。

**Primary recommendation:** 复用现有组件架构，列表视图扩展 TanStack Table 的列定义和分组功能，看板视图优化 TaskKanban 组件，任务详情抽屉使用 Sheet 组件 + Tab 切换模式。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 列表视图
- **D-01:** 列表显示字段采用「标准模式」— 任务名称、状态、优先级、截止日期、负责人、标签
- **D-02:** 分组支持三种维度 — 按状态分组、按优先级分组、按负责人分组
- **D-03:** 筛选 UI 采用「顶部筛选栏」— 在列表上方显示筛选栏，选择后显示条件标签
- **D-04:** 内联编辑采用「单击激活」— 单击字段即可编辑状态、优先级、截止日期等

#### 看板视图
- **D-05:** 看板卡片显示采用「标准模式」— 任务名称 + 状态 + 优先级 + 负责人头像
- **D-06:** 拖拽动画采用「平滑动画」— 拖动时卡片随鼠标平滑移动，其他卡片平滑让位
- **D-07:** 拖放行为采用「直接生效」— 拖到目标列即更改状态，无额外确认
- **D-08:** 快速编辑采用「卡片内内联编辑」— 卡片上的优先级、负责人可直接点击修改

#### 任务详情抽屉
- **D-09:** 抽屉位置采用「右侧抽屉」— 从右侧滑出，覆盖部分内容，不关闭可继续操作其他任务
- **D-10:** 抽屉包含四个 Tab — 详情 Tab、子任务 Tab、评论 Tab、标签 Tab

### Claude's Discretion
- 排序默认规则（建议：按优先级 > 截止日期）
- 列表视图分页或虚拟滚动
- 看板列顺序（建议：按状态流转顺序）
- 空状态提示文案

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TASK-01 | 列表视图，支持排序、筛选、分组、内联编辑 | TanStack Table v8 提供完整的排序、筛选、分组 API；现有 `DataTable` 组件已实现排序和筛选基础；需扩展分组功能和内联编辑 |
| TASK-02 | 看板视图，支持拖拽排序、跨列移动 | 现有 `TaskKanban` 组件已实现完整拖拽功能；需增强卡片内联编辑和视觉反馈 |
| TASK-05 | 任务详情抽屉，支持子任务、评论、标签、依赖 | 现有 `Sheet` 组件 + `SubTaskList` 组件可复用；需构建 Tab 切换架构和评论、标签模块 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-table | 8.21.3 | 列表视图核心 | 已安装，项目标准表格库，支持排序、筛选、分组、虚拟化 |
| @dnd-kit/core | 6.3.1 | 看板拖拽核心 | 已安装，React 拖拽标准库，性能优于 react-beautiful-dnd |
| @dnd-kit/sortable | 10.0.0 | 列表内拖拽排序 | 配合 @dnd-kit/core 使用，已安装 |
| zustand | 5.0.2 | 视图状态管理 | 已安装，项目标准状态管理库 |
| @tanstack/react-query | 5.62.0 | 服务端状态管理 | 已安装，已用于任务数据获取 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-select | 2.2.6 | 下拉选择（状态、优先级） | 内联编辑下拉选择 |
| @radix-ui/react-popover | 1.1.15 | 日期选择器弹窗 | 截止日期编辑 |
| react-day-picker | 9.13.2 | 日期选择 | 截止日期选择器 |
| lucide-react | 0.468.0 | 图标库 | 已安装，项目标准图标 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TanStack Table | AG Grid / Handsontable | AG Grid 功能更强但体积大，TanStack Table 更轻量且已集成 |
| @dnd-kit | react-beautiful-dnd | react-beautiful-dnd 已停止维护，@dnd-kit 更活跃且性能更好 |
| Sheet 抽屉 | Dialog 模态框 | Dialog 会阻断用户操作其他任务，Sheet 更符合需求 |

**Installation:**
无需安装新依赖，所有核心库已安装。

**Version verification:**
```bash
npm view @tanstack/react-table version  # 8.21.3 ✓
npm view @dnd-kit/core version          # 6.3.1 ✓
npm view @dnd-kit/sortable version      # 10.0.0 ✓
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── tasks/
│   │   ├── list/                    # 列表视图组件
│   │   │   ├── TaskList.tsx         # 列表主组件
│   │   │   ├── TaskListFilters.tsx  # 筛选栏
│   │   │   ├── TaskListColumns.tsx  # 列定义
│   │   │   └── InlineEditCell.tsx   # 内联编辑单元格
│   │   ├── kanban/                  # 看板视图组件
│   │   │   ├── TaskKanban.tsx       # 已有，增强
│   │   │   ├── KanbanCard.tsx       # 已有，增强内联编辑
│   │   │   └── KanbanInlineEdit.tsx # 新增：卡片内联编辑
│   │   └── detail/                  # 任务详情组件
│   │       ├── TaskDetailDrawer.tsx # 详情抽屉主组件
│   │       ├── DetailTab.tsx        # 详情 Tab
│   │       ├── SubTaskTab.tsx       # 子任务 Tab（复用 SubTaskList）
│   │       ├── CommentsTab.tsx      # 评论 Tab
│   │       └── TagsTab.tsx          # 标签 Tab
│   └── ui/
│       ├── data-table.tsx           # 已有，扩展
│       └── sheet.tsx                # 已有，直接使用
├── stores/
│   └── taskViewStore.ts             # 新增：视图状态管理
└── app/
    └── projects/[id]/tasks/
        └── page.tsx                 # 已有，修改视图切换逻辑
```

### Pattern 1: TanStack Table 列表视图

**What:** 使用 TanStack Table 的分组和排序功能实现任务列表视图

**When to use:** 列表视图实现（TASK-01）

**Example:**
```typescript
// Source: TanStack Table 官方文档 + 现有 data-table.tsx
import { useReactTable, getGroupedRowModel, getSortedRowModel } from '@tanstack/react-table'

const table = useReactTable({
  data: tasks,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getGroupedRowModel: getGroupedRowModel(), // 分组支持
  getSortedRowModel: getSortedRowModel(),   // 排序支持
  getFilteredRowModel: getFilteredRowModel(), // 筛选支持
  state: {
    grouping: [groupBy], // ['status'] | ['priority'] | ['assignee']
    sorting,
    columnFilters,
  },
  onGroupingChange: setGroupBy,
})

// 分组渲染
{table.getHeaderGroups().map(headerGroup => (
  <TableRow key={headerGroup.id}>
    {headerGroup.headers.map(header => (
      header.isPlaceholder ? null : (
        <TableHead key={header.id}>
          {flexRender(header.column.columnDef.header, header.getContext())}
        </TableHead>
      )
    ))}
  </TableRow>
))}
```

### Pattern 2: @dnd-kit 拖拽模式

**What:** 使用 @dnd-kit 的 DndContext + useDroppable 实现看板跨列拖拽

**When to use:** 看板视图拖拽（TASK-02）

**Example:**
```typescript
// Source: 现有 TaskKanban.tsx
import { DndContext, DragOverlay, useSensor, PointerSensor } from '@dnd-kit/core'

function TaskKanban({ projectId }) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // 防止误触
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const targetStatus = over.id as TaskStatus

    // 乐观更新
    updateStatusMutation.mutate({ taskId, status: targetStatus })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {/* 列渲染 */}
      <DragOverlay>
        {activeTask && <SortableTaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}
```

### Pattern 3: Sheet 右侧抽屉

**What:** 使用 Radix Dialog 封装的 Sheet 组件实现右侧滑出抽屉

**When to use:** 任务详情抽屉（TASK-05）

**Example:**
```typescript
// Source: 现有 sheet.tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

function TaskDetailDrawer({ taskId, open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[500px]">
        <SheetHeader>
          <SheetTitle>任务详情</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="detail">
          <TabsList>
            <TabsTrigger value="detail">详情</TabsTrigger>
            <TabsTrigger value="subtasks">子任务</TabsTrigger>
            <TabsTrigger value="comments">评论</TabsTrigger>
            <TabsTrigger value="tags">标签</TabsTrigger>
          </TabsList>

          <TabsContent value="detail">
            <DetailTab taskId={taskId} />
          </TabsContent>
          <TabsContent value="subtasks">
            <SubTaskList taskId={taskId} />
          </TabsContent>
          {/* ... */}
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
```

### Pattern 4: 内联编辑单元格

**What:** 使用 Popover + Select 实现单击激活的内联编辑

**When to use:** 列表视图内联编辑（TASK-01 D-04）

**Example:**
```typescript
// 内联状态编辑
function StatusCell({ task, onUpdate }) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1" onClick={() => setOpen(true)}>
          <TaskStatusBadge status={task.status} size="sm" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-40">
        <Select value={task.status} onValueChange={(value) => {
          onUpdate(task.id, { status: value })
          setOpen(false)
        }}>
          <SelectContent>
            {Object.entries(TASK_STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PopoverContent>
    </Popover>
  )
}
```

### Anti-Patterns to Avoid

- **反模式：在看板组件中直接调用 API** — 应通过 TanStack Query 的 mutation 和乐观更新模式，确保 UI 响应速度和数据一致性
- **反模式：使用 useState 管理视图状态** — 应使用 Zustand store 管理视图切换、筛选条件等状态，实现跨组件共享和持久化
- **反模式：每个字段编辑都触发页面刷新** — 内联编辑应使用乐观更新，失败时回滚并显示错误提示
- **反模式：抽屉内容全部加载** — 应使用 Tab 懒加载，只加载当前激活 Tab 的内容

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 表格分组功能 | 自己实现分组逻辑 | TanStack Table getGroupedRowModel | 内置分组支持，性能优化完善 |
| 拖拽动画 | CSS transition 手写 | @dnd-kit DragOverlay + CSS Transform | 自动处理位移计算、碰撞检测 |
| 日期选择器 | 手写日历组件 | react-day-picker + Radix Popover | 可访问性、国际化、键盘导航已处理 |
| 下拉选择 | 手写下拉菜单 | Radix Select / Radix Popover | 键盘导航、焦点管理、可访问性 |
| 右侧抽屉 | 手写动画抽屉 | shadcn/ui Sheet 组件 | 已有，动画、焦点锁定、ESC 关闭已实现 |

**Key insight:** 项目已有完整的 UI 基础设施，避免重复造轮子，专注于业务逻辑实现。

## Common Pitfalls

### Pitfall 1: TanStack Table 分组状态丢失

**What goes wrong:** 用户切换分组维度时，展开/折叠状态丢失，体验不佳

**Why it happens:** TanStack Table 的分组状态是内部管理的，切换 grouping 属性会重置展开状态

**How to avoid:**
```typescript
// 使用 expanded 状态持久化
const [expanded, setExpanded] = useState<ExpandedState>({})

const table = useReactTable({
  state: { grouping, expanded },
  onExpandedChange: setExpanded,
  // 将 expanded 存储到 Zustand store 实现跨会话持久化
})
```

**Warning signs:** 切换分组后所有行都折叠

### Pitfall 2: 拖拽传感器配置错误导致卡顿

**What goes wrong:** 拖拽时页面卡顿，或误触拖拽

**Why it happens:** PointerSensor 默认激活距离为 0，轻触即触发拖拽

**How to avoid:**
```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // 至少移动 8px 才激活拖拽
    },
  })
)
```

**Warning signs:** 点击卡片时意外进入拖拽模式

### Pitfall 3: 乐观更新后数据不一致

**What goes wrong:** 拖拽后状态更新，但刷新页面数据回滚

**Why it happens:** 乐观更新只修改了本地缓存，API 调用失败时未正确回滚

**How to avoid:**
```typescript
const updateMutation = useMutation({
  mutationFn: updateTaskStatus,
  onMutate: async ({ taskId, status }) => {
    await queryClient.cancelQueries({ queryKey: ['tasks'] })
    const previous = queryClient.getQueryData(['tasks'])

    queryClient.setQueryData(['tasks'], (old) =>
      old.map(t => t.id === taskId ? { ...t, status } : t)
    )

    return { previous } // 返回上下文用于回滚
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['tasks'], context.previous) // 回滚
  },
})
```

**Warning signs:** 网络请求失败后 UI 显示不一致

### Pitfall 4: 抽屉 Tab 内容重复渲染

**What goes wrong:** 切换 Tab 时所有 Tab 内容都渲染，导致性能问题

**Why it happens:** 没有使用 React 的条件渲染或 TabsContent 的懒加载机制

**How to avoid:**
```typescript
// 使用条件渲染
const [activeTab, setActiveTab] = useState('detail')

<TabsContent value="detail">
  {activeTab === 'detail' && <DetailTab />}
</TabsContent>
<TabsContent value="subtasks">
  {activeTab === 'subtasks' && <SubTaskList />}
</TabsContent>
```

**Warning signs:** 打开抽屉时网络请求数量过多

## Code Examples

Verified patterns from existing codebase:

### 现有看板拖拽实现
```typescript
// Source: src/components/tasks/TaskKanban.tsx (lines 291-376)
export function TaskKanban({ projectId }: TaskKanbanProps) {
  const queryClient = useQueryClient()
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectId, 'kanban'],
    queryFn: () => fetchProjectTasks(projectId),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      updateTaskStatus(taskId, status),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId, 'kanban'] })
      queryClient.setQueryData<Task[]>(['tasks', projectId, 'kanban'], (old = []) =>
        old.map((task) => (task.id === taskId ? { ...task, status } : task))
      )
      return { taskId }
    },
    onError: (error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId, 'kanban'] })
    },
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const taskId = active.id as string
    const targetStatus = over.id as TaskStatus

    const task = tasks.find((t) => t.id === taskId)
    if (task && task.status !== targetStatus) {
      updateStatusMutation.mutate({ taskId, status: targetStatus })
    }
  }
}
```

### 现有 Sheet 组件使用
```typescript
// Source: src/components/ui/sheet.tsx (lines 54-72)
const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70">
        <X className="h-4 w-4" />
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
```

### 现有子任务列表组件
```typescript
// Source: src/components/tasks/SubTaskList.tsx (lines 101-154)
export function SubTaskList({ taskId }: SubTaskListProps) {
  const queryClient = useQueryClient()
  const { data: subTasks = [], isLoading } = useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: () => fetchSubTasks(taskId),
  })

  const createMutation = useMutation({
    mutationFn: (title: string) => createSubTask(taskId, title),
    onMutate: async (newTitle) => {
      await queryClient.cancelQueries({ queryKey: ['subtasks', taskId] })
      const optimisticSubTask: SubTask = {
        id: `temp-${Date.now()}`,
        title: newTitle,
        completed: false,
        taskId,
        // ...
      }
      queryClient.setQueryData<SubTask[]>(['subtasks', taskId], (old = []) => [
        ...old,
        optimisticSubTask,
      ])
      return { optimisticSubTask }
    },
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData<SubTask[]>(['subtasks', taskId], (old = []) =>
        old.map((st) => st.id === context?.optimisticSubTask.id ? data : st)
      )
    },
  })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit | 项目初始 | 更好的 TypeScript 支持、更活跃的维护 |
| 手写表格排序 | TanStack Table v8 | 项目初始 | 内置排序、筛选、分组、虚拟化 |
| Dialog 模态框 | Sheet 抽屉 | Phase 3 | 更好的用户体验，不阻断用户操作 |

**Deprecated/outdated:**
- react-beautiful-dnd: 已停止维护，不建议使用

## Open Questions

1. **评论 Tab 的富文本编辑器选择**
   - What we know: 项目未安装富文本编辑器
   - What's unclear: 评论是否需要富文本支持，还是纯文本即可
   - Recommendation: Phase 3 先实现纯文本评论，后续 Phase 可扩展富文本

2. **标签 Tab 的标签管理 API**
   - What we know: 已有 `/api/v1/tasks/[id]/tags` API
   - What's unclear: 标签是系统预设还是用户自定义
   - Recommendation: 查看现有 API 实现，支持用户创建新标签

3. **列表视图分页 vs 虚拟滚动**
   - What we know: 现有实现使用分页（pageSize: 10）
   - What's unclear: 数据量大时是否需要虚拟滚动
   - Recommendation: Phase 3 保持分页模式，TanStack Table 支持后续升级虚拟滚动

## Environment Availability

> 本阶段依赖均在项目中已安装，无外部依赖缺失。

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| @tanstack/react-table | 列表视图 | ✓ | 8.21.3 | — |
| @dnd-kit/core | 看板拖拽 | ✓ | 6.3.1 | — |
| @dnd-kit/sortable | 列表排序 | ✓ | 10.0.0 | — |
| zustand | 视图状态管理 | ✓ | 5.0.2 | — |
| @tanstack/react-query | 数据获取 | ✓ | 5.62.0 | — |
| react-day-picker | 日期选择 | ✓ | 9.13.2 | — |
| @radix-ui/react-select | 下拉选择 | ✓ | 2.2.6 | — |
| @radix-ui/react-popover | 弹出层 | ✓ | 1.1.15 | — |

**Missing dependencies with no fallback:**
- None

**Missing dependencies with fallback:**
- None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | vitest.config.ts |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm run test:unit:coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TASK-01 | 列表视图排序功能 | unit | `vitest run src/components/tasks/list/__tests__` | ❌ Wave 0 |
| TASK-01 | 列表视图筛选功能 | unit | `vitest run src/components/tasks/list/__tests__` | ❌ Wave 0 |
| TASK-01 | 列表视图分组功能 | unit | `vitest run src/components/tasks/list/__tests__` | ❌ Wave 0 |
| TASK-01 | 内联编辑功能 | unit | `vitest run src/components/tasks/list/__tests__` | ❌ Wave 0 |
| TASK-02 | 看板拖拽跨列移动 | unit | `vitest run src/components/tasks/__tests__/TaskKanban.test.tsx` | ✅ |
| TASK-02 | 看板卡片内联编辑 | unit | `vitest run src/components/tasks/kanban/__tests__` | ❌ Wave 0 |
| TASK-05 | 任务详情抽屉显示 | unit | `vitest run src/components/tasks/detail/__tests__` | ❌ Wave 0 |
| TASK-05 | 子任务 Tab 功能 | unit | `vitest run src/components/tasks/SubTaskList.test.tsx` | ❌ Wave 0 |
| TASK-05 | 评论 Tab 功能 | unit | `vitest run src/components/tasks/detail/__tests__` | ❌ Wave 0 |
| TASK-05 | 标签 Tab 功能 | unit | `vitest run src/components/tasks/detail/__tests__` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test:unit`
- **Per wave merge:** `npm run test:unit:coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/tasks/list/__tests__/TaskList.test.tsx` — covers TASK-01 列表视图
- [ ] `src/components/tasks/list/__tests__/InlineEditCell.test.tsx` — covers TASK-01 内联编辑
- [ ] `src/components/tasks/kanban/__tests__/KanbanInlineEdit.test.tsx` — covers TASK-02 卡片内联编辑
- [ ] `src/components/tasks/detail/__tests__/TaskDetailDrawer.test.tsx` — covers TASK-05 抽屉
- [ ] `src/components/tasks/SubTaskList.test.tsx` — covers TASK-05 子任务
- [ ] `tests/helpers/test-data-factory.ts` — 扩展任务测试数据工厂

*(现有测试: `src/components/tasks/__tests__/TaskKanban.test.tsx` 已覆盖部分 TASK-02)*

## Sources

### Primary (HIGH confidence)
- 现有代码库审查: `src/components/tasks/TaskKanban.tsx`, `src/components/ui/data-table.tsx`, `src/components/ui/sheet.tsx`
- TanStack Table 官方文档: https://tanstack.com/table/v8/docs/guide/grouping
- @dnd-kit 官方文档: https://docs.dndkit.com/

### Secondary (MEDIUM confidence)
- 项目 CLAUDE.md 约定文件
- 现有 API 实现: `src/app/api/v1/tasks/route.ts`

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 所有依赖已安装，版本已验证
- Architecture: HIGH - 现有代码提供了清晰的实现模式
- Pitfalls: HIGH - 基于 TanStack Table 和 @dnd-kit 的已知问题

**Research date:** 2026-03-26
**Valid until:** 30 days (稳定的技术栈)