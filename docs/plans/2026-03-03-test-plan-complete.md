# 项目管理系统完整测试方案

**版本**: v2.0  
**日期**: 2026-03-03  
**目标覆盖率**: 90%+  
**当前覆盖率**: 33%

---

## 一、项目概况

### 1.1 项目规模

| 维度     | 数量                   |
| -------- | ---------------------- |
| 功能模块 | 21 个                  |
| API 路由 | 90 个                  |
| 服务文件 | 19 个                  |
| 组件     | 52 个                  |
| 数据模型 | 46 个                  |
| 现有测试 | 48 个文件 / 297 个用例 |

### 1.2 技术栈

- **框架**: Next.js 15 + React 18 + TypeScript
- **数据库**: PostgreSQL + Prisma 6
- **测试框架**: Vitest (单元/集成) + Playwright (E2E)
- **状态管理**: Zustand + TanStack Query

---

## 二、功能模块清单

### 2.1 模块覆盖率总览

| 序号 | 模块       | 功能点 | 已测试 | 覆盖率 | 优先级 |
| ---- | ---------- | ------ | ------ | ------ | ------ |
| 1    | 用户与权限 | 6      | 5      | 83%    | P1     |
| 2    | 项目管理   | 4      | 3      | 75%    | P0     |
| 3    | 任务管理   | 17     | 9      | 53%    | P0     |
| 4    | 里程碑管理 | 6      | 3      | 50%    | P1     |
| 5    | 需求管理   | 10     | 3      | 30%    | P0     |
| 6    | 问题管理   | 7      | 2      | 29%    | P0     |
| 7    | 评审管理   | 12     | 5      | 42%    | P0     |
| 8    | AI评审分析 | 8      | 0      | 0%     | P0     |
| 9    | 风险管理   | 11     | 1      | 9%     | P1     |
| 10   | 文件管理   | 10     | 3      | 30%    | P1     |
| 11   | 通知系统   | 10     | 2      | 20%    | P1     |
| 12   | 邮件服务   | 6      | 1      | 17%    | P2     |
| 13   | Webhook    | 5      | 0      | 0%     | P0     |
| 14   | 定时任务   | 3      | 0      | 0%     | P0     |
| 15   | 标签管理   | 4      | 0      | 0%     | P2     |
| 16   | 模板管理   | 5      | 3      | 60%    | P2     |
| 17   | 仪表板     | 7      | 0      | 0%     | P0     |
| 18   | 报告生成   | 2      | 0      | 0%     | P2     |
| 19   | 审计日志   | 2      | 0      | 0%     | P2     |
| 20   | 预览服务   | 3      | 1      | 33%    | P2     |
| 21   | 核心服务   | 9      | 8      | 89%    | P1     |

### 2.2 功能点详情

#### 模块 1: 用户与权限 (覆盖率: 83%)

| 子功能       | 对应文件                                                    | 是否有测试 |
| ------------ | ----------------------------------------------------------- | ---------- |
| 用户注册     | auth/register/route.ts                                      | ✅         |
| 用户登录     | auth/login/route.ts                                         | ✅         |
| 密码重置     | auth/reset-password/route.ts, auth/forgot-password/route.ts | ✅         |
| 用户状态管理 | prisma/schema.prisma (UserStatus)                           | ✅         |
| 系统角色管理 | prisma/schema.prisma (SystemRole)                           | ✅         |
| 角色选择器   | components/users/role-select.tsx                            | ❌         |

#### 模块 2: 项目管理 (覆盖率: 75%)

| 子功能       | 对应文件                       | 是否有测试 |
| ------------ | ------------------------------ | ---------- |
| 项目CRUD     | projects/route.ts              | ✅         |
| 项目成员管理 | projects/[id]/members/route.ts | ✅         |
| 项目状态管理 | prisma/schema.prisma           | ❌         |
| 项目角色管理 | prisma/schema.prisma           | ✅         |

#### 模块 3: 任务管理 (覆盖率: 53%)

| 子功能         | 对应文件                              | 是否有测试 |
| -------------- | ------------------------------------- | ---------- |
| 任务CRUD       | tasks/route.ts                        | ✅         |
| 任务状态管理   | tasks/[id]/status/route.ts            | ✅         |
| 任务进度跟踪   | tasks/[id]/progress/route.ts          | ✅         |
| 任务优先级     | prisma/schema.prisma                  | ✅         |
| 任务执行人     | prisma/schema.prisma                  | ✅         |
| 任务依赖管理   | tasks/[id]/dependencies/route.ts      | ✅         |
| 任务导入       | tasks/import/route.ts                 | ✅         |
| 任务关注者     | tasks/[id]/watchers/route.ts          | ❌         |
| 子任务管理     | tasks/[id]/subtasks/route.ts          | ❌         |
| 任务标签       | tasks/[id]/tags/route.ts              | ❌         |
| 任务看板       | components/tasks/TaskKanban.tsx       | ❌         |
| 任务时间线     | components/tasks/TaskTimeline.tsx     | ❌         |
| 任务依赖可视化 | components/tasks/TaskDependencies.tsx | ❌         |
| 子任务列表     | components/tasks/SubTaskList.tsx      | ❌         |
| 任务观察者     | components/tasks/TaskWatchers.tsx     | ❌         |
| 任务导入对话框 | components/tasks/TaskImportDialog.tsx | ❌         |
| 日期范围选择   | components/tasks/DateRangePicker.tsx  | ❌         |

#### 模块 4: 里程碑管理 (覆盖率: 50%)

| 子功能         | 对应文件                                | 是否有测试 |
| -------------- | --------------------------------------- | ---------- |
| 里程碑CRUD     | milestones/route.ts                     | ✅         |
| 里程碑详情     | milestones/[id]/route.ts                | ✅         |
| 里程碑状态     | prisma/schema.prisma                    | ✅         |
| 里程碑任务关联 | milestones/[id]/tasks/route.ts          | ❌         |
| 里程碑列表     | components/milestones/MilestoneList.tsx | ❌         |
| 里程碑表单     | components/milestones/MilestoneForm.tsx | ❌         |

#### 模块 5: 需求管理 (覆盖率: 30%)

| 子功能   | 对应文件                               | 是否有测试 |
| -------- | -------------------------------------- | ---------- |
| 需求CRUD | requirements/route.ts                  | ✅         |
| 需求详情 | requirements/[id]/route.ts             | ✅         |
| 需求状态 | prisma/schema.prisma                   | ✅         |
| 需求审批 | requirements/[id]/accept/route.ts      | ❌         |
| 需求拒绝 | requirements/[id]/reject/route.ts      | ❌         |
| 需求验收 | requirements/[id]/acceptances/route.ts | ❌         |
| 需求方案 | requirements/[id]/proposals/route.ts   | ❌         |
| 需求波及 | requirements/[id]/impacts/route.ts     | ❌         |
| 需求讨论 | requirements/[id]/discussions/route.ts | ❌         |
| 变更历史 | requirements/[id]/history/route.ts     | ❌         |

#### 模块 6: 问题管理 (覆盖率: 29%)

| 子功能   | 对应文件                              | 是否有测试 |
| -------- | ------------------------------------- | ---------- |
| 问题CRUD | issues/route.ts                       | ❌         |
| 问题详情 | issues/[id]/route.ts                  | ❌         |
| 问题解决 | issues/[id]/resolve/route.ts          | ❌         |
| 关联需求 | issues/[id]/link-requirement/route.ts | ❌         |
| 问题状态 | prisma/schema.prisma                  | ✅         |
| 问题列表 | components/issues/IssueList.tsx       | ❌         |
| 问题表单 | components/issues/IssueForm.tsx       | ❌         |

#### 模块 7: 评审管理 (覆盖率: 42%)

| 子功能       | 对应文件                                | 是否有测试 |
| ------------ | --------------------------------------- | ---------- |
| 评审CRUD     | reviews/route.ts                        | ✅         |
| 评审详情     | reviews/[id]/route.ts                   | ✅         |
| 评审状态     | prisma/schema.prisma                    | ✅         |
| 评审类型配置 | review-types/route.ts                   | ✅         |
| 评审模板     | review-templates/route.ts               | ✅         |
| 评审参与者   | reviews/[id]/participants/route.ts      | ❌         |
| 评审材料     | reviews/[id]/materials/route.ts         | ❌         |
| 参与者角色   | prisma/schema.prisma                    | ❌         |
| 评审列表     | components/views/ReviewList.tsx         | ❌         |
| 创建评审     | components/views/CreateReviewDialog.tsx | ❌         |
| 评审项表单   | components/views/ReviewItemForm.tsx     | ❌         |
| 材料上传     | components/views/MaterialUpload.tsx     | ❌         |

#### 模块 8: AI评审分析 (覆盖率: 0%)

| 子功能       | 对应文件                                   | 是否有测试 |
| ------------ | ------------------------------------------ | ---------- |
| AI材料分析   | reviews/[id]/ai-analyze/route.ts           | ❌         |
| AI生成检查项 | reviews/[id]/ai-generate-criteria/route.ts | ❌         |
| AI风险识别   | reviews/[id]/ai-identify-risks/route.ts    | ❌         |
| AI生成摘要   | reviews/[id]/ai-generate-summary/route.ts  | ❌         |
| AI服务配置   | admin/ai/configs/route.ts                  | ❌         |
| AI审计日志   | ai/audit/review/route.ts                   | ❌         |
| AI缓存管理   | ai/cache/route.ts                          | ❌         |
| AI风险分析   | ai/analyze/risk/route.ts                   | ❌         |

#### 模块 9: 风险管理 (覆盖率: 9%)

| 子功能       | 对应文件                          | 是否有测试 |
| ------------ | --------------------------------- | ---------- |
| 风险CRUD     | risks/route.ts                    | ✅         |
| 风险详情     | risks/[id]/route.ts               | ❌         |
| 风险任务关联 | risks/[id]/tasks/route.ts         | ❌         |
| 风险类别     | prisma/schema.prisma              | ❌         |
| 风险等级     | prisma/schema.prisma              | ❌         |
| 风险状态     | prisma/schema.prisma              | ❌         |
| 风险列表     | components/risks/RiskList.tsx     | ❌         |
| 风险表单     | components/risks/RiskForm.tsx     | ❌         |
| 风险矩阵     | components/risks/RiskMatrix.tsx   | ❌         |
| 风险进度     | components/risks/RiskProgress.tsx | ❌         |
| 风险任务链接 | components/risks/RiskTaskLink.tsx | ❌         |

#### 模块 10: 文件管理 (覆盖率: 30%)

| 子功能       | 对应文件                                  | 是否有测试 |
| ------------ | ----------------------------------------- | ---------- |
| 文件上传     | files/upload/route.ts                     | ✅         |
| 文件预览     | files/preview/route.ts                    | ✅         |
| OnlyOffice   | lib/preview/onlyoffice.ts                 | ✅         |
| 文件管理     | files/route.ts                            | ❌         |
| 文件详情     | files/[id]/route.ts                       | ❌         |
| 在线编辑     | files/[id]/preview-edit/route.ts          | ❌         |
| OO回调       | files/onlyoffice-callback/route.ts        | ❌         |
| 预览配置     | preview/services/route.ts                 | ❌         |
| OO编辑器     | components/files/OnlyOfficeEditor.tsx     | ❌         |
| 预览配置组件 | components/files/PreviewServiceConfig.tsx | ❌         |

#### 模块 11: 通知系统 (覆盖率: 20%)

| 子功能   | 对应文件                                        | 是否有测试 |
| -------- | ----------------------------------------------- | ---------- |
| 通知创建 | notifications/route.ts                          | ✅         |
| 通知类型 | lib/notification.ts                             | ✅         |
| 偏好设置 | notifications/preferences/route.ts              | ❌         |
| 忽略项目 | notifications/ignore/route.ts                   | ❌         |
| 任务通知 | lib/notification.ts                             | ❌         |
| 到期提醒 | lib/notification.ts                             | ❌         |
| 评审通知 | lib/notification.ts                             | ❌         |
| 风险预警 | lib/notification.ts                             | ❌         |
| 通知抽屉 | components/notifications/NotificationDrawer.tsx | ❌         |
| 通知图标 | components/notifications/NotificationIcon.tsx   | ❌         |

#### 模块 12: 邮件服务 (覆盖率: 17%)

| 子功能     | 对应文件                       | 是否有测试 |
| ---------- | ------------------------------ | ---------- |
| 邮件发送   | lib/email.ts                   | ✅         |
| 邮件配置   | admin/email/configs/route.ts   | ❌         |
| 邮件日志   | admin/email/logs/route.ts      | ❌         |
| 邮件模板   | admin/email/templates/route.ts | ❌         |
| 邮件状态   | prisma/schema.prisma           | ❌         |
| SMTP提供商 | lib/email-providers/smtp.ts    | ❌         |

#### 模块 13: Webhook (覆盖率: 0%)

| 子功能       | 对应文件                          | 是否有测试 |
| ------------ | --------------------------------- | ---------- |
| Webhook CRUD | webhooks/route.ts                 | ❌         |
| Webhook详情  | webhooks/[id]/route.ts            | ❌         |
| 投递记录     | webhooks/[id]/deliveries/route.ts | ❌         |
| Webhook测试  | webhooks/test/route.ts            | ❌         |
| 投递状态     | prisma/schema.prisma              | ❌         |

#### 模块 14: 定时任务 (覆盖率: 0%)

| 子功能   | 对应文件                      | 是否有测试 |
| -------- | ----------------------------- | ---------- |
| 任务管理 | admin/scheduled-jobs/route.ts | ❌         |
| 任务状态 | prisma/schema.prisma          | ❌         |
| Cron支持 | prisma/schema.prisma          | ❌         |

#### 模块 15: 标签管理 (覆盖率: 0%)

| 子功能     | 对应文件                       | 是否有测试 |
| ---------- | ------------------------------ | ---------- |
| 标签创建   | tags/create/route.ts           | ❌         |
| 标签列表   | tags/list/route.ts             | ❌         |
| 标签详情   | tags/[id]/route.ts             | ❌         |
| 标签管理器 | components/tags/TagManager.tsx | ❌         |

#### 模块 16: 模板管理 (覆盖率: 60%)

| 子功能       | 对应文件                       | 是否有测试 |
| ------------ | ------------------------------ | ---------- |
| 评审模板CRUD | review-templates/route.ts      | ✅         |
| 评审模板详情 | review-templates/[id]/route.ts | ✅         |
| 类型种子     | review-types/seed/route.ts     | ❌         |
| 通用模板CRUD | templates/route.ts             | ❌         |
| 通用模板详情 | templates/[id]/route.ts        | ❌         |

#### 模块 17: 仪表板 (覆盖率: 0%)

| 子功能       | 对应文件                              | 是否有测试 |
| ------------ | ------------------------------------- | ---------- |
| 统计         | dashboard/stats/route.ts              | ❌         |
| 我的任务     | dashboard/my-tasks/route.ts           | ❌         |
| 项目进度     | dashboard/progress/route.ts           | ❌         |
| 风险概览     | dashboard/risks/route.ts              | ❌         |
| 我的任务组件 | components/dashboard/MyTasks.tsx      | ❌         |
| 时间线组件   | components/dashboard/TaskTimeline.tsx | ❌         |
| 统计卡片     | components/dashboard/StatsCard.tsx    | ❌         |

#### 模块 18: 报告生成 (覆盖率: 0%)

| 子功能   | 对应文件                         | 是否有测试 |
| -------- | -------------------------------- | ---------- |
| 评审报告 | reports/review/[id]/route.ts     | ❌         |
| 报告服务 | lib/services/report-generator.ts | ❌         |

#### 模块 19: 审计日志 (覆盖率: 0%)

| 子功能       | 对应文件                  | 是否有测试 |
| ------------ | ------------------------- | ---------- |
| 审计日志查询 | admin/audit-logs/route.ts | ❌         |
| 审计动作     | prisma/schema.prisma      | ❌         |

#### 模块 20: 预览服务 (覆盖率: 33%)

| 子功能       | 对应文件                       | 是否有测试 |
| ------------ | ------------------------------ | ---------- |
| KKFileView   | lib/preview/kkfileview.ts      | ✅         |
| 预览服务列表 | preview/services/route.ts      | ❌         |
| 预览服务详情 | preview/services/[id]/route.ts | ❌         |

#### 模块 21: 核心服务 (覆盖率: 89%)

| 子功能     | 对应文件                      | 是否有测试 |
| ---------- | ----------------------------- | ---------- |
| 认证服务   | lib/auth.ts                   | ✅         |
| AI服务     | lib/ai.ts                     | ✅         |
| 缓存服务   | lib/cache.ts                  | ✅         |
| 安全服务   | lib/security.ts               | ✅         |
| 数据库连接 | lib/db.ts, lib/prisma.ts      | ✅         |
| API响应    | lib/api/response.ts           | ✅         |
| API客户端  | lib/api/client.ts             | ✅         |
| 工具函数   | lib/utils.ts                  | ✅         |
| 问题服务   | lib/services/issue-service.ts | ❌         |

---

## 三、现有测试资产

### 3.1 测试文件分布

| 测试类型   | 文件数 | 用例数  | 占比     |
| ---------- | ------ | ------- | -------- |
| 单元测试   | 16     | 156     | 52.5%    |
| 集成测试   | 9      | 101     | 34.0%    |
| 数据库集成 | 15     | -       | 5.1%     |
| E2E测试    | 5      | 21      | 7.1%     |
| 安全测试   | 2      | 12      | 4.0%     |
| 性能测试   | 1      | 7       | 2.4%     |
| **总计**   | **48** | **297** | **100%** |

### 3.2 测试用例详情

#### 单元测试 (156 用例)

| 测试文件             | 模块      | 用例数 |
| -------------------- | --------- | ------ |
| auth.test.ts         | 认证      | 6      |
| email.test.ts        | 邮件      | 8      |
| notification.test.ts | 通知      | 9      |
| security.test.ts     | 安全      | 15     |
| cache.test.ts        | 缓存      | 13     |
| ai.test.ts           | AI        | 9      |
| db.test.ts           | 数据库    | 4      |
| business.test.ts     | 业务逻辑  | 17     |
| zod.test.ts          | 验证      | 14     |
| risk.test.ts         | 风险      | 25     |
| milestone.test.ts    | 里程碑    | 7      |
| onlyoffice.test.ts   | 文档预览  | 20     |
| utils.test.ts        | 工具      | 6      |
| queryClient.test.ts  | 查询      | 3      |
| api/client.test.ts   | API客户端 | 5      |
| api/response.test.ts | API响应   | 5      |

#### 集成测试 (101 用例)

| 测试文件             | 模块     | 用例数 |
| -------------------- | -------- | ------ |
| project.test.ts      | 项目     | 12     |
| task.test.ts         | 任务     | 16     |
| requirement.test.ts  | 需求     | 20     |
| file-preview.test.ts | 文件预览 | 27     |
| notification.test.ts | 通知     | 11     |
| user-flow.test.ts    | 用户流程 | 3      |
| milestone.test.ts    | 里程碑   | 4      |
| review.test.ts       | 评审     | 4      |
| api.test.ts          | API      | 4      |

#### E2E测试 (21 用例)

| 测试文件                  | 模块     | 用例数 |
| ------------------------- | -------- | ------ |
| p0-p1-features.spec.ts    | 核心功能 | 8      |
| auth.spec.ts              | 认证     | 4      |
| role-system.spec.ts       | 角色系统 | 2      |
| task-dependencies.spec.ts | 任务依赖 | 3      |
| email-sending.spec.ts     | 邮件     | 4      |

---

## 四、测试缺口分析

### 4.1 P0 级缺口（核心业务）

| 模块       | 覆盖率 | 缺失功能                             | 预估工时 |
| ---------- | ------ | ------------------------------------ | -------- |
| AI评审分析 | 0%     | 材料分析、检查项生成、风险识别、摘要 | 6h       |
| 仪表板     | 0%     | 统计、进度、风险概览、我的任务       | 4h       |
| Webhook    | 0%     | CRUD、投递记录、触发机制             | 3h       |
| 定时任务   | 0%     | 任务管理、Cron调度                   | 2h       |
| 项目管理   | 75%    | 状态管理流程                         | 2h       |
| 任务管理   | 53%    | 关注者、子任务、标签                 | 4h       |
| 需求管理   | 30%    | 审批、验收、波及、讨论、历史         | 5h       |
| 问题管理   | 29%    | CRUD、解决、关联需求                 | 3h       |
| 评审管理   | 42%    | 参与者、材料、参与者角色             | 4h       |

**P0 小计：33h**

### 4.2 P1 级缺口（重要功能）

| 模块     | 覆盖率 | 缺失功能                         | 预估工时 |
| -------- | ------ | -------------------------------- | -------- |
| 风险管理 | 9%     | 详情、任务关联、类别、等级、状态 | 4h       |
| 通知系统 | 20%    | 偏好、忽略、各类通知场景         | 3h       |
| 文件管理 | 30%    | 管理、详情、在线编辑、回调       | 4h       |
| 里程碑   | 50%    | 任务关联、组件                   | 2h       |
| 核心服务 | 89%    | 问题服务                         | 1h       |

**P1 小计：14h**

### 4.3 P2 级缺口（辅助功能）

| 模块     | 覆盖率 | 缺失功能               | 预估工时 |
| -------- | ------ | ---------------------- | -------- |
| 邮件服务 | 17%    | 配置、日志、模板、SMTP | 2h       |
| 标签管理 | 0%     | CRUD、管理器组件       | 1h       |
| 模板管理 | 40%    | 种子、通用模板         | 1h       |
| 报告生成 | 0%     | 评审报告、生成服务     | 1h       |
| 审计日志 | 0%     | 查询、动作记录         | 1h       |
| 预览服务 | 33%    | 服务列表、详情         | 1h       |

**P2 小计：7h**

---

## 五、实施计划

### 5.1 分阶段计划

```
Phase 1: 基础设施 (Week 1) ─────────────────────────────
├── 测试工具库搭建
│   ├── tests/helpers/test-db.ts (数据库隔离)
│   ├── tests/helpers/test-data-factory.ts (数据工厂)
│   └── tests/helpers/assertions.ts (自定义断言)
├── Mock 工厂创建
│   ├── tests/mocks/prisma-mock.ts
│   └── tests/mocks/request-mock.ts
├── 数据库隔离机制
│   └── 事务回滚 + 测试 Schema
└── CI/CD 集成

Phase 2: P0 核心模块 (Week 2-3) ─────────────────────────
├── AI评审分析测试 (6h)
│   ├── ai-review.test.ts
│   └── ai-analysis.integration.test.ts
├── 仪表板测试 (4h)
│   └── dashboard.integration.test.ts
├── Webhook测试 (3h)
│   └── webhook.integration.test.ts
├── 定时任务测试 (2h)
│   └── scheduled-jobs.test.ts
├── 项目管理补充 (2h)
├── 任务管理补充 (4h)
├── 需求管理补充 (5h)
├── 问题管理补充 (3h)
└── 评审管理补充 (4h)

Phase 3: P1 重要模块 (Week 4) ───────────────────────────
├── 风险管理补充 (4h)
├── 通知系统补充 (3h)
├── 文件管理补充 (4h)
├── 里程碑补充 (2h)
└── 核心服务补充 (1h)

Phase 4: P2 辅助模块 (Week 5) ───────────────────────────
├── 邮件服务补充 (2h)
├── 标签管理测试 (1h)
├── 模板管理补充 (1h)
├── 报告生成测试 (1h)
├── 审计日志测试 (1h)
└── 预览服务补充 (1h)

Phase 5: 覆盖率优化 (Week 6) ────────────────────────────
├── E2E 测试激活
├── 覆盖率分析与缺口补充
├── 回归测试
└── 文档更新
```

### 5.2 工时估算

| 阶段    | 工时 | 累计 |
| ------- | ---- | ---- |
| Phase 1 | 8h   | 8h   |
| Phase 2 | 33h  | 41h  |
| Phase 3 | 14h  | 55h  |
| Phase 4 | 7h   | 62h  |
| Phase 5 | 8h   | 70h  |

### 5.3 覆盖率目标

| 阶段完成 | 预期覆盖率 |
| -------- | ---------- |
| Phase 1  | 35%        |
| Phase 2  | 65%        |
| Phase 3  | 80%        |
| Phase 4  | 88%        |
| Phase 5  | **90%+**   |

---

## 六、测试基础设施

### 6.1 目录结构

```
tests/
├── helpers/
│   ├── test-db.ts              # 数据库隔离
│   ├── test-data-factory.ts    # 数据工厂
│   ├── test-utils.ts           # 通用工具
│   └── assertions.ts           # 自定义断言
├── mocks/
│   ├── prisma-mock.ts          # Prisma Mock
│   ├── request-mock.ts         # Request Mock
│   └── response-mock.ts        # Response Mock
├── fixtures/
│   ├── users.ts
│   ├── projects.ts
│   └── tasks.ts
├── unit/                       # 单元测试
├── integration/
│   └── database/               # 数据库集成
├── security/                   # 安全测试
├── performance/                # 性能测试
└── e2e/                        # E2E测试
```

### 6.2 关键工具实现

#### 数据库隔离

```typescript
// tests/helpers/test-db.ts
import { PrismaClient } from '@prisma/client'
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
})

export function setupTestDatabase() {
  beforeAll(async () => await prisma.$connect())
  beforeEach(async () => await prisma.$executeRaw`BEGIN`)
  afterEach(async () => await prisma.$executeRaw`ROLLBACK`)
  afterAll(async () => await prisma.$disconnect())
  return prisma
}
```

#### 测试数据工厂

```typescript
// tests/helpers/test-data-factory.ts
import { faker } from '@faker-js/faker'
import { testPrisma } from './test-db'

export async function createTestUser(overrides = {}) {
  return testPrisma.user.create({
    data: {
      email: faker.internet.email(),
      passwordHash: faker.string.alphanumeric(60),
      name: faker.person.fullName(),
      status: 'ACTIVE',
      role: 'EMPLOYEE',
      ...overrides,
    },
  })
}

export async function createTestProject(ownerId: string, overrides = {}) {
  return testPrisma.project.create({
    data: {
      name: faker.company.name(),
      status: 'PLANNING',
      ownerId,
      ...overrides,
    },
  })
}
```

### 6.3 Vitest 配置

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/lib/**/*.ts', 'src/app/api/**/*.ts'],
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
  },
})
```

---

## 七、验收标准

### 7.1 覆盖率标准

| 指标       | 目标  |
| ---------- | ----- |
| 语句覆盖率 | ≥ 90% |
| 分支覆盖率 | ≥ 85% |
| 函数覆盖率 | ≥ 90% |
| 行覆盖率   | ≥ 90% |

### 7.2 质量标准

- [ ] 所有测试可独立运行
- [ ] 测试间数据隔离
- [ ] 无跳过的测试（describe.skip/it.skip）
- [ ] CI/CD 自动化测试
- [ ] 覆盖率报告自动生成

### 7.3 里程碑

| 里程碑 | 完成标准        | 时间   |
| ------ | --------------- | ------ |
| M1     | 基础设施就绪    | Week 1 |
| M2     | P0 模块测试完成 | Week 3 |
| M3     | P1 模块测试完成 | Week 4 |
| M4     | P2 模块测试完成 | Week 5 |
| M5     | 覆盖率达标      | Week 6 |

---

## 八、风险管理

### 8.1 技术风险

| 风险           | 影响              | 缓解措施              |
| -------------- | ----------------- | --------------------- |
| 数据库连接问题 | 集成测试无法运行  | Docker 容器化测试环境 |
| 外部服务依赖   | AI/邮件测试不稳定 | Mock 外部服务         |
| 测试数据污染   | 测试结果不可靠    | 事务回滚机制          |

### 8.2 进度风险

| 风险         | 影响     | 缓解措施          |
| ------------ | -------- | ----------------- |
| 工时估算不足 | 延期     | 预留 20% 缓冲时间 |
| 功能变更     | 测试重写 | 优先测试稳定功能  |

---

## 九、附录

### A. 测试命令

```bash
# 单元测试
npm run test:unit

# 集成测试
npm run test:integration

# E2E测试
npm run test:e2e

# 覆盖率报告
npm run test:coverage

# 全量测试
npm run test:all
```

### B. 参考文档

- Vitest 官方文档: https://vitest.dev
- Playwright 官方文档: https://playwright.dev
- Prisma 测试指南: https://www.prisma.io/docs/guides/testing

---

**文档版本**: v2.0  
**最后更新**: 2026-03-03  
**负责人**: AI Assistant
