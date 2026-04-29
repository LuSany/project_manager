# Requirements: Project Manager - UI 现代化与功能增强

**Defined:** 2026-03-25
**Core Value:** 打造现代化、智能化的项目管理体验

## v1 Requirements

### UI-001: 布局与主题系统

- [x] **LAYOUT-01**: 可折叠侧边栏导航，支持展开/收起状态持久化
- [x] **LAYOUT-02**: 深色/浅色主题切换，无闪烁加载
- [x] **LAYOUT-03**: 响应式 Header，包含搜索、通知、用户菜单
- [x] **LAYOUT-04**: 命令面板 (⌘K)，支持快速导航和搜索

### UI-002: 任务视图组件

- [x] **TASK-01**: 列表视图，支持排序、筛选、分组、内联编辑
- [x] **TASK-02**: 看板视图，支持拖拽排序、跨列移动
- [x] **TASK-03**: 日历视图，按日期展示任务，支持拖拽调整日期
- [x] **TASK-04**: 时间线/甘特图视图，展示任务时间线和依赖关系
- [x] **TASK-05**: 任务详情抽屉，支持子任务、评论、标签、依赖

### UI-003: 仪表盘组件

- [x] **DASH-01**: 统计卡片组件，展示任务数、完成率、风险数
- [x] **DASH-02**: 饼图/环形图组件，任务状态分布、优先级分布
- [x] **DASH-03**: 折线图组件，任务完成趋势、活动趋势
- [x] **DASH-04**: 柱状图组件，项目对比、团队效率
- [x] **DASH-05**: 里程碑进度组件，燃尽图/进度条

### UI-004: 管理ZQZQ

- [x] **ADMIN-01**: 用户管理界面，CRUD、角色分配、状态切换
- [x] **ADMIN-02**: 项目管理界面，CRUD、成员管理、归档
- [x] **ADMIN-03**: 权限配置界面，细粒度权限设置
- [x] **ADMIN-04**: 审计日志界面，按条件筛选查看
- [x] **ADMIN-05**: AI 配置界面，API Key、模型选择、测试连接

### EQUIP-001: 设备管理基础

- [x] **EQUIP-01**: 设备类型配置，支持自定义设备类型和属性
- [x] **EQUIP-02**: 设备 CRUD 界面，创建、编辑、删除设备
- [x] **EQUIP-03**: 设备状态管理，可用、维护中、已停用
- [x] **EQUIP-04**: 设备详情页，展示设备信息和预定历史

### EQUIP-002: 设备预定功能

- [x] **EQUIP-05**: 时间选择器，直观展示可用时段
- [x] **EQUIP-06**: 预定创建，选择设备、时间、项目关联
- [x] **EQUIP-07**: 冲突检测，防止重复预定
- [x] **EQUIP-08**: 预定列表，查看我的预定和所有预定
- [x] **EQUIP-09**: 预定取消，支持取消未开始的预定

### EQUIP-003: 审批与配额

- [x] **EQUIP-10**: 审批流程配置，设置审批人和审批链
- [x] **EQUIP-11**: 审批界面，待审批列表、审批操作
- [x] **EQUIP-12**: 配额管理，设置项目/用户配额
- [x] **EQUIP-13**: 配额预警，超限前主动提醒

### EQUIP-004: 机时统计

- [x] **EQUIP-14**: 项目机时统计，按项目汇总使用时长
- [x] **EQUIP-15**: 设备使用率报表，展示利用率趋势
- [x] **EQUIP-16**: 使用记录查询，按条件筛选历史记录

### AI-001: AI 风险判断

- [x] **AIRISK-01**: 自动风险识别，AI 分析项目数据发现潜在风险
- [x] **AIRISK-02**: 风险评级建议，AI 评估概率和影响程度
- [x] **AIRISK-03**: 应对方案生成，AI 生成风险应对策略
- [x] **AIRISK-04**: 定期风险扫描，定时任务自动扫描并通知

### AI-002: AI 评审参与

- [x] **AIREV-01**: AI 评审员角色，作为评审参与者投票
- [x] **AIREV-02**: 评审材料分析，AI 提取文档关键信息
- [x] **AIREV-03**: 问题自动识别，AI 发现材料中的问题
- [x] **AIREV-04**: 决议草案生成，评审结束后自动生成结论

## v2 Requirements

### 延后功能

- **MOBILE-01**: 移动端原生 App (Web 响应式优先)
- **COLLAB-01**: 实时协作编辑 (非核心需求)
- **VIDEO-01**: 视频会议集成 (外部工具完成)
- **CHAT-01**: 即时通讯功能 (Webhook 推送至 IM)
- **I18N-01**: 多语言国际化 (当前中文为主)
- **REPORT-01**: 复杂报表自定义 (预设报表足够)

## Out of Scope

| Feature | Reason |
|---------|--------|
| 移动端原生 App | 开发维护成本高，Web 响应式优先 |
| 实时协作编辑 | 技术复杂度高，非核心场景 |
| 视频会议集成 | 与专业平台重复，API 维护成本高 |
| 即时通讯/聊天 | Slack/钉钉已解决，整合价值低 |
| 代码托管功能 | GitHub/GitLab 专业领域 |
| 复杂报表自定义 | 学习曲线陡峭，预设报表足够 |
| 拖拽甘特图编辑 | 技术复杂度高，编辑用列表/详情 |
| 多语言国际化 | 当前用户群体以中文为主 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| LAYOUT-01 | Phase 1 | Complete |
| LAYOUT-03 | Phase 1 | Complete |
| LAYOUT-02 | Phase 2 | Complete |
| LAYOUT-04 | Phase 2 | Complete |
| TASK-01 | Phase 3 | Complete |
| TASK-02 | Phase 3 | Complete |
| TASK-05 | Phase 3 | Complete |
| TASK-03 | Phase 4 | Complete |
| TASK-04 | Phase 5 | Complete |
| DASH-01 | Phase 6 | Complete |
| DASH-02 | Phase 6 | Complete |
| DASH-03 | Phase 6 | Complete |
| DASH-04 | Phase 6 | Complete |
| DASH-05 | Phase 6 | Complete |
| ADMIN-01 | Phase 7 | Complete |
| ADMIN-02 | Phase 7 | Complete |
| ADMIN-03 | Phase 7 | Complete |
| ADMIN-04 | Phase 7 | Complete |
| ADMIN-05 | Phase 7 | Complete |
| EQUIP-01 | Phase 8 | Complete |
| EQUIP-02 | Phase 8 | Complete |
| EQUIP-03 | Phase 8 | Complete |
| EQUIP-04 | Phase 8 | Complete |
| EQUIP-05 | Phase 8 | Complete |
| EQUIP-06 | Phase 8 | Complete |
| EQUIP-07 | Phase 8 | Complete |
| EQUIP-08 | Phase 8 | Complete |
| EQUIP-09 | Phase 8 | Complete |
| EQUIP-10 | Phase 9 | Complete |
| EQUIP-11 | Phase 9 | Complete |
| EQUIP-12 | Phase 9 | Complete |
| EQUIP-13 | Phase 9 | Complete |
| EQUIP-14 | Phase 9 | Complete |
| EQUIP-15 | Phase 9 | Complete |
| EQUIP-16 | Phase 9 | Complete |
| AIRISK-01 | Phase 10 | Complete |
| AIRISK-02 | Phase 10 | Complete |
| AIRISK-03 | Phase 10 | Complete |
| AIRISK-04 | Phase 10 | Complete |
| AIREV-01 | Phase 10 | Complete |
| AIREV-02 | Phase 10 | Complete |
| AIREV-03 | Phase 10 | Complete |
| AIREV-04 | Phase 10 | Complete |

**Coverage:**
- v1 requirements: 43 total
- Mapped to phases: 43
- Complete: 43 (100%)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-04-29 after verifying all requirements are implemented*
