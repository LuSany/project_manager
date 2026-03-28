# Phase 8: 设备管理 MVP - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

用户可以管理设备（类型配置、CRUD、状态切换）并进行设备预定。系统检测预定冲突，用户可查看预定历史和取消未开始的预定。审批和配额功能属于 Phase 9。

</domain>

<decisions>
## Implementation Decisions

### 设备类型结构

- **D-01:** 设备类型采用固定字段设计
  - 字段：名称、型号、位置、描述、负责人
  - 简单直观，易于实现和维护
  - MVP 阶段优先，后续可根据需求扩展

### 预定交互方式

- **D-02:** 日历拖拽方式预定设备
  - 类似日历视图，用户从设备可用时间表中直接选择连续时段
  - 直观的交互方式，提升用户体验

### 冲突检测策略

- **D-03:** 精确匹配冲突检测
  - 完全禁止时间重叠
  - 冲突时提示具体冲突的预定
  - 用户需调整时间后才能预定

### 设备列表展示

- **D-04:** 表格视图展示设备列表
  - 适合管理员查看所有设备
  - 支持筛选、排序功能
  - 可在表格中显示设备状态、位置等信息

### 状态流转流程

- **D-05:** 完整设备状态机
  - 状态：可用 → 已预约 → 使用中 → 维护中 → 已停用
  - 完整生命周期管理
  - 适合贵重设备的精细管理

### Claude's Discretion

- 设备详情页的详细信息展示结构
- 预定历史的时间范围显示（最近30天 vs 全部）
- 设备搜索和筛选的字段选择

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements

- `.planning/REQUIREMENTS.md` — EQUIP-01 到 EQUIP-09 的完整需求定义

### Project Context

- `.planning/PROJECT.md` — 项目整体目标和技术栈约束
- `.planning/ROADMAP.md` — Phase 8 的目标和成功标准

### Prior Phases

- Phase 1-4 建立的 UI 模式和组件库可复用

[No external specs — requirements fully captured in decisions above]

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `src/components/ui/card.tsx` — 设备卡片可复用
- `src/components/ui/table.tsx` — 设备列表表格
- `src/components/ui/dialog.tsx` — 设备创建/编辑弹窗
- `src/components/ui/calendar.tsx` — 日历组件，用于预定时间选择
- `src/components/ui/select.tsx` — 下拉选择，用于状态切换

### Established Patterns

- Zustand + TanStack Query 组合用于状态管理和数据获取
- UI 组件使用 cva 定义变体
- 使用 `cn()` 工具函数合并类名

### Integration Points

- 新增页面：`src/app/(main)/devices/page.tsx` — 设备列表
- 新增页面：`src/app/(main)/devices/[id]/page.tsx` — 设备详情
- 新增页面：`src/app/(main)/bookings/page.tsx` — 预定列表
- 侧边栏导航需要添加设备管理入口

</code_context>

<specifics>
## Specific Ideas

- 日历拖拽预定参考 Phase 4 日历视图的拖拽交互模式
- 表格布局参考 Phase 3 列表视图的筛选和排序功能

</specifics>

<deferred>
## Deferred Ideas

- 设备预约审批流程 — Phase 9
- 配额管理 — Phase 9
- 机时统计报表 — Phase 9

</deferred>

---

_Phase: 08-mvp_
_Context gathered: 2026-03-29_
