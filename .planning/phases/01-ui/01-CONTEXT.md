# Phase 1: UI 基础设施 - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

建立稳定的 UI 布局基础架构，实现可折叠侧边栏和响应式 Header。这是整个 UI 现代化的基础设施，后续所有视图和功能组件都将在此基础上构建。

**Requirements:** LAYOUT-01, LAYOUT-03
- LAYOUT-01: 可折叠侧边栏导航，支持展开/收起状态持久化
- LAYOUT-03: 响应式 Header，包含搜索、通知、用户菜单

</domain>

<decisions>
## Implementation Decisions

### 侧边栏折叠
- **D-01:** 折叠模式为「仅图标模式」— 收起后显示图标+Tooltip，参考 Plane/Linear 设计风格
- **D-02:** 折叠触发方式为「专用按钮」— 在侧边栏顶部或底部放置展开/收起按钮
- **D-03:** 折叠状态持久化存储到 localStorage，刷新页面后保持

### Header 行为
- **D-04:** Header 固定在顶部（`position: fixed`），不随滚动消失
- **D-05:** Header 在移动端采用「精简显示」策略 — 搜索/通知/用户菜单折叠到抽屉或下拉菜单

### Claude's Discretion
- 侧边栏动画过渡效果
- Header 高度和样式细节
- 具体的响应式断点数值

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目规划文档
- `.planning/PROJECT.md` — 项目愿景、约束、关键决策
- `.planning/REQUIREMENTS.md` — 需求定义和追踪
- `.planning/ROADMAP.md` — 阶段规划和依赖关系

### 代码库分析
- `.planning/codebase/CONVENTIONS.md` — 编码规范和组件模式
- `.planning/codebase/STRUCTURE.md` — 目录结构和命名约定
- `.planning/codebase/ARCHITECTURE.md` — 系统架构和数据流

### 现有组件参考
- `src/components/layout/AppLayout.tsx` — 现有主布局组件
- `src/components/layout/Sidebar.tsx` — 现有侧边栏组件
- `src/components/layout/Header.tsx` — 现有 Header 组件
- `src/stores/uiStore.ts` — UI 状态管理

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/layout/Sidebar.tsx`: 已有侧边栏实现，需要增强折叠功能
- `src/components/layout/Header.tsx`: 已有 Header 实现，需要增强响应式
- `src/stores/uiStore.ts`: 已有 UI 状态管理，可扩展侧边栏状态
- `src/components/ui/button.tsx`: shadcn/ui Button 组件，可用于折叠按钮

### Established Patterns
- Zustand 状态管理：`create()` + `subscribeWithSelector`
- Tailwind CSS 样式：使用 `cn()` 合并类名
- 组件模式：`forwardRef` + `cva` 变体定义
- SSR 无闪烁：避免客户端状态闪烁

### Integration Points
- `src/app/(main)/layout.tsx`: 布局入口，需集成新的侧边栏和 Header
- `src/app/layout.tsx`: 根布局，提供全局 Provider
- `src/middleware.ts`: 路由保护，不影响布局组件

</code_context>

<specifics>
## Specific Ideas

- 参考 Plane/Linear 的侧边栏设计：收起时仅显示图标，悬停显示 Tooltip
- 折叠按钮放在侧边栏底部，与用户信息区域相邻
- Header 高度建议 56-64px，侧边栏宽度展开 240px，收起 64px

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-ui*
*Context gathered: 2026-03-25*