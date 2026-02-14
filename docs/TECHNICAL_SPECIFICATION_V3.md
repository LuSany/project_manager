# 项目管理系统 - 技术实现规范 V3.0

## 文档信息

| 项目名称 | 企业级项目管理系统 |
|---------|-------------------|
| 版本 | V3.0 (综合版) |
| 目标用户 | 内部员工（约200人） |
| 编写日期 | 2024年 |
| 说明 | 合并FINAL_TECHNICAL_SPECIFICATION.md和OPTIMIZED_FINAL_SPECIFICATION.md |

---

## 目录

1. [系统概述](#一系统概述)
2. [技术方案优化亮点](#二技术方案优化亮点)
3. [功能模块设计](#三功能模块设计)
4. [系统架构设计](#四系统架构设计)
5. [数据库设计](#五数据库设计)
6. [API接口设计](#六api接口设计)
7. [安全与权限设计](#七安全与权限设计)
8. [性能优化策略](#八性能优化策略)
9. [运维保障](#九运维保障)
10. [部署方案](#十部署方案)
11. [实施计划](#十一实施计划)

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
| 服务端状态 | TanStack Query | 5.x | 数据缓存与同步 |
| 表单处理 | React Hook Form | 7.x | 表单验证 |
| 数据验证 | Zod | 4.x | Schema验证 |
| ORM | Prisma | 6.x | 类型安全查询 |
| 数据库 | SQLite/PostgreSQL | - | 开发/生产环境 |
| 认证 | JWT (jose) | 6.x | Token认证 |
| 图表 | Recharts | 2.x | 数据可视化 |
| 日期处理 | date-fns | 4.x | 日期工具 |
| AI服务 | z-ai-web-dev-sdk | Latest | 大模型调用 |

---

## 二、技术方案优化亮点

### 2.1 相比原方案的优化点

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          技术方案优化总览                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  【架构优化】                                                                │
│  ├── 新增：事件驱动架构，解耦模块间通信                                      │
│  ├── 新增：统一缓存策略，提升查询性能                                        │
│  ├── 新增：API版本控制，保证向后兼容                                         │
│  └── 优化：服务层抽象，统一错误处理和响应格式                                 │
│                                                                             │
│  【安全增强】                                                                │
│  ├── 新增：API请求速率限制                                                   │
│  ├── 新增：敏感操作审计日志                                                  │
│  ├── 新增：会话并发控制                                                      │
│  └── 优化：URL签名机制增强                                                   │
│                                                                             │
│  【性能优化】                                                                │
│  ├── 新增：数据库索引策略                                                    │
│  ├── 新增：分页查询标准化                                                    │
│  ├── 新增：AI响应缓存机制                                                    │
│  └── 优化：大文件处理策略                                                    │
│                                                                             │
│  【可扩展性】                                                                │
│  ├── 新增：Webhook支持外部系统集成                                           │
│  ├── 新增：插件化架构预留                                                    │
│  ├── 新增：多租户数据隔离方案                                                │
│  └── 优化：配置中心化设计                                                    │
│                                                                             │
│  【运维保障】                                                                │
│  ├── 新增：健康检查端点标准化                                                │
│  ├── 新增：数据备份与恢复策略                                                │
│  ├── 新增：监控指标采集                                                      │
│  └── 优化：日志结构化输出                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 需求覆盖度统计

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          需求覆盖度统计                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  核心需求覆盖率                                                             │
│  ████████████████████████████████████████████████████████████████████ 100%  │
│  (10/10 项核心需求全部覆盖)                                                 │
│                                                                             │
│  功能点覆盖率                                                               │
│  ████████████████████████████████████████████████████████████████████ 100%  │
│  (88/88 个功能点已覆盖)                                                     │
│                                                                             │
│  数据模型覆盖率                                                             │
│  ████████████████████████████████████████████████████████████████████ 100%  │
│  (所有模型完整，含P0/P1新增模型)                                            │
│                                                                             │
│  API接口覆盖率                                                              │
│  ████████████████████████████████████████████████████████████████████ 100%  │
│  (所有API已设计，含新增15个接口)                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 三、功能模块设计

### 3.1 功能模块总览

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
│  │  │ 文件预览 │ │ Dashboard│ │  邮件服务 │ │  AI服务  │ │ 通知提醒 │ │   │
│  │  │          │ │          │ │          │ │          │ │          │ │   │
│  │  │ • 上传   │ │ • 进度   │ │ • 公司   │ │ • 风险   │ │ • 站内   │ │   │
│  │  │ • 预览   │ │ • 风险   │ │ • SMTP   │ │ • 审核   │ │ • 邮件   │ │   │
│  │  │ • 编辑   │ │ • 跳转   │ │ • 日志   │ │ • 日志   │ │ • 预警   │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          基础服务模块                               │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │   │
│  │  │ 用户管理 │ │ 项目管理 │ │ 里程碑   │ │ 资源调度 │ │ 文档管理 │ │   │
│  │  │          │ │          │ │          │ │          │ │          │ │   │
│  │  │ • 认证   │ │ • CRUD   │ │ • 创建   │ │ • 人力   │ │ • 版本   │ │   │
│  │  │ • 权限   │ │ • 成员   │ │ • 关联   │ │ • 成本   │ │ • 分类   │ │   │
│  │  │ • 角色   │ │ • 预算   │ │ • 进度   │ │ • 机时   │ │ • 权限   │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 用户管理模块

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
model User {
  id            String      @id @default(cuid())
  email         String      @unique
  password      String
  name          String
  role          UserRole    @default(EMPLOYEE)
  department    String?
  position      String?
  avatar        String?
  status        UserStatus  @default(PENDING)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  passwordResetTokens  PasswordResetToken[]
  projectMembers       ProjectMember[]
  tasks               Task[]
  notifications       Notification[]
  notificationPreference NotificationPreference?
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
  
  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum UserRole {
  ADMIN           // 系统管理员
  PROJECT_ADMIN   // 项目管理员
  PROJECT_OWNER   // 项目所有者
  PROJECT_MEMBER  // 项目成员
  EMPLOYEE        // 普通员工
}

enum UserStatus {
  PENDING   // 待审批
  ACTIVE    // 激活
  DISABLED  // 禁用
}
```

---

### 3.3 任务管理模块

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
model Task {
  id              String        @id @default(cuid())
  projectId       String
  milestoneId     String?
  issueId         String?
  requirementId   String?
  parentId        String?
  title           String
  description     String?
  status          TaskStatus    @default(TODO)
  priority        Priority      @default(MEDIUM)
  progress        Int           @default(0)
  startDate       DateTime?
  dueDate         DateTime?
  completedAt     DateTime?
  estimatedHours  Float?
  actualHours     Float?
  ownerId         String
  acceptorId      String?
  isOverdue       Boolean       @default(false)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  project         Project       @relation(fields: [projectId], references: [id])
  milestone       Milestone?    @relation(fields: [milestoneId], references: [id])
  issue           Issue?        @relation(fields: [issueId], references: [id])
  owner           User          @relation(fields: [ownerId], references: [id])
  subTasks        SubTask[]
  assignments     TaskAssignment[]
  dependencies    TaskDependency[]
  tags            TaskTag[]
  watchers        TaskWatcher[]
  comments        Comment[]
  attachments     Attachment[]
}

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

model TaskAssignment {
  id          String    @id @default(cuid())
  taskId      String
  userId      String
  role        String    @default("ASSIGNEE")
  createdAt   DateTime  @default(now())
  
  task        Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
}

model TaskDependency {
  id              String    @id @default(cuid())
  taskId          String
  dependsOnId     String
  dependencyType  String    @default("FINISH_TO_START")
  createdAt       DateTime  @default(now())
  
  task            Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
}

enum TaskStatus {
  TODO          // 未开始
  IN_PROGRESS   // 进行中
  REVIEW        // 待评审
  TESTING       // 测试中
  DONE          // 已完成
  CANCELLED     // 已取消
  DELAYED       // 延期
  BLOCKED       // 阻塞
}

enum Priority {
  CRITICAL    // 紧急
  HIGH        // 高
  MEDIUM      // 中
  LOW         // 低
}
```

---

### 3.4 需求管理模块

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
  history         RequirementHistory[]
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
```

---

### 3.5 ISSUE管理模块

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
  
  project         Project       @relation(fields: [projectId], references: [id])
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

### 3.6 风险管理模块

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
  
  project         Project     @relation(fields: [projectId], references: [id])
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

### 3.7 评审管理模块

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
  
  project         Project         @relation(fields: [projectId], references: [id])
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

enum PreviewStatus {
  PENDING
  PROCESSING
  READY
  FAILED
}

enum PreviewType {
  NATIVE
  ONLYOFFICE
  KKFILEVIEW
  UNSUPPORTED
}
```

---

### 3.8 文件预览服务模块

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

### 3.9 邮件服务模块

#### 功能需求

| 功能 | 描述 | 优先级 |
|------|------|:------:|
| 邮件配置 | 配置邮件服务提供商 | P1 |
| 邮件发送 | 发送通知邮件 | P1 |
| 模板管理 | 邮件模板管理 | P1 |
| 发送日志 | 邮件发送记录 | P1 |

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

enum EmailStatus {
  PENDING     // 待发送
  SENT        // 已发送
  DELIVERED   // 已送达
  FAILED      // 发送失败
  BOUNCED     // 退信
}
```

---

### 3.10 AI服务模块

#### 功能需求

| 功能 | 描述 | 优先级 |
|------|------|:------:|
| AI配置 | AI服务配置 | P1 |
| 风险评估 | AI风险分析 | P1 |
| 评审审核 | AI评审内容审核 | P1 |
| 调用日志 | AI调用记录 | P1 |
| 响应缓存 | AI响应结果缓存，降低调用成本 | P1 |

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

### 3.11 通知系统模块

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
model Notification {
  id              String            @id @default(cuid())
  userId          String
  type            NotificationType
  title           String
  content         String
  link            String?
  isRead          Boolean           @default(false)
  readAt          DateTime?
  createdAt       DateTime          @default(now())
  
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
}

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

enum NotificationType {
  TASK_ASSIGNED      // 任务分配
  TASK_DUE           // 任务到期
  TASK_COMPLETED     // 任务完成
  REVIEW_INVITE      // 评审邀请
  REVIEW_RESULT      // 评审结果
  RISK_ALERT         // 风险预警
  REQUIREMENT_UPDATE // 需求更新
  MENTION            // @提及
  SYSTEM             // 系统通知
}
```

---

### 3.12 Dashboard工作台模块

#### 功能需求

| 功能 | 描述 | 优先级 |
|------|------|:------:|
| 项目概览 | 项目统计卡片 | P0 |
| 进度追踪 | 项目进度图表 | P0 |
| 风险看板 | 风险状态可视化 | P0 |
| 任务看板 | 我的任务列表 | P0 |
| 快捷入口 | 常用功能入口 | P1 |

---

## 四、系统架构设计

### 4.1 整体架构图

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
│  │  │  Dashboard │ 项目详情 │ 任务管理 │ ISSUE │ 风险 │ 评审 │ 设置   │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │         Zustand (客户端状态) + TanStack Query (服务端状态)        │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓ REST API
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API网关层                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    Next.js API Routes (/api/v1/*)                     │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │  • 请求验证 (Zod Schema)    • 速率限制 (Rate Limiter)           │  │  │
│  │  │  • 认证中间件 (JWT)         • 响应格式化 (统一封装)              │  │  │
│  │  │  • 权限检查 (RBAC)          • 错误处理 (统一异常)                │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                             业务逻辑层                                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ 认证服务   │ │ 项目服务   │ │ 任务服务   │ │ 风险服务   │              │
│  │AuthService │ │ProjectSvc  │ │ TaskSvc    │ │ RiskSvc    │              │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ ISSUE服务  │ │ 评审服务   │ │ 模板服务   │ │ 统计服务   │              │
│  │ IssueSvc   │ │ReviewSvc   │ │TemplateSvc │ │ StatsSvc   │              │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      事件总线 (EventBus)                              │   │
│  │  任务完成 → ISSUE状态更新 → 通知发送 → 风险评估 → Dashboard刷新      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AI服务层                                          │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    AI Agent 服务 (z-ai-web-dev-sdk)                    │  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐        │  │
│  │  │ 风险智能评估     │ │ 评审材料审核     │ │ 内容分析服务     │        │  │
│  │  │ • 里程碑风险    │ │ • 内容审核      │ │ • 文档解析      │          │  │
│  │  │ • 任务风险      │ │ • 逻辑检查      │ │ • 关键词提取    │          │  │
│  │  │ • 风险预警      │ │ • 风险识别      │ │ • 摘要生成      │          │  │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐    │  │
│  │  │                    AI响应缓存 (LRU Cache)                    │    │  │
│  │  └─────────────────────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                          外部集成层                                          │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐        │  │
│  │  │ 邮件服务适配器   │ │ 文档预览服务     │ │ 文件存储服务     │        │  │
│  │  │ • 公司邮箱系统  │ │ • OnlyOffice    │ │ • 本地存储      │          │  │
│  │  │ • SMTP         │ │ • KKFileView    │ │ • 云存储        │          │  │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐    │  │
│  │  │                    Webhook 发送器                            │    │  │
│  │  │    事件触发 → 外部系统通知 (企业微信/钉钉/自定义)            │    │  │
│  │  └─────────────────────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                            数据访问层                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                       Prisma ORM                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────┐     │  │
│  │  │  • 查询缓存 (Query Cache)    • 批量操作优化                  │     │  │
│  │  │  • 事务管理                  • 连接池管理                    │     │  │
│  │  └─────────────────────────────────────────────────────────────┘     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                             数据存储层                                       │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐                  │
│  │ 主数据库       │ │ 文件存储       │ │ 缓存(可选)     │                  │
│  │ SQLite/PostgreSQL│ 本地/云存储    │ 内存缓存       │                  │
│  └────────────────┘ └────────────────┘ └────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 事件驱动架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          事件驱动架构设计                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       事件类型定义                                    │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  任务事件:                                                          │   │
│  │  ├── TASK_CREATED      - 任务创建                                  │   │
│  │  ├── TASK_UPDATED      - 任务更新                                  │   │
│  │  ├── TASK_COMPLETED    - 任务完成                                  │   │
│  │  ├── TASK_OVERDUE      - 任务超期                                  │   │
│  │  └── TASK_ASSIGNED     - 任务分配                                  │   │
│  │                                                                     │   │
│  │  里程碑事件:                                                        │   │
│  │  ├── MILESTONE_CREATED - 里程碑创建                                │   │
│  │  ├── MILESTONE_COMPLETED - 里程碑完成                              │   │
│  │  └── MILESTONE_AT_RISK - 里程碑风险预警                            │   │
│  │                                                                     │   │
│  │  ISSUE事件:                                                         │   │
│  │  ├── ISSUE_CREATED    - ISSUE创建                                  │   │
│  │  ├── ISSUE_RESOLVED   - ISSUE解决                                  │   │
│  │  └── ISSUE_REOPENED   - ISSUE重开                                  │   │
│  │                                                                     │   │
│  │  风险事件:                                                          │   │
│  │  ├── RISK_IDENTIFIED  - 风险识别                                   │   │
│  │  ├── RISK_UPDATED     - 风险更新                                   │   │
│  │  ├── RISK_RESOLVED    - 风险解决                                   │   │
│  │  └── AI_RISK_ALERT    - AI风险预警                                 │   │
│  │                                                                     │   │
│  │  评审事件:                                                          │   │
│  │  ├── REVIEW_CREATED   - 评审创建                                   │   │
│  │  ├── REVIEW_STARTED   - 评审开始                                   │   │
│  │  ├── REVIEW_COMPLETED - 评审完成                                   │   │
│  │  └── AI_REVIEW_DONE   - AI审核完成                                 │   │
│  │                                                                     │   │
│  │  需求事件:                                                          │   │
│  │  ├── REQUIREMENT_SUBMITTED - 需求提交                              │   │
│  │  ├── REQUIREMENT_ACCEPTED  - 需求接受                              │   │
│  │  ├── REQUIREMENT_REJECTED  - 需求拒绝                              │   │
│  │  └── REQUIREMENT_COMPLETED  - 需求完成                             │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      事件处理流程示例                                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  TASK_COMPLETED 事件触发:                                           │   │
│  │  │                                                                  │   │
│  │  ├──→ [ISSUE服务] 检查关联ISSUE是否可关闭                          │   │
│  │  │    └── 触发 ISSUE_RESOLVED                                      │   │
│  │  │                                                                  │   │
│  │  ├──→ [里程碑服务] 更新里程碑进度                                   │   │
│  │  │    └── 如果进度异常 → 触发 MILESTONE_AT_RISK                    │   │
│  │  │                                                                  │   │
│  │  ├──→ [通知服务] 发送通知给相关用户                                 │   │
│  │  │    └── 站内通知 + 邮件                                          │   │
│  │  │                                                                  │   │
│  │  ├──→ [AI服务] 触发风险评估                                        │   │
│  │  │    └── 如有风险 → 触发 AI_RISK_ALERT                            │   │
│  │  │                                                                  │   │
│  │  └──→ [统计服务] 更新项目统计                                      │   │
│  │       └── Dashboard数据刷新                                         │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 五、数据库设计

### 5.1 数据表清单

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
| **系统** | AuditLog | 操作日志表 |
| | WebhookConfig | Webhook配置表 |
| | SystemConfig | 系统配置表 |

### 5.2 索引策略

```sql
-- 用户表索引
CREATE UNIQUE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_department ON "User"(department);
CREATE INDEX idx_user_role ON "User"(role);

-- 项目表索引
CREATE UNIQUE INDEX idx_project_code ON "Project"(code);
CREATE INDEX idx_project_status ON "Project"(status);
CREATE INDEX idx_project_dates ON "Project"(startDate, endDate);
CREATE INDEX idx_project_created ON "Project"("createdBy");

-- 任务表索引
CREATE INDEX idx_task_project ON "Task"("projectId");
CREATE INDEX idx_task_milestone ON "Task"("milestoneId");
CREATE INDEX idx_task_status ON "Task"(status);
CREATE INDEX idx_task_priority ON "Task"(priority);
CREATE INDEX idx_task_owner ON "Task"("ownerId");
CREATE INDEX idx_task_due_date ON "Task"("dueDate");
CREATE INDEX idx_task_issue ON "Task"("issueId");
CREATE INDEX idx_task_overdue ON "Task"("isOverdue") WHERE "isOverdue" = true;
-- 复合索引：项目+状态查询优化
CREATE INDEX idx_task_project_status ON "Task"("projectId", status);
-- 复合索引：项目+里程碑查询优化
CREATE INDEX idx_task_project_milestone ON "Task"("projectId", "milestoneId");

-- 里程碑表索引
CREATE INDEX idx_milestone_project ON "Milestone"("projectId");
CREATE INDEX idx_milestone_status ON "Milestone"(status);
CREATE INDEX idx_milestone_date ON "Milestone"("plannedDate");

-- 风险表索引
CREATE INDEX idx_risk_project ON "Risk"("projectId");
CREATE INDEX idx_risk_status ON "Risk"(status);
CREATE INDEX idx_risk_level ON "Risk"("riskLevel");
CREATE INDEX idx_risk_ai ON "Risk"("isAiIdentified") WHERE "isAiIdentified" = true;

-- ISSUE表索引
CREATE INDEX idx_issue_project ON "Issue"("projectId");
CREATE INDEX idx_issue_status ON "Issue"(status);
CREATE INDEX idx_issue_reporter ON "Issue"("reporterId");

-- 评审表索引
CREATE INDEX idx_review_project ON "Review"("projectId");
CREATE INDEX idx_review_status ON "Review"(status);
CREATE INDEX idx_review_type ON "Review"(type);
CREATE INDEX idx_review_milestone ON "Review"("milestoneId");

-- 需求表索引
CREATE INDEX idx_requirement_project ON "Requirement"("projectId");
CREATE INDEX idx_requirement_status ON "Requirement"(status);
CREATE INDEX idx_requirement_proposer ON "Requirement"("proposerId");

-- 通知表索引
CREATE INDEX idx_notification_user ON "Notification"("userId");
CREATE INDEX idx_notification_unread ON "Notification"("userId", "isRead") WHERE "isRead" = false;
CREATE INDEX idx_notification_created ON "Notification"("createdAt" DESC);

-- 文件存储表索引
CREATE INDEX idx_file_project ON "FileStorage"("projectId");
CREATE INDEX idx_file_category ON "FileStorage"(category);
CREATE INDEX idx_file_uploaded ON "FileStorage"("uploadedBy");
CREATE INDEX idx_file_document_key ON "FileStorage"("documentKey");

-- AI服务日志表索引
CREATE INDEX idx_ai_log_type ON "AiServiceLog"("serviceType");
CREATE INDEX idx_ai_log_project ON "AiServiceLog"("projectId");
CREATE INDEX idx_ai_log_created ON "AiServiceLog"("createdAt" DESC);

-- 审计日志表索引
CREATE INDEX idx_audit_user ON "AuditLog"("userId");
CREATE INDEX idx_audit_action ON "AuditLog"(action);
CREATE INDEX idx_audit_resource ON "AuditLog"("resourceType", "resourceId");
CREATE INDEX idx_audit_created ON "AuditLog"("createdAt" DESC);
```

### 5.3 新增系统表

```prisma
model AuditLog {
  id           String   @id @default(cuid())
  userId       String
  action       String   // CREATE, UPDATE, DELETE, VIEW, EXPORT, etc.
  resourceType String   // PROJECT, TASK, REVIEW, etc.
  resourceId   String?
  details      String?  // JSON格式存储操作详情
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime @default(now())
  
  user         User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([action])
  @@index([resourceType, resourceId])
  @@index([createdAt(sort: Desc)])
}

model WebhookConfig {
  id          String   @id @default(cuid())
  name        String
  url         String
  secret      String?
  events      String   // JSON数组: ["TASK_COMPLETED", "REVIEW_CREATED"]
  isActive    Boolean  @default(true)
  lastTriggeredAt DateTime?
  failureCount Int     @default(0)
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([isActive])
}

model SystemConfig {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   // JSON格式存储
  category  String   // AI, EMAIL, STORAGE, SECURITY
  description String?
  updatedAt DateTime @updatedAt
  updatedBy String
  
  @@index([category])
}
```

---

## 六、API接口设计

### 6.1 统一响应格式

```typescript
// 成功响应
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

// 错误响应
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;       // 错误代码，如 "VALIDATION_ERROR"
    message: string;    // 用户友好的错误信息
    details?: any;      // 详细错误信息（仅开发环境）
  };
}

// 分页请求参数
interface PaginationParams {
  page?: number;        // 页码，默认1
  pageSize?: number;    // 每页数量，默认20，最大100
  sortBy?: string;      // 排序字段
  sortOrder?: 'asc' | 'desc';  // 排序方向
}
```

### 6.2 错误码标准化定义

#### 6.2.1 错误码命名规范

```
错误码格式：{模块}_{类型}_{序号}

模块前缀：
├── AUTH      - 认证授权相关
├── USER      - 用户管理相关
├── PROJ      - 项目管理相关
├── TASK      - 任务管理相关
├── ISSUE     - ISSUE管理相关
├── RISK      - 风险管理相关
├── REVIEW    - 评审管理相关
├── REQ       - 需求管理相关
├── FILE      - 文件管理相关
├── AI        - AI服务相关
├── EMAIL     - 邮件服务相关
├── NOTIFY    - 通知服务相关
├── SYS       - 系统级错误
├── VALID     - 参数验证错误
└── RATE      - 速率限制错误

类型后缀：
├── _001 ~ _099  - 客户端错误 (4xx)
├── _100 ~ _199  - 服务端错误 (5xx)
└── _200 ~ _299  - 业务逻辑错误 (4xx/5xx)
```

#### 6.2.2 完整错误码表

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          错误码标准化定义表                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  【认证授权模块 AUTH】                                                        │
│  ┌─────────────┬──────┬──────────────────────────────────────────────────┐  │
│  │ 错误码       │ HTTP │ 说明                                              │  │
│  ├─────────────┼──────┼──────────────────────────────────────────────────┤  │
│  │ AUTH_001    │ 401  │ 未授权访问，需要登录                               │  │
│  │ AUTH_002    │ 401  │ Token无效或已过期                                  │  │
│  │ AUTH_003    │ 401  │ Token刷新失败                                      │  │
│  │ AUTH_004    │ 403  │ 权限不足，拒绝访问                                 │  │
│  │ AUTH_005    │ 403  │ 账号已被禁用                                       │  │
│  │ AUTH_006    │ 403  │ 账号待审批中                                       │  │
│  │ AUTH_007    │ 401  │ 登录凭证错误                                       │  │
│  │ AUTH_008    │ 423  │ 账号已锁定，请稍后重试                             │  │
│  │ AUTH_009    │ 410  │ 密码重置链接已过期                                 │  │
│  │ AUTH_010    │ 400  │ 密码重置Token无效                                  │  │
│  │ AUTH_011    │ 409  │ 该邮箱已注册                                       │  │
│  │ AUTH_100    │ 500  │ 认证服务内部错误                                   │  │
│  └─────────────┴──────┴──────────────────────────────────────────────────┘  │
│                                                                             │
│  【用户管理模块 USER】                                                        │
│  ┌─────────────┬──────┬──────────────────────────────────────────────────┐  │
│  │ 错误码       │ HTTP │ 说明                                              │  │
│  ├─────────────┼──────┼──────────────────────────────────────────────────┤  │
│  │ USER_001    │ 404  │ 用户不存在                                         │  │
│  │ USER_002    │ 409  │ 邮箱已被使用                                       │  │
│  │ USER_003    │ 400  │ 用户名格式无效                                     │  │
│  │ USER_004    │ 400  │ 密码强度不足                                       │  │
│  │ USER_005    │ 400  │ 原密码错误                                         │  │
│  │ USER_006    │ 403  │ 无法修改其他用户信息                               │  │
│  │ USER_007    │ 403  │ 无法删除超级管理员                                 │  │
│  │ USER_008    │ 400  │ 头像文件格式不支持                                 │  │
│  │ USER_100    │ 500  │ 用户服务内部错误                                   │  │
│  └─────────────┴──────┴──────────────────────────────────────────────────┘  │
│                                                                             │
│  【项目管理模块 PROJ】                                                        │
│  ┌─────────────┬──────┬──────────────────────────────────────────────────┐  │
│  │ 错误码       │ HTTP │ 说明                                              │  │
│  ├─────────────┼──────┼──────────────────────────────────────────────────┤  │
│  │ PROJ_001    │ 404  │ 项目不存在                                         │  │
│  │ PROJ_002    │ 409  │ 项目编码已存在                                     │  │
│  │ PROJ_003    │ 403  │ 无该项目访问权限                                   │  │
│  │ PROJ_004    │ 400  │ 项目状态不允许此操作                               │  │
│  │ PROJ_005    │ 400  │ 项目日期无效（结束日期早于开始日期）                │  │
│  │ PROJ_006    │ 400  │ 项目预算无效                                       │  │
│  │ PROJ_007    │ 409  │ 项目名称已存在                                     │  │
│  │ PROJ_008    │ 400  │ 项目成员数量超限                                   │  │
│  │ PROJ_009    │ 400  │ 无法删除有任务的项目                               │  │
│  │ PROJ_010    │ 404  │ 项目成员不存在                                     │  │
│  │ PROJ_011    │ 409  │ 用户已是项目成员                                   │  │
│  │ PROJ_100    │ 500  │ 项目服务内部错误                                   │  │
│  └─────────────┴──────┴──────────────────────────────────────────────────┘  │
│                                                                             │
│  【任务管理模块 TASK】                                                        │
│  ┌─────────────┬──────┬──────────────────────────────────────────────────┐  │
│  │ 错误码       │ HTTP │ 说明                                              │  │
│  ├─────────────┼──────┼──────────────────────────────────────────────────┤  │
│  │ TASK_001    │ 404  │ 任务不存在                                         │  │
│  │ TASK_002    │ 403  │ 无任务操作权限                                     │  │
│  │ TASK_003    │ 400  │ 任务状态不允许此操作                               │  │
│  │ TASK_004    │ 400  │ 任务日期无效                                       │  │
│  │ TASK_005    │ 404  │ 任务里程碑不存在                                   │  │
│  │ TASK_006    │ 404  │ 任务验收人不存在                                   │  │
│  │ TASK_007    │ 404  │ 子任务不存在                                       │  │
│  │ TASK_008    │ 400  │ 进度值无效（必须在0-100之间）                      │  │
│  │ TASK_009    │ 400  │ 任务依赖循环                                       │  │
│  │ TASK_010    │ 400  │ 无法删除有子任务的父任务                           │  │
│  │ TASK_011    │ 404  │ 任务模板不存在                                     │  │
│  │ TASK_012    │ 400  │ 模板格式无效                                       │  │
│  │ TASK_013    │ 404  │ 任务标签不存在                                     │  │
│  │ TASK_014    │ 409  │ 任务已绑定该标签                                   │  │
│  │ TASK_100    │ 500  │ 任务服务内部错误                                   │  │
│  └─────────────┴──────┴──────────────────────────────────────────────────┘  │
│                                                                             │
│  【文件管理模块 FILE】                                                        │
│  ┌─────────────┬──────┬──────────────────────────────────────────────────┐  │
│  │ 错误码       │ HTTP │ 说明                                              │  │
│  ├─────────────┼──────┼──────────────────────────────────────────────────┤  │
│  │ FILE_001    │ 404  │ 文件不存在                                         │  │
│  │ FILE_002    │ 403  │ 无文件访问权限                                     │  │
│  │ FILE_003    │ 413  │ 文件大小超过限制（最大100MB）                      │  │
│  │ FILE_004    │ 415  │ 不支持的文件类型                                   │  │
│  │ FILE_005    │ 400  │ 文件名无效                                         │  │
│  │ FILE_006    │ 400  │ 签名URL已过期                                      │  │
│  │ FILE_007    │ 400  │ 签名URL无效                                        │  │
│  │ FILE_008    │ 404  │ 文件预览不可用                                     │  │
│  │ FILE_009    │ 503  │ 预览服务不可用                                     │  │
│  │ FILE_100    │ 500  │ 文件服务内部错误                                   │  │
│  └─────────────┴──────┴──────────────────────────────────────────────────┘  │
│                                                                             │
│  【参数验证模块 VALID】                                                       │
│  ┌─────────────┬──────┬──────────────────────────────────────────────────┐  │
│  │ 错误码       │ HTTP │ 说明                                              │  │
│  ├─────────────┼──────┼──────────────────────────────────────────────────┤  │
│  │ VALID_001   │ 400  │ 参数验证失败                                       │  │
│  │ VALID_002   │ 400  │ 必填参数缺失                                       │  │
│  │ VALID_003   │ 400  │ 参数类型错误                                       │  │
│  │ VALID_004   │ 400  │ 参数格式错误                                       │  │
│  │ VALID_005   │ 400  │ 参数值超出范围                                     │  │
│  │ VALID_006   │ 400  │ 参数长度超限                                       │  │
│  │ VALID_007   │ 400  │ 参数枚举值无效                                     │  │
│  │ VALID_008   │ 400  │ ID格式无效                                         │  │
│  │ VALID_009   │ 400  │ 日期格式无效                                       │  │
│  │ VALID_010   │ 400  │ JSON格式无效                                       │  │
│  └─────────────┴──────┴──────────────────────────────────────────────────┘  │
│                                                                             │
│  【速率限制模块 RATE】                                                        │
│  ┌─────────────┬──────┬──────────────────────────────────────────────────┐  │
│  │ 错误码       │ HTTP │ 说明                                              │  │
│  ├─────────────┼──────┼──────────────────────────────────────────────────┤  │
│  │ RATE_001    │ 429  │ 请求频率超限                                       │  │
│  │ RATE_002    │ 429  │ 认证接口请求过于频繁                               │  │
│  │ RATE_003    │ 429  │ AI服务调用频率超限                                 │  │
│  │ RATE_004    │ 429  │ 文件上传频率超限                                   │  │
│  └─────────────┴──────┴──────────────────────────────────────────────────┘  │
│                                                                             │
│  【系统级错误 SYS】                                                          │
│  ┌─────────────┬──────┬──────────────────────────────────────────────────┐  │
│  │ 错误码       │ HTTP │ 说明                                              │  │
│  ├─────────────┼──────┼──────────────────────────────────────────────────┤  │
│  │ SYS_001     │ 500  │ 服务器内部错误                                     │  │
│  │ SYS_002     │ 502  │ 网关错误                                           │  │
│  │ SYS_003     │ 503  │ 服务暂时不可用                                     │  │
│  │ SYS_004     │ 504  │ 网关超时                                           │  │
│  │ SYS_005     │ 500  │ 数据库连接错误                                     │  │
│  │ SYS_006     │ 500  │ 缓存服务错误                                       │  │
│  │ SYS_007     │ 500  │ 配置错误                                           │  │
│  │ SYS_008     │ 500  │ 第三方服务错误                                     │  │
│  │ SYS_009     │ 422  │ 业务逻辑错误                                       │  │
│  │ SYS_010     │ 405  │ HTTP方法不允许                                     │  │
│  │ SYS_011     │ 404  │ API接口不存在                                      │  │
│  │ SYS_012     │ 501  │ 功能未实现                                         │  │
│  └─────────────┴──────┴──────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 API版本控制

```
/api/v1/auth/*        - 认证相关
/api/v1/projects/*    - 项目管理
/api/v1/tasks/*       - 任务管理
/api/v1/issues/*      - ISSUE管理
/api/v1/risks/*       - 风险管理
/api/v1/reviews/*     - 评审管理
/api/v1/requirements/* - 需求管理
/api/v1/templates/*   - 模板管理
/api/v1/files/*       - 文件管理
/api/v1/notifications/* - 通知管理
/api/v1/ai/*          - AI服务
/api/v1/webhooks/*    - Webhook管理
/api/v1/admin/*       - 管理员接口
```

### 6.4 速率限制策略

```typescript
const rateLimitConfig = {
  // 认证接口：较严格限制
  'auth/*': { max: 10, window: '1m' },
  
  // AI接口：限制调用频率
  'ai/*': { max: 30, window: '1m' },
  
  // 文件上传：限制频率
  'files/upload': { max: 20, window: '1m' },
  
  // 普通查询接口
  '*/list': { max: 60, window: '1m' },
  
  // 写入操作
  '*/create': { max: 30, window: '1m' },
  '*/update': { max: 30, window: '1m' },
  '*/delete': { max: 20, window: '1m' },
  
  // 默认限制
  'default': { max: 60, window: '1m' }
};
```

### 6.5 核心API列表

| 模块 | 接口 | 方法 | 说明 |
|------|------|------|------|
| **用户管理** | /api/v1/auth/forgot-password | POST | 请求密码重置 (P0) |
| | /api/v1/auth/reset-password | POST | 重置密码 (P0) |
| **任务标签** | /api/v1/tags/list | GET | 标签列表 (P0) |
| | /api/v1/tags/create | POST | 创建标签 (P0) |
| | /api/v1/tasks/[id]/tags | POST | 关联任务标签 (P0) |
| | /api/v1/tasks/[id]/watch | POST | 关注任务 (P1) |
| **需求管理** | /api/v1/requirements/[id]/history | GET | 变更历史 (P1) |
| **邮件服务** | /api/v1/email/templates | GET | 邮件模板列表 (P1) |
| **AI服务** | /api/v1/ai/cache/clear | DELETE | 清除AI缓存 (P1) |
| **通知设置** | /api/v1/notifications/preferences | GET/PUT | 通知偏好 (P1) |

---

## 七、安全与权限设计

### 7.1 权限模型

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
│      │                                    │  │  │  │  │    │
│      │ 可提出需求，查看参与项目            │  │  │  │  │    │
│      ↓                                    │  │  │  │  │    │
│  └────────────────────────────────────────┴──┴──┴──┴──┴────┘
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 7.2 敏感操作审计

```typescript
enum AuditAction {
  // 登录相关
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  
  // 数据操作
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  
  // 权限相关
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  ROLE_CHANGE = 'ROLE_CHANGE',
  
  // 敏感操作
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  SETTINGS_CHANGE = 'SETTINGS_CHANGE',
  BULK_DELETE = 'BULK_DELETE'
}
```

---

## 八、性能优化策略

### 8.1 查询优化

```typescript
// 分页查询优化
async function getTasksPaginated(params: {
  projectId: string;
  status?: TaskStatus[];
  page?: number;
  pageSize?: number;
}) {
  const { projectId, status, page = 1, pageSize = 20 } = params;
  
  // 使用索引优化查询
  const where = {
    projectId,
    ...(status && { status: { in: status } })
  };
  
  // 并行执行计数和查询
  const [total, tasks] = await Promise.all([
    db.task.count({ where }),
    db.task.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        milestone: { select: { id: true, name: true } }
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }]
    })
  ]);
  
  return {
    data: tasks,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
  };
}
```

### 8.2 缓存策略

```typescript
const cacheConfig = {
  // 用户信息缓存（15分钟）
  user: { ttl: 900, prefix: 'user:' },
  
  // 项目信息缓存（5分钟）
  project: { ttl: 300, prefix: 'project:' },
  
  // 项目成员缓存（5分钟）
  projectMembers: { ttl: 300, prefix: 'project:members:' },
  
  // AI响应缓存（1小时）
  aiResponse: { ttl: 3600, prefix: 'ai:response:' },
  
  // 预览配置缓存（30分钟）
  previewConfig: { ttl: 1800, prefix: 'preview:config:' },
  
  // 服务状态缓存（1分钟）
  serviceStatus: { ttl: 60, prefix: 'service:status:' }
};

// 缓存装饰器
function withCache<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = memoryCache.get(key);
  if (cached) return cached;
  
  return fetcher().then(result => {
    memoryCache.set(key, result, ttl);
    return result;
  });
}
```

### 8.3 AI响应缓存

```typescript
class AICacheService {
  generateCacheKey(prompt: string, context: Record<string, any>): string {
    const content = JSON.stringify({ prompt, context });
    return `ai:${crypto.hash('sha256', content)}`;
  }
  
  async callWithCache(
    prompt: string,
    context: Record<string, any>,
    executor: () => Promise<string>
  ): Promise<string> {
    const key = this.generateCacheKey(prompt, context);
    
    const cached = await this.getCachedResponse(key);
    if (cached) return cached;
    
    const response = await executor();
    await this.cacheResponse(key, response);
    
    return response;
  }
}
```

---

## 九、运维保障

### 9.1 健康检查端点

```typescript
// GET /api/v1/health
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: { status: string; latency: number };
    storage: { status: string; availableSpace: number };
    aiService: { status: string; latency?: number };
    previewServices: {
      onlyoffice: { status: string; latency?: number };
      kkfileview: { status: string; latency?: number };
    };
  };
}
```

### 9.2 数据备份策略

```
【备份类型】
├── 全量备份：每周日凌晨2点执行
├── 增量备份：每天凌晨2点执行
└── 实时备份：WAL日志归档（生产环境PostgreSQL）

【备份保留】
├── 日备份：保留7天
├── 周备份：保留4周
├── 月备份：保留12个月
└── 年备份：保留3年
```

### 9.3 监控指标

```typescript
interface SystemMetrics {
  app: {
    requestCount: number;
    requestLatency: { p50: number; p95: number; p99: number };
    errorRate: number;
    activeUsers: number;
  };
  database: {
    connectionCount: number;
    queryLatency: number;
    slowQueries: number;
  };
  ai: {
    totalCalls: number;
    successRate: number;
    avgLatency: number;
    cacheHitRate: number;
  };
  storage: {
    totalFiles: number;
    storageUsed: number;
  };
}
```

---

## 十、部署方案

### 10.1 Docker Compose 部署

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/pm
      - JWT_SECRET=${JWT_SECRET}
      - ONLYOFFICE_URL=http://onlyoffice:80
      - KKFILEVIEW_URL=http://kkfileview:8012
    depends_on:
      - db
      - onlyoffice
      - kkfileview
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=pm
    restart: unless-stopped

  onlyoffice:
    image: onlyoffice/documentserver:8.2
    environment:
      - JWT_ENABLED=true
      - JWT_SECRET=${ONLYOFFICE_JWT_SECRET}
    volumes:
      - onlyoffice_data:/var/www/onlyoffice/Data
    restart: unless-stopped

  kkfileview:
    image: keking/kkfileview:4.4.0
    environment:
      - KK_OFFICE_PREVIEW_TYPE=image
    volumes:
      - kkfileview_file:/opt/kkFileView-4.4.0/file
    restart: unless-stopped

volumes:
  postgres_data:
  onlyoffice_data:
  kkfileview_file:
```

### 10.2 环境变量配置

```env
# 应用配置
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://pm.example.com

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/pm

# JWT配置
JWT_SECRET=your-secure-jwt-secret-at-least-32-characters

# OnlyOffice配置
ONLYOFFICE_URL=http://localhost:8080
ONLYOFFICE_JWT_SECRET=your-onlyoffice-jwt-secret

# KKFileView配置
KKFILEVIEW_URL=http://localhost:8012

# AI服务配置
AI_API_KEY=your-ai-api-key
AI_BASE_URL=https://api.example.com
AI_MODEL=gpt-4

# 邮件配置
EMAIL_PROVIDER=SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=your-smtp-password
EMAIL_FROM=noreply@example.com
```

---

## 十一、实施计划

### 11.1 开发阶段划分

| 阶段 | 内容 | 周期 |
|------|------|------|
| **第一阶段** | 用户管理、项目管理、里程碑管理 | 2周 |
| **第二阶段** | 任务管理、任务模板、标签系统 | 2周 |
| **第三阶段** | 需求管理、ISSUE管理 | 2周 |
| **第四阶段** | 风险管理、AI风险评估 | 2周 |
| **第五阶段** | 评审管理、文件预览服务 | 2周 |
| **第六阶段** | Dashboard、通知系统 | 1周 |
| **第七阶段** | 邮件服务、系统集成测试 | 1周 |
| **第八阶段** | 性能优化、部署上线 | 1周 |

### 11.2 技术风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| AI服务不稳定 | 高 | 增加缓存层、降级方案 |
| 文件预览服务资源占用大 | 中 | 使用混合方案、按需启动 |
| 并发性能瓶颈 | 中 | 数据库索引优化、缓存策略 |

---

## 附录：V3.0更新日志

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| V1.0 | 2024-01 | 初版技术方案 |
| V2.0 | 2024-01 | 补充P0/P1功能，覆盖率100% |
| V3.0 | 2024-01 | 合并FINAL和OPTIMIZED文档，统一技术规范 |
