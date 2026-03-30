# Phase 9: 审批配额与统计 - Context

**Gathered:** 2026-03-30
**Updated:** 2026-03-30 (v2 — 基于代码库实际状态更新)
**Status:** Ready for planning

<domain>
## Phase Boundary

为设备预定建立审批流程、配额管理机制、以及设备使用统计报表。审批流程支持单级和可选多级串行审批，配额按项目维度管理（可按设备类型细分），统计报表覆盖项目机时、设备使用率、使用记录三个维度。

**依赖**: Phase 8（设备管理 MVP）已完成，基于其 bookings/device_types/devices 模型扩展。

**Requirements:** EQUIP-10, EQUIP-11, EQUIP-12, EQUIP-13, EQUIP-14, EQUIP-15, EQUIP-16

**Success Criteria (from ROADMAP.md):**

1. 管理员可以配置审批人和审批链
2. 用户可以查看待审批列表并进行审批操作
3. 管理员可以设置项目/用户配额
4. 用户在超限前收到预警通知
5. 用户可以查看项目机时统计
6. 用户可以查看设备使用率报表
7. 用户可以按条件查询使用记录

</domain>

<decisions>
## Implementation Decisions

### 审批流程设计

- **D-01:** 单级 + 可选多级串行审批 — 大多数设备预定只需一位审批人，贵重设备可配置多级审批链（如组长→主任）
- **D-02:** 按设备类型配置审批人 — 每种设备类型可配置自己的审批人列表，灵活适应不同设备的管理需求
- **D-03:** 审批操作：通过 + 驳回 + 转交 — 审批人可批准、驳回、或转交给其他审批人处理
- **D-04:** 审批通过后预定状态变为"已确认"，用户开始使用时手动确认"使用中"；审批拒绝则预定取消
- **D-05:** 独立审批页面 — 显示所有待审批预定，审批人可逐个或批量处理
- **D-06:** 审批备注：可选填写，驳回时必填 — 确保驳回有明确理由
- **D-07:** 审批超时：提醒审批人不自动通过 — 避免流程阻塞但保持审批严谨性
- **D-08:** 审批链在设备类型配置页内嵌设置 — 管理员配置设备类型时同时设置审批人和审批顺序
- **D-09:** 混合方案集成预定审批 — `BookingStatus` 枚举新增 `PENDING_APPROVAL`，同时新建独立 `approval_configs` 和 `approval_records` 表。预定创建 → PENDING_APPROVAL → 审批通过 → RESERVED → IN_PROGRESS → COMPLETED/CANCELLED。审批链独立可追溯。
- **D-10:** 用户可随时取消正在审批中的预定 — 取消后审批人不再看到该申请
- **D-11:** 双向通知 — 审批人生成审批申请时通知审批人，审批结果通知申请人

### 配额管理机制

- **D-12:** 按项目配额 + 可选按设备类型子配额 — 项目是资源分配的基本单位，可按设备类型进一步细分
- **D-13:** 配额单位：机时（小时） — 以小时为单位计量
- **D-14:** 月度配额，每月重置 — 适合常规设备使用场景
- **D-15:** 配额不结转，上月未用完的机时不累计到下月
- **D-16:** 超限后允许预定但需额外审批 — 超限预定自动转给管理员或指定审批人
- **D-17:** 超限预定转给管理员/指定审批人处理
- **D-18:** 配额在项目设置页配置，预定页展示剩余配额 — 管理员在项目设置中管理，用户在预定界面看到用量
- **D-19:** 支持按设备类型设置子配额 — 在项目配额内进一步限制特定设备类型的机时
- **D-20:** 项目总配额 + 设备类型子配额 — 子配额之和 ≤ 总配额
- **D-21:** 管理员可随时调整配额，立即生效 — 当月已用部分不变
- **D-22:** 新项目手动设置配额，无配额即无限制 — 不强制所有项目设置配额
- **D-23:** 配额按实际使用量计算（非预定时间） — 更准确反映真实消耗
- **D-24:** 配额用量展示：进度条 + 数字（"已用 X 小时 / 总配额 Y 小时"）

### 统计报表展示

- **D-25:** 独立页面 `/equipment/stats` — Tab 页签切换布局，"项目机时统计"、"设备使用率"、"使用记录查询"三个 Tab。复用 Phase 6 的 ChartCard + Recharts 模式保持视觉一致性。
- **D-26:** 混合图表 — 机时趋势用折线图，设备使用率用柱状图，项目对比用水平条形图，配额用进度条
- **D-27:** Excel (xlsx) 导出 — 安装 xlsx 库，在统计 API 中独立实现 Excel 生成和下载，不扩展 report-generator.ts
- **D-28:** 时间范围：月度 + 自定义日期范围 — 默认当前月，可切换到上月/自定义
- **D-29:** 使用记录查询：筛选表格 — 支持按项目、设备、用户、时间范围筛选

### 预警通知机制

- **D-30:** 固定三级预警：50%提醒、80%警告、100%超限
- **D-31:** 站内通知 — 通过现有 `createNotification()` 系统发送（需扩展 NotificationType 枚举）
- **D-32:** 通知项目成员 + 项目经理 — 让相关人员都了解配额使用情况
- **D-33:** 通知包含关键数据摘要 — 项目名、已用/总配额、剩余百分比、超限日期预估
- **D-34:** 预定创建时触发预警检查 — 每次新预定创建时检查配额，触发阈值时发通知
- **D-35:** 每阈值只通知一次 — 避免重复打扰

### Claude's Discretion

- 审批页面的具体布局和交互细节
- 审批超时提醒的间隔时间
- 统计图表的具体颜色主题
- Excel 导出的表格样式和字段顺序
- 超限日期预估算法的实现细节
- 使用记录表格的默认排序和分页设置

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目规划文档

- `.planning/PROJECT.md` — 项目愿景、约束、关键决策
- `.planning/REQUIREMENTS.md` — EQUIP-10 到 EQUIP-16 的完整需求定义
- `.planning/ROADMAP.md` — Phase 9 的目标和成功标准
- `.planning/STATE.md` — 已确认决策和进度

### Phase 8 已实现代码（直接依赖）

- `prisma/schema.prisma` §lines 1145-1207 — `device_types`, `devices`, `bookings` 模型 + `DeviceStatus`, `BookingStatus` 枚举
- `src/app/api/v1/device-types/route.ts` — 设备类型 CRUD API
- `src/app/api/v1/device-types/[id]/route.ts` — 设备类型详情/更新/删除
- `src/app/api/v1/devices/route.ts` — 设备列表/创建 API
- `src/app/api/v1/devices/[id]/route.ts` — 设备详情/更新/删除
- `src/app/api/v1/devices/[id]/status/route.ts` — 设备状态切换（含转换验证）
- `src/app/api/v1/bookings/route.ts` — 预定创建（含冲突检测 `hasBookingConflict`）
- `src/app/api/v1/bookings/[id]/route.ts` — 预定详情
- `src/app/api/v1/bookings/[id]/cancel/route.ts` — 取消预定
- `src/lib/booking-conflict.ts` — `hasBookingConflict()` 冲突检测函数
- `src/stores/deviceStore.ts` — 设备筛选/分页 Zustand store
- `src/components/devices/DeviceTable.tsx` — 设备列表表格
- `src/components/devices/DeviceBookingCalendar.tsx` — 日历拖拽预定组件
- `src/components/devices/BookingCreatePopover.tsx` — 预定创建弹出框
- `src/components/bookings/MyBookingsTable.tsx` — 我的预定表格
- `src/components/bookings/AllBookingsTable.tsx` — 全部预定表格

### 通知系统参考

- `src/lib/notification.ts` — 通知核心库，`createNotification()` 函数及各专用通知函数
- `src/app/api/v1/notifications/route.ts` — 通知 CRUD API
- `src/app/api/v1/notifications/preferences/route.ts` — 通知偏好设置
- `prisma/schema.prisma` §lines 1006-1024 — `NotificationType` 枚举（需扩展）

### 图表和统计参考

- `src/components/dashboard/ChartCard.tsx` — 通用图表容器（loading/empty 状态）
- `src/components/dashboard/MetricCard.tsx` — 动画数字卡片 + `StatsGrid` 组件
- `src/components/dashboard/ActivityChart.tsx` — Recharts AreaChart 模式
- `src/components/dashboard/PriorityDonut.tsx` — PieChart 环形图模式
- `src/components/dashboard/ProjectComparisonChart.tsx` — 项目对比柱状图
- `src/components/dashboard/MilestoneProgressList.tsx` — 进度列表
- `src/types/dashboard-charts.ts` — 图表颜色映射常量和类型
- `src/app/api/v1/dashboard/stats/route.ts` — 统计 API 模式（Promise.all + groupBy）

### UI 模式参考

- `src/components/ui/data-table.tsx` — TanStack Table 基础实现（Phase 3）
- `src/components/ui/progress.tsx` — 进度条组件
- `src/components/ui/skeleton.tsx` — 骨架屏加载组件
- `.planning/phases/03-kanban-list/03-CONTEXT.md` — TanStack Table 模式参考

### 前阶段上下文

- `.planning/phases/06-dashboard/06-CONTEXT.md` — Phase 6 图表和统计模式
- `.planning/phases/07-guan-li-hou-tai/07-CONTEXT.md` — Phase 7 管理后台模式
- `.planning/phases/08-mvp/08-CONTEXT.md` — Phase 8 设备管理决策

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `src/lib/notification.ts` — `createNotification()` 函数可直接扩展，需在 `NotificationType` 枚举中添加 `APPROVAL_REQUEST`、`APPROVAL_APPROVED`、`APPROVAL_REJECTED`、`QUOTA_WARNING`、`QUOTA_EXCEEDED`
- `src/components/dashboard/ChartCard.tsx` — 统一图表容器，loading/empty 状态处理，可直接复用于设备统计页
- `src/components/dashboard/MetricCard.tsx` — 动画数字卡片 + StatsGrid 组件，复用于设备统计概览
- `src/components/ui/data-table.tsx` — TanStack Table 基础，复用于使用记录查询
- `src/lib/api/response.ts` — `success()`/`error()` 统一响应格式
- `src/components/ui/progress.tsx` — 进度条组件，复用于配额展示
- `src/components/devices/BookingCreatePopover.tsx` — 预定创建流程需集成审批触发
- `src/lib/booking-conflict.ts` — 冲突检测逻辑，审批流程需在其后触发

### Established Patterns

- Recharts 图表：AreaChart + ResponsiveContainer + Tooltip 模式（Phase 6 已建立）
- API 统计：Promise.all 并行查询 + groupBy 聚合（dashboard stats 已建立）
- 通知创建：`createNotification()` + 专用通知函数模式（notification.ts 已建立）
- TanStack Table：data-table.tsx + 筛选排序分页（Phase 3 已建立）
- 审批链模式：新建 `approval_configs`（按设备类型配置审批人）+ `approval_records`（审批记录）
- 配额模型：新建 `quotas`（项目级配额）+ `quota_sub_items`（设备类型子配额）

### Integration Points

- **Prisma Schema 扩展**: `BookingStatus` 新增 `PENDING_APPROVAL`；`NotificationType` 新增审批/配额相关类型
- **审批流程**: 新建 `approval_configs`, `approval_records` 模型和 API，关联 `bookings` 和 `device_types`
- **配额管理**: 新建 `quotas`, `quota_sub_items` 模型和 API，关联 `projects` 和 `device_types`
- **统计报表**: 新建统计 API `/api/v1/equipment/stats/`，基于 bookings 数据聚合
- **预警通知**: 扩展 `src/lib/notification.ts`，添加配额相关通知函数
- **预定流程集成**: 修改 `src/app/api/v1/bookings/route.ts` POST 创建预定后自动触发审批链和配额检查
- **页面路由**: 新增审批页面 `src/app/(main)/approvals/page.tsx`，统计页面 `src/app/(main)/equipment/stats/page.tsx`
- **侧边栏导航**: 更新 `src/components/layout/Sidebar.tsx` 添加审批和统计导航入口
- **Excel 导出**: 安装 `xlsx` 库，在统计 API 中独立实现导出端点

</code_context>

<specifics>
## Specific Ideas

- 审批页参考 Phase 7 管理后台的 TanStack Table 模式（筛选、排序、批量操作）
- 统计图表复用 Phase 6 的 ChartCard + Recharts 模式，保持视觉一致性
- Excel 导出安装 xlsx 库，在 `/api/v1/equipment/stats/export` 端点独立实现，返回 application/octet-stream
- 审批超时提醒复用通知系统，设定合理间隔（如 24 小时）
- 超限日期预估算法：根据最近 7 天平均日用量推算剩余天数
- 配额进度条在预定页顶部醒目位置展示，使用不同颜色区分安全/警告/超限状态
- 设备类型子配额配置使用可折叠面板，默认收起，仅显示总配额
- 预定创建流程变更：创建预定 → 检查冲突 → 触发审批链 → 设为 PENDING_APPROVAL → 审批通过后 → RESERVED

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 09-shen-pei-e-yu-tong-ji_
_Context gathered: 2026-03-30_
_Updated: 2026-03-30 (v2 — 基于代码库实际状态更新)_
