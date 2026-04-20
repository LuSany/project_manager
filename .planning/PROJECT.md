# Project Manager - UI 现代化与功能增强

## What This Is

项目管理器系统是一个企业级项目管理平台，支持任务管理、需求管理、风险管理、评审流程等核心功能。本次里程碑目标是参考 Plane、Vikunja、Focalboard、AppFlowy 等优秀开源项目，重新设计现代化 UI，并新增设备/机时管理、AI 智能分析等功能。

## Core Value

**打造现代化、智能化的项目管理体验** —— 让用户高效管理项目、设备资源，并借助 AI 能力提升决策质量。

## Requirements

### Validated

- ✓ 用户认证系统（登录、注册、密码重置）
- ✓ 项目管理（CRUD、成员管理、里程碑）
- ✓ 任务管理（CRUD、子任务、标签、依赖关系、观察者）
- ✓ 需求管理（CRUD、接受/拒绝、影响分析）
- ✓ 风险管理（CRUD、矩阵图、任务关联）
- ✓ 评审系统（流程、投票、评论、AI 分析）
- ✓ 仪表盘（统计卡片、活动图表）
- ✓ 通知系统（通知、偏好设置）
- ✓ 文件管理（上传、预览、OnlyOffice 集成）
- ✓ 管理后台（用户管理、AI 配置、邮件配置、审计日志）— Validated in Phase 07
- ✓ Webhook 系统
- ✓ UI 布局组件（可折叠侧边栏、命令面板、主题切换）— Validated in Phase 01-02
- ✓ 任务视图组件（列表视图、看板视图、日历视图、甘特图）— Validated in Phase 03-05
- ✓ 仪表盘组件（图表、统计卡片、里程碑进度）— Validated in Phase 06
- ✓ 管理后台组件（用户、项目、权限配置）— Validated in Phase 07
- ✓ 设备管理 MVP（设备 CRUD、预定、冲突检测）— Validated in Phase 08
- ✓ 审批配额与统计（审批流程、配额管理）— Validated in Phase 09
- ✓ AI 增强功能（风险识别、AI 评审员）— Validated in Phase 10

### Active

**当前无活跃需求** — Phase 01-10 已全部完成，待里程碑归档。

### Out of Scope

- 移动端原生 App（Web 响应式优先）
- 实时协作编辑（非核心需求）
- 视频会议集成（暂不实现）

## Context

### 现有技术栈
- **前端**: Next.js 15 + React 18 + TypeScript
- **UI**: Tailwind CSS 4 + Radix UI（升级到 shadcn/ui）
- **状态管理**: Zustand + TanStack Query
- **图表**: Recharts（需增强甘特图）
- **拖拽**: @dnd-kit
- **后端**: Next.js API Routes + Prisma
- **数据库**: PostgreSQL 15

### 参考设计
- **Plane**: 现代 Linear 风格，深色模式，命令面板导航
- **Vikunja**: 简洁清爽，仪表盘 + 多视图切换
- **Focalboard**: Block 架构，属性系统，灵活视图
- **AppFlowy**: Notion 风格，知识管理

### 现有数据库
- 40+ 模型，功能完整
- 支持任务依赖关系（甘特图基础）
- 细粒度权限模型
- AI 配置、审计日志已支持

## Constraints

- **技术栈**: 保持 Next.js + TypeScript + Prisma，不更换框架
- **兼容性**: 新 UI 需兼容现有 API
- **性能**: 首屏加载 < 3s，交互响应 < 100ms
- **浏览器**: 支持 Chrome、Firefox、Safari 最新两个版本

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 采用 shadcn/ui | 与现有 Radix UI 兼容，组件可复制到项目完全可控 | — Pending |
| 自定义 SVG 甘特图 | Recharts 不支持甘特图，自定义可保持风格一致 | — Pending |
| 渐进式路由扩展 | 保持现有路由结构，逐步添加新功能 | — Pending |
| 设备类型可配置 | 支持多种实验室设备，灵活管理 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-25 after initialization*