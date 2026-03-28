# Phase 2: UI 功能组件 - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

完善用户交互体验的核心功能组件，实现深色/浅色主题切换和命令面板增强。在 Phase 1 建立的布局基础设施上，提供主题切换能力和更强大的快捷导航功能。

**Requirements:** LAYOUT-02, LAYOUT-04
- LAYOUT-02: 深色/浅色主题切换，无闪烁加载
- LAYOUT-04: 命令面板 (⌘K)，支持快速导航和搜索

</domain>

<decisions>
## Implementation Decisions

### 主题切换
- **D-01:** 主题切换按钮放在「用户菜单内」— 在用户头像下拉菜单中与个人信息、设置并列，点击切换
- **D-02:** 主题架构采用「扩展 uiStore」— 与现有 uiStore 模式一致，所有状态集中管理，代码风格统一
- **D-03:** 主题状态持久化到 localStorage，使用 Zustand persist 中间件（复用 Phase 1 模式）

### 命令面板
- **D-04:** 命令面板增强四项功能：
  - 最近访问：记录最近访问的项目、任务、需求页面
  - 收藏项目：允许用户收藏常用项目或页面，始终置顶
  - 快捷操作：常用操作的快捷入口（创建任务、新建项目等）
  - AI 助手：AI 对话入口，与项目数据交互

### Claude's Discretion
- 主题切换动画效果
- 命令面板分组样式
- 最近访问记录数量上限
- 收藏项目排序方式

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目规划文档
- `.planning/PROJECT.md` — 项目愿景、约束、关键决策
- `.planning/REQUIREMENTS.md` — 需求定义和追踪
- `.planning/ROADMAP.md` — 阶段规划和依赖关系

### 现有代码参考
- `src/stores/uiStore.ts` — UI 状态管理（需扩展主题状态）
- `src/components/ui/command-palette.tsx` — 现有命令面板组件
- `src/components/ui/command.tsx` — shadcn/ui Command 组件
- `src/hooks/useCommandPalette.ts` — 命令面板 hook
- `src/app/globals.css` — 已有 dark mode CSS 变量

### Phase 1 参考
- `.planning/phases/01-ui/01-CONTEXT.md` — Phase 1 决策（Zustand persist 模式）
- `src/hooks/useMediaQuery.ts` — 响应式断点检测

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/stores/uiStore.ts`: 已有 Zustand persist 模式，可扩展 `theme` 状态
- `src/components/ui/command-palette.tsx`: 已有命令面板基础实现
- `globals.css`: 已定义完整的 light/dark CSS 变量
- `cmdk` 包: 已安装，命令面板基础库

### Established Patterns
- Zustand persist 中间件：`persist()` + `onRehydrateStorage` 处理 SSR
- 主题 CSS 变量：`:root` 和 `.dark` 类切换
- 命令面板：`useCommandPalette` hook + `CommandItem` 类型

### Integration Points
- `src/components/layout/Header.tsx`: 需集成主题切换按钮（用户菜单内）
- `src/app/(main)/layout.tsx`: 需添加主题 Provider 或类名切换
- `src/hooks/useCommandPalette.ts`: 需扩展命令列表

</code_context>

<specifics>
## Specific Ideas

- 主题切换使用太阳/月亮图标，在用户菜单底部显示
- 命令面板分组：最近访问、收藏、快捷操作、AI 助手
- 最近访问记录上限建议 5-10 条
- 参考 Linear 的命令面板设计：分组清晰、快捷键提示

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-ui*
*Context gathered: 2026-03-26*