# 项目管理系统 - 最终版技术实现方案

## 文档信息

| 项目名称 | 企业级项目管理系统 |
|---------|-------------------|
| 版本 | Final V2.0 |
| 目标用户 | 内部员工（约200人） |
| 编写日期 | 2024年 |

---

## 目录

1. [系统概述](#一系统概述)
2. [功能模块设计](#二功能模块设计)
3. [系统架构设计](#三系统架构设计)
4. [数据库设计](#四数据库设计)
5. [API接口设计](#五api接口设计)
6. [安全与权限设计](#六安全与权限设计)
7. [部署方案](#七部署方案)
8. [实施计划](#八实施计划)

---

## 一、系统概述

### 1.1 项目背景

本项目旨在为企业内部员工提供一个完整的项目管理解决方案，支持多角色权限控制、项目生命周期管理、任务跟踪、需求管理、评审流程等核心功能。

### 1.2 目标用户

| 角色 | 人数 | 权限范围 |
|------|------|---------|
| 系统管理员 | 2-3人 | 可访问所有数据，管理所有项目 |
| 项目管理员 | 5-10人 | 管理分配的项目 |
| 项目所有者(Owner) | 10-20人 | 拥有项目的完整权限，审核需求 |
| 项目成员 | 100+人 | 参与项目任务 |
| 普通员工 | 50+人 | 可提出需求，查看参与的项目 |

### 1.3 技术栈

| 层级 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| 前端框架 | Next.js | 16.x | App Router, SSR/SSG |
| UI框架 | React | 19.x | 服务端组件 |
| 开发语言 | TypeScript | 5.x | 类型安全 |
| 样式方案 | Tailwind CSS | 4.x | 原子化CSS |
| 组件库 | shadcn/ui | Latest | 高质量组件 |
| 状态管理 | Zustand | 5.x | 轻量级状态管理 |
| 表单处理 | React Hook Form | 7.x | 表单验证 |
| 数据验证 | Zod | 4.x | Schema验证 |
| ORM | Prisma | 6.x | 类型安全查询 |
| 数据库 | SQLite/PostgreSQL | - | 开发/生产环境 |
| 认证 | JWT (jose) | 6.x | Token认证 |
| 图表 | Recharts | 2.x | 数据可视化 |
| AI服务 | z-ai-web-dev-sdk | Latest | 大模型调用 |

---

## 二、功能模块设计

### 2.1 功能模块总览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           功能模块全景图                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          核心业务模块                               │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │   │
│  │  │ 任务管理 │ │ 需求管理 │ │ ISSUE管理 │ │ 风险管理 │ │ 评审管理 │ │   │
│  │  │          │ │          │ │          │ │          │ │          │ │   │
│  │  │ • 模板   │ │ • 提出   │ │ • 创建   │ │ • 关联   │ │ • 类型   │ │   │
│  │  │ • 时间   │ │ • 审核   │ │ • 关联   │ │ • 进展   │ │ • 模板   │ │   │
│  │  │ • 进度   │ │ • 评估   │ │ • 翻转   │ │ • AI判断 │ │ • AI审核 │ │   │
│  │  │ • 子任务 │ │ • 验收   │ │          │ │          │ │ • 预览   │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          支撑功能模块                               │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │   │
│  │  │ 文件预览 │ │  Dashboard│ │  邮件服务 │ │  AI服务  │ │ 通知提醒 │ │   │
│  │  │          │ │          │ │          │ │          │ │          │ │   │
│  │  │ • 上传   │ │ • 进度   │ │ • 公司   │ │ • 风险   │ │ • 站内   │ │   │
│  │  │ • 预览   │ │ • 风险   │ │ • SMTP   │ │ • 审核   │ │ • 邮件   │ │   │
│  │  │ • 编辑   │ │ • 跳转   │ │ • 日志   │ │ • 日志   │ │ • 预警   │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.2 用户管理模块（增强）

#### 功能需求

| 功能 | 描述 | 优先级 |
|------|------|:------:|
| 用户注册 | 邮箱注册，需管理员审批 | P0 |
| 用户登录 | JWT Token认证 | P0 |
| 密码找回 | 邮箱验证重置密码 | P0 |
| 个人信息 | 姓名、部门、职位、头像 | P0 |
| 角色管理 | 系统角色分配 | P0 |

#### 密码找回流程

```
┌─────────────────────────────────────────────────────────────────┐
│                     密码找回流程                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │ 用户请求    │ ─→ │ 生成重置令牌 │ ─→ │ 发送邮件    │        │
│  │ 重置密码    │    │ (有效期1小时)│    │ 含重置链接  │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│                                              │                 │
│                                              ↓                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │ 密码重置    │ ←─ │ 验证令牌    │ ←─ │ 用户点击    │        │
│  │ 完成        │    │ 有效性      │    │ 邮件链接    │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 数据模型

```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
  
  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

### 2.3 任务管理模块（增强）

#### 功能需求

| 功能 | 描述 | 优先级 |
|------|------|:------:|
| 任务模板导入 | 支持外部模板导入，任务可绑定里程碑 | P0 |
| 时间设置 | 设置开始/结束时间 | P0 |
| 验收人设置 | 指定任务验收负责人 | P0 |
| 进度更新 | 更新完成百分比(0-100) | P0 |
| 子任务管理 | 创建和管理子任务清单 | P0 |
| 任务标签 | 任务分类和筛选 | P0 |
| 任务关注者 | 关注任务动态通知 | P1 |

#### 任务模板导入流程

```
┌─────────────────────────────────────────────────────────────────┐
│                     任务模板导入流程                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │ 上传模板文件 │ ─→ │ 解析模板内容 │ ─→ │ 验证模板格式 │        │
│  │ (JSON/Excel)│    │             │    │             │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│                                              │                 │
│                                              ↓                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │ 导入完成    │ ←─ │ 创建任务/里程碑│ ←─ │ 关联里程碑  │        │
│  │             │    │             │    │             │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 任务状态流转

```
未开始(TODO) → 进行中(IN_PROGRESS) → 待评审(REVIEW) → 测试中(TESTING) → 已完成(DONE)
      ↓              ↓                    ↓              ↓
   已取消       延期(DELAYED)        阻塞(BLOCKED)    已取消(CANCELLED)
```

#### 数据模型

```prisma
model TaskTemplate {
  id              String        @id @default(cuid())
  projectId       String?
  name            String
  description     String?
  category        String?
  isPublic        Boolean       @default(false)
  templateData    String        // JSON格式存储任务结构
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  createdById     String
}

model SubTask {
  id          String    @id @default(cuid())
  taskId      String
  title       String
  isCompleted Boolean   @default(false)
  order       Int       @default(0)
  
  task        Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
}

// 任务标签系统 (P0)
model Tag {
  id          String    @id @default(cuid())
  name        String
  color       String    @default("#6B7280")
  projectId   String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  tasks       TaskTag[]
}

model TaskTag {
  taskId      String
  tagId       String
  createdAt   DateTime  @default(now())
  
  task        Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  tag         Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@primaryKey([taskId, tagId])
}

// 任务关注者 (P1)
model TaskWatcher {
  taskId      String
  userId      String
  createdAt   DateTime  @default(now())
  
  task        Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user        User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@primaryKey([taskId, userId])
}
```

---

### 2.4 需求管理模块（增强）

#### 功能需求

| 功能 | 描述 | 优先级 |
|------|------|:------:|
| 需求提出 | 提交需求内容、时间要求 | P0 |
| 接受/拒绝 | Project Owner审核判断 | P0 |
| 方案评估 | 指派成员评估实现方案、资源、计划 | P0 |
| 波及影响分析 | 设置波及相关方 | P0 |
| 方案讨论 | 可关联到项目任务 | P1 |
| 验收流程 | 设置验收人，记录验收结果 | P0 |
| 变更历史 | 需求变更记录和追溯 | P1 |

#### 需求管理流程

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           需求管理完整流程                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────┐     ┌─────────────┐     ┌─────────────┐                          │
│  │需求提出  │ ──→│ 项目Owner    │ ──→│   接受需求   │ ──────────────────────┐  │
│  │         │     │ 审核        │     │             │                        │  │
│  └─────────┘     └─────────────┘     └─────────────┘                        │  │
│       │                 │                   │                                │  │
│       │                 │ 拒绝              │                                │  │
│       │                 ↓                   │                                │  │
│       │           ┌───────────┐             │                                │  │
│       │           │  需求拒绝  │             │                                │  │
│       │           │ (结束)    │             │                                │  │
│       │           └───────────┘             │                                │  │
│       │                                     ↓                                │  │
│       │                              ┌─────────────┐                         │  │
│       │                              │ 指派成员    │                         │  │
│       │                              │ 评估方案    │                         │  │
│       │                              └─────────────┘                         │  │
│       │                                     │                                │  │
│       │                                     ↓                                │  │
│       │                              ┌─────────────┐     ┌─────────────┐    │  │
│       │                              │ 实现方案    │ ──→│ 波及影响    │    │  │
│       │                              │ 评估       │     │ 分析        │    │  │
│       │                              └─────────────┘     └─────────────┘    │  │
│       │                                     │                   │          │  │
│       │                                     └─────────┬─────────┘          │  │
│       │                                               ↓                    │  │
│       │                                        ┌─────────────┐             │  │
│       │                                        │ 方案讨论    │             │  │
│       │                                        │ (关联任务)  │             │  │
│       │                                        └─────────────┘             │  │
│       │                                               │                    │  │
│       │                                               ↓                    │  │
│       │                                        ┌─────────────┐             │  │
│       │                                        │   验收      │             │  │
│       │                                        │ (设置验收人) │             │  │
│       │                                        └─────────────┘             │  │
│       │                                               │                    │  │
│       │                          ┌───────────────────┴────────────────┐    │  │
│       │                          ↓                                    ↓    │  │
│       │                    ┌───────────┐                       ┌───────────┐│  │
│       │                    │ 验收通过  │                       │ 验收不通过 ││  │
│       │                    │ (完成)    │                       │ (返工)    ││  │
│       │                    └───────────┘                       └───────────┘│  │
│       │                                                                     │  │
│       └─────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 需求状态流转

```
SUBMITTED → PENDING_REVIEW → ACCEPTED → EVALUATING → PLANNING → IMPLEMENTING → COMPLETED
    ↓              ↓
 CLOSED        REJECTED
```

#### 数据模型

```prisma
model Requirement {
  id              String            @id @default(cuid())
  projectId       String
  title           String
  description     String
  priority        Priority          @default(MEDIUM)
  category        String?
  expectedDate    DateTime?
  deadline        DateTime?
  status          RequirementStatus @default(SUBMITTED)
  proposerId      String
  proposerDept    String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  proposals       RequirementProposal[]
  impacts         RequirementImpact[]
  discussions     RequirementDiscussion[]
  acceptances     RequirementAcceptance[]
  tasks           Task[]
}

model RequirementProposal {
  id              String    @id @default(cuid())
  requirementId   String
  evaluatorId     String
  solution        String
  estimatedHours  Float?
  estimatedCost   Float?
  resources       String?   // JSON格式存储所需资源列表
  plannedStart    DateTime?
  plannedEnd      DateTime?
  risks           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model RequirementImpact {
  id              String    @id @default(cuid())
  requirementId   String
  impactArea      String
  impactType      String
  impactLevel     String
  impactDesc      String
  affectedParty   String?
  affectedDept    String?
  contactPerson   String?
  notifyStatus    String?
  createdAt       DateTime  @default(now())
}

model RequirementDiscussion {
  id              String    @id @default(cuid())
  requirementId   String
  content         String
  userId          String
  relatedTaskId   String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model RequirementAcceptance {
  id              String    @id @default(cuid())
  requirementId   String
  acceptorId      String
  result          AcceptanceResult
  comments        String?
  acceptedAt      DateTime  @default(now())
}

enum RequirementStatus {
  SUBMITTED        // 已提交
  PENDING_REVIEW   // 待审核
  ACCEPTED         // 已接受
  REJECTED         // 已拒绝
  EVALUATING       // 评估中
  PLANNING         // 规划中
  IMPLEMENTING     // 实现中
  COMPLETED        // 已完成
  CLOSED           // 已关闭
}

enum AcceptanceResult {
  PASSED       // 通过
  FAILED       // 不通过
  CONDITIONAL  // 有条件通过
}

// 需求变更历史 (P1)
model RequirementHistory {
  id              String    @id @default(cuid())
  requirementId   String
  changeType      String    // STATUS_CHANGE, CONTENT_UPDATE, PRIORITY_CHANGE
  oldValue        String?
  newValue        String?
  changedBy       String
  changeReason    String?
  createdAt       DateTime  @default(now())
  
  requirement     Requirement @relation(fields: [requirementId], references: [id], onDelete: Cascade)
}
```

---

### 2.5 ISSUE管理模块

#### 功能需求

| 功能 | 描述 | 优先级 |
|------|------|:------:|
| 创建ISSUE | 支持创建问题 | P0 |
| 关联任务 | ISSUE可关联多个任务 | P0 |
| 状态翻转 | 任务完成后可自动或手动翻转ISSUE状态 | P0 |

#### ISSUE与任务关联

```
┌─────────────────────────────────────────────────────────────────┐
│                    ISSUE与任务关联关系                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ISSUE                                                          │
│    │                                                            │
│    │ 1:N 关联                                                   │
│    │                                                            │
│    ├──→ Task 1                                                  │
│    │     └── 完成后检查是否全部完成                              │
│    │                                                            │
│    ├──→ Task 2                                                  │
│    │     └── 完成后检查是否全部完成                              │
│    │                                                            │
│    └──→ Task N                                                  │
│          └── 完成后检查是否全部完成                              │
│                                                                 │
│  自动翻转规则：                                                  │
│  • autoClose = true: 所有关联任务完成 → ISSUE状态变为RESOLVED    │
│  • autoClose = false: 需手动更新ISSUE状态                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 数据模型

```prisma
model Issue {
  id              String        @id @default(cuid())
  projectId       String
  title           String
  description     String?
  category        IssueCategory @default(OTHER)
  severity        IssueSeverity @default(MEDIUM)
  status          IssueStatus   @default(OPEN)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  resolvedAt      DateTime?
  reporterId      String
  assigneeId      String?
  autoClose       Boolean       @default(true)
  
  tasks           Task[]
}

enum IssueCategory {
  BUG           // 缺陷
  FEATURE       // 功能请求
  IMPROVEMENT   // 改进建议
  DOCUMENTATION // 文档问题
  OTHER         // 其他
}

enum IssueSeverity {
  CRITICAL    // 严重
  HIGH        // 高
  MEDIUM      // 中
  LOW         // 低
}

enum IssueStatus {
  OPEN          // 打开
  IN_PROGRESS   // 处理中
  RESOLVED      // 已解决
  CLOSED        // 已关闭
  REOPENED      // 重新打开
}
```

---

### 2.6 风险管理模块（增强）

#### 功能需求

| 功能 | 描述 | 优先级 |
|------|------|:------:|
| 关联任务 | 风险可关联项目内的任务 | P0 |
| 进展更新 | 手动更新风险进展和状态 | P0 |
| AI智能判断 | 根据里程碑任务完成情况智能判断风险 | P1 |

#### 风险-任务关联关系

```
┌─────────────────────────────────────────────────────────────────┐
│                     风险-任务关联关系                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  风险 (Risk) ─────────┬─────────────────────────────────────    │
│                       │                                        │
│       ┌───────────────┼───────────────┐                        │
│       ↓               ↓               ↓                        │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                    │
│  │ RELATED │    │ CAUSES  │    │MITIGATES│                    │
│  │ 相关联   │    │ 导致    │    │ 缓解    │                    │
│  └────┬────┘    └────┬────┘    └────┬────┘                    │
│       │               │               │                        │
│       └───────────────┴───────────────┘                        │
│                       │                                        │
│                       ↓                                        │
│                 任务 (Task)                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### AI风险评估服务架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI风险评估服务架构                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    触发入口                              │  │
│  │  • 里程碑任务变更                                        │  │
│  │  • 定时任务扫描                                          │  │
│  │  • 手动触发                                              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                             │                                  │
│                             ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    数据收集                              │  │
│  │  • 里程碑完成率                                          │  │
│  │  • 任务延期情况                                          │  │
│  │  • 资源使用情况                                          │  │
│  │  • 历史风险数据                                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                             │                                  │
│                             ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              AI Agent 分析 (z-ai-web-dev-sdk)            │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │  │
│  │  │ 风险识别    │ │ 影响分析    │ │ 建议生成    │        │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                             │                                  │
│                             ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    结果处理                              │  │
│  │  • 存储风险评估结果                                      │  │
│  │  • 创建风险预警                                          │  │
│  │  • 发送通知                                              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 数据模型

```prisma
model Risk {
  id              String      @id @default(cuid())
  projectId       String
  title           String
  description     String?
  category        RiskCategory
  probability     Int         @default(1) // 1-5
  impact          Int         @default(1) // 1-5
  riskLevel       RiskLevel   @default(LOW)
  status          RiskStatus  @default(IDENTIFIED)
  progress        Int         @default(0)
  mitigation      String?
  contingency     String?
  ownerId         String
  isAiIdentified  Boolean     @default(false)
  aiRiskScore     Float?
  aiSuggestion    String?
  identifiedDate  DateTime    @default(now())
  dueDate         DateTime?
  resolvedDate    DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  riskTasks       RiskTask[]
}

model RiskTask {
  id           String   @id @default(cuid())
  riskId       String
  taskId       String
  relationType String   @default("RELATED")
  createdAt    DateTime @default(now())
  
  risk        Risk      @relation(fields: [riskId], references: [id], onDelete: Cascade)
  task        Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
}

enum RiskCategory {
  TECHNICAL     // 技术风险
  SCHEDULE      // 进度风险
  RESOURCE      // 资源风险
  BUDGET        // 预算风险
  EXTERNAL      // 外部风险
  MANAGEMENT    // 管理风险
}

enum RiskLevel {
  LOW           // 低
  MEDIUM        // 中
  HIGH          // 高
  CRITICAL      // 关键
}

enum RiskStatus {
  IDENTIFIED    // 已识别
  ANALYZING     // 分析中
  MITIGATING    // 缓解中
  MONITORING    // 监控中
  RESOLVED      // 已解决
  CLOSED        // 已关闭
}
```

---

### 2.7 评审管理模块（增强）

#### 功能需求

| 功能 | 描述 | 优先级 |
|------|------|:------:|
| 多种评审类型 | 可行性评估、里程碑、测试方案、测试发布、测试报告等 | P0 |
| 自定义类型 | 支持后期自定义新的评审类型 | P1 |
| 材料模板 | 自定义材料模板或使用标准模板 | P0 |
| 在线预览 | 支持评审材料在线预览 | P0 |
| AI审核 | AI判断内容/逻辑/风险等 | P1 |

#### 评审类型体系

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          评审类型体系                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        系统预设评审类型                              │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │   │
│  │  │ 可行性评估评审    │  │ 里程碑相关评审    │  │ 测试方案/规程评审 │  │   │
│  │  │ FEASIBILITY      │  │ MILESTONE        │  │ TEST_PLAN        │  │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  │   │
│  │                                                                     │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │   │
│  │  │ 测试程序发布评审  │  │ 测试报告评审      │  │ 初审/终审        │  │   │
│  │  │ TEST_RELEASE     │  │ TEST_REPORT      │  │ INITIAL/FINAL    │  │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        自定义评审类型                                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  管理员可以创建新的评审类型，例如：                                  │   │
│  │  • 代码评审 (CODE_REVIEW)                                           │   │
│  │  • 设计评审 (DESIGN_REVIEW)                                         │   │
│  │  • 安全评审 (SECURITY_REVIEW)                                       │   │
│  │  • ...                                                              │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 系统预设评审类型

| 类型 | 编码 | 适用场景 | 标准材料 |
|------|------|---------|---------|
| 可行性评估评审 | FEASIBILITY | 项目启动前，评估项目可行性 | 可行性分析报告、技术方案、资源需求清单、风险评估 |
| 里程碑相关评审 | MILESTONE | 里程碑完成时进行评审 | 里程碑完成报告、任务完成清单、质量报告 |
| 测试方案/规程评审 | TEST_PLAN | 测试阶段开始前 | 测试方案、测试用例、测试数据、环境说明 |
| 测试程序发布评审 | TEST_RELEASE | 测试程序发布前 | 发布清单、变更说明、回退方案 |
| 测试报告评审 | TEST_REPORT | 测试完成后 | 测试报告、问题清单、质量评估 |
| 初审 | INITIAL | 阶段初评审 | 阶段计划、资源需求 |
| 终审 | FINAL | 最终评审 | 完成报告、验收材料 |

#### 数据模型

```prisma
model Review {
  id              String          @id @default(cuid())
  projectId       String
  milestoneId     String?
  title           String
  type            ReviewType
  typeConfigId    String?
  templateId      String?
  status          ReviewStatus    @default(DRAFT)
  scheduledDate   DateTime?
  completedDate   DateTime?
  totalItems      Int             @default(0)
  passedItems     Int             @default(0)
  failedItems     Int             @default(0)
  effectiveness   Float?
  aiReviewStatus  AiReviewStatus  @default(PENDING)
  aiReviewResult  String?
  aiContentScore  Float?
  aiLogicScore    Float?
  aiRiskScore     Float?
  aiSuggestions   String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  createdById     String
  
  participants    ReviewParticipant[]
  items           ReviewItem[]
  materials       ReviewMaterial[]
  criteria        ReviewCriterion[]
}

model ReviewTypeConfig {
  id              String    @id @default(cuid())
  name            String    @unique
  code            String    @unique
  description     String?
  isSystem        Boolean   @default(false)
  isActive        Boolean   @default(true)
  sortOrder       Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdBy       String
  
  templates       ReviewTemplate[]
}

model ReviewTemplate {
  id              String    @id @default(cuid())
  typeId          String
  name            String
  description     String?
  templateData    String    // JSON格式存储模板结构
  isStandard      Boolean   @default(false)
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdBy       String
  
  type            ReviewTypeConfig @relation(fields: [typeId], references: [id], onDelete: Cascade)
  items           ReviewTemplateItem[]
}

model ReviewTemplateItem {
  id              String    @id @default(cuid())
  templateId      String
  name            String
  description     String?
  isRequired      Boolean   @default(true)
  fileType        String?
  maxSize         Int?
  sortOrder       Int       @default(0)
  
  template        ReviewTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
}

model ReviewMaterial {
  id              String    @id @default(cuid())
  reviewId        String
  fileId          String?
  fileName        String
  filePath        String
  fileType        String
  fileSize        Int
  version         Int       @default(1)
  previewPath     String?
  previewStatus   PreviewStatus @default(PENDING)
  previewError    String?
  previewType     PreviewType @default(NATIVE)
  previewUrl      String?
  uploadedBy      String
  uploadedAt      DateTime  @default(now())
  
  review          Review    @relation(fields: [reviewId], references: [id], onDelete: Cascade)
}

enum ReviewType {
  FEASIBILITY       // 可行性评估评审
  MILESTONE         // 里程碑相关评审
  TEST_PLAN         // 测试方案/规程评审
  TEST_RELEASE      // 测试程序发布评审
  TEST_REPORT       // 测试报告评审
  INITIAL           // 初审
  FINAL             // 终审
  PHASE             // 阶段评审
  AD_HOC            // 临时评审
  CUSTOM            // 自定义类型
}

enum ReviewStatus {
  DRAFT        // 草稿
  SCHEDULED    // 已安排
  IN_PROGRESS  // 进行中
  COMPLETED    // 已完成
  CANCELLED    // 已取消
}

enum AiReviewStatus {
  PENDING     // 待审核
  PROCESSING  // 审核中
  COMPLETED   // 已完成
  FAILED      // 失败
}
```

---

### 2.8 文件预览服务模块

#### 功能需求

| 功能 | 描述 | 优先级 |
|------|------|:------:|
| 文件上传 | 统一文件上传服务 | P0 |
| 文件下载 | 带权限验证的下载 | P0 |
| OnlyOffice集成 | Office文档预览/编辑 | P0 |
| KKFileView集成 | 多格式文档预览 | P0 |
| 原生预览 | 图片/视频/音频/PDF | P0 |
| 服务路由 | 自动选择预览服务 | P0 |
| 降级策略 | 服务不可用时降级 | P1 |
| 水印支持 | 预览水印 | P2 |
| URL签名 | 安全访问控制 | P1 |

#### 技术选型对比

| 方案 | 类型 | 编辑支持 | 部署复杂度 | 资源占用 | 格式保真度 | 推荐场景 |
|------|------|---------|-----------|---------|-----------|---------|
| **纯前端方案** | 前端 | ❌ 仅预览 | ⭐ 最简单 | 低 | 中等 | 轻量级需求 |
| **OnlyOffice** | 独立服务 | ✅ 预览+编辑 | ⭐⭐⭐ 中等 | 高(~4GB) | ⭐⭐⭐⭐⭐ 最高 | 专业办公场景 |
| **KKFileView** | 独立服务 | ❌ 仅预览 | ⭐⭐ 简单 | 中(~1GB) | ⭐⭐⭐⭐ 较高 | 快速集成预览 |

#### 推荐方案：OnlyOffice + KKFileView 混合

```
┌─────────────────────────────────────────────────────────────┐
│                    文件预览服务架构                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐     ┌─────────────────────────────────┐  │
│   │ 文件上传    │────▶│ 文件类型判断 & 服务路由          │  │
│   └─────────────┘     └─────────────────────────────────┘  │
│                                    │                        │
│         ┌──────────────────────────┼──────────────────┐    │
│         ▼                          ▼                  ▼    │
│   ┌───────────┐            ┌─────────────┐      ┌────────┐ │
│   │ OnlyOffice│            │  KKFileView │      │ 原生   │ │
│   │  (编辑)   │            │  (预览)     │      │ 预览   │ │
│   └───────────┘            └─────────────┘      └────────┘ │
│         │                          │                  │    │
│   docx/xlsx/pptx          pdf/odt/zip/其他     图片/视频   │
│   (高保真预览/编辑)         (快速预览)        (本地渲染)   │
│                                                             │
│   ────────────────────── 降级策略 ────────────────────────  │
│   OnlyOffice不可用 → KKFileView → 原生预览 → 仅下载        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 文件类型分发策略

| 文件类型 | 首选服务 | 备选服务 | 原生支持 | 编辑支持 |
|---------|---------|---------|---------|---------|
| Word(docx,doc) | OnlyOffice | KKFileView | ❌ | ✅ |
| Excel(xlsx,xls) | OnlyOffice | KKFileView | ❌ | ✅ |
| PPT(pptx,ppt) | OnlyOffice | KKFileView | ❌ | ✅ |
| PDF | KKFileView | - | ✅ react-pdf | ❌ |
| 图片(jpg,png,gif,webp,svg) | - | - | ✅ img标签 | ❌ |
| 视频(mp4,webm,mov) | - | - | ✅ video标签 | ❌ |
| 音频(mp3,wav,ogg) | - | - | ✅ audio标签 | ❌ |
| 代码(js,ts,py,java,go) | - | - | ✅ Monaco Editor | ❌ |
| 压缩包(zip,rar,7z) | KKFileView | - | ❌ | ❌ |

#### 数据模型

```prisma
model FileStorage {
  id              String        @id @default(cuid())
  projectId       String?
  fileName        String
  storedName      String
  filePath        String
  fileSize        Int
  mimeType        String
  fileExtension   String
  category        FileCategory  @default(GENERAL)
  previewType     PreviewType   @default(NATIVE)
  previewStatus   PreviewStatus @default(PENDING)
  previewPath     String?
  previewUrl      String?
  documentKey     String?       @unique
  version         Int           @default(1)
  parentId        String?
  isPublic        Boolean       @default(false)
  accessLevel     AccessLevel   @default(PROJECT)
  uploadedBy      String
  uploadedAt      DateTime      @default(now())
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

model PreviewServiceConfig {
  id              String          @id @default(cuid())
  name            String          @unique
  serviceType     PreviewServiceType
  baseUrl         String
  apiKey          String?
  config          String?
  supportedTypes  String
  isActive        Boolean         @default(true)
  isDefault       Boolean         @default(false)
  priority        Int             @default(0)
  healthStatus    HealthStatus    @default(UNKNOWN)
  lastCheckAt     DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

enum PreviewServiceType {
  ONLYOFFICE
  KKFILEVIEW
  NATIVE
  EXTERNAL
}

enum FileCategory {
  GENERAL
  DOCUMENT
  SPREADSHEET
  PRESENTATION
  IMAGE
  VIDEO
  AUDIO
  ARCHIVE
  CODE
  DESIGN
  OTHER
}

enum PreviewType {
  NATIVE
  ONLYOFFICE
  KKFILEVIEW
  UNSUPPORTED
}

enum PreviewStatus {
  PENDING
  PROCESSING
  READY
  FAILED
}

enum HealthStatus {
  HEALTHY
  DEGRADED
  UNHEALTHY
  UNKNOWN
}

enum AccessLevel {
  PUBLIC
  PROJECT
  TEAM
  PRIVATE
}
```

---

### 2.9 邮件服务模块（增强）

#### 功能需求

| 功能 | 描述 | 优先级 |
|------|------|:------:|
| 邮件配置 | 配置邮件服务提供商 | P1 |
| 邮件发送 | 发送通知邮件 | P1 |
| 模板管理 | 邮件模板管理 | P1 |
| 发送日志 | 邮件发送记录 | P1 |

#### 邮件类型

- 任务分配通知
- 任务到期提醒
- 里程碑到期提醒
- 评审邀请通知
- 评审结果通知
- 风险预警通知

#### 数据模型

```prisma
model EmailConfig {
  id              String    @id @default(cuid())
  name            String    @unique
  provider        String    // COMPANY, SMTP, SENDGRID
  apiKey          String?
  smtpHost        String?
  smtpPort        Int?
  smtpUser        String?
  smtpPassword    String?
  fromAddress     String
  fromName        String?
  isActive        Boolean   @default(true)
  isDefault       Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model EmailLog {
  id              String      @id @default(cuid())
  userId          String?
  projectId       String?
  to              String
  subject         String
  content         String
  templateType    String?
  status          EmailStatus @default(PENDING)
  errorMessage    String?
  externalId      String?
  sentAt          DateTime?
  createdAt       DateTime    @default(now())
}

enum EmailStatus {
  PENDING     // 待发送
  SENT        // 已发送
  DELIVERED   // 已送达
  FAILED      // 发送失败
  BOUNCED     // 退信
}

// 邮件模板 (P1)
model EmailTemplate {
  id          String    @id @default(cuid())
  name        String    @unique
  type        String    // TASK_ASSIGNED, TASK_DUE, REVIEW_INVITE, RISK_ALERT
  subject     String
  body        String    // HTML模板，支持变量替换
  variables   String?   // JSON格式变量定义
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

---

### 2.10 AI服务模块（增强）

#### 功能需求

| 功能 | 描述 | 优先级 |
|------|------|:------:|
| AI配置 | AI服务配置 | P1 |
| 风险评估 | AI风险分析 | P1 |
| 评审审核 | AI评审内容审核 | P1 |
| 调用日志 | AI调用记录 | P1 |
| 响应缓存 | AI响应结果缓存，降低调用成本 | P1 |

#### AI服务类型

| 服务类型 | 说明 | 调用场景 |
|---------|------|---------|
| RISK_ANALYSIS | 风险分析 | 里程碑任务变更时 |
| REVIEW_AUDIT | 评审审核 | 提交评审材料时 |
| DOC_PARSE | 文档解析 | 上传评审材料时 |

#### 数据模型

```prisma
model AiServiceConfig {
  id              String    @id @default(cuid())
  name            String    @unique
  provider        String    // OPENAI, ZHIPU, BAIDU
  apiKey          String?
  baseUrl         String?
  model           String
  isActive        Boolean   @default(true)
  isDefault       Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model AiServiceLog {
  id              String    @id @default(cuid())
  serviceType     String    // RISK_ANALYSIS, REVIEW_AUDIT
  projectId       String?
  resourceId      String?
  requestData     String?
  responseData    String?
  tokensUsed      Int?
  responseTime    Int?
  status          String
  errorMessage    String?
  createdAt       DateTime  @default(now())
}

// AI响应缓存 (P1)
model AiResponseCache {
  id              String    @id @default(cuid())
  cacheKey        String    @unique  // 基于输入内容的哈希
  serviceType     String    // RISK_ANALYSIS, REVIEW_AUDIT
  requestHash     String    // 请求内容的SHA256哈希
  response        String    // AI响应结果
  hitCount        Int       @default(0)
  expiresAt       DateTime
  createdAt       DateTime  @default(now())
  
  @@index([serviceType, requestHash])
  @@index([expiresAt])
}
```

---

### 2.11 通知系统模块（增强）

#### 功能需求

| 功能 | 描述 | 优先级 |
|------|------|:------:|
| 站内通知 | 系统通知消息 | P0 |
| 任务提醒 | 任务到期提醒 | P0 |
| 评审邀请 | 评审邀请通知 | P0 |
| 风险预警 | 风险状态变化预警 | P0 |
| 通知订阅 | 用户通知偏好设置 | P1 |

#### 数据模型

```prisma
// 通知偏好设置 (P1)
model NotificationPreference {
  id              String    @id @default(cuid())
  userId          String    @unique
  emailEnabled    Boolean   @default(true)
  inAppEnabled    Boolean   @default(true)
  taskDue         Boolean   @default(true)
  taskAssigned    Boolean   @default(true)
  reviewInvite    Boolean   @default(true)
  riskAlert       Boolean   @default(true)
  weeklyDigest    Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  user            User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

### 2.12 Dashboard工作台模块

#### 功能需求

| 功能 | 描述 | 优先级 |
|------|------|:------:|
| 项目概览 | 项目统计卡片 | P0 |
| 进度追踪 | 项目进度图表 | P0 |
| 风险看板 | 风险状态可视化 | P0 |
| 任务看板 | 我的任务列表 | P0 |
| 快捷入口 | 常用功能入口 | P1 |

#### 统计维度

- 各项目任务完成率
- 各项目延期任务数
- 各项目资源利用率
- 各项目预算执行率
- 风险分布统计

---

## 三、系统架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              客户端层                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    浏览器 / 移动端浏览器                                │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓ HTTPS
┌─────────────────────────────────────────────────────────────────────────────┐
│                            前端应用层                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                 Next.js 16 App Router (React 19)                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │  Dashboard │ 项目 │ 任务 │ 需求 │ ISSUE │ 风险 │ 评审 │ 设置   │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │              Zustand State Management                            │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓ REST API
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API网关层                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    Next.js API Routes                                  │  │
│  │  /api/auth  /api/projects  /api/tasks  /api/requirements  /api/issues │  │
│  │  /api/risks  /api/reviews  /api/templates  /api/dashboard  /api/ai    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                             业务逻辑层                                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ 认证服务   │ │ 项目服务   │ │ 任务服务   │ │ 需求服务   │              │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ 风险服务   │ │ 评审服务   │ │ 模板服务   │ │ 统计服务   │              │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AI服务层                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    AI Agent 服务 (z-ai-web-dev-sdk)                    │  │
│  │  • 风险智能评估    • 评审材料审核    • 文档解析    • 内容分析          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                          外部集成层                                          │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │
│  │ 邮件服务适配器   │ │ 文档预览服务     │ │ 文件存储服务     │              │
│  │ • 公司邮箱系统  │ │ • OnlyOffice    │ │ • 本地存储      │              │
│  │ • SMTP         │ │ • KKFileView    │ │ • 云存储        │              │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                            数据访问层                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                       Prisma ORM                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                             数据存储层                                       │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐                  │
│  │ 主数据库       │ │ 文件存储       │ │ 缓存(可选)     │                  │
│  │ SQLite/PostgreSQL│ 本地/云存储    │ Redis          │                  │
│  └────────────────┘ └────────────────┘ └────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 模块依赖关系

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           模块依赖关系图                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                        ┌─────────────┐                                      │
│                        │   Dashboard │                                      │
│                        └──────┬──────┘                                      │
│                               │                                              │
│              ┌────────────────┼────────────────┐                            │
│              ↓                ↓                ↓                            │
│      ┌───────────┐    ┌───────────┐    ┌───────────┐                       │
│      │ 项目管理  │    │ 风险统计  │    │ 进度统计  │                       │
│      └─────┬─────┘    └───────────┘    └───────────┘                       │
│            │                                                                  │
│            ↓                                                                  │
│  ┌─────────────────────────────────────────────────────────┐                │
│  │                      项目 (Project)                      │                │
│  │              所有数据的核心容器和关联中心                 │                │
│  └─────────────────────────────────────────────────────────┘                │
│            │                                                                  │
│      ┌─────┴─────┬───────────┬───────────┬───────────┬───────────┐          │
│      ↓           ↓           ↓           ↓           ↓           ↓          │
│  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐         │
│  │ 任务  │  │ ISSUE │  │ 需求  │  │ 里程碑 │  │ 风险  │  │ 评审  │         │
│  └───────┘  └───────┘  └───────┘  └───────┘  └───────┘  └───────┘         │
│       │          │          │          │          │          │               │
│       │←─────────┤          │          │          │          │               │
│       │          │          │          │←─────────┤          │               │
│       │←─────────────────────┤          │          │          │               │
│       │                               │          │                         │
│       └───────────────────────────────┴──────────┘                         │
│                     ↑                       ↑                               │
│                     │ 关联                  │ AI审核                        │
│              ┌──────┴──────┐         ┌──────┴──────┐                       │
│              │   风险任务   │         │  AI服务     │                       │
│              └─────────────┘         └─────────────┘                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 四、数据库设计

### 4.1 数据表清单

| 模块 | 表名 | 说明 |
|------|------|------|
| **用户权限** | User | 用户表 |
| | PasswordResetToken | 密码重置令牌表 (P0) |
| | ProjectMember | 项目成员关联表 |
| **项目管理** | Project | 项目表 |
| | Milestone | 里程碑表 |
| **任务管理** | Task | 任务表 |
| | SubTask | 子任务表 |
| | TaskAssignment | 任务分配表 |
| | TaskDependency | 任务依赖表 |
| | TaskTemplate | 任务模板表 |
| | Tag | 标签表 (P0) |
| | TaskTag | 任务标签关联表 (P0) |
| | TaskWatcher | 任务关注者表 (P1) |
| | Comment | 评论表 |
| | Attachment | 附件表 |
| **需求管理** | Requirement | 需求表 |
| | RequirementProposal | 方案评估表 |
| | RequirementImpact | 波及影响表 |
| | RequirementDiscussion | 方案讨论表 |
| | RequirementAcceptance | 验收记录表 |
| | RequirementHistory | 变更历史表 (P1) |
| **ISSUE管理** | Issue | ISSUE表 |
| **风险管理** | Risk | 风险表 |
| | RiskTask | 风险任务关联表 |
| **评审管理** | Review | 评审表 |
| | ReviewTypeConfig | 评审类型配置表 |
| | ReviewTemplate | 评审模板表 |
| | ReviewTemplateItem | 模板项表 |
| | ReviewParticipant | 参与者表 |
| | ReviewItem | 评审项表 |
| | ReviewMaterial | 评审材料表 |
| | ReviewCriterion | 评审标准表 |
| **文件预览** | FileStorage | 文件存储表 |
| | PreviewServiceConfig | 预览服务配置表 |
| **资源调度** | ResourceAllocation | 资源分配表 |
| | MachineTimeAllocation | 机时分配表 |
| **文档管理** | Document | 文档表 |
| | DocumentVersion | 文档版本表 |
| **邮件服务** | EmailConfig | 邮件配置表 |
| | EmailTemplate | 邮件模板表 (P1) |
| | EmailLog | 邮件日志表 |
| **AI服务** | AiServiceConfig | AI配置表 |
| | AiServiceLog | AI调用日志表 |
| | AiResponseCache | AI响应缓存表 (P1) |
| **通知系统** | Notification | 通知表 |
| | NotificationPreference | 通知偏好设置表 (P1) |
| | AuditLog | 操作日志表 |

### 4.2 ER图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │   Project   │       │  Requirement│
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │───┐   │ id          │───┐   │ id          │
│ email       │   │   │ name        │   │   │ title       │
│ name        │   │   │ code        │   │   │ description │
│ role        │   │   │ status      │   │   │ status      │
│ department  │   │   │ budget      │   │   │ proposerId  │
└─────────────┘   │   └─────────────┘   │   └─────────────┘
      │           │         │           │         │
      │           │         │           │         │
      │     ┌─────┴─────┐   │     ┌─────┴─────┐   │
      │     │ProjectMember│  │     │ Proposal  │   │
      │     ├─────────────┤   │     ├───────────┤   │
      └────→│ projectId   │   │     │ evaluator │   │
            │ userId      │   │     │ solution  │   │
            │ role        │   │     └───────────┘   │
            └─────────────┘   │                     │
                              │     ┌───────────┐   │
                              │     │  Impact   │   │
                              │     ├───────────┤   │
                              │     │ affected  │   │
                              │     └───────────┘   │
                              │                     │
┌─────────────┐               │     ┌─────────────┐
│    Task     │───────────────┘     │    Review   │
├─────────────┤                     ├─────────────┤
│ id          │                     │ id          │
│ title       │                     │ title       │
│ status      │                     │ type        │
│ progress    │                     │ templateId  │
│ startDate   │                     └─────────────┘
│ dueDate     │                           │
│ ownerId     │                           │
│ acceptorId  │                     ┌─────────────┐
│ requirementId│                    │ReviewTemplate│
└─────────────┘                     ├─────────────┤
      │                             │ id          │
      │                             │ name        │
      │                             │ templateData│
      │                             └─────────────┘
┌─────────────┐                           │
│    Risk     │                     ┌─────────────┐
├─────────────┤                     │ReviewType   │
│ id          │                     ├─────────────┤
│ title       │                     │ id          │
│ status      │                     │ name        │
│ progress    │                     │ code        │
│ aiRiskScore │                     │ isSystem    │
└─────────────┘                     └─────────────┘
      │
      │
┌─────────────┐
│  RiskTask   │
├─────────────┤
│ riskId      │
│ taskId      │
│ relationType│
└─────────────┘
```

---

## 五、API接口设计

### 5.1 接口规范

```
命名规范：
- 使用RESTful风格
- URL使用小写+连字符
- 版本控制：/api/v1/...

响应格式：
{
  "success": true/false,
  "data": { ... },
  "error": { "code": "...", "message": "..." }
}

分页格式：
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 5.2 核心API列表

| 模块 | 接口 | 方法 | 说明 |
|------|------|------|------|
| **用户管理** | /api/auth/forgot-password | POST | 请求密码重置 (P0) |
| | /api/auth/reset-password | POST | 重置密码 (P0) |
| **任务标签** | /api/tags/list | GET | 标签列表 (P0) |
| | /api/tags/create | POST | 创建标签 (P0) |
| | /api/tags/[id] | PUT | 更新标签 (P0) |
| | /api/tags/[id] | DELETE | 删除标签 (P0) |
| | /api/tasks/[id]/tags | POST | 关联任务标签 (P0) |
| | /api/tasks/[id]/watch | POST | 关注任务 (P1) |
| | /api/tasks/[id]/unwatch | DELETE | 取消关注 (P1) |
| **任务模板** | /api/templates/list | GET | 模板列表 |
| | /api/templates/create | POST | 创建模板 |
| | /api/templates/import | POST | 导入模板 |
| **需求管理** | /api/requirements/create | POST | 创建需求 |
| | /api/requirements/review | PUT | 审核（接受/拒绝） |
| | /api/requirements/proposals | POST | 提交评估方案 |
| | /api/requirements/impacts | POST | 波及影响分析 |
| | /api/requirements/discussions | POST | 方案讨论 |
| | /api/requirements/accept | POST | 验收 |
| | /api/requirements/[id]/history | GET | 变更历史 (P1) |
| **ISSUE管理** | /api/issues/create | POST | 创建ISSUE |
| | /api/issues/update | PUT | 更新ISSUE |
| | /api/issues/update-status | PUT | 更新状态 |
| **风险管理** | /api/risks/create | POST | 创建风险 |
| | /api/risks/update | PUT | 更新风险 |
| | /api/risks/link-task | POST | 关联任务 |
| | /api/risks/ai-assess | POST | AI风险评估 |
| **评审管理** | /api/review-types/list | GET | 评审类型列表 |
| | /api/review-types/create | POST | 创建评审类型 |
| | /api/review-templates/list | GET | 评审模板列表 |
| | /api/review-templates/create | POST | 创建评审模板 |
| | /api/reviews/create | POST | 创建评审 |
| | /api/reviews/ai-audit | POST | AI审核 |
| **文件预览** | /api/files/upload | POST | 文件上传 |
| | /api/files/[id] | GET | 文件下载 |
| | /api/files/[id]/preview | GET | 获取预览信息 |
| | /api/preview/health | GET | 服务健康检查 |
| **邮件服务** | /api/email/templates | GET | 邮件模板列表 (P1) |
| | /api/email/templates | POST | 创建邮件模板 (P1) |
| | /api/email/send | POST | 发送邮件 |
| **AI服务** | /api/ai/analyze | POST | AI分析 |
| | /api/ai/cache/clear | DELETE | 清除AI缓存 (P1) |
| **通知设置** | /api/notifications/preferences | GET | 获取通知偏好 (P1) |
| | /api/notifications/preferences | PUT | 更新通知偏好 (P1) |
| **Dashboard** | /api/dashboard/stats | GET | 统计数据 |
| | /api/dashboard/risks | GET | 风险汇总 |

---

## 六、安全与权限设计

### 6.1 权限模型

采用RBAC（基于角色的访问控制）模型：

```
┌────────────────────────────────────────────────────────────┐
│                     权限层级                                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  系统管理员 (ADMIN) ──────────────────────────────────┐    │
│      │                                                │    │
│      │ 完全控制所有数据                                │    │
│      ↓                                                │    │
│  项目管理员 (PROJECT_ADMIN) ───────────────────────┐  │    │
│      │                                              │  │    │
│      │ 管理分配的项目                                │  │    │
│      ↓                                              │  │    │
│  项目所有者 (PROJECT_OWNER) ────────────────────┐  │  │    │
│      │                                            │  │  │    │
│      │ 拥有项目的完整权限                          │  │  │    │
│      ↓                                            │  │  │    │
│  项目成员 (PROJECT_MEMBER) ─────────────────┐  │  │  │    │
│      │                                        │  │  │  │    │
│      │ 拥有当前项目数据访问权限                │  │  │  │    │
│      ↓                                        │  │  │  │    │
│  普通员工 (EMPLOYEE) ───────────────────┐  │  │  │  │    │
│                                          │  │  │  │  │    │
│      基础权限，需加入项目才能访问数据     │  │  │  │  │    │
└──────────────────────────────────────────┴──┴──┴──┴──┴────┘
```

### 6.2 权限矩阵

| 功能 | 系统管理员 | 项目管理员 | 项目所有者 | 项目成员 | 普通员工 |
|------|:--------:|:--------:|:--------:|:--------:|:--------:|
| 查看所有项目 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 创建项目 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 编辑项目 | ✅ | ✅* | ✅* | ❌ | ❌ |
| 删除项目 | ✅ | ❌ | ✅* | ❌ | ❌ |
| 提出需求 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 审核需求 | ✅ | ❌ | ✅* | ❌ | ❌ |
| 创建任务 | ✅ | ✅* | ✅* | ✅* | ❌ |
| 创建ISSUE | ✅ | ✅* | ✅* | ✅* | ❌ |
| 管理风险 | ✅ | ✅* | ✅* | ✅* | ❌ |
| 创建评审 | ✅ | ✅* | ✅* | ✅* | ❌ |
| 参与评审 | ✅ | ✅* | ✅* | ✅* | ❌ |

*注：带星号表示仅限于参与的项目

### 6.3 安全措施

| 类别 | 措施 |
|------|------|
| 认证安全 | JWT Token机制、HTTP-only Cookie、Token过期策略 |
| 权限控制 | RBAC角色权限、项目级数据隔离、操作审计日志 |
| 数据安全 | 密码加密存储、SQL注入防护、XSS防护 |
| 文件安全 | URL签名验证、访问权限控制、水印支持 |

---

## 七、部署方案

### 7.1 Docker部署

#### docker-compose.yml

```yaml
version: '3.8'

services:
  # 主应用
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/project_management
      - JWT_SECRET=your-jwt-secret-key
      - ONLYOFFICE_URL=http://onlyoffice:80
      - KKFILEVIEW_URL=http://kkfileview:8012
    depends_on:
      - db
      - onlyoffice
      - kkfileview
    restart: unless-stopped

  # 数据库
  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=project_management
    restart: unless-stopped

  # OnlyOffice
  onlyoffice:
    image: onlyoffice/documentserver:8.2
    ports:
      - "8080:80"
    environment:
      - JWT_ENABLED=true
      - JWT_SECRET=your-jwt-secret
    volumes:
      - onlyoffice_data:/var/www/onlyoffice/Data
    restart: unless-stopped

  # KKFileView
  kkfileview:
    image: keking/kkfileview:4.4.0
    ports:
      - "8012:8012"
    environment:
      - KK_OFFICE_PREVIEW_TYPE=image
    restart: unless-stopped

volumes:
  postgres_data:
  onlyoffice_data:
```

### 7.2 环境变量配置

```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/project_management"

# JWT
JWT_SECRET="your-secure-jwt-secret-key-at-least-32-characters"

# OnlyOffice
ONLYOFFICE_URL="http://localhost:8080"
ONLYOFFICE_JWT_SECRET="your-onlyoffice-jwt-secret"
ONLYOFFICE_ENABLED=true

# KKFileView
KKFILEVIEW_URL="http://localhost:8012"
KKFILEVIEW_ENABLED=true

# 文件存储
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=104857600

# AI服务
AI_API_KEY="your-ai-api-key"
AI_MODEL="gpt-4"

# 邮件
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="noreply@example.com"
SMTP_PASS="password"

# 应用
NEXT_PUBLIC_APP_URL="https://pm.example.com"
```

---

## 八、实施计划

### 8.1 阶段划分

| 阶段 | 模块 | 内容 | 工期 |
|:---:|------|------|:---:|
| **Phase 1** | 用户管理增强 | 密码找回、令牌验证、邮件发送 | 2天 |
| **Phase 2** | 任务管理增强 | 任务模板导入、时间设置、验收人、进度更新、子任务、**标签系统(P0)**、**关注者(P1)** | 6天 |
| **Phase 3** | 需求管理 | 需求提出、审核、评估、影响分析、讨论、验收、**变更历史(P1)** | 9天 |
| **Phase 4** | ISSUE管理 | ISSUE创建、关联任务、状态翻转 | 3天 |
| **Phase 5** | 风险管理增强 | 关联任务、进展更新、AI风险评估 | 5天 |
| **Phase 6** | 评审管理增强 | 评审类型、模板、材料预览、AI审核 | 8天 |
| **Phase 7** | 文件预览服务 | 文件上传、OnlyOffice/KKFileView集成、预览组件 | 6天 |
| **Phase 8** | 邮件服务增强 | 邮件配置、**模板管理(P1)**、发送、日志 | 4天 |
| **Phase 9** | AI服务增强 | AI配置、风险评估、评审审核、**响应缓存(P1)** | 5天 |
| **Phase 10** | 通知系统增强 | 站内通知、任务提醒、**订阅管理(P1)** | 3天 |
| **Phase 11** | Dashboard | 项目概览、进度图表、风险看板 | 4天 |
| **Phase 12** | 测试优化 | 集成测试、性能优化、文档完善 | 4天 |

**总工期：约59天**

### 8.2 里程碑

| 里程碑 | 目标 | 预计完成 |
|--------|------|---------|
| M1 | 用户管理+任务管理完成 | 第8天 |
| M2 | 核心业务模块完成 | 第20天 |
| M3 | 管理功能增强完成 | 第33天 |
| M4 | 集成服务完成 | 第48天 |
| M5 | 全部功能完成 | 第55天 |
| M6 | 系统上线 | 第59天 |

### 8.3 P0/P1功能补充说明

本版本(V2.0)在V1.0基础上补充了以下功能：

**P0 必须实现功能：**
| 功能 | 模块 | 数据模型 | API接口 |
|------|------|---------|---------|
| 密码找回 | 用户管理 | PasswordResetToken | /api/auth/forgot-password, /api/auth/reset-password |
| 任务标签系统 | 任务管理 | Tag, TaskTag | /api/tags/*, /api/tasks/[id]/tags |

**P1 建议实现功能：**
| 功能 | 模块 | 数据模型 | API接口 |
|------|------|---------|---------|
| 任务关注者 | 任务管理 | TaskWatcher | /api/tasks/[id]/watch |
| 需求变更历史 | 需求管理 | RequirementHistory | /api/requirements/[id]/history |
| 邮件模板管理 | 邮件服务 | EmailTemplate | /api/email/templates |
| AI响应缓存 | AI服务 | AiResponseCache | /api/ai/cache/clear |
| 通知订阅管理 | 通知系统 | NotificationPreference | /api/notifications/preferences |

---

## 九、附录

### 9.1 状态码定义

| 状态码 | 说明 |
|-------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未登录 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

### 9.2 枚举值汇总

| 枚举名 | 值 |
|--------|-----|
| UserRole | ADMIN, PROJECT_ADMIN, PROJECT_OWNER, PROJECT_MEMBER, EMPLOYEE |
| ProjectStatus | PLANNING, PENDING, ACTIVE, ON_HOLD, COMPLETED, CANCELLED |
| TaskStatus | TODO, IN_PROGRESS, REVIEW, TESTING, DONE, CANCELLED, DELAYED, BLOCKED |
| Priority | CRITICAL, HIGH, MEDIUM, LOW |
| RequirementStatus | SUBMITTED, PENDING_REVIEW, ACCEPTED, REJECTED, EVALUATING, PLANNING, IMPLEMENTING, COMPLETED, CLOSED |
| IssueStatus | OPEN, IN_PROGRESS, RESOLVED, CLOSED, REOPENED |
| RiskStatus | IDENTIFIED, ANALYZING, MITIGATING, MONITORING, RESOLVED, CLOSED |
| ReviewType | FEASIBILITY, MILESTONE, TEST_PLAN, TEST_RELEASE, TEST_REPORT, INITIAL, FINAL, PHASE, AD_HOC, CUSTOM |
| PreviewType | NATIVE, ONLYOFFICE, KKFILEVIEW, UNSUPPORTED |

---

*文档最后更新：2024年*
