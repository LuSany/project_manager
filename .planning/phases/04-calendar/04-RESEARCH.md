# Phase 4: 日历视图 - Research

**Researched:** 2026-03-26
**Domain:** React Calendar Component with Drag-and-Drop Task Management
**Confidence:** HIGH

## Summary

日历视图实现需要扩展现有的 react-day-picker v9 组件和 @dnd-kit 拖拽基础设施。核心挑战在于将 react-day-picker 的单元格渲染与任务数据结合，并实现单元格级别的拖放功能。项目中已有成熟的拖拽模式（TaskKanban）和视图状态管理（taskViewStore），可直接复用。

**Primary recommendation:** 扩展现有 Calendar 组件的自定义渲染能力，复用 @dnd-kit 的 DndContext 模式，通过 taskViewStore 扩展支持 calendar 视图模式。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** 日历视图作为第三种视图模式 — 与列表/看板并列，三选一切换，保持统一的视图切换 UI
- **D-02:** 默认显示月视图 — 显示整月日历，每行一周，适合查看整体任务分布
- **D-03:** 单元格采用紧凑任务条 — 每个任务一行，显示标题+优先级颜色条，平衡信息量和可读性
- **D-04:** 任务按截止日期显示 — 每个任务只显示在截止日期对应的单元格中
- **D-05:** 拖拽更新截止日期 — 拖拽任务到新日期即更新截止日期，直接生效无需确认
- **D-06:** 点击日期快速创建 — 点击空白日期弹出简单表单，填写标题即可快速创建任务
- **D-07:** 无日期任务显示在日历外列表 — 日历下方或侧边显示无截止日期的任务列表，可拖入日历设置日期
- **D-08:** 继承筛选条件 — 日历视图继承任务页面的筛选条件，只显示当前筛选结果

### Claude's Discretion

- 周视图切换 UI 设计（如需要）
- 无日期任务列表的具体位置（建议：日历下方）
- 快速创建弹窗的字段（建议：仅标题，其他字段可选）
- 日期格式的本地化显示

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TASK-03 | 日历视图，按日期展示任务，支持拖拽调整日期 | react-day-picker v9 自定义组件渲染 + @dnd-kit 拖放模式 |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-day-picker | 9.14.0 (installed: 9.13.2) | 日历基础组件 | 项目已安装，shadcn/ui 集成完成 |
| @dnd-kit/core | 6.3.1 | 拖拽核心库 | 看板已使用，成熟模式 |
| date-fns | 3.6.0 | 日期处理 | 项目已安装，轻量级日期库 |
| @tanstack/react-query | 5.62.0 | 数据获取和缓存 | 看板列表视图已使用 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand | 5.0.2 | 视图状态管理 | 扩展 taskViewStore 支持 calendar |
| lucide-react | 0.468.0 | 图标库 | 日历导航、任务图标 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-day-picker | react-big-calendar | react-big-calendar 更重量级，react-day-picker 已集成且更灵活 |
| @dnd-kit | react-dnd | @dnd-kit 已在看板使用，无额外学习成本 |
| 自定义日历 | react-day-picker | 自定义开发量大，react-day-picker 已处理边缘情况 |

**Installation:** 无需额外安装 — 所有依赖已存在于项目中。

**Version verification:**
- react-day-picker: 已安装 ^9.13.2，最新稳定版 9.14.0
- @dnd-kit/core: 已安装 ^6.3.1

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── tasks/
│   │   ├── calendar/
│   │   │   ├── TaskCalendar.tsx        # 日历视图主组件
│   │   │   ├── CalendarTaskCard.tsx    # 日历单元格中的任务卡片
│   │   │   ├── CalendarDayCell.tsx     # 自定义日期单元格
│   │   │   ├── UnscheduledTaskList.tsx # 无日期任务列表
│   │   │   └── QuickCreatePopover.tsx  # 快速创建弹窗
│   │   └── ...
│   └── ui/
│       └── calendar.tsx                # 已存在，需扩展自定义组件支持
├── stores/
│   └── taskViewStore.ts                # 扩展 TaskViewMode 类型
└── app/
    └── projects/[id]/tasks/
        └── page.tsx                    # 添加 calendar 视图渲染逻辑
```

### Pattern 1: Calendar Custom Day Cell Rendering

**What:** 使用 react-day-picker 的 `components` prop 自定义日期单元格渲染，在单元格中显示任务列表。

**When to use:** 实现日历视图的核心渲染逻辑。

**Example:**

```tsx
// 来源: react-day-picker v9 API + 项目现有 calendar.tsx 模式
import { DayPicker, DayButton } from 'react-day-picker'

// 自定义日期单元格组件
function CustomDayCell({
  date,
  tasks,
  onTaskClick,
  onDragOver,
  onDrop,
}) {
  const dayTasks = tasks.filter(task =>
    isSameDay(new Date(task.dueDate), date)
  )

  return (
    <div
      className="min-h-[80px] p-1"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(date)}
    >
      {/* 日期数字 */}
      <div className="text-xs text-muted-foreground mb-1">
        {format(date, 'd')}
      </div>
      {/* 任务列表 */}
      <div className="space-y-1">
        {dayTasks.map(task => (
          <CalendarTaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}

// 在 DayPicker 中使用
<DayPicker
  components={{
    DayButton: CustomDayCell, // 替换默认 DayButton
  }}
/>
```

### Pattern 2: DndContext Calendar Drag-Drop

**What:** 复用 TaskKanban 的 DndContext 模式，将每个日期单元格作为 droppable 区域。

**When to use:** 实现任务拖拽调整截止日期功能。

**Example:**

```tsx
// 来源: 项目 TaskKanban.tsx 已有模式
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core'

// 日历单元格作为放置目标
function CalendarDayCell({ date, tasks }) {
  const { setNodeRef, isOver } = useDroppable({
    id: format(date, 'yyyy-MM-dd'),
    data: { type: 'calendar-day', date },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[80px] border rounded transition-colors',
        isOver && 'bg-primary/10 border-primary'
      )}
    >
      {/* 单元格内容 */}
    </div>
  )
}

// 任务卡片作为拖拽源
function CalendarTaskCard({ task }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: task.id,
    data: { type: 'task', task },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="cursor-grab"
    >
      {/* 任务内容 */}
    </div>
  )
}
```

### Pattern 3: View Mode State Extension

**What:** 扩展 taskViewStore 的 viewMode 类型支持 'calendar'。

**When to use:** 实现视图切换功能。

**Example:**

```tsx
// 来源: 项目 taskViewStore.ts 已有模式
// 扩展类型定义
export type TaskViewMode = 'list' | 'kanban' | 'calendar'

// store 已有 setViewMode action，直接使用
const setViewMode = useTaskViewStore((state) => state.setViewMode)

// 视图切换按钮组
<div className="flex bg-muted rounded-md p-1">
  <button onClick={() => setViewMode('list')}>列表</button>
  <button onClick={() => setViewMode('kanban')}>看板</button>
  <button onClick={() => setViewMode('calendar')}>日历</button>
</div>
```

### Anti-Patterns to Avoid

- **不要在 DayPicker 内部使用复杂的 DndContext:** react-day-picker 的内部 DOM 结构可能与 @dnd-kit 冲突。推荐在 DayPicker 外层包裹 DndContext，通过 data 属性关联日期。
- **不要为每个单元格创建独立的 mutation:** 应复用现有的 updateTask mutation 模式，保持乐观更新一致性。
- **不要忽略无日期任务:** 根据 D-07，必须显示无截止日期的任务列表并提供拖入日历的能力。

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 日历基础渲染 | 自定义日历网格 | react-day-picker | 处理了月份切换、国际化、无障碍等边缘情况 |
| 拖拽检测 | 自定义拖拽逻辑 | @dnd-kit/core | 已在看板验证，传感器配置成熟 |
| 日期计算 | 手动日期运算 | date-fns | isSameDay, format, addMonths 等工具函数 |
| 视图状态持久化 | 自定义 localStorage | Zustand persist 中间件 | taskViewStore 已配置 |

**Key insight:** 项目已有成熟的拖拽和状态管理模式，复用比重建更可靠。

## Common Pitfalls

### Pitfall 1: react-day-picker v9 组件 API 变化

**What goes wrong:** v9 相比 v8 有 Breaking Changes，网上旧教程的 API 可能不适用。

**Why it happens:** v9 重构了 components prop 的结构，使用 DayButton 替代了旧的 render props 模式。

**How to avoid:** 参考项目中已有的 calendar.tsx 实现，它已适配 v9 API。自定义组件需遵循 `getDefaultClassNames()` 和 `components` prop 模式。

**Warning signs:** TypeScript 类型错误、自定义组件不渲染、样式丢失。

### Pitfall 2: 拖拽与日历单元格点击冲突

**What goes wrong:** 拖拽手势与点击日期创建任务的手势冲突，导致误触发。

**Why it happens:** @dnd-kit 的传感器默认可能过于敏感，点击也会触发拖拽。

**How to avoid:** 使用 `activationConstraint.distance` 设置最小拖拽距离（项目中看板使用 8px），区分点击和拖拽意图。

```tsx
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  })
)
```

**Warning signs:** 点击日期时任务被意外拖动、拖拽体验卡顿。

### Pitfall 3: 大量任务导致单元格溢出

**What goes wrong:** 某天任务过多时，单元格高度不一致，破坏日历网格布局。

**Why it happens:** 没有限制单元格内的任务显示数量。

**How to avoid:**
1. 限制每个单元格最多显示 N 个任务（如 3 个）
2. 超出部分显示 "+N 更多" 链接
3. 点击单元格展开完整任务列表（Popover 或 Dialog）

**Warning signs:** 日历行高不一致、滚动条出现在日历内部、布局错乱。

### Pitfall 4: 忽略时区导致日期偏移

**What goes wrong:** 任务显示在错误的日期上，或拖拽更新后日期差一天。

**Why it happens:** 服务端返回 UTC 时间，前端按本地时区解析，导致日期偏移。

**How to avoid:**
1. 使用 `date-fns` 的 `startOfDay` / `endOfDay` 处理日期边界
2. 更新截止日期时，只传日期部分（不传时间）
3. 后端存储时使用 `DateTime?` 类型，只存储日期部分

**Warning signs:** 任务显示日期与预期差一天、跨时区用户看到不同日期。

## Code Examples

### 任务按日期分组

```tsx
// 来源: 项目 TaskKanban.tsx 的 tasksByStatus 模式
import { startOfDay, isSameDay } from 'date-fns'

function groupTasksByDate(tasks: Task[], month: Date): Map<string, Task[]> {
  const grouped = new Map<string, Task[]>()

  tasks.forEach(task => {
    if (!task.dueDate) return

    const dueDate = new Date(task.dueDate)
    const dateKey = format(dueDate, 'yyyy-MM-dd')

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, [])
    }
    grouped.get(dateKey)!.push(task)
  })

  return grouped
}
```

### 快速创建任务弹窗

```tsx
// 来源: 项目已有 Popover + Command 模式 (参考 CommandPalette)
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function QuickCreatePopover({ date, onCreate }: {
  date: Date
  onCreate: (title: string, dueDate: Date) => void
}) {
  const [title, setTitle] = useState('')
  const [open, setOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onCreate(title.trim(), date)
      setTitle('')
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-full h-full" onDoubleClick={() => setOpen(true)} />
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <form onSubmit={handleSubmit}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="任务标题"
            autoFocus
          />
          <Button type="submit" size="sm" className="mt-2 w-full">
            创建任务
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}
```

### 更新任务截止日期 API 调用

```tsx
// 来源: 项目 TaskKanban.tsx 的 updateTask mutation 模式
const updateDueDateMutation = useMutation({
  mutationFn: ({ taskId, dueDate }: { taskId: string; dueDate: string }) =>
    fetch(`/api/v1/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dueDate }),
    }).then(res => res.json()),

  onMutate: async ({ taskId, dueDate }) => {
    await queryClient.cancelQueries({ queryKey: ['tasks', projectId] })
    const previousTasks = queryClient.getQueryData(['tasks', projectId])

    // 乐观更新
    queryClient.setQueryData(['tasks', projectId], (old = []) =>
      old.map(task => task.id === taskId ? { ...task, dueDate } : task)
    )

    return { previousTasks }
  },

  onError: (err, variables, context) => {
    if (context?.previousTasks) {
      queryClient.setQueryData(['tasks', projectId], context.previousTasks)
    }
  },
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-day-picker v8 render props | v9 components prop | 2024 Q4 | 更灵活的自定义渲染，需适配新 API |
| 自定义拖拽检测 | @dnd-kit sensors | Phase 3 | 统一拖拽模式，更好的手势识别 |

**Deprecated/outdated:**
- react-day-picker v8 API: v9 使用 `components` prop 替代旧的 `renderDay` 等渲染 props

## Open Questions

1. **周视图是否在 MVP 范围内?**
   - What we know: D-02 锁定默认月视图
   - What's unclear: 用户是否需要周视图切换能力
   - Recommendation: MVP 先实现月视图，周视图作为后续增强

2. **单元格点击创建任务的触发方式?**
   - What we know: D-06 要求点击日期创建任务
   - What's unclear: 单击还是双击触发（单击可能与选择日期冲突）
   - Recommendation: 使用双击创建任务，单击用于选中日期显示详情

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | 20.x | — |
| react-day-picker | Calendar rendering | ✓ | 9.13.2 | — |
| @dnd-kit/core | Drag-drop | ✓ | 6.3.1 | — |
| date-fns | Date utilities | ✓ | 3.6.0 | — |
| PostgreSQL | Task data storage | ✓ | 15 (Docker) | — |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** None

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | vitest.config.ts |
| Quick run command | `npm run test:unit -- --run` |
| Full suite command | `npm run test:unit` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TASK-03 | 日历视图按日期显示任务 | unit | `vitest run src/components/tasks/calendar/__tests__/TaskCalendar.test.tsx` | ❌ Wave 0 |
| TASK-03 | 拖拽任务更新截止日期 | unit | `vitest run src/components/tasks/calendar/__tests__/CalendarTaskCard.test.tsx` | ❌ Wave 0 |
| TASK-03 | 点击日期创建任务 | unit | `vitest run src/components/tasks/calendar/__tests__/QuickCreatePopover.test.tsx` | ❌ Wave 0 |
| TASK-03 | 无日期任务列表显示 | unit | `vitest run src/components/tasks/calendar/__tests__/UnscheduledTaskList.test.tsx` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test:unit -- --run`
- **Per wave merge:** `npm run test:unit`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/components/tasks/calendar/__tests__/TaskCalendar.test.tsx` — 日历主组件测试
- [ ] `src/components/tasks/calendar/__tests__/CalendarTaskCard.test.tsx` — 任务卡片拖拽测试
- [ ] `src/components/tasks/calendar/__tests__/CalendarDayCell.test.tsx` — 日期单元格渲染测试
- [ ] `src/components/tasks/calendar/__tests__/UnscheduledTaskList.test.tsx` — 无日期任务列表测试
- [ ] `src/components/tasks/calendar/__tests__/QuickCreatePopover.test.tsx` — 快速创建弹窗测试
- [ ] `src/stores/__tests__/taskViewStore.test.ts` — 已存在，需扩展 calendar 视图模式测试

## Sources

### Primary (HIGH confidence)

- 项目代码: `src/components/ui/calendar.tsx` — react-day-picker v9 集成实现
- 项目代码: `src/components/tasks/TaskKanban.tsx` — @dnd-kit 拖拽模式
- 项目代码: `src/stores/taskViewStore.ts` — 视图状态管理模式
- npm registry: react-day-picker@9.14.0, @dnd-kit/core@6.3.1 版本验证

### Secondary (MEDIUM confidence)

- 项目代码: `prisma/schema.prisma` — Task 模型 dueDate/startDate 字段定义
- 项目代码: `src/app/projects/[id]/tasks/page.tsx` — 视图切换 UI 模式

### Tertiary (LOW confidence)

- WebSearch: react-day-picker v9 文档 — 需通过实际代码验证

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 所有依赖已安装并验证版本
- Architecture: HIGH — 项目已有成熟模式可复用
- Pitfalls: MEDIUM — react-day-picker v9 API 需实际编码验证

**Research date:** 2026-03-26
**Valid until:** 30 days (stable libraries, low churn risk)