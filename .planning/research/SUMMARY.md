# Project Research Summary

**Project:** Project Manager - UI Modernization
**Domain:** 现代化项目管理工具 (Next.js 15 + React 18 + TypeScript + shadcn/ui)
**Researched:** 2026-03-25
**Confidence:** HIGH

## Executive Summary

这是一个面向开发者的现代化项目管理工具 UI 重构项目，核心目标是构建类似 Plane/Linear/Vikunja 风格的 SaaS 应用。研究明确建议采用 Next.js 15 App Router 架构，配合 shadcn/ui 组件库实现完全可控的 UI 系统，而非使用 Mantine/Ant Design 等重量级方案。项目已有良好的技术基础（Radix UI、Tailwind CSS 4、Zustand 均已在使用），建议在此基础上补充缺失的 shadcn/ui 组件。

关键风险集中在：主题切换闪烁 (FOUC)、Zustand 状态管理碎片化导致刷新丢失、大数据集看板拖拽性能、以及 Next.js 15 服务端/客户端边界模糊。这些风险均可通过遵循官方模式和建立开发规范来规避。建议采用三阶段递进式开发：先完成布局和基础 UI 组件，再实现设备管理和任务视图核心功能，最后构建 AI 增强功能。

## Key Findings

### Recommended Stack

**Core technologies:**
- **Next.js 15.x**: 全栈 React 框架 — 项目已在使用，App Router 提供 SSR 优势
- **React 18.3.x**: UI 框架 — 与 Next.js 15 兼容，支持 Server Components
- **TypeScript 5.9.x**: 类型安全 — 已配置，与 Next.js 集成良好
- **shadcn/ui**: 组件库 — 复制粘贴模式=完全控制，基于 Radix UI (项目已有)
- **Tailwind CSS 4.1.x**: 工具类 CSS — 已升级至 v4，shadcn/ui 原生支持
- **Zustand 5.0.x**: 客户端状态 — 已在使用，API 简洁，适合 UI 状态管理
- **TanStack Query 5.62.x**: 服务端状态 — 已在使用，处理缓存和突变
- **@dnd-kit 6.3.x**: 拖拽库 — 用于看板视图，现代 API，优于 react-dnd
- **Recharts 2.15.x**: 图表库 — 仪表盘使用，甘特图需自定义 SVG 实现

### Expected Features

**Must have (table stakes):**
- **多视图任务管理** (列表/看板) — 不同工作场景需要不同视图
- **可折叠侧边栏导航** — 现代 SaaS 标准布局
- **命令面板 (Cmd+K)** — 快速导航和操作的行业标准
- **深色/浅色主题切换** — 开发者期望的标配功能
- **仪表盘与统计卡片** — 项目健康状况一目了然
- **设备预定时间选择器** — 设备管理的核心交互
- **审批流程 UI** — 展示审批链、当前状态、历史轨迹

**Should have (competitive):**
- **AI 风险自动识别** — 核心竞争力：从"记录工具"升级为"决策助手"
- **AI 评审材料摘要** — 大幅减少人工审阅时间
- **AI 风险评级建议** — 辅助决策，减少主观偏差
- **设备使用率分析报表** — 可视化展示设备利用率
- **甘特图/时间线视图** — 项目规划和依赖关系可视化

**Defer (v2+):**
- 日历视图 — 依赖关系复杂，Phase 1 后可用列表/看板满足基本需求
- AI 决议草案生成 — 需要完整评审流程数据积累
- 甘特图拖拽编辑 — 技术复杂度极高，甘特图主要用于查看
- 移动端原生 App — 优先保证 Web 响应式体验

### Architecture Approach

推荐采用 Next.js 15 App Router 的分层架构，严格分离 Server/Client 组件边界。数据流从服务端单向传递到客户端，客户端通过 Zustand 和 TanStack Query 管理状态。组件按业务特性组织 (Colocated Features)，而非按技术类型分层。

**Major components:**
1. **Layout 层 (Server)** — 应用外壳、路由结构、SEO
2. **Page 层 (Server)** — 数据获取、权限检查、初始状态
3. **Feature Hooks 层 (Client)** — 业务逻辑封装、状态订阅
4. **Smart Components 层 (Client)** — 组合基础组件、处理交互
5. **Dumb Components 层 (Client)** — 纯展示、事件回调
6. **UI Primitive 层** — Radix UI + Tailwind + CSS Variables

### Critical Pitfalls

1. **主题切换闪烁 (FOUC)** — 使用 `next-themes` 库，在 `layout.tsx` 包裹 `ThemeProvider`，避免在 `useEffect` 中设置主题
2. **Zustand 状态碎片化** — 按功能域划分 store (`authStore`、`boardStore`、`uiStore`)，使用 `useShallow` hook 避免过度订阅
3. **拖拽性能崩溃** — 配置 dnd-kit Sensor 阈值，卡片组件使用 `React.memo`，拖拽排序乐观更新 + debounce 批量同步
4. **Tailwind CSS 4 升级断崖** — 升级前阅读迁移指南，检查 `@apply` 指令行为，动态类名使用 `clsx`/`tailwind-merge`
5. **服务端/客户端边界模糊** — 严格遵循规则：需要交互/状态/Effect 必须添加 `"use client"` 指令

## Implications for Roadmap

基于研究结果，建议采用三阶段递进式开发结构：

### Phase 1: UI 基础设施与布局重构

**Rationale:** 必须先建立稳定的 UI 基础架构和开发规范，后续功能开发才有依托。此阶段解决主题系统、状态管理、组件规范等基础设施问题。

**Delivers:**
- 可折叠侧边栏导航 (Sheet 组件)
- 深色/浅色主题切换 (无闪烁)
- 命令面板 (Cmd+K)
- 统一 Zustand Store 架构
- 基础 UI 组件补齐 (Dialog, Select, Tabs 等 shadcn/ui 组件)

**Addresses:** 主题切换闪烁、Zustand 碎片化、侧边栏动画性能

**Avoids:**
- FOUC 问题 — 使用 next-themes 在服务端确定主题
- Store 重复数据 — 按功能域划分 store
- 动画抖动 — 使用 CSS transform 而非 width 动画

**Uses:** Next.js 15 App Router, shadcn/ui, Zustand 5, Framer Motion

**Research Flags:** 标准模式 — shadcn/ui 和 next-themes 有完善的官方文档，可跳过深度研究

### Phase 2: 任务视图与设备管理 MVP

**Rationale:** 在稳定的 UI 基础上实现核心业务功能。任务视图 (列表/看板) 和设备预定是用户最高频使用的功能，依赖 Phase 1 的布局和状态管理基础设施。

**Delivers:**
- 列表视图 (TanStack Table)
- 看板视图 (@dnd-kit 拖拽)
- 设备 CRUD 界面
- 时间选择器 + 可用时段展示
- 简单冲突检测提示
- 我的预定列表

**Addresses:** 多视图任务管理、设备预定核心交互

**Avoids:**
- 拖拽性能崩溃 — React.memo + 乐观更新 + debounce
- 命令面板性能 — 预加载索引，虚拟列表

**Uses:** @dnd-kit, TanStack Table, React Day Picker, date-fns

**Research Flags:** 需要研究 — 甘特图自定义 SVG 实现需要深度调研 (如 Phase 1 后评估是否集成第三方库)

### Phase 3: AI 增强与高级功能

**Rationale:** 在前两阶段完成后，核心功能稳定运行，此时构建 AI 增强功能形成产品差异化竞争力。AI 功能依赖已有的任务/风险数据结构。

**Delivers:**
- AI 风险识别 (手动触发)
- AI 评审材料摘要
- 风险评级建议展示
- 仪表盘统计卡片
- 活动热图
- 审批流程 UI

**Addresses:** AI 风险识别、AI 评审员、评审材料分析

**Avoids:**
- Recharts 限制 — 甘特图使用自定义 SVG 或集成专用库
- 图表性能问题 — 大数据集评估 visx 替代方案

**Uses:** Recharts, 自定义 SVG, AI API 集成

**Research Flags:** 需要研究 — AI 功能的具体实现方式需要 API 调研和效果验证

### Phase Ordering Rationale

1. **依赖关系驱动:** Phase 1 的 UI 基础设施是 Phase 2/3 的前提 — 没有稳定的主题系统和状态管理，后续功能无法正常工作
2. **架构模式驱动:** 遵循"UI Primitive → Layout → Feature Hooks → Smart Components → Page"的构建顺序
3. **风险规避驱动:** 先在 Phase 1 解决主题闪烁、状态碎片化等基础问题，避免在复杂功能中放大这些问题

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 2:** 甘特图实现方案 — 需评估自定义 SVG vs 第三方库 (frappe-gantt/dhtmlx-gantt)
- **Phase 3:** AI 功能集成 — 需调研 AI API 能力边界和响应格式

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** shadcn/ui 组件集成、主题系统、Zustand Store — 均有完善的官方文档和社区最佳实践
- **Phase 2:** 列表视图、看板视图 — TanStack Table 和@dnd-kit 模式成熟

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | 项目已有技术基础，所有推荐技术均已在 package.json 中存在，官方文档完善 |
| Features | HIGH | 基于 Plane/Vikunja/Focalboard 等成熟产品分析，表格里外功能定义清晰 |
| Architecture | HIGH | Next.js 15 App Router 官方模式，shadcn/ui 架构经过验证 |
| Pitfalls | HIGH | 每个 Pitfall 都有官方文档支撑和具体预防策略 |

**Overall confidence:** HIGH

### Gaps to Address

1. **甘特图实现细节:** 研究建议自定义 SVG，但需在实际开发前评估工作量，必要时考虑集成成熟库
2. **AI 功能效果验证:** AI 风险识别和评审材料摘要需要实际测试 AI API 的输出质量，建议在 Phase 3 规划前进行小规模验证
3. **设备冲突检测算法:** 研究提到需要后端支撑，需确认现有数据库模型是否满足冲突检测需求

## Sources

### Primary (HIGH confidence)
- Next.js 15 官方文档 — Server/Client Components, App Router 架构
- shadcn/ui 官方文档 — 组件使用模式和主题系统
- Tailwind CSS 4 官方发布 — v4 迁移指南
- Zustand 官方文档 — State Management Best Practices
- @dnd-kit 官方文档 — 性能优化指南

### Secondary (MEDIUM confidence)
- Plane/Vikunja/Focalboard 产品分析 — 功能参考
- Radix UI 文档 — Headless 组件模式
- TanStack Table v8 文档 — 数据表格实现
- Recharts 文档 — 图表库能力边界

### Tertiary (LOW confidence)
- Gartner AI 项目管理工具分析 2025 — AI 功能趋势 (需验证)
- 设备预定系统设计模式 (ScienceDirect) — 冲突检测算法 (需结合具体实现验证)

---
*Research completed: 2026-03-25*
*Ready for roadmap: yes*
