# Roadmap: Project Manager - UI 现代化与功能增强

## Overview

本项目将现有项目管理系统重构为现代化、智能化的项目管理平台。路线图从 UI 基础设施开始，逐步实现任务视图、管理后台、设备管理，最终通过 AI 功能形成产品差异化竞争力。

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: UI 基础设施** - 可折叠侧边栏、响应式 Header
- [x] **Phase 2: UI 功能组件** - 主题切换、命令面板
- [x] **Phase 3: 列表与看板视图** - 任务列表、看板拖拽
- [x] **Phase 4: 日历视图** - 日历展示、日期拖拽
- [ ] **Phase 5: 甘特图视图** - 时间线、依赖关系可视化
- [ ] **Phase 6: 仪表盘** - 统计卡片、图表组件
- [ ] **Phase 7: 管理后台** - 用户/项目/权限/AI 配置界面
- [ ] **Phase 8: 设备管理 MVP** - 设备 CRUD、预定、冲突检测
- [ ] **Phase 9: 审批配额与统计** - 审批流程、配额管理、机时报表
- [ ] **Phase 10: AI 增强功能** - AI 风险识别、AI 评审员

## Phase Details

### Phase 1: UI 基础设施

**Goal**: 建立稳定的 UI 布局基础架构
**Depends on**: Nothing (first phase)
**Requirements**: LAYOUT-01, LAYOUT-03
**Success Criteria** (what must be TRUE):

1. 用户可以展开/收起侧边栏，状态在刷新页面后保持
2. Header 在不同屏幕尺寸下正确响应式展示
3. 侧边栏支持多层导航结构
4. 布局组件支持 SSR 无闪烁加载
   **Plans**: 3 plans in 2 waves

Plans:

- [x] 01-01-PLAN.md — Foundation: uiStore persist + useMediaQuery + Sheet component
- [x] 01-02-PLAN.md — Sidebar with persistence + AppLayout integration
- [x] 01-03-PLAN.md — Header responsive + MobileNav

**UI hint**: yes

### Phase 2: UI 功能组件

**Goal**: 完善用户交互体验的核心功能组件
**Depends on**: Phase 1
**Requirements**: LAYOUT-02, LAYOUT-04
**Success Criteria** (what must be TRUE):

1. 用户可以切换深色/浅色主题，无闪烁加载
2. 用户可以使用 Cmd+K 打开命令面板进行搜索和导航
3. 命令面板支持最近访问、快捷操作
4. 主题偏好持久化存储
   **Plans**: 2 plans in 1 wave

Plans:

- [x] 02-01-PLAN.md — 主题切换：uiStore 扩展 + useTheme hook + Header 用户菜单集成
- [x] 02-02-PLAN.md — 命令面板增强：最近访问、收藏项目、快捷操作、AI 助手

**UI hint**: yes

### Phase 3: 列表与看板视图

**Goal**: 用户可以通过列表和看板视图管理任务
**Depends on**: Phase 1
**Requirements**: TASK-01, TASK-02, TASK-05
**Success Criteria** (what must be TRUE):

1. 用户可以在列表视图中查看任务，支持排序、筛选、分组
2. 用户可以在看板视图中拖拽任务卡片跨列移动
3. 用户可以查看任务详情抽屉（子任务、评论、标签）
4. 支持内联编辑任务属性
5. 任务状态变更实时更新
   **Plans**: 3 plans in 2 waves

Plans:

- [x] 03-01-PLAN.md — 列表视图：taskViewStore + TaskList 组件 + 筛选栏 + 内联编辑
- [x] 03-02-PLAN.md — 看板视图增强：卡片内联编辑 + 优化拖拽交互
- [x] 03-03-PLAN.md — 任务详情抽屉：四个 Tab（详情、子任务、评论、标签）

**UI hint**: yes

### Phase 4: 日历视图

**Goal**: 用户可以通过日历视图管理任务时间
**Depends on**: Phase 3
**Requirements**: TASK-03
**Success Criteria** (what must be TRUE):

1. 用户可以在日历视图中查看按日期分布的任务
2. 用户可以拖拽任务调整日期
3. 支持月视图和周视图切换
4. 点击日期可创建新任务
   **Plans**: 6 plans in 5 waves

Plans:

- [x] 04-00-PLAN.md — Wave 0: 测试脚手架（5个测试文件占位符）
- [x] 04-01-PLAN.md — taskViewStore 扩展 + TaskCalendar 组件框架
- [x] 04-02-PLAN.md — CalendarDayCell + CalendarTaskCard（任务显示和拖拽）
- [x] 04-03-PLAN.md — UnscheduledTaskList + QuickCreatePopover
- [x] 04-04-PLAN.md — 页面集成 + 功能验证
- [x] 04-05-PLAN.md — Gap Closure: 修复拖拽日期偏移和优先级颜色问题

**UI hint**: yes

### Phase 5: 甘特图视图

**Goal**: 用户可以查看项目时间线和任务依赖关系
**Depends on**: Phase 4
**Requirements**: TASK-04
**Success Criteria** (what must be TRUE):

1. 用户可以在甘特图中查看任务时间线
2. 任务依赖关系通过连线展示
3. 支持缩放和平移浏览
4. 关键路径高亮显示
5. 悬停显示任务详情
   **Plans**: 3 plans in 2 waves

Plans:

- [x] 05-01-PLAN.md — 甘特图基础框架：Store扩展 + 核心渲染组件（双栏布局 + SVG时间线 + 任务条）
- [x] 05-02-PLAN.md — 依赖关系可视化：直角折线连线 + 关键路径算法 + 高亮
- [ ] 05-03-PLAN.md — 交互与页面集成：缩放平移 + 悬停详情 + 视图切换集成

**UI hint**: yes

### Phase 6: 仪表盘

**Goal**: 用户可以查看项目健康状况和统计数据
**Depends on**: Phase 3
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05
**Success Criteria** (what must be TRUE):

1. 仪表盘展示任务数、完成率统计卡片
2. 饼图展示任务状态分布、优先级分布
3. 折线图展示任务完成趋势
4. 柱状图展示项目对比
5. 里程碑进度条/燃尽图
   **Plans**: TBD
   **UI hint**: yes

### Phase 7: 管理后台

**Goal**: 管理员可以配置系统基础数据
**Depends on**: Phase 1
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05
**Success Criteria** (what must be TRUE):

1. 管理员可以创建/编辑/删除用户，分配角色
2. 管理员可以创建/编辑/删除项目，管理成员
3. 管理员可以配置细粒度权限
4. 管理员可以查看审计日志，按条件筛选
5. 管理员可以配置 AI API Key、选择模型、测试连接
   **Plans**: TBD
   **UI hint**: yes

### Phase 8: 设备管理 MVP

**Goal**: 用户可以管理设备并进行预定
**Depends on**: Phase 1
**Requirements**: EQUIP-01, EQUIP-02, EQUIP-03, EQUIP-04, EQUIP-05, EQUIP-06, EQUIP-07, EQUIP-08, EQUIP-09
**Success Criteria** (what must be TRUE):

1. 用户可以创建/编辑/删除设备类型配置
2. 用户可以创建/编辑/删除设备
3. 用户可以切换设备状态（可用、维护中、已停用）
4. 用户可以查看设备详情和预定历史
5. 用户可以选择时段进行设备预定
6. 系统在重复预定时提示冲突
7. 用户可以查看"我的预定"列表
8. 用户可以取消未开始的预定
   **Plans**: 6 plans in 6 waves

Plans:

- [ ] 08-00-PLAN.md — Wave 0: Test scaffolds + Prisma schema (foundation)
- [ ] 08-01-PLAN.md — Wave 1: DeviceType API + Device API (backend CRUD)
- [ ] 08-02-PLAN.md — Wave 2: Device List UI + Sidebar navigation (frontend entry)
- [ ] 08-03-PLAN.md — Wave 3: Booking API + Conflict detection (TDD approach)
- [ ] 08-04-PLAN.md — Wave 4: Device Details + Booking Calendar (drag-to-select)
- [ ] 08-05-PLAN.md — Wave 5: Bookings Page + Integration verification

**UI hint**: yes

### Phase 9: 审批配额与统计

**Goal**: 管理员可以配置审批流程和管理配额
**Depends on**: Phase 8
**Requirements**: EQUIP-10, EQUIP-11, EQUIP-12, EQUIP-13, EQUIP-14, EQUIP-15, EQUIP-16
**Success Criteria** (what must be TRUE):

1. 管理员可以配置审批人和审批链
2. 用户可以查看待审批列表并进行审批操作
3. 管理员可以设置项目/用户配额
4. 用户在超限前收到预警通知
5. 用户可以查看项目机时统计
6. 用户可以查看设备使用率报表
7. 用户可以按条件查询使用记录
   **Plans**: TBD
   **UI hint**: yes

### Phase 10: AI 增强功能

**Goal**: 用户可以借助 AI 能力进行风险识别和评审
**Depends on**: Phase 3, Phase 6
**Requirements**: AIRISK-01, AIRISK-02, AIRISK-03, AIRISK-04, AIREV-01, AIREV-02, AIREV-03, AIREV-04
**Success Criteria** (what must be TRUE):

1. 用户可以手动触发 AI 分析项目数据识别风险
2. AI 提供风险评级建议（概率和影响程度）
3. AI 生成风险应对策略建议
4. 系统定时自动扫描项目风险并通知用户
5. AI 作为评审员参与评审流程并投票
6. AI 分析评审材料并提取关键信息
7. AI 识别评审材料中的问题
8. 评审结束后 AI 自动生成决议草案
   **Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase             | Plans Complete | Status      | Completed  |
| ----------------- | -------------- | ----------- | ---------- |
| 1. UI 基础设施    | 3/3            | Complete    | 2026-03-25 |
| 2. UI 功能组件    | 2/2            | Complete    | 2026-03-28 |
| 3. 列表与看板视图 | 3/3            | Complete    | 2026-03-28 |
| 4. 日历视图       | 6/6            | Complete    | 2026-03-28 |
| 5. 甘特图视图     | 2/3            | In Progress |            |
| 6. 仪表盘         | 0/0            | Not started | -          |
| 7. 管理后台       | 0/0            | Not started | -          |
| 8. 设备管理 MVP   | 0/6            | Planned     | -          |
| 9. 审批配额与统计 | 0/0            | Not started | -          |
| 10. AI 增强功能   | 0/0            | Not started | -          |
