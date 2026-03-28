# Phase 1: UI 基础设施 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 01-ui
**Areas discussed:** 侧边栏折叠方式, Header 行为

---

## 侧边栏折叠方式

| Option | Description | Selected |
|--------|-------------|----------|
| 仅图标模式 | 收起后显示图标+Tooltip，参考 Plane/Linear | ✓ |
| 完全隐藏 | 收起后完全隐藏，内容区扩展全宽 | |
| 迷你模式 | 收起后变成窄条，显示部分文字 | |
| 其他方式 | 让我描述具体需求 | |

**User's choice:** 仅图标模式
**Notes:** 参考 Plane/Linear 设计风格

---

### 折叠触发方式

| Option | Description | Selected |
|--------|-------------|----------|
| 专用按钮 | 在侧边栏顶部或底部有展开/收起按钮 | ✓ |
| Hover 展开 | 鼠标悬停时展开，离开时收起 | |
| 可拖拽宽度 | 用户拖动边缘调整宽度 | |
| 按钮 + Hover | 同时支持按钮和 Hover | |

**User's choice:** 专用按钮
**Notes:** 按钮位置推荐在侧边栏顶部或底部

---

## Header 行为

### 固定方式

| Option | Description | Selected |
|--------|-------------|----------|
| 固定顶部 | 始终固定在顶部，不随滚动消失 | ✓ |
| 滚动隐藏 | 向下滚动时隐藏，向上滚动时显示 | |
| 可配置行为 | 大部分页面固定，某些页面可以隐藏 | |

**User's choice:** 固定顶部
**Notes:** `position: fixed` 实现

---

### 移动端处理

| Option | Description | Selected |
|--------|-------------|----------|
| 精简显示 | 保留主要功能，搜索/通知/用户菜单折叠到抽屉 | ✓ |
| 完全保留 | 与桌面端完全相同 | |
| 极简模式 | 只保留 Logo 和用户头像 | |

**User's choice:** 精简显示
**Notes:** 搜索/通知/用户菜单折叠到抽屉或下拉菜单

---

## Claude's Discretion

- 侧边栏动画过渡效果
- Header 高度和样式细节
- 具体的响应式断点数值

## Deferred Ideas

None — discussion stayed within phase scope.