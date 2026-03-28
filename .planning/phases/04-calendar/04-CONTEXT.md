# Phase 4: 日历视图 - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

实现日历视图，让用户可以通过日历视图管理任务时间。支持按日期查看任务、拖拽调整日期、月/周视图切换、点击日期创建新任务。

**Requirements:** TASK-03
- TASK-03: 日历视图，按日期展示任务，支持拖拽调整日期

**Success Criteria (from ROADMAP.md):**
1. 用户可以在日历视图中查看按日期分布的任务
2. 用户可以拖拽任务调整日期
3. 支持月视图和周视图切换
4. 点击日期可创建新任务

</domain>

<decisions>
## Implementation Decisions

### 视图集成
- **D-01:** 日历视图作为第三种视图模式 — 与列表/看板并列，三选一切换，保持统一的视图切换 UI

### 日历显示
- **D-02:** 默认显示月视图 — 显示整月日历，每行一周，适合查看整体任务分布
- **D-03:** 单元格采用紧凑任务条 — 每个任务一行，显示标题+优先级颜色条，平衡信息量和可读性
- **D-04:** 任务按截止日期显示 — 每个任务只显示在截止日期对应的单元格中

### 交互行为
- **D-05:** 拖拽更新截止日期 — 拖拽任务到新日期即更新截止日期，直接生效无需确认
- **D-06:** 点击日期快速创建 — 点击空白日期弹出简单表单，填写标题即可快速创建任务
- **D-07:** 无日期任务显示在日历外列表 — 日历下方或侧边显示无截止日期的任务列表，可拖入日历设置日期

### 筛选与状态
- **D-08:** 继承筛选条件 — 日历视图继承任务页面的筛选条件，只显示当前筛选结果

### Claude's Discretion
- 周视图切换 UI 设计（如需要）
- 无日期任务列表的具体位置（建议：日历下方）
- 快速创建弹窗的字段（建议：仅标题，其他字段可选）
- 日期格式的本地化显示

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目规划文档
- `.planning/PROJECT.md` — 项目愿景、约束、关键决策
- `.planning/REQUIREMENTS.md` — 需求定义和追踪
- `.planning/ROADMAP.md` — 阶段规划和依赖关系
- `.planning/phases/03-kanban-list/03-CONTEXT.md` — Phase 3 决策（视图切换、任务详情抽屉）

### 现有代码参考
- `src/components/ui/calendar.tsx` — 基于 react-day-picker 的日历组件
- `src/components/tasks/TaskKanban.tsx` — 任务看板组件（视图切换模式参考）
- `src/components/tasks/list/TaskList.tsx` — 任务列表组件
- `src/stores/taskViewStore.ts` — 任务视图状态管理
- `src/app/projects/[id]/tasks/page.tsx` — 任务页面入口
- `prisma/schema.prisma` — Task 模型（dueDate, startDate 字段）

### 依赖库
- `react-day-picker` — 已安装，Calendar 组件基础
- `@dnd-kit/core` — 已安装，拖拽功能
- `@tanstack/react-query` — 已安装，数据获取

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/calendar.tsx`: 基于 react-day-picker 的完整日历组件，支持自定义样式
- `src/stores/taskViewStore.ts`: 已有 viewMode 状态（list/kanban），可扩展为 calendar
- `@dnd-kit/core`: 拖拽核心库已在看板视图中使用
- Task API: `/api/v1/tasks` 提供任务数据，包含 dueDate 字段

### Established Patterns
- 视图切换: taskViewStore 管理 viewMode 状态
- 拖拽模式: DndContext + useDraggable + useDroppable
- 抽屉组件: shadcn/ui Sheet 组件（Phase 3 已使用）
- 快速创建: 可参考现有 Dialog/Popover 模式

### Integration Points
- `src/stores/taskViewStore.ts`: 需扩展 viewMode 类型支持 'calendar'
- `src/app/projects/[id]/tasks/page.tsx`: 需添加日历视图渲染逻辑
- Task model: 已有 dueDate 和 startDate 字段，无需修改数据库

</code_context>

<specifics>
## Specific Ideas

- 参考 Google Calendar 的简洁日历设计
- 任务条显示优先级颜色条（红色=高优先级、黄色=中、蓝色=低）
- 拖拽时目标日期高亮提示
- 无日期任务列表可折叠，节省空间

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-calendar*
*Context gathered: 2026-03-26*