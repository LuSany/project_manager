# Phase 6: 仪表盘 - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

增强现有仪表盘，添加图表可视化组件（环形图、柱状图、里程碑进度条）。保留原有功能组件（WelcomeSection, QuickActions, TaskBoard, RiskOverview），在其基础上重新组织布局，融入新的图表组件。

**Requirements:** DASH-01, DASH-02, DASH-03, DASH-04, DASH-05

**Success Criteria (from ROADMAP.md):**

1. 仪表盘展示任务数、完成率统计卡片
2. 环形图展示任务状态分布、优先级分布
3. 折线图展示任务完成趋势
4. 柱状图展示项目对比
5. 里程碑进度条/燃尽图

</domain>

<decisions>
## Implementation Decisions

### 图表组件选择

- **D-01:** 任务状态分布和优先级分布使用环形图（Donut Chart）— 两个指标并排显示两个环形图，中间显示总数，现代感强
- **D-02:** 项目对比柱状图对比维度为「任务完成率」— 每个项目显示完成率百分比，最多展示 5-8 个项目
- **D-03:** 折线图采用双图组合 — 上方为任务完成趋势折线图（AreaChart），下方为任务状态分布环形图，形成"概览卡片"
- **D-04:** 保留现有 ActivityChart（Recharts AreaChart）作为基础，增强为任务完成趋势展示

### 里程碑进度展示

- **D-05:** 里程碑进度使用进度条（Progress Bar）— 不使用燃尽图，每个里程碑一行显示标题 + 状态颜色 + 进度条 + 截止日期
- **D-06:** 里程碑进度展示用户参与的所有项目的活跃里程碑（默认全局视图），最多显示 5-6 个里程碑
- **D-07:** 点击里程碑可展开详情或跳转到项目里程碑页面

### 仪表盘整体布局

- **D-08:** 保留现有布局结构，新增图表区域 — 保留 WelcomeSection + StatsGrid + ActivityChart + TaskBoard + RiskOverview + QuickActions，在 StatsGrid 和 ActivityChart 之间插入新的图表区域
- **D-09:** 新增图表区域布局为 2x2 网格 — 左上: 任务状态分布环形图; 右上: 优先级分布环形图; 左下: 项目完成率对比柱状图; 右下: 里程碑进度条
- **D-10:** 图表卡片统一高度 280px，确保视觉对齐

### 数据范围与筛选

- **D-11:** 仪表盘默认展示全局数据 — 所有项目的汇总统计
- **D-12:** 不添加项目筛选器 — 仪表盘始终为全局概览，如需查看单个项目数据，用户进入项目详情页
- **D-13:** Stats API 需扩展返回任务状态分布和优先级分布数据
- **D-14:** 新增 API 返回各项目任务完成率数据（用于柱状图对比）
- **D-15:** Progress API 扩展支持无 projectId 参数时返回全局里程碑进度列表

### Claude's Discretion

- 图表卡片的具体颜色主题和圆角样式
- 环形图中间数字的动画效果
- 空状态提示文案和图标
- 里程碑进度条的动画效果
- 柱状图的最大展示项目数量和排序方式

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目规划文档

- `.planning/PROJECT.md` — 项目愿景、约束、关键决策
- `.planning/REQUIREMENTS.md` — 需求定义 DASH-01~DASH-05
- `.planning/ROADMAP.md` — Phase 6 成功标准
- `.planning/STATE.md` — 已确认决策和进度

### 现有代码参考

- `src/app/(main)/dashboard/page.tsx` — 现有仪表盘页面
- `src/components/dashboard/` — 现有仪表盘组件目录（10 个组件）
- `src/components/dashboard/MetricCard.tsx` — 统计卡片组件（StatsGrid, AnimatedNumber）
- `src/components/dashboard/ActivityChart.tsx` — Recharts AreaChart 已实现
- `src/components/dashboard/TaskBoard.tsx` — 我的任务组件
- `src/components/dashboard/RiskOverview.tsx` — 风险概览组件
- `src/components/dashboard/WelcomeSection.tsx` — 欢迎区域组件
- `src/components/dashboard/QuickActions.tsx` — 快捷入口组件

### API 路由

- `src/app/api/v1/dashboard/stats/route.ts` — 统计概览 API（需扩展）
- `src/app/api/v1/dashboard/activity/route.ts` — 活动趋势 API
- `src/app/api/v1/dashboard/progress/route.ts` — 里程碑进度 API（需扩展）
- `src/app/api/v1/dashboard/risks/route.ts` — 风险数据 API
- `src/app/api/v1/dashboard/my-tasks/route.ts` — 我的任务 API

### 依赖库

- `recharts` — 已安装，PieChart, BarChart, LineChart, AreaChart 等可用
- `framer-motion` — 已安装，动画效果

### 前 Phase 上下文

- `.planning/phases/03-kanban-list/03-CONTEXT.md` — Phase 3 视图切换模式
- `.planning/phases/04-calendar/04-CONTEXT.md` — Phase 4 日历视图扩展 taskViewStore 的模式

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `src/components/dashboard/MetricCard.tsx`: StatsGrid 组件已实现 4 个统计卡片，带 AnimatedNumber 动画效果，直接复用
- `src/components/dashboard/ActivityChart.tsx`: Recharts AreaChart 已实现，有 7d/30d 切换、渐变填充、图例，作为折线图基础
- `src/components/ui/card.tsx`: shadcn/ui Card 组件，所有图表卡片的基础
- `src/lib/animations.ts`: framer-motion 动画配置（staggerContainer, staggerItem）
- `src/components/ui/skeleton.tsx`: 加载骨架屏组件

### Established Patterns

- Recharts 使用: AreaChart + ResponsiveContainer + Tooltip 模式，在 ActivityChart 中已建立
- API 响应格式: `success(data)` / `error(code, message)` 统一格式
- 组件模式: 'use client' + useState + useEffect 数据获取
- Zustand 状态管理: 用于 UI 状态
- TanStack Query: 用于服务端数据缓存（现有仪表盘未使用，各组件独立 fetch）

### Integration Points

- `src/app/(main)/dashboard/page.tsx`: 仪表盘页面，需添加新图表区域
- `/api/v1/dashboard/stats`: 需扩展返回任务状态分布、优先级分布数据
- `/api/v1/dashboard/progress`: 需扩展支持无 projectId 参数，返回全局里程碑列表
- 新增 API: 需返回各项目任务完成率数据（用于柱状图对比）

</code_context>

<specifics>
## Specific Ideas

- 参考 Plane 的数据概览页面：环形图 + 趋势图的组合布局
- 参考 Vikunja 仪表盘风格：简洁清爽，多视图切换
- 环形图参考 GitHub Insights 风格：中间显示总数，外围颜色编码
- 项目对比柱状图参考 Linear 的项目概览：水平柱状图，完成率百分比
- 里程碑进度条参考 Asana：每个里程碑一行，进度条 + 截止日期 + 逾期提示

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 06-dashboard_
_Context gathered: 2026-03-28_
