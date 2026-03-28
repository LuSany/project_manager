# Phase 5: 甘特图视图 - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

实现甘特图视图，让用户可以查看项目时间线和任务依赖关系。甘特图作为第四种视图模式与列表/看板/日历并列。支持缩放平移浏览、依赖关系连线、关键路径高亮、悬停详情。拖拽编辑甘特图任务条不在范围内（编辑通过列表/详情完成）。

**Requirements:** TASK-04

- TASK-04: 时间线/甘特图视图，展示任务时间线和依赖关系

**Success Criteria (from ROADMAP.md):**

1. 用户可以在甘特图中查看任务时间线
2. 任务依赖关系通过连线展示
3. 支持缩放和平移浏览
4. 关键路径高亮显示
5. 悬停显示任务详情

**Out of Scope (from REQUIREMENTS.md):**

- 拖拽甘特图编辑 — 技术复杂度高，编辑用列表/详情

</domain>

<decisions>
## Implementation Decisions

### 布局结构

- **D-01:** 经典双栏布局 — 左侧固定任务列表 + 右侧可滚动时间线区域，参考 Plane/GitLab 甘特图
- **D-02:** 左侧面板显示紧凑信息行 — 任务名称、状态图标、负责人头像、起止日期。每行与右侧时间线条对齐
- **D-03:** 固定比例分割 — 左右面板比例固定（如 30:70），不可拖动调整

### 时间刻度与导航

- **D-04:** 日/周/月三级刻度切换 — 默认日级别（每列一天），可通过按钮切换到周级别或月级别
- **D-05:** 自动计算时间范围 — 根据任务最早 startDate 和最晚 dueDate 自动确定显示范围，无任务时显示当前月
- **D-06:** 拖拽平移 + 今天按钮 — 鼠标拖拽平移时间线 + 顶部工具栏"今天"按钮快速跳转到当天

### 依赖关系连线

- **D-07:** 直角折线连接 — 从源任务条末端到目标任务条起点画直角折线，参考 MS Project 经典风格
- **D-08:** 按依赖类型颜色编码 — FINISH_TO_START=蓝色、START_TO_START=绿色、FINISH_TO_FINISH=紫色、START_TO_FINISH=橙色
- **D-09:** 实心箭头 — 连线末端用实心三角箭头指向被依赖任务，方向明确
- **D-10:** 悬停显示详细弹窗 — 悬停连线显示源任务名称、目标任务名称、依赖类型、状态

### 关键路径与交互

- **D-11:** 关键路径颜色高亮 — 关键路径上的任务条和连线用特殊颜色（如橙红色）高亮，与普通任务区分
- **D-12:** 悬停任务条显示 Popover 详情 — 悬停显示任务名称、状态、起止日期、进度百分比、负责人信息
- **D-13:** 点击任务条打开详情抽屉 — 复用 Phase 3 的 TaskDetailDrawer 右侧抽屉，体验一致
- **D-14:** 任务条显示颜色条+名称+进度 — 颜色按优先级/状态着色，条上显示任务名称和进度百分比

### Claude's Discretion

- 任务条具体高度和间距（建议 32-40px 行高）
- 左侧面板列宽具体比例（建议 30:70）
- 时间刻度头部显示格式
- 空状态提示文案和图标
- 依赖连线与任务条的精确连接点位置

### Folded Todos

无 — 没有待办事项匹配此阶段

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目规划文档

- `.planning/PROJECT.md` — 项目愿景、约束、Key Decision: 自定义 SVG 甘特图
- `.planning/REQUIREMENTS.md` — TASK-04 需求定义、Out of Scope: 拖拽甘特图编辑
- `.planning/ROADMAP.md` — Phase 5 成功标准
- `.planning/STATE.md` — 已确认决策: 甘特图使用自定义 SVG 实现

### 前 Phase 上下文

- `.planning/phases/03-kanban-list/03-CONTEXT.md` — Phase 3 视图切换模式、任务详情抽屉决策
- `.planning/phases/04-calendar/04-CONTEXT.md` — Phase 4 日历视图扩展 taskViewStore 的模式

### 现有代码参考

- `src/stores/taskViewStore.ts` — 视图状态管理，需扩展 TaskViewMode 支持 'gantt'
- `src/types/task-dependency.ts` — 完整依赖类型系统 (DependencyType enum, 4种类型)
- `src/components/tasks/TaskDependencies.tsx` — 依赖 CRUD 组件，含 API 调用模式
- `src/components/tasks/TaskTimeline.tsx` — 现有简单时间线组件（参考但不复用）
- `src/components/tasks/detail/TaskDetailDrawer.tsx` — 可复用的任务详情抽屉
- `src/components/tasks/calendar/` — 日历视图组件结构参考（目录组织方式）
- `src/app/projects/[id]/tasks/page.tsx` — 任务页面入口，需添加甘特图视图渲染
- `prisma/schema.prisma` §tasks (line 787) — Task model: startDate, dueDate 字段
- `prisma/schema.prisma` §task_dependencies (line 688) — 依赖关系模型

### API 参考

- `src/app/api/v1/tasks/[id]/dependencies/route.ts` — GET/POST 任务依赖
- `src/app/api/v1/tasks/[id]/dependencies/[depId]/route.ts` — DELETE 单个依赖
- `src/app/api/v1/tasks/route.ts` — 任务列表 API

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `taskViewStore.ts`: 已有 viewMode 状态管理 (list/kanban/calendar)，扩展 'gantt' 遵循相同模式
- `TaskDetailDrawer`: Phase 3 实现的右侧详情抽屉，直接复用
- `DependencyType` enum: 完整的 4 种依赖类型定义
- Task API: `/api/v1/tasks` 已提供 startDate, dueDate 数据
- Dependencies API: `/api/v1/tasks/[id]/dependencies` 已提供完整 CRUD

### Established Patterns

- 视图切换: taskViewStore 管理 viewMode + segmented buttons 切换 UI
- SVG 渲染: PROJECT.md 决定自定义 SVG 实现（非第三方甘特图库）
- Popover/Tooltip: shadcn/ui Popover 组件用于悬停详情
- 数据获取: TanStack Query + fetch API
- 状态管理: Zustand (UI 状态) + TanStack Query (服务端数据)

### Integration Points

- `taskViewStore.ts`: 扩展 TaskViewMode 类型添加 'gantt'
- `src/app/projects/[id]/tasks/page.tsx`: 添加甘特图视图渲染分支 + 工具栏按钮
- `/api/v1/tasks`: 需确保返回 startDate 字段（可能已有）
- `/api/v1/tasks/[id]/dependencies`: 获取所有任务的依赖关系用于绘制连线

</code_context>

<specifics>
## Specific Ideas

- 参考 Plane 的甘特图设计：经典双栏、紧凑任务条、清晰依赖连线
- 参考 MS Project 的直角折线连接方式
- 关键路径用醒目的橙红色与普通任务区分
- 任务条颜色按优先级着色（与 Phase 4 日历视图的优先级颜色一致：红色=高、黄色=中、蓝色=低）

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 05-gantt_
_Context gathered: 2026-03-28_
