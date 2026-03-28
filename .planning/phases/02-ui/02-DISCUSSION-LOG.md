# Phase 2: UI 功能组件 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 02-ui
**Areas discussed:** 主题切换位置, 命令面板功能, 主题架构选择

---

## 主题切换位置

| Option | Description | Selected |
|--------|-------------|----------|
| 用户菜单内 | 放在用户头像下拉菜单中，与个人信息、设置等选项并列 | ✓ |
| Header 独立按钮 | 在 Header 右侧显示太阳/月亮图标按钮，独立于用户菜单 | |
| 侧边栏底部 | 放在侧边栏底部，与设置按钮相邻 | |

**User's choice:** 用户菜单内
**Notes:** 与个人信息、设置等选项并列，点击切换

---

## 命令面板功能

| Option | Description | Selected |
|--------|-------------|----------|
| 最近访问 | 记录最近访问的项目、任务、需求页面 | ✓ |
| 收藏项目 | 允许用户收藏常用的项目或页面 | ✓ |
| 快捷操作 | 常用操作的快捷入口，如「创建任务」「新建项目」 | ✓ |
| AI 助手 | AI 对话入口，与项目数据进行交互 | ✓ |

**User's choice:** 全部四项功能
**Notes:** 提供完整的命令面板增强功能

---

## 主题架构选择

| Option | Description | Selected |
|--------|-------------|----------|
| 扩展 uiStore | 与现有 uiStore 模式一致，所有状态集中管理 | ✓ |
| 使用 next-themes | Next.js 标准方案，自动处理 SSR、系统主题检测 | |

**User's choice:** 扩展 uiStore
**Notes:** 保持代码风格统一，与 Phase 1 的 Zustand persist 模式一致

---

## Claude's Discretion

- 主题切换动画效果
- 命令面板分组样式
- 最近访问记录数量上限
- 收藏项目排序方式

## Deferred Ideas

None — discussion stayed within phase scope.