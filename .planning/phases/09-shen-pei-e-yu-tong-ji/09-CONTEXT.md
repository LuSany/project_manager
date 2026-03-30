# Phase 9: 审批配额与统计 - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

为设备预定建立审批流程、配额管理机制、以及设备使用统计报表。审批流程支持单级和可选多级串行审批，配额按项目维度管理（可按设备类型细分），统计报表覆盖项目机时、设备使用率、使用记录三个维度。

**注意**: Phase 8（设备管理 MVP）尚未执行，本阶段的实现需要在 Phase 8 完成后开始。

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
- **D-09:** 预定提交后必须审批（先审批后使用） — 所有预定需审批通过才能使用设备
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

- **D-25:** Tab 页签切换布局 — "项目机时统计"、"设备使用率"、"使用记录查询"三个 Tab
- **D-26:** 混合图表 — 机时趋势用折线图，设备使用率用柱状图，项目对比用水平条形图，配额用进度条
- **D-27:** Excel (xlsx) 导出 — 适合机时数据分析和报表
- **D-28:** 时间范围：月度 + 自定义日期范围 — 默认当前月，可切换到上月/自定义
- **D-29:** 使用记录查询：筛选表格 — 支持按项目、设备、用户、时间范围筛选

### 预警通知机制

- **D-30:** 固定三级预警：50%提醒、80%警告、100%超限
- **D-31:** 站内通知 — 通过现有 createNotification() 系统发送
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

### Phase 8 上下文（直接依赖）

- `.planning/phases/08-mvp/08-CONTEXT.md` — Phase 8 的设备管理决策
- `.planning/phases/08-mvp/08-00-PLAN.md` — Prisma schema 定义（device_types, devices, bookings 模型）

### 通知系统参考

- `src/lib/notification.ts` — 通知核心库，createNotification() 函数
- `src/app/api/v1/notifications/route.ts` — 通知 API

### 图表和统计参考

- `src/components/dashboard/ChartCard.tsx` — 通用图表容器
- `src/components/dashboard/ActivityChart.tsx` — Recharts AreaChart 模式
- `src/components/dashboard/PriorityDonut.tsx` — PieChart 环形图模式
- `src/components/dashboard/MetricCard.tsx` — 数字统计卡片
- `src/types/dashboard-charts.ts` — 图表颜色映射常量
- `src/app/api/v1/dashboard/stats/route.ts` — 统计 API 模式

### 报告生成参考

- `src/lib/services/report-generator.ts` — PDF/Word 报告生成模式

### UI 模式参考

- `src/components/ui/data-table.tsx` — TanStack Table 基础实现（Phase 3）
- `.planning/phases/03-kanban-list/03-CONTEXT.md` — TanStack Table 模式参考

### 前阶段上下文

- `.planning/phases/06-dashboard/06-CONTEXT.md` — Phase 6 图表和统计模式
- `.planning/phases/07-guan-li-hou-tai/07-CONTEXT.md` — Phase 7 管理后台模式

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `src/lib/notification.ts` — createNotification() 函数可直接扩展，添加 QUOTA_WARNING、QUOTA_EXCEEDED 通知类型
- `src/components/dashboard/ChartCard.tsx` — 统一图表容器，loading/empty 状态处理
- `src/components/dashboard/MetricCard.tsx` — 动画数字卡片，可复用于统计页
- `src/components/ui/data-table.tsx` — TanStack Table 基础，可复用于使用记录查询
- `src/lib/api/response.ts` — success()/error() 统一响应格式
- `src/components/ui/progress.tsx` — 进度条组件，可用于配额展示

### Established Patterns

- Recharts 图表：AreaChart + ResponsiveContainer + Tooltip 模式（Phase 6 已建立）
- API 统计：Promise.all 并行查询 + groupBy 聚合（dashboard stats 已建立）
- 通知创建：createNotification() + 专用通知函数模式（notification.ts 已建立）
- TanStack Table：data-table.tsx + 筛选排序分页（Phase 3 已建立）

### Integration Points

- **审批流程**: 需新建 Approval model 和 API，关联 Booking model（Phase 8 定义）
- **配额管理**: 需新建 Quota model 和 API，关联 Project 和 DeviceType models
- **统计报表**: 需新建统计 API，基于 bookings 数据聚合
- **预警通知**: 扩展 notification.ts，添加配额相关通知类型
- **页面路由**: 新增审批页面 `/app/(main)/approvals/page.tsx`，统计页面 `/app/(main)/equipment/stats/page.tsx`
- **侧边栏**: 需添加审批和统计的导航入口

</code_context>

<specifics>
## Specific Ideas

- 审批页参考 Phase 7 管理后台的 TanStack Table 模式（筛选、排序、批量操作）
- 统计图表复用 Phase 6 的 ChartCard + Recharts 模式，保持视觉一致性
- Excel 导出可使用 xlsx 库（需新增依赖），参考现有 report-generator.ts 的模式
- 审批超时提醒复用通知系统，设定合理间隔（如 24 小时）
- 超限日期预估算法：根据最近 7 天平均日用量推算剩余天数
- 配额进度条在预定页顶部醒目位置展示，使用不同颜色区分安全/警告/超限状态
- 设备类型子配额配置使用可折叠面板，默认收起，仅显示总配额

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 09-shen-pei-e-yu-tong-ji_
_Context gathered: 2026-03-30_
