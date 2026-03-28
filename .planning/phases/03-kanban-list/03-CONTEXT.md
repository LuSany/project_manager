# Phase 3: 列表与看板视图 - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

实现任务列表视图和看板视图，支持排序、筛选、分组、拖拽、内联编辑和任务详情抽屉。在现有 TanStack Table 和 @dnd-kit 基础设施上构建完整的任务管理视图体验。

**Requirements:** TASK-01, TASK-02, TASK-05
- TASK-01: 列表视图，支持排序、筛选、分组、内联编辑
- TASK-02: 看板视图，支持拖拽排序、跨列移动
- TASK-05: 任务详情抽屉，支持子任务、评论、标签、依赖

</domain>

<decisions>
## Implementation Decisions

### 列表视图
- **D-01:** 列表显示字段采用「标准模式」— 任务名称、状态、优先级、截止日期、负责人、标签
- **D-02:** 分组支持三种维度 — 按状态分组、按优先级分组、按负责人分组
- **D-03:** 筛选 UI 采用「顶部筛选栏」— 在列表上方显示筛选栏，选择后显示条件标签
- **D-04:** 内联编辑采用「单击激活」— 单击字段即可编辑状态、优先级、截止日期等

### 看板视图
- **D-05:** 看板卡片显示采用「标准模式」— 任务名称 + 状态 + 优先级 + 负责人头像
- **D-06:** 拖拽动画采用「平滑动画」— 拖动时卡片随鼠标平滑移动，其他卡片平滑让位
- **D-07:** 拖放行为采用「直接生效」— 拖到目标列即更改状态，无额外确认
- **D-08:** 快速编辑采用「卡片内内联编辑」— 卡片上的优先级、负责人可直接点击修改

### 任务详情抽屉
- **D-09:** 抽屉位置采用「右侧抽屉」— 从右侧滑出，覆盖部分内容，不关闭可继续操作其他任务
- **D-10:** 抽屉包含四个 Tab — 详情 Tab、子任务 Tab、评论 Tab、标签 Tab

### Claude's Discretion
- 排序默认规则（建议：按优先级 > 截止日期）
- 列表视图分页或虚拟滚动
- 看板列顺序（建议：按状态流转顺序）
- 空状态提示文案

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目规划文档
- `.planning/PROJECT.md` — 项目愿景、约束、关键决策
- `.planning/REQUIREMENTS.md` — 需求定义和追踪
- `.planning/ROADMAP.md` — 阶段规划和依赖关系
- `.planning/STATE.md` — 已确认决策：列表视图基于 TanStack Table

### 现有代码参考
- `src/components/ui/data-table.tsx` — TanStack Table 基础实现
- `src/components/kanban/KanbanBoard.tsx` — 现有看板组件 (@dnd-kit)
- `src/components/kanban/KanbanCard.tsx` — 现有看板卡片组件
- `src/components/kanban/KanbanColumn.tsx` — 现有看板列组件
- `src/components/tasks/TaskKanban.tsx` — 任务看板组件
- `src/components/tasks/SubTaskList.tsx` — 子任务列表组件
- `src/app/projects/[id]/tasks/page.tsx` — 任务页面入口

### Phase 1-2 参考
- `src/stores/uiStore.ts` — UI 状态管理模式
- `src/hooks/useCommandPalette.ts` — 命令面板模式
- `src/components/layout/Header.tsx` — 响应式布局模式

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/data-table.tsx`: TanStack Table 已配置，可直接扩展用于任务列表
- `src/components/kanban/`: 完整的看板组件体系，支持 @dnd-kit 拖拽
- `src/components/tasks/SubTaskList.tsx`: 子任务列表组件可复用于详情抽屉
- `@dnd-kit/core`: 已安装，拖拽核心库
- `@tanstack/react-table`: 已安装，表格核心库

### Established Patterns
- TanStack Table: 使用 useReactTable hook + 列定义模式
- @dnd-kit: DndContext + useDraggable + useDroppable 模式
- 抽屉组件: 使用 shadcn/ui Sheet 组件
- 状态管理: Zustand + TanStack Query 组合

### Integration Points
- `src/app/projects/[id]/tasks/page.tsx`: 需添加视图切换 (列表/看板)
- `src/stores/`: 可能需要新建 taskViewStore 管理视图状态
- 现有 API: `/api/v1/tasks` 提供任务数据

</code_context>

<specifics>
## Specific Ideas

- 参考 Linear 的任务列表设计：紧凑行、快速内联编辑
- 看板参考 Trello/Jira：列标题显示任务数、快速添加按钮
- 筛选栏参考 Notion：标签式筛选条件，可快速移除
- 详情抽屉参考 Asana：Tab 切换流畅，评论支持富文本

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-kanban-list*
*Context gathered: 2026-03-26*