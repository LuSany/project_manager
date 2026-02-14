# 项目管理系统 - 技术实现规范 V4.0

## 文档信息

| 项目名称 | 企业级项目管理系统 |
|---------|-------------------|
| 版本 | V4.0 (优化版) |
| 目标用户 | 内部员工（约200人） |
| 编写日期 | 2026年 |
| 说明 | 基于V3.0优化，修正字段命名不一致，补充API接口示例 |

---

## 目录

1. [系统概述](#一系统概述)
2. [技术方案优化亮点](#二技术方案优化亮点)
3. [功能模块设计](#三功能模块设计)
4. [系统架构设计](#四系统架构设计)
5. [前端实现方案](#五前端实现方案)
   - 5.1 页面路由结构设计
   - 5.2 组件架构设计
   - 5.3 布局系统设计
   - 5.4 状态管理方案
   - 5.5 数据请求与缓存策略
   - 5.6 表单处理规范
   - 5.7 UI交互规范
   - 5.8 前端性能优化
   - 5.9 前端测试策略
6. [数据库设计](#六数据库设计)
7. [API接口设计](#七api接口设计)
8. [安全与权限设计](#八安全与权限设计)
9. [性能优化策略](#九性能优化策略)
10. [运维保障](#十运维保障)
11. [部署方案](#十一部署方案)
12. [实施计划](#十二实施计划)

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
| 前端框架 | Next.js | 15.x | App Router, SSR/SSG（稳定版） |
| UI框架 | React | 18.x | 服务端组件（稳定版） |
| 开发语言 | TypeScript | 5.x | 类型安全 |
| 样式方案 | Tailwind CSS | 4.x | 原子化CSS |
| 组件库 | shadcn/ui | Latest | 高质量组件 |
| 状态管理 | Zustand | 5.x | 轻量级状态管理 |
| 服务端状态 | TanStack Query | 5.x | 数据缓存与同步 |
| 表单处理 | React Hook Form | 7.x | 表单验证 |
| 数据验证 | Zod | 4.x | Schema验证 |
| ORM | Prisma | 6.x | 类型安全查询 |
| 数据库 | SQLite/PostgreSQL | - | 开发/生产环境 |
| 认证 | JWT (jose) | 5.x | Token认证 |
| 图表 | Recharts | 2.x | 数据可视化 |
| 日期处理 | date-fns | 3.x | 日期工具 |
| AI服务 | z-ai-web-dev-sdk | Latest | 大模型调用（公司内部自研） |

#### 1.3.1 技术栈版本说明

> **版本选择原则**：优先使用稳定版本，避免使用 Canary/Beta 版本

| 技术 | 原文档版本 | 确认使用版本 | 选择原因 |
|------|:----------:|:------------:|----------|
| Next.js | 16.x | **15.x** | 15.x为当前最新稳定版 |
| React | 19.x | **18.x** | 18.x为稳定版，19.x仍为Canary |
| jose | 6.x | **5.x** | 5.x为当前稳定版 |
| date-fns | 4.x | **3.x** | 3.x为当前稳定版 |

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

// 评论表 - 支持多态关联
model Comment {
  id          String   @id @default(cuid())
  content     String   // 评论内容
  userId      String   // 评论者ID
  parentId    String?  // 父评论ID（支持回复）
  
  // 多态关联 - 通过 targetType 和 targetId 实现
  targetType  String   // 关联对象类型: TASK, REVIEW, REQUIREMENT
  targetId    String   // 关联对象ID
  
  // 状态
  isEdited    Boolean  @default(false)
  isDeleted   Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // 关联
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent      Comment? @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies     Comment[] @relation("CommentReplies")
  
  @@index([targetType, targetId])
  @@index([userId])
  @@index([createdAt(sort: Desc)])
}

// 附件表
model Attachment {
  id            String        @id @default(cuid())
  fileName      String        // 原始文件名
  storedName    String        // 存储文件名
  filePath      String        // 文件路径
  fileSize      Int           // 文件大小（字节）
  mimeType      String        // MIME类型
  fileExtension String        // 文件扩展名
  
  // 多态关联
  targetType    String        // 关联对象类型: TASK, COMMENT, REVIEW
  targetId      String        // 关联对象ID
  
  uploadedBy    String        // 上传者ID
  uploadedAt    DateTime      @default(now())
  
  // 关联
  uploader      User          @relation(fields: [uploadedBy], references: [id], onDelete: Cascade)
  
  @@index([targetType, targetId])
  @@index([uploadedBy])
}

// Milestone-Task 关联说明
// 一个里程碑(1) 包含 多个任务(N)
// 任务通过 milestoneId 字段关联里程碑
// 任务不可跨里程碑（一个任务只能属于一个里程碑）
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

#### 文件存储方案

| 环境 | 存储方案 | 配置要求 |
|------|----------|----------|
| 开发环境 | 本地存储 | 路径：`./uploads/`，通过环境变量 `UPLOAD_DIR` 配置 |
| 生产环境 | 本地存储为主，可扩展云存储 | 默认本地存储，支持通过配置切换至云存储（阿里云OSS/腾讯云COS） |
| 备份策略 | 文件需要备份 | 每日凌晨增量备份，每周日全量备份 |
| 容量规划 | 500GB起步 | 按项目增长预估年增长100-200GB |

```env
# 文件存储配置
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=104857600  # 100MB

# 云存储配置（可选，生产环境）
CLOUD_STORAGE_ENABLED=false
CLOUD_STORAGE_PROVIDER=aliyun  # aliyun / tencent
CLOUD_STORAGE_BUCKET=project-management-files
CLOUD_STORAGE_REGION=cn-hangzhou
CLOUD_STORAGE_ACCESS_KEY=
CLOUD_STORAGE_SECRET_KEY=
```

#### OnlyOffice文档兼容性

| 格式类型 | 支持情况 | 备注 |
|----------|----------|------|
| Word文档 | .doc .docx .wps都支持 | 最高支持Office 2021版本格式 |
| Excel表格 | .xls .xlsx .et都支持 | 最高支持Office 2021版本格式 |
| PPT演示 | .ppt .pptx .dps都支持 | 最高支持Office 2021版本格式 |
| 编辑功能 | **支持在线编辑** | OnlyOffice Document Server 8.2 支持实时协作编辑 |

**补充说明：**
- OnlyOffice Document Server 8.2 版本支持实时协作编辑
- 同时支持PDF导出功能
- 支持文档版本历史记录

#### 预览水印配置（P2功能，预留接口）

| 配置项 | 配置值 |
|--------|--------|
| 是否预留接口 | ✅ 是，预留接口 |
| 水印内容规则 | `{用户名} - {日期时间} - 内部资料` |
| 默认透明度 | 0.15 |
| 默认旋转角度 | -30° |
| 显示模式 | 平铺 |

```typescript
// 水印配置接口
interface WatermarkConfig {
  enabled: boolean;
  content: string;           // 水印内容模板
  fontSize: number;          // 字体大小
  opacity: number;           // 透明度 0-1
  rotation: number;          // 旋转角度
  pattern: 'tile' | 'single'; // 平铺/单个
}

// 默认配置
const defaultWatermark: WatermarkConfig = {
  enabled: true,
  content: '{username} - {datetime} - 内部资料',
  fontSize: 14,
  opacity: 0.15,
  rotation: -30,
  pattern: 'tile',
}

// API预留
// GET /api/v1/files/{id}/preview?watermark=true
```

#### URL签名机制

| 配置项 | 配置值 |
|--------|--------|
| 签名算法 | HMAC-SHA256 |
| 签名有效期 | 1小时（可配置） |
| 签名参数 | `fileId`、`userId`、`timestamp`、`action`（view/download） |
| 传递方式 | URL参数（主）、Header（备选） |

```typescript
import crypto from 'crypto'

interface SignedUrlParams {
  fileId: string
  userId: string
  action: 'view' | 'download'
  expiresIn?: number  // 秒，默认3600
}

function generateSignedUrl(params: SignedUrlParams): string {
  const { fileId, userId, action, expiresIn = 3600 } = params
  const timestamp = Math.floor(Date.now() / 1000)
  const expires = timestamp + expiresIn
  
  // 参与签名的参数
  const signContent = `${fileId}|${userId}|${action}|${expires}`
  
  // 生成签名
  const signature = crypto
    .createHmac('sha256', process.env.FILE_SIGN_SECRET!)
    .update(signContent)
    .digest('hex')
  
  // 返回带签名的URL
  return `/api/v1/files/${fileId}?userId=${userId}&action=${action}&expires=${expires}&sig=${signature}`
}

function verifySignedUrl(
  fileId: string,
  userId: string,
  action: string,
  expires: number,
  signature: string
): boolean {
  // 检查是否过期
  if (Date.now() / 1000 > expires) {
    return false
  }
  
  // 验证签名
  const signContent = `${fileId}|${userId}|${action}|${expires}`
  const expectedSignature = crypto
    .createHmac('sha256', process.env.FILE_SIGN_SECRET!)
    .update(signContent)
    .digest('hex')
  
  return signature === expectedSignature
}
```

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

#### AI服务SDK配置

> **SDK来源**：公司内部自研（通过统一AI网关封装）

```typescript
// SDK配置示例
const aiConfig = {
  apiKey: process.env.AI_API_KEY,
  baseUrl: process.env.AI_BASE_URL,  // AI网关地址
  model: process.env.AI_MODEL || 'gpt-4',
}

// 支持的AI服务类型
type AIServiceType = 
  | 'RISK_ANALYSIS'    // 风险分析
  | 'REVIEW_AUDIT'     // 评审审核
  | 'DOC_PARSE'        // 文档解析
```

#### AI服务类型

| 服务类型 | 说明 | 调用场景 |
|---------|------|---------|
| RISK_ANALYSIS | 风险分析 | 里程碑任务变更时 |
| REVIEW_AUDIT | 评审审核 | 提交评审材料时 |
| DOC_PARSE | 文档解析 | 上传评审材料时 |

#### AI风险评估触发机制

| 配置项 | 配置值 | 说明 |
|--------|--------|------|
| 定时扫描周期 | 每天凌晨2点 | 执行全量项目风险扫描 |
| 实时触发延迟 | 5分钟 | 里程碑任务变更后延迟触发（避免频繁调用） |
| 风险级别阈值 | 见下表 | 基于AI返回的风险分数映射 |
| 调用限制 | 30次/分钟 | 速率限制配置 |

**风险级别阈值映射：**

| 分数范围 | 风险级别 | 说明 |
|:--------:|:--------:|------|
| 0-30 | LOW（低） | 低风险，无需特别关注 |
| 31-60 | MEDIUM（中） | 中等风险，需要关注 |
| 61-85 | HIGH（高） | 高风险，需要立即处理 |
| 86-100 | CRITICAL（关键） | 关键风险，必须立即处理 |

**预警发送机制：**
- 发送对象：项目经理、项目Owner、风险管理人
- 发送方式：站内通知 + 邮件（如已配置）

```typescript
// 风险评估触发配置
const riskAssessmentConfig = {
  // 定时扫描
  scheduledScan: {
    enabled: true,
    cron: '0 2 * * *',  // 每天凌晨2点
  },
  
  // 实时触发
  realTimeTrigger: {
    enabled: true,
    delayMs: 5 * 60 * 1000,  // 5分钟延迟
    debounce: true,          // 防抖处理
  },
  
  // 风险级别阈值
  riskLevelThresholds: {
    LOW: { min: 0, max: 30 },
    MEDIUM: { min: 31, max: 60 },
    HIGH: { min: 61, max: 85 },
    CRITICAL: { min: 86, max: 100 },
  },
  
  // 预警通知
  alertNotification: {
    channels: ['in-app', 'email'],
    recipients: ['project_manager', 'project_owner', 'risk_owner'],
  },
}
```

#### AI审核评分标准

| 评分项 | 评分标准 | 合格线 |
|--------|----------|:------:|
| `aiContentScore` | 内容完整性（检查必填材料、内容字数） | **≥60分** |
| `aiLogicScore` | 逻辑合理性（文档结构、数据一致性、论据支持） | **≥60分** |
| `aiRiskScore` | 风险识别（风险点、影响程度） | **<70分** |

**综合判定规则：**
```typescript
interface AIReviewResult {
  aiContentScore: number;   // 内容完整性 0-100
  aiLogicScore: number;     // 逻辑合理性 0-100
  aiRiskScore: number;      // 风险评分 0-100（分越高风险越大）
  aiSuggestions: string;    // 改进建议
  aiReviewStatus: 'PASSED' | 'WARNING' | 'FAILED';
}

function evaluateAIReview(scores: AIReviewResult): 'PASSED' | 'WARNING' | 'FAILED' {
  const { aiContentScore, aiLogicScore, aiRiskScore } = scores;
  
  // 完全通过
  if (aiContentScore >= 60 && aiLogicScore >= 60 && aiRiskScore < 60) {
    return 'PASSED';
  }
  
  // 警告（通过但需关注）
  if (aiContentScore >= 60 && aiLogicScore >= 60 && aiRiskScore >= 60 && aiRiskScore < 70) {
    return 'WARNING';
  }
  
  // 不通过
  return 'FAILED';
}
```

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

#### 通知发送机制

**采用混合方案**：重要通知实时发送，普通通知定时批量发送

| 通知类型 | 发送方式 | 说明 |
|----------|----------|------|
| 风险预警 (RISK_ALERT) | 实时发送 | 高优先级，立即通知 |
| 评审邀请 (REVIEW_INVITE) | 实时发送 | 需及时响应 |
| 紧急任务 (URGENT_TASK) | 实时发送 | 高优先级 |
| 任务到期提醒 (TASK_DUE) | 批量发送 | 每5分钟一批 |
| 任务分配 (TASK_ASSIGNED) | 批量发送 | 每5分钟一批 |
| 评论@提醒 (COMMENT_MENTION) | 批量发送 | 每5分钟一批 |
| 每日摘要 (DAILY_DIGEST) | 定时发送 | 每日固定时间 |

```typescript
const notificationConfig = {
  // 实时通知类型
  realTimeTypes: [
    'RISK_ALERT',        // 风险预警
    'REVIEW_INVITE',     // 评审邀请
    'URGENT_TASK',       // 紧急任务分配
  ],
  
  // 批量通知类型
  batchTypes: [
    'TASK_DUE_REMINDER', // 任务到期提醒
    'TASK_ASSIGNED',     // 任务分配通知
    'COMMENT_MENTION',   // 评论@提醒
    'DAILY_DIGEST',      // 每日摘要
  ],
  
  // 批量发送配置
  batchSchedule: {
    interval: 5 * 60 * 1000,  // 每5分钟发送一批
    maxBatchSize: 100,         // 每批最多100条
  },
}
```

#### 通知订阅粒度

| 粒度级别 | 支持情况 | 说明 |
|----------|:--------:|------|
| 全局级别 | ✅ 支持 | 开启/关闭所有邮件通知、站内通知 |
| 项目级别 | ✅ 支持 | 选择关注/忽略特定项目的通知 |
| 事件类型级别 | ✅ 支持 | 按事件类型开关（任务、评审、风险等） |
| 具体资源级别 | ❌ 不支持 | 当前版本不支持，考虑P2版本添加 |

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
  commentMention  Boolean   @default(true)
  weeklyDigest    Boolean   @default(false)
  dailyDigest     Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  user            User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// 项目级别忽略设置
model NotificationIgnore {
  id          String   @id @default(cuid())
  userId      String
  projectId   String
  createdAt   DateTime @default(now())
  
  @@unique([userId, projectId])
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

## 五、前端实现方案

### 5.1 页面路由结构设计

#### 5.1.1 路由架构总览

```
src/app/
├── (auth)/                          # 认证相关页面（无侧边栏布局）
│   ├── login/page.tsx               # 登录页
│   ├── register/page.tsx            # 注册页
│   ├── forgot-password/page.tsx     # 忘记密码页
│   └── reset-password/page.tsx      # 重置密码页
│
├── (main)/                          # 主应用页面（有侧边栏布局）
│   ├── layout.tsx                   # 主布局（侧边栏+顶栏）
│   ├── page.tsx                     # Dashboard首页
│   │
│   ├── projects/                    # 项目管理
│   │   ├── page.tsx                 # 项目列表
│   │   ├── new/page.tsx             # 新建项目
│   │   └── [id]/
│   │       ├── page.tsx             # 项目详情/概览
│   │       ├── tasks/               # 项目任务
│   │       │   ├── page.tsx         # 任务列表
│   │       │   ├── new/page.tsx     # 新建任务
│   │       │   └── [taskId]/page.tsx # 任务详情
│   │       ├── milestones/          # 里程碑
│   │       │   ├── page.tsx
│   │       │   └── [milestoneId]/page.tsx
│   │       ├── issues/              # ISSUE管理
│   │       │   ├── page.tsx
│   │       │   ├── new/page.tsx
│   │       │   └── [issueId]/page.tsx
│   │       ├── risks/               # 风险管理
│   │       │   ├── page.tsx
│   │       │   ├── new/page.tsx
│   │       │   └── [riskId]/page.tsx
│   │       ├── requirements/        # 需求管理
│   │       │   ├── page.tsx
│   │       │   ├── new/page.tsx
│   │       │   └── [reqId]/page.tsx
│   │       ├── reviews/             # 评审管理
│   │       │   ├── page.tsx
│   │       │   ├── new/page.tsx
│   │       │   └── [reviewId]/page.tsx
│   │       ├── documents/           # 文档管理
│   │       │   └── page.tsx
│   │       ├── members/             # 成员管理
│   │       │   └── page.tsx
│   │       └── settings/            # 项目设置
│   │           └── page.tsx
│   │
│   ├── tasks/                       # 我的任务（跨项目）
│   │   └── page.tsx
│   │
│   ├── issues/                      # 我的ISSUE（跨项目）
│   │   └── page.tsx
│   │
│   ├── risks/                       # 风险看板（跨项目）
│   │   └── page.tsx
│   │
│   ├── reviews/                     # 我的评审（跨项目）
│   │   └── page.tsx
│   │
│   ├── notifications/               # 通知中心
│   │   └── page.tsx
│   │
│   ├── settings/                    # 个人设置
│   │   ├── page.tsx                 # 基本设置
│   │   ├── profile/page.tsx         # 个人资料
│   │   └── preferences/page.tsx     # 偏好设置
│   │
│   └── admin/                       # 管理员区域
│       ├── layout.tsx               # 管理员布局
│       ├── users/                   # 用户管理
│       │   └── page.tsx
│       ├── projects/                # 项目管理
│       │   └── page.tsx
│       ├── templates/               # 全局模板
│       │   └── page.tsx
│       ├── email/                   # 邮件配置
│       │   └── page.tsx
│       ├── ai/                      # AI配置
│       │   └── page.tsx
│       └── logs/                    # 系统日志
│           └── page.tsx
│
├── api/                             # API路由
│   └── ...
│
├── layout.tsx                       # 根布局
├── loading.tsx                      # 全局加载状态
├── error.tsx                        # 全局错误处理
└── not-found.tsx                    # 404页面
```

#### 5.1.2 路由守卫与权限控制

```typescript
// middleware.ts - 路由守卫
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 不需要认证的路径
const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password']

// 管理员专属路径
const adminPaths = ['/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth_token')?.value

  // 公开路径直接放行
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 未登录跳转到登录页
  if (!token) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // 验证Token有效性
  const user = await verifyToken(token)
  if (!user) {
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }

  // 管理员路径权限检查
  if (adminPaths.some(path => pathname.startsWith(path))) {
    if (user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // 项目访问权限检查（动态路由）
  const projectIdMatch = pathname.match(/\/projects\/([^\/]+)/)
  if (projectIdMatch) {
    const projectId = projectIdMatch[1]
    const hasAccess = await checkProjectAccess(user.id, projectId)
    if (!hasAccess && user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/projects', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)'
  ]
}
```

---

### 5.2 组件架构设计

#### 5.2.1 组件分层架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           组件分层架构                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      页面组件 (Page Components)                       │   │
│  │  • 负责页面级布局和数据获取                                           │   │
│  │  • 组合业务组件构建完整页面                                           │   │
│  │  • 示例：DashboardPage, ProjectDetailPage, TaskListPage              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      业务组件 (Business Components)                   │   │
│  │  • 包含特定业务逻辑                                                   │   │
│  │  • 可复用的功能模块                                                   │   │
│  │  • 示例：TaskKanban, RiskMatrix, ReviewTimeline, RequirementFlow     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      通用组件 (Common Components)                     │   │
│  │  • 无业务逻辑的UI组件                                                 │   │
│  │  • 高度可配置和复用                                                   │   │
│  │  • 示例：DataTable, StatusBadge, UserAvatar, DateRangePicker         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      基础组件 (Base Components)                       │   │
│  │  • shadcn/ui 组件封装                                                 │   │
│  │  • 统一设计规范                                                       │   │
│  │  • 示例：Button, Input, Dialog, Card, Tabs, Dropdown                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.2.2 目录结构

```
src/components/
├── ui/                              # shadcn/ui 基础组件
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   ├── toast.tsx
│   └── ...
│
├── common/                          # 通用组件
│   ├── layout/                      # 布局组件
│   │   ├── AppLayout.tsx            # 主布局
│   │   ├── Sidebar.tsx              # 侧边栏
│   │   ├── Header.tsx               # 顶部导航
│   │   ├── Footer.tsx               # 底部
│   │   └── Breadcrumb.tsx           # 面包屑
│   │
│   ├── data-display/                # 数据展示
│   │   ├── DataTable.tsx            # 数据表格
│   │   ├── DataList.tsx             # 数据列表
│   │   ├── Pagination.tsx           # 分页
│   │   ├── EmptyState.tsx           # 空状态
│   │   ├── LoadingState.tsx         # 加载状态
│   │   └── ErrorState.tsx           # 错误状态
│   │
│   ├── feedback/                    # 反馈组件
│   │   ├── AlertDialog.tsx          # 确认对话框
│   │   ├── Toast.tsx                # 消息提示
│   │   ├── Progress.tsx             # 进度条
│   │   └── Skeleton.tsx             # 骨架屏
│   │
│   ├── form/                        # 表单组件
│   │   ├── FormField.tsx            # 表单字段
│   │   ├── SearchInput.tsx          # 搜索输入
│   │   ├── DateRangePicker.tsx      # 日期范围选择
│   │   ├── UserSelect.tsx           # 用户选择器
│   │   ├── ProjectSelect.tsx        # 项目选择器
│   │   ├── FileUpload.tsx           # 文件上传
│   │   └── RichTextEditor.tsx       # 富文本编辑
│   │
│   └── media/                       # 媒体组件
│       ├── UserAvatar.tsx           # 用户头像
│       ├── StatusBadge.tsx          # 状态徽章
│       ├── PriorityBadge.tsx        # 优先级徽章
│       └── FilePreview.tsx          # 文件预览
│
├── business/                        # 业务组件
│   ├── task/                        # 任务相关
│   │   ├── TaskCard.tsx             # 任务卡片
│   │   ├── TaskKanban.tsx           # 任务看板
│   │   ├── TaskTimeline.tsx         # 任务时间线
│   │   ├── TaskForm.tsx             # 任务表单
│   │   ├── TaskDetail.tsx           # 任务详情
│   │   ├── SubTaskList.tsx          # 子任务列表
│   │   ├── TaskProgress.tsx         # 任务进度
│   │   └── TaskFilter.tsx           # 任务筛选
│   │
│   ├── project/                     # 项目相关
│   │   ├── ProjectCard.tsx          # 项目卡片
│   │   ├── ProjectList.tsx          # 项目列表
│   │   ├── ProjectForm.tsx          # 项目表单
│   │   ├── ProjectOverview.tsx      # 项目概览
│   │   ├── ProjectStats.tsx         # 项目统计
│   │   └── MemberManager.tsx        # 成员管理
│   │
│   ├── requirement/                  # 需求相关
│   │   ├── RequirementCard.tsx      # 需求卡片
│   │   ├── RequirementFlow.tsx      # 需求流程
│   │   ├── RequirementForm.tsx      # 需求表单
│   │   ├── ProposalForm.tsx         # 方案评估表单
│   │   ├── ImpactAnalysis.tsx       # 影响分析
│   │   └── AcceptancePanel.tsx      # 验收面板
│   │
│   ├── issue/                       # ISSUE相关
│   │   ├── IssueCard.tsx            # ISSUE卡片
│   │   ├── IssueList.tsx            # ISSUE列表
│   │   ├── IssueForm.tsx            # ISSUE表单
│   │   └── IssueTaskLink.tsx        # ISSUE任务关联
│   │
│   ├── risk/                        # 风险相关
│   │   ├── RiskCard.tsx             # 风险卡片
│   │   ├── RiskMatrix.tsx           # 风险矩阵
│   │   ├── RiskForm.tsx             # 风险表单
│   │   ├── RiskTimeline.tsx         # 风险时间线
│   │   └── AIRiskAssessment.tsx     # AI风险评估
│   │
│   ├── review/                      # 评审相关
│   │   ├── ReviewCard.tsx           # 评审卡片
│   │   ├── ReviewList.tsx           # 评审列表
│   │   ├── ReviewForm.tsx           # 评审表单
│   │   ├── ReviewDetail.tsx         # 评审详情
│   │   ├── MaterialUpload.tsx       # 材料上传
│   │   ├── MaterialPreview.tsx      # 材料预览
│   │   └── AIReviewPanel.tsx        # AI审核面板
│   │
│   ├── milestone/                   # 里程碑相关
│   │   ├── MilestoneCard.tsx        # 里程碑卡片
│   │   ├── MilestoneTimeline.tsx    # 里程碑时间线
│   │   └── MilestoneProgress.tsx    # 里程碑进度
│   │
│   └── dashboard/                   # Dashboard相关
│       ├── StatsCard.tsx            # 统计卡片
│       ├── ProgressChart.tsx        # 进度图表
│       ├── RiskOverview.tsx         # 风险概览
│       ├── RecentActivities.tsx     # 最近活动
│       └── MyTasks.tsx              # 我的任务
│
└── providers/                       # Context Providers
    ├── QueryProvider.tsx            # TanStack Query Provider
    ├── ThemeProvider.tsx            # 主题 Provider
    └── AuthProvider.tsx             # 认证 Provider
```

#### 5.2.3 组件设计规范

```typescript
// 组件接口设计规范
interface ComponentProps {
  // 1. 数据属性
  data?: T                          // 组件数据
  loading?: boolean                  // 加载状态
  error?: Error | null              // 错误状态

  // 2. 事件回调
  onChange?: (value: T) => void     // 值变化回调
  onSubmit?: (data: T) => void      // 提交回调
  onCancel?: () => void             // 取消回调

  // 3. 样式定制
  className?: string                // 自定义类名
  style?: React.CSSProperties       // 自定义样式

  // 4. 行为配置
  disabled?: boolean                // 禁用状态
  readOnly?: boolean                // 只读状态
  required?: boolean                // 必填标识

  // 5. 其他
  id?: string                       // 元素ID
  'aria-label'?: string             // 无障碍标签
}

// 示例：TaskCard组件
interface TaskCardProps {
  data: Task                        // 任务数据
  loading?: boolean
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onStatusChange?: (taskId: string, status: TaskStatus) => void
  className?: string
  showActions?: boolean
  compact?: boolean
}

// 组件实现规范
export function TaskCard({
  data,
  loading,
  onEdit,
  onDelete,
  onStatusChange,
  className,
  showActions = true,
  compact = false
}: TaskCardProps) {
  // 1. Hooks调用（在最顶层）
  const { user } = useAuth()
  const { showToast } = useToast()

  // 2. 派生状态（使用useMemo）
  const isOverdue = useMemo(() => {
    return data.dueDate && new Date(data.dueDate) < new Date()
  }, [data.dueDate])

  // 3. 事件处理（使用useCallback）
  const handleStatusChange = useCallback((status: TaskStatus) => {
    onStatusChange?.(data.id, status)
  }, [data.id, onStatusChange])

  // 4. 条件渲染
  if (loading) {
    return <TaskCardSkeleton />
  }

  // 5. 主要渲染
  return (
    <Card className={cn('task-card', className)}>
      {/* 组件内容 */}
    </Card>
  )
}
```

---

### 5.3 布局系统设计

#### 5.3.1 布局架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              页面布局架构                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           Header (h-16)                               │   │
│  │  ┌─────────┐  ┌─────────────────────────────┐  ┌─────────────────┐  │   │
│  │  │ Logo    │  │        搜索栏               │  │ 用户信息/通知   │  │   │
│  │  └─────────┘  └─────────────────────────────┘  └─────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌────────────┐  ┌──────────────────────────────────────────────────────┐  │
│  │            │  │                                                      │  │
│  │            │  │                                                      │  │
│  │  Sidebar   │  │                    Content                           │  │
│  │  (w-64)    │  │                    (flex-1)                          │  │
│  │            │  │                                                      │  │
│  │  • Dashboard│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  • 项目    │  │  │  Breadcrumb                                   │  │  │
│  │  • 任务    │  │  └──────────────────────────────────────────────┘  │  │
│  │  • 需求    │  │                                                      │  │
│  │  • ISSUE  │  │  ┌──────────────────────────────────────────────┐  │  │
│  │  • 风险    │  │  │                                              │  │  │
│  │  • 评审    │  │  │              Page Content                    │  │  │
│  │  • 设置    │  │  │                                              │  │  │
│  │            │  │  │                                              │  │  │
│  │            │  │  └──────────────────────────────────────────────┘  │  │
│  └────────────┘  └──────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.3.2 响应式断点设计

```typescript
// tailwind.config.ts 断点配置
const breakpoints = {
  sm: '640px',    // 手机横屏
  md: '768px',    // 平板竖屏
  lg: '1024px',   // 平板横屏/小型笔记本
  xl: '1280px',   // 桌面显示器
  '2xl': '1536px' // 大型显示器
}

// 响应式行为
const responsiveConfig = {
  // 侧边栏
  sidebar: {
    mobile: 'hidden',                    // 移动端隐藏
    tablet: 'collapsed (w-16)',          // 平板折叠
    desktop: 'expanded (w-64)'           // 桌面展开
  },

  // 表格
  table: {
    mobile: 'card-list',                 // 移动端卡片列表
    tablet: 'compact-table',             // 平板紧凑表格
    desktop: 'full-table'                // 桌面完整表格
  },

  // 表单
  form: {
    mobile: 'single-column',             // 移动端单列
    desktop: 'multi-column'              // 桌面多列
  }
}
```

#### 5.3.3 布局组件实现

```typescript
// components/common/layout/AppLayout.tsx
'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <Header
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex">
        {/* 侧边栏 */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
        />

        {/* 主内容区 */}
        <main className={cn(
          'flex-1 transition-all duration-300',
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        )}>
          <div className="container mx-auto p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

// components/common/layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  AlertCircle,
  ShieldAlert,
  FileCheck,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/projects', icon: FolderKanban, label: '项目管理' },
  { href: '/tasks', icon: CheckSquare, label: '我的任务' },
  { href: '/issues', icon: AlertCircle, label: 'ISSUE' },
  { href: '/risks', icon: ShieldAlert, label: '风险管理' },
  { href: '/reviews', icon: FileCheck, label: '评审管理' },
  { href: '/settings', icon: Settings, label: '设置' },
]

interface SidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={cn(
      'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r bg-card transition-all duration-300',
      collapsed ? 'w-16' : 'w-64',
      'hidden md:block'
    )}>
      {/* 折叠按钮 */}
      <button
        onClick={() => onCollapse(!collapsed)}
        className="absolute -right-3 top-6 z-50 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* 导航菜单 */}
      <nav className="flex flex-col gap-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

---

### 5.4 状态管理方案

#### 5.4.1 状态分类与管理策略

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           状态管理策略                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    服务端状态 (TanStack Query)                        │   │
│  │                                                                     │   │
│  │  • 项目列表、任务列表、需求列表等                                     │   │
│  │  • 自动缓存、重新验证、后台更新                                       │   │
│  │  • 请求状态管理（loading、error、success）                           │   │
│  │  • 分页、无限滚动                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    客户端状态 (Zustand)                               │   │
│  │                                                                     │   │
│  │  • 全局：用户信息、主题设置、通知状态                                 │   │
│  │  • UI状态：侧边栏折叠、模态框状态、筛选条件                           │   │
│  │  • 表单状态：临时编辑数据、草稿保存                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    URL状态 (Next.js Router)                           │   │
│  │                                                                     │   │
│  │  • 分页参数：page, pageSize                                         │   │
│  │  • 筛选参数：status, priority, assignee                              │   │
│  │  • 排序参数：sortBy, sortOrder                                       │   │
│  │  • 搜索关键词：q                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.4.2 Zustand Store 设计

```typescript
// stores/authStore.ts - 用户认证状态
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  department?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => set({ user, token, isAuthenticated: true }),

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        // 清除cookie
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      },

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null
        }))
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token })
    }
  )
)

// stores/uiStore.ts - UI状态
import { create } from 'zustand'

interface UIState {
  // 侧边栏
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // 模态框
  activeModal: string | null
  modalData: any
  openModal: (modalId: string, data?: any) => void
  closeModal: () => void

  // 通知抽屉
  notificationOpen: boolean
  toggleNotification: () => void

  // 全局加载
  globalLoading: boolean
  setGlobalLoading: (loading: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  activeModal: null,
  modalData: null,
  openModal: (modalId, data) => set({ activeModal: modalId, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  notificationOpen: false,
  toggleNotification: () => set((state) => ({ notificationOpen: !state.notificationOpen })),

  globalLoading: false,
  setGlobalLoading: (loading) => set({ globalLoading: loading })
}))

// stores/filterStore.ts - 筛选状态
import { create } from 'zustand'

interface TaskFilter {
  status: TaskStatus[]
  priority: Priority[]
  assignee: string[]
  milestone: string[]
  tags: string[]
  dueDate: { start?: Date; end?: Date }
  search: string
}

interface FilterState {
  taskFilter: TaskFilter
  setTaskFilter: (filter: Partial<TaskFilter>) => void
  resetTaskFilter: () => void

  projectFilter: { status: ProjectStatus[]; search: string }
  setProjectFilter: (filter: Partial<typeof projectFilter>) => void
}

const defaultTaskFilter: TaskFilter = {
  status: [],
  priority: [],
  assignee: [],
  milestone: [],
  tags: [],
  dueDate: {},
  search: ''
}

export const useFilterStore = create<FilterState>((set) => ({
  taskFilter: defaultTaskFilter,
  setTaskFilter: (filter) =>
    set((state) => ({ taskFilter: { ...state.taskFilter, ...filter } })),
  resetTaskFilter: () => set({ taskFilter: defaultTaskFilter }),

  projectFilter: { status: [], search: '' },
  setProjectFilter: (filter) =>
    set((state) => ({ projectFilter: { ...state.projectFilter, ...filter } }))
}))
```

#### 5.4.3 TanStack Query 配置

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5分钟内数据视为新鲜
      gcTime: 10 * 60 * 1000,         // 10分钟后垃圾回收
      retry: 1,                        // 失败重试1次
      refetchOnWindowFocus: false,     // 窗口聚焦不自动刷新
      refetchOnReconnect: true,        // 网络重连时刷新
    },
    mutations: {
      retry: 0,                        // 变更操作不重试
    }
  }
})

// hooks/queries/useTasks.ts - 任务查询
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// 查询键工厂
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskFilterParams) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
}

// 获取任务列表
export function useTasks(filters: TaskFilterParams) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => api.getTasks(filters),
  })
}

// 获取任务详情
export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => api.getTask(id),
    enabled: !!id,
  })
}

// 创建任务
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.createTask,
    onSuccess: () => {
      // 使任务列表缓存失效
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

// 更新任务
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) =>
      api.updateTask(id, data),
    onSuccess: (_, variables) => {
      // 更新特定任务缓存
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

// hooks/queries/useProjects.ts - 项目查询
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: ProjectFilterParams) => [...projectKeys.lists(), filters] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
  members: (id: string) => [...projectKeys.all, 'members', id] as const,
  stats: (id: string) => [...projectKeys.all, 'stats', id] as const,
}

export function useProjects(filters?: ProjectFilterParams) {
  return useQuery({
    queryKey: projectKeys.list(filters || {}),
    queryFn: () => api.getProjects(filters),
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => api.getProject(id),
    enabled: !!id,
  })
}

// 乐观更新示例
export function useUpdateTaskProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, progress }: { id: string; progress: number }) =>
      api.updateTaskProgress(id, progress),

    onMutate: async ({ id, progress }) => {
      // 取消正在进行的请求
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) })

      // 保存之前的数据
      const previousTask = queryClient.getQueryData(taskKeys.detail(id))

      // 乐观更新
      queryClient.setQueryData(taskKeys.detail(id), (old: Task) => ({
        ...old,
        progress
      }))

      return { previousTask }
    },

    onError: (err, { id }, context) => {
      // 回滚
      queryClient.setQueryData(taskKeys.detail(id), context.previousTask)
    },

    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) })
    },
  })
}
```

---

### 5.5 数据请求与缓存策略

#### 5.5.1 API请求封装

```typescript
// lib/api/client.ts - API客户端
import { ApiError } from '@/lib/errors'

const BASE_URL = '/api/v1'

interface RequestOptions extends RequestInit {
  params?: Record<string, any>
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options

    // 构建URL
    let url = `${this.baseUrl}${endpoint}`
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      url += `?${searchParams.toString()}`
    }

    // 获取token
    const token = this.getToken()

    // 发送请求
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...fetchOptions.headers,
      },
    })

    // 处理响应
    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(
        data.error?.code || 'UNKNOWN_ERROR',
        response.status,
        data.error?.message
      )
    }

    return data.data
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    const authStorage = localStorage.getItem('auth-storage')
    if (!authStorage) return null
    try {
      const { state } = JSON.parse(authStorage)
      return state?.token
    } catch {
      return null
    }
  }

  get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params })
  }

  post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const api = new ApiClient(BASE_URL)

// lib/api/tasks.ts - 任务API
export const taskApi = {
  list: (params: TaskFilterParams) =>
    api.get<PaginatedResponse<Task>>('/tasks', params),

  get: (id: string) =>
    api.get<Task>(`/tasks/${id}`),

  create: (data: CreateTaskInput) =>
    api.post<Task>('/tasks', data),

  update: (id: string, data: UpdateTaskInput) =>
    api.put<Task>(`/tasks/${id}`, data),

  delete: (id: string) =>
    api.delete<void>(`/tasks/${id}`),

  updateProgress: (id: string, progress: number) =>
    api.put<Task>(`/tasks/${id}/progress`, { progress }),

  addComment: (id: string, content: string) =>
    api.post<Comment>(`/tasks/${id}/comments`, { content }),

  addSubTask: (id: string, title: string) =>
    api.post<SubTask>(`/tasks/${id}/subtasks`, { title }),

  toggleSubTask: (id: string, subTaskId: string) =>
    api.put<SubTask>(`/tasks/${id}/subtasks/${subTaskId}/toggle`),
}
```

#### 5.5.2 缓存策略配置

```typescript
// lib/cache/config.ts - 缓存配置
export const cacheConfig = {
  // 用户相关
  user: {
    staleTime: 15 * 60 * 1000,    // 15分钟
    gcTime: 30 * 60 * 1000,       // 30分钟
  },

  // 项目信息
  project: {
    staleTime: 5 * 60 * 1000,     // 5分钟
    gcTime: 15 * 60 * 1000,       // 15分钟
  },

  // 项目成员
  projectMembers: {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },

  // 任务列表
  tasks: {
    staleTime: 2 * 60 * 1000,     // 2分钟
    gcTime: 10 * 60 * 1000,
  },

  // 任务详情
  taskDetail: {
    staleTime: 1 * 60 * 1000,     // 1分钟
    gcTime: 5 * 60 * 1000,
  },

  // 通知
  notifications: {
    staleTime: 30 * 1000,         // 30秒
    gcTime: 5 * 60 * 1000,
  },

  // 统计数据
  stats: {
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  },

  // AI分析结果
  aiAnalysis: {
    staleTime: 60 * 60 * 1000,    // 1小时
    gcTime: 2 * 60 * 60 * 1000,   // 2小时
  },
}

// 使用示例
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectApi.get(id),
    ...cacheConfig.project,
    enabled: !!id,
  })
}
```

#### 5.5.3 预加载策略

```typescript
// hooks/usePreload.ts - 预加载钩子
import { useQueryClient } from '@tanstack/react-query'
import { projectKeys, taskKeys } from '@/lib/queryKeys'
import { projectApi, taskApi } from '@/lib/api'

export function usePreload() {
  const queryClient = useQueryClient()

  // 预加载项目详情
  const preloadProject = async (id: string) => {
    await queryClient.prefetchQuery({
      queryKey: projectKeys.detail(id),
      queryFn: () => projectApi.get(id),
    })
  }

  // 预加载项目成员
  const preloadProjectMembers = async (id: string) => {
    await queryClient.prefetchQuery({
      queryKey: projectKeys.members(id),
      queryFn: () => projectApi.getMembers(id),
    })
  }

  // 预加载任务详情
  const preloadTask = async (id: string) => {
    await queryClient.prefetchQuery({
      queryKey: taskKeys.detail(id),
      queryFn: () => taskApi.get(id),
    })
  }

  return {
    preloadProject,
    preloadProjectMembers,
    preloadTask,
  }
}

// 在链接上使用预加载
// components/business/project/ProjectLink.tsx
export function ProjectLink({ project }: { project: Project }) {
  const { preloadProject } = usePreload()

  return (
    <Link
      href={`/projects/${project.id}`}
      onMouseEnter={() => preloadProject(project.id)}
      onTouchStart={() => preloadProject(project.id)}
    >
      {project.name}
    </Link>
  )
}
```

---

### 5.6 表单处理规范

#### 5.6.1 表单架构设计

```typescript
// lib/forms/schemas.ts - Zod Schema定义
import { z } from 'zod'

// 项目表单Schema
export const projectSchema = z.object({
  name: z.string()
    .min(2, '项目名称至少2个字符')
    .max(100, '项目名称最多100个字符'),
  code: z.string()
    .min(2, '项目编码至少2个字符')
    .max(20, '项目编码最多20个字符')
    .regex(/^[A-Z][A-Z0-9_-]*$/, '项目编码必须以大写字母开头，只能包含大写字母、数字、下划线和连字符'),
  description: z.string().max(2000, '描述最多2000个字符').optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), '请选择有效的开始日期'),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), '请选择有效的结束日期'),
  budget: z.number().min(0, '预算不能为负数').optional(),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: '结束日期必须晚于开始日期',
  path: ['endDate'],
})

// 任务表单Schema
export const taskSchema = z.object({
  title: z.string()
    .min(2, '任务标题至少2个字符')
    .max(200, '任务标题最多200个字符'),
  description: z.string().max(5000, '描述最多5000个字符').optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  milestoneId: z.string().optional(),
  assigneeIds: z.array(z.string()).min(1, '请至少选择一个执行人'),
  acceptorId: z.string().min(1, '请选择验收人'),
  estimatedHours: z.number().min(0).max(1000).optional(),
  tags: z.array(z.string()).optional(),
}).refine(
  (data) => {
    if (data.startDate && data.dueDate) {
      return new Date(data.dueDate) >= new Date(data.startDate)
    }
    return true
  },
  { message: '截止日期不能早于开始日期', path: ['dueDate'] }
)

// 需求表单Schema
export const requirementSchema = z.object({
  title: z.string().min(2, '需求标题至少2个字符').max(200),
  description: z.string().min(10, '需求描述至少10个字符').max(5000),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  category: z.string().optional(),
  expectedDate: z.string().optional(),
  deadline: z.string().optional(),
})

// 类型导出
export type ProjectFormData = z.infer<typeof projectSchema>
export type TaskFormData = z.infer<typeof taskSchema>
export type RequirementFormData = z.infer<typeof requirementSchema>
```

#### 5.6.2 表单组件实现

```typescript
// components/business/task/TaskForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { UserSelect } from '@/components/common/form/UserSelect'
import { MilestoneSelect } from '@/components/common/form/MilestoneSelect'
import { TagInput } from '@/components/common/form/TagInput'
import { DateRangePicker } from '@/components/common/form/DateRangePicker'
import { taskSchema, type TaskFormData } from '@/lib/forms/schemas'
import { useCreateTask, useUpdateTask } from '@/hooks/queries/useTasks'
import type { Task } from '@/types'

interface TaskFormProps {
  projectId: string
  task?: Task                  // 编辑时传入
  onSuccess?: (task: Task) => void
  onCancel?: () => void
}

export function TaskForm({ projectId, task, onSuccess, onCancel }: TaskFormProps) {
  const isEdit = !!task

  // 表单初始化
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: task ? {
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      startDate: task.startDate?.split('T')[0] || '',
      dueDate: task.dueDate?.split('T')[0] || '',
      milestoneId: task.milestoneId || '',
      assigneeIds: task.assignments?.map(a => a.userId) || [],
      acceptorId: task.acceptorId || '',
      estimatedHours: task.estimatedHours,
      tags: task.tags?.map(t => t.tagId) || [],
    } : {
      title: '',
      description: '',
      priority: 'MEDIUM',
      startDate: '',
      dueDate: '',
      milestoneId: '',
      assigneeIds: [],
      acceptorId: '',
      estimatedHours: undefined,
      tags: [],
    },
  })

  // Mutations
  const createMutation = useCreateTask()
  const updateMutation = useUpdateTask()

  // 提交处理
  const onSubmit = async (data: TaskFormData) => {
    try {
      const input = {
        ...data,
        projectId,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      }

      let result: Task
      if (isEdit) {
        result = await updateMutation.mutateAsync({ id: task.id, data: input })
      } else {
        result = await createMutation.mutateAsync(input)
      }

      onSuccess?.(result)
    } catch (error) {
      // 错误处理
      console.error('Form submission error:', error)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 标题 */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>任务标题</FormLabel>
              <FormControl>
                <Input placeholder="请输入任务标题" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 描述 */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>任务描述</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="请输入任务描述"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 优先级和日期 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>优先级</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择优先级" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CRITICAL">紧急</SelectItem>
                    <SelectItem value="HIGH">高</SelectItem>
                    <SelectItem value="MEDIUM">中</SelectItem>
                    <SelectItem value="LOW">低</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="milestoneId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>关联里程碑</FormLabel>
                <MilestoneSelect
                  projectId={projectId}
                  value={field.value}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 日期范围 */}
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>计划日期</FormLabel>
              <DateRangePicker
                startDate={form.watch('startDate')}
                endDate={form.watch('dueDate')}
                onStartDateChange={(date) => form.setValue('startDate', date)}
                onEndDateChange={(date) => form.setValue('dueDate', date)}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 执行人 */}
        <FormField
          control={form.control}
          name="assigneeIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>执行人</FormLabel>
              <UserSelect
                projectId={projectId}
                value={field.value}
                onChange={field.onChange}
                multiple
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 验收人 */}
        <FormField
          control={form.control}
          name="acceptorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>验收人</FormLabel>
              <UserSelect
                projectId={projectId}
                value={field.value}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 标签 */}
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>标签</FormLabel>
              <TagInput
                projectId={projectId}
                value={field.value}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '保存中...' : isEdit ? '更新任务' : '创建任务'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

---

### 5.7 UI交互规范

#### 5.7.1 设计Token

```typescript
// 设计系统Token定义
export const designTokens = {
  // 颜色系统
  colors: {
    // 主色（非靛蓝）
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',    // 主色调：绿色
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    // 功能色
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    // 中性色
    gray: { /* ... */ },
  },

  // 间距
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
  },

  // 圆角
  radius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },

  // 阴影
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },

  // 字体
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },

  // 字号
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
  },

  // 动画时长
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },

  // 过渡曲线
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
}
```

#### 5.7.2 状态徽章组件

```typescript
// components/common/media/StatusBadge.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-primary-100 text-primary-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

// 任务状态映射
const taskStatusConfig: Record<TaskStatus, { label: string; variant: VariantProps<typeof badgeVariants>['variant'] }> = {
  TODO: { label: '未开始', variant: 'default' },
  IN_PROGRESS: { label: '进行中', variant: 'primary' },
  REVIEW: { label: '待评审', variant: 'warning' },
  TESTING: { label: '测试中', variant: 'info' },
  DONE: { label: '已完成', variant: 'success' },
  CANCELLED: { label: '已取消', variant: 'default' },
  DELAYED: { label: '已延期', variant: 'danger' },
  BLOCKED: { label: '已阻塞', variant: 'danger' },
}

// 优先级映射
const priorityConfig: Record<Priority, { label: string; variant: VariantProps<typeof badgeVariants>['variant'] }> = {
  CRITICAL: { label: '紧急', variant: 'danger' },
  HIGH: { label: '高', variant: 'warning' },
  MEDIUM: { label: '中', variant: 'info' },
  LOW: { label: '低', variant: 'default' },
}

interface StatusBadgeProps {
  status: TaskStatus | ProjectStatus | IssueStatus | RiskStatus
  type?: 'task' | 'project' | 'issue' | 'risk' | 'requirement'
}

export function StatusBadge({ status, type = 'task' }: StatusBadgeProps) {
  const config = type === 'task' ? taskStatusConfig[status as TaskStatus] : { label: status, variant: 'default' }

  return (
    <span className={cn(badgeVariants({ variant: config.variant }))}>
      {config.label}
    </span>
  )
}

interface PriorityBadgeProps {
  priority: Priority
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority]

  return (
    <span className={cn(badgeVariants({ variant: config.variant }))}>
      {config.label}
    </span>
  )
}
```

#### 5.7.3 加载状态组件

```typescript
// components/common/feedback/LoadingState.tsx
import { Skeleton } from '@/components/ui/skeleton'

interface LoadingStateProps {
  type?: 'card' | 'table' | 'list' | 'detail'
  count?: number
}

export function LoadingState({ type = 'card', count = 3 }: LoadingStateProps) {
  if (type === 'table') {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'detail') {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-40" />
      </div>
    )
  }

  // card
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  )
}
```

#### 5.7.4 空状态组件

```typescript
// components/common/data-display/EmptyState.tsx
import { Button } from '@/components/ui/button'
import { FileQuestion, FolderOpen, Search, AlertCircle } from 'lucide-react'

interface EmptyStateProps {
  type?: 'no-data' | 'no-results' | 'error' | 'empty-folder'
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

const defaultContent = {
  'no-data': {
    icon: FolderOpen,
    title: '暂无数据',
    description: '还没有任何数据，点击下方按钮创建',
  },
  'no-results': {
    icon: Search,
    title: '未找到结果',
    description: '尝试调整筛选条件或搜索关键词',
  },
  'error': {
    icon: AlertCircle,
    title: '加载失败',
    description: '数据加载失败，请稍后重试',
  },
  'empty-folder': {
    icon: FileQuestion,
    title: '文件夹为空',
    description: '此文件夹中没有内容',
  },
}

export function EmptyState({
  type = 'no-data',
  title,
  description,
  action
}: EmptyStateProps) {
  const content = defaultContent[type]
  const Icon = content.icon

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">
        {title || content.title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        {description || content.description}
      </p>
      {action && (
        <Button className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

#### 5.7.5 交互反馈规范

```typescript
// hooks/useToast.ts - 消息提示
import { toast } from 'sonner'

export function useFeedback() {
  const showSuccess = (message: string) => {
    toast.success(message)
  }

  const showError = (message: string, error?: Error) => {
    toast.error(message, {
      description: error?.message,
    })
  }

  const showWarning = (message: string) => {
    toast.warning(message)
  }

  const showInfo = (message: string) => {
    toast.info(message)
  }

  const showLoading = (message: string) => {
    return toast.loading(message)
  }

  const dismiss = (id?: string | number) => {
    toast.dismiss(id)
  }

  const confirm = async (
    message: string,
    options?: { title?: string; confirmText?: string; cancelText?: string }
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      // 使用AlertDialog组件
    })
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    dismiss,
    confirm,
  }
}

// 使用示例
function TaskDeleteButton({ task }: { task: Task }) {
  const { showSuccess, showError, confirm } = useFeedback()
  const deleteMutation = useDeleteTask()

  const handleDelete = async () => {
    const confirmed = await confirm(
      `确定要删除任务"${task.title}"吗？此操作不可撤销。`,
      { title: '确认删除', confirmText: '删除' }
    )

    if (!confirmed) return

    try {
      await deleteMutation.mutateAsync(task.id)
      showSuccess('任务已删除')
    } catch (error) {
      showError('删除失败', error as Error)
    }
  }

  return (
    <Button variant="destructive" onClick={handleDelete}>
      删除
    </Button>
  )
}
```

---

### 5.8 前端性能优化

#### 5.8.1 代码分割策略

```typescript
// 动态导入大型组件
import dynamic from 'next/dynamic'

// 富文本编辑器（大型组件）
const RichTextEditor = dynamic(
  () => import('@/components/common/form/RichTextEditor'),
  {
    loading: () => <Skeleton className="h-64" />,
    ssr: false,
  }
)

// 文件预览组件
const FilePreview = dynamic(
  () => import('@/components/common/media/FilePreview'),
  {
    loading: () => <Skeleton className="h-96" />,
  }
)

// 图表组件
const ProgressChart = dynamic(
  () => import('@/components/business/dashboard/ProgressChart'),
  {
    loading: () => <Skeleton className="h-64" />,
  }
)

// AI分析面板
const AIRiskAssessment = dynamic(
  () => import('@/components/business/risk/AIRiskAssessment'),
  {
    loading: () => <Skeleton className="h-48" />,
  }
)
```

#### 5.8.2 图片优化

```typescript
// components/common/media/OptimizedImage.tsx
import Image from 'next/image'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
}

export function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 300,
  className,
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAB//9k="
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  )
}

// 头像组件优化
export function UserAvatar({ user, size = 'md' }: UserAvatarProps) {
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  }

  const pixelSize = sizeMap[size]

  return (
    <div className={cn('relative rounded-full overflow-hidden bg-muted', className)}>
      {user.avatar ? (
        <Image
          src={user.avatar}
          alt={user.name}
          width={pixelSize}
          height={pixelSize}
          className="object-cover"
        />
      ) : (
        <div
          className="flex items-center justify-center bg-primary text-primary-foreground font-medium"
          style={{ width: pixelSize, height: pixelSize }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  )
}
```

#### 5.8.3 虚拟列表

```typescript
// hooks/useVirtualList.ts - 虚拟列表
import { useVirtualizer } from '@tanstack/react-virtual'

interface UseVirtualListOptions<T> {
  items: T[]
  estimateSize?: number
  overscan?: number
}

export function useVirtualList<T>({
  items,
  estimateSize = 50,
  overscan = 5,
}: UseVirtualListOptions<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  })

  return {
    parentRef,
    virtualItems: virtualizer.getVirtualItems(),
    totalSize: virtualizer.getTotalSize(),
    scrollToIndex: virtualizer.scrollToIndex,
  }
}

// 使用示例：任务列表
function VirtualTaskList({ tasks }: { tasks: Task[] }) {
  const { parentRef, virtualItems, totalSize } = useVirtualList({
    items: tasks,
    estimateSize: 80,
  })

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: totalSize, position: 'relative' }}>
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualItem.size,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <TaskCard task={tasks[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### 5.9 前端测试策略

#### 5.9.1 单元测试

```typescript
// __tests__/components/StatusBadge.test.tsx
import { render, screen } from '@testing-library/react'
import { StatusBadge, PriorityBadge } from '@/components/common/media/StatusBadge'

describe('StatusBadge', () => {
  it('renders correct task status label', () => {
    render(<StatusBadge status="IN_PROGRESS" type="task" />)
    expect(screen.getByText('进行中')).toBeInTheDocument()
  })

  it('applies correct variant class', () => {
    const { container } = render(<StatusBadge status="DONE" type="task" />)
    expect(container.firstChild).toHaveClass('bg-green-100')
  })
})

describe('PriorityBadge', () => {
  it('renders critical priority correctly', () => {
    render(<PriorityBadge priority="CRITICAL" />)
    expect(screen.getByText('紧急')).toBeInTheDocument()
  })
})
```

#### 5.9.2 集成测试

```typescript
// __tests__/integration/task-flow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TaskForm } from '@/components/business/task/TaskForm'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Task Creation Flow', () => {
  it('creates a new task successfully', async () => {
    const onSuccess = jest.fn()
    const wrapper = createWrapper()

    render(
      <TaskForm projectId="project-1" onSuccess={onSuccess} />,
      { wrapper }
    )

    // 填写表单
    fireEvent.change(screen.getByLabelText('任务标题'), {
      target: { value: '测试任务' }
    })
    fireEvent.change(screen.getByLabelText('任务描述'), {
      target: { value: '这是一个测试任务' }
    })

    // 选择优先级
    fireEvent.click(screen.getByText('选择优先级'))
    fireEvent.click(screen.getByText('高'))

    // 提交表单
    fireEvent.click(screen.getByText('创建任务'))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('shows validation errors', async () => {
    const wrapper = createWrapper()

    render(<TaskForm projectId="project-1" />, { wrapper })

    // 未填写任何内容直接提交
    fireEvent.click(screen.getByText('创建任务'))

    await waitFor(() => {
      expect(screen.getByText('任务标题至少2个字符')).toBeInTheDocument()
    })
  })
})
```


## 六、数据库设计

### 6.1 数据表清单

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

### 6.2 索引策略

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

### 6.3 新增系统表

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

## 七、API接口设计

### 7.1 统一响应格式

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

### 7.2 错误码标准化定义

#### 7.2.1 错误码命名规范

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

#### 7.2.2 完整错误码表

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

### 7.3 API版本控制

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

### 7.4 速率限制策略

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

### 7.5 核心API列表

| 模块 | 接口 | 方法 | 说明 |
|------|------|------|------|
| **用户管理** | /api/v1/auth/forgot-password | POST | 请求密码重置 (P0) |
| | /api/v1/auth/reset-password | POST | 重置密码 (P0) |
| **任务标签** | /api/v1/tags/list | GET | 标签列表 (P0) |
| | /api/v1/tags/create | POST | 创建标签 (P0) |
| | /api/v1/tasks/[id]/tags | POST | 关联任务标签 (P0) |
| | /api/v1/tasks/[id]/watch | POST | 关注任务 (P1) |
| **需求管理** | /api/v1/requirements/[id]/history | GET | 变更历史 (P1) |
| **AI服务** | /api/v1/ai/risk/assess | POST | AI风险评估 (P1) |
| | /api/v1/ai/review/audit | POST | AI审核评分 (P1) |
| | /api/v1/ai/cache/clear | DELETE | 清除AI缓存 (P1) |
| **文件服务** | /api/v1/files/upload | POST | 文件上传 (P0) |
| | /api/v1/files/[id] | GET | 文件下载 (P0) |
| | /api/v1/files/[id]/preview | GET | 文件预览URL (P0) |
| **邮件服务** | /api/v1/email/templates | GET | 邮件模板列表 (P1) |
| **通知设置** | /api/v1/notifications/preferences | GET/PUT | 通知偏好 (P1) |

---

### 7.6 AI服务接口详细说明

#### 7.6.1 AI风险评估接口

**POST /api/v1/ai/risk/assess**

使用AI Agent分析项目里程碑任务，评估项目风险。

**请求参数：**

```typescript
interface RiskAssessRequest {
  projectId: string           // 项目ID
  milestoneId?: string        // 里程碑ID（可选，不指定则评估整个项目）
  forceRefresh?: boolean      // 是否强制重新评估（跳过缓存）
}
```

**响应示例：**

```typescript
interface RiskAssessResponse {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'  // 风险等级
  score: number               // AI风险评分 (0-100)
  factors: {                 // 风险因素分析
    scheduleRisk: number      // 进度风险评分
    resourceRisk: number      // 资源风险评分
    complexityRisk: number    // 复杂度风险评分
    dependencyRisk: number    // 依赖风险评分
  }
  suggestions: string[]        // AI建议的风险缓解措施
  assessedAt: string          // 评估时间 (ISO8601)
  cacheKey?: string          // 缓存键（用于失效）
}
```

#### 7.6.2 AI审核评分接口

**POST /api/v1/ai/review/audit**

对评审材料进行AI审核，返回内容完整性、逻辑合理性、风险识别三项评分。

**请求参数：**

```typescript
interface ReviewAuditRequest {
  reviewId: string           // 评审ID
  materialIds: string[]       // 评审材料ID列表
  type: 'FEASIBILITY'        // 评审类型
      | 'MILESTONE'
      | 'TEST_PLAN'
      | 'TEST_RELEASE'
      | 'TEST_REPORT'
      | 'INITIAL'
      | 'INAL'
      | 'PHASE'
}
```

**响应示例：**

```typescript
interface ReviewAuditResponse {
  reviewId: string
  aiContentScore: number      // 内容完整性评分 (0-100)
  aiLogicScore: number       // 逻辑合理性评分 (0-100)
  aiRiskScore: number        // 风险识别评分 (0-100，越高越安全)

  issues: {                   // 识别的问题
    content: string[]        // 内容问题
    logic: string[]          // 逻辑问题
    risk: string[]           // 风险提示
  }

  passed: boolean            // 综合判定（三项均≥60分且无严重问题）
  assessedAt: string
}
```

#### 7.6.3 AI缓存清除接口

**DELETE /api/v1/ai/cache/clear**

清除AI响应缓存，强制下次调用重新执行AI分析。

**请求参数：**

```typescript
interface ClearCacheRequest {
  cacheKey?: string           // 指定缓存键（可选）
  type?: 'risk' | 'review'  // 缓存类型（可选）
}
```

**响应示例：**

```typescript
interface ClearCacheResponse {
  cleared: number             // 清除的缓存条数
  message: string
}
```

---

### 7.7 文件服务接口详细说明

#### 7.7.1 文件上传接口

**POST /api/v1/files/upload**

上传文件到系统，返回文件ID和访问URL。

**请求格式：** `multipart/form-data`

```typescript
interface FileUploadRequest {
  file: File                  // 文件对象（form-data字段）
  projectId?: string           // 关联项目（可选）
  taskId?: string              // 关联任务（可选）
  category?: 'document'       // 文件分类
         | 'image'
         | 'video'
         | 'other'
}
```

**响应示例：**

```typescript
interface FileUploadResponse {
  id: string                  // 文件ID
  filename: string             // 原始文件名
  size: number                // 文件大小（字节）
  mimeType: string             // MIME类型
  category: string             // 文件分类

  // 访问URL
  downloadUrl: string           // 下载URL
  previewUrl: string           // 预览URL（如支持）

  // 预览服务信息
  previewService?: {           // 如果支持预览
    type: 'onlyoffice'      // 预览服务类型
          | 'kkfileview'
          | 'native'
    configId: string           // 预览服务配置ID
  }

  uploadedAt: string           // 上传时间
}
```

#### 7.7.2 文件下载接口

**GET /api/v1/files/[id]**

下载文件或获取文件访问信息。

**响应示例：**

```typescript
interface FileDownloadResponse {
  id: string
  filename: string
  size: number
  mimeType: string
  downloadUrl: string         // 带签名的下载URL（临时）
  previewUrl: string           // 带签名的预览URL（临时）
  expiresAt: string           // URL过期时间
}
```

#### 7.7.3 文件预览接口

**GET /api/v1/files/[id]/preview**

获取文件预览URL，系统自动选择最合适的预览服务。

**请求参数：**

```typescript
interface PreviewRequest {
  id: string                  // 文件ID
}
```

**响应示例：**

```typescript
interface PreviewResponse {
  fileId: string
  previewUrl: string           // 预览服务URL（已内嵌认证参数）
  serviceType: string          // 使用的预览服务
  supportedActions: string[]    // 支持的操作（如：edit, download）
  expiresAt: string           // 预览URL过期时间
}
```

**预览服务选择逻辑：**

1. **Office文档** (.docx, .xlsx, .pptx) → OnlyOffice（优先）或 KKFileView
2. **PDF文档** → KKFileView 或原生预览
3. **图片** (jpg, png, gif, webp) → 原生预览
4. **视频** (mp4, webm) → 原生预览（HTML5 Video）
5. **其他格式** → 仅提供下载

---

## 八、安全与权限设计

### 8.1 权限模型

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

### 8.2 敏感操作审计

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

## 九、性能优化策略

### 9.1 查询优化

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

### 9.2 缓存策略

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

### 9.3 AI响应缓存

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

## 十、运维保障

### 10.1 健康检查端点

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

### 10.2 数据备份策略

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

### 10.3 监控指标

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

## 十一、部署方案

### 11.1 Docker Compose 部署

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

### 11.2 环境变量配置

> **统一命名规范**：所有环境变量使用大写字母+下划线分隔

```env
# ========== 应用配置 ==========
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://pm.example.com
NEXT_PUBLIC_APP_NAME="项目管理系统"

# ========== 数据库 ==========
DATABASE_URL="postgresql://user:password@localhost:5432/pm"

# ========== JWT配置 ==========
JWT_SECRET="your-secure-jwt-secret-at-least-32-characters"
JWT_EXPIRES_IN="15m"              # Access Token有效期
JWT_REFRESH_EXPIRES_IN="7d"       # Refresh Token有效期

# ========== OnlyOffice配置 ==========
ONLYOFFICE_URL="http://localhost:8080"
ONLYOFFICE_JWT_SECRET="your-onlyoffice-jwt-secret"
ONLYOFFICE_ENABLED=true

# ========== KKFileView配置 ==========
KKFILEVIEW_URL="http://localhost:8012"
KKFILEVIEW_ENABLED=true

# ========== 文件存储配置 ==========
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=104857600           # 100MB
FILE_SIGN_SECRET="your-file-signing-secret-key"

# ========== AI服务配置 ==========
AI_API_KEY="your-ai-api-key"
AI_BASE_URL="https://ai-gateway.example.com"
AI_MODEL="gpt-4"

# ========== 邮件配置 ==========
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="noreply@example.com"
SMTP_PASS="your-smtp-password"
SMTP_FROM="Project Management <noreply@example.com>"

# ========== 云存储配置（可选） ==========
CLOUD_STORAGE_ENABLED=false
CLOUD_STORAGE_PROVIDER=aliyun     # aliyun / tencent
CLOUD_STORAGE_BUCKET=project-management-files
CLOUD_STORAGE_REGION=cn-hangzhou
CLOUD_STORAGE_ACCESS_KEY=
CLOUD_STORAGE_SECRET_KEY=
```

---

## 十二、实施计划

### 12.1 开发阶段划分

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

### 12.2 测试策略

#### 测试覆盖要求

| 测试类型 | 要求说明 | 覆盖率目标 |
|----------|----------|:----------:|
| 单元测试 | 必须，使用Jest + React Testing Library | **70%** |
| 集成测试 | 必须，关键业务流程必须覆盖 | 关键流程100% |
| E2E测试 | 可选，使用Playwright | 核心场景覆盖 |

```json
// jest.config.js 测试配置
{
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  }
}
```

### 12.3 阶段验收标准

| 验收维度 | 标准 |
|----------|------|
| 功能完成度 | 所有P0功能必须完成，P1功能完成比例：**≥80%** |
| 测试通过率 | 单元测试通过率：**100%** |
| 代码审查 | **必须**（每个PR至少1人审核） |
| 文档更新 | **API文档同步更新** |

#### 阶段验收清单模板

```markdown
## 阶段验收报告

### 基本信息
- 阶段名称：Phase X - XXX模块
- 开发周期：YYYY-MM-DD ~ YYYY-MM-DD
- 开发人员：XXX

### 功能完成情况
| 功能项 | 优先级 | 状态 | 备注 |
|--------|:------:|:----:|------|
| 功能A | P0 | ✅ | |
| 功能B | P1 | ✅ | |
| 功能C | P1 | ⏳ | 待完成 |

### 测试覆盖
- 单元测试覆盖率：XX%
- 集成测试用例数：XX
- E2E测试场景数：XX

### 代码审查
- [ ] 代码已通过Review
- [ ] 无高危安全漏洞
- [ ] 无性能问题告警

### 文档更新
- [ ] API文档已更新
- [ ] 组件文档已更新
- [ ] README已更新

### 验收结论
- [ ] 通过
- [ ] 有条件通过（需补充：XXX）
- [ ] 不通过（原因：XXX）
```

### 12.4 数据库选型确认

| 环境 | 数据库选型 | 说明 |
|------|------------|------|
| 本地开发 | SQLite | 快速开发，无需额外配置 |
| 测试环境 | **PostgreSQL** | 与生产环境一致，避免兼容性问题 |
| 预发布环境 | **PostgreSQL** | 与生产环境一致 |
| 生产环境 | PostgreSQL | 主数据库 |

### 12.5 技术风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| AI服务不稳定 | 高 | 增加缓存层、降级方案 |
| 文件预览服务资源占用大 | 中 | 使用混合方案、按需启动 |
| 并发性能瓶颈 | 中 | 数据库索引优化、缓存策略 |

---

## 附录A：权限矩阵详细说明

### A.1 项目管理员与项目所有者权限边界

| 操作 | PROJECT_ADMIN | PROJECT_OWNER | 说明 |
|------|:-------------:|:-------------:|------|
| 项目成员管理 | ✅ 可 | ✅ 可 | 都可以管理成员 |
| 需求审核 | ❌ 否 | ✅ 可 | 仅PROJECT_OWNER可审核需求 |
| 项目删除 | ❌ 否 | ✅ 可* | PROJECT_OWNER可删除自己Owner的项目，需二次确认 |
| 预算修改 | ✅ 可 | ✅ 可 | 都可修改预算 |
| 角色转换 | ❌ 否 | ❌ 否 | 角色由系统管理员分配，不可自行转换 |

### A.2 补充权限矩阵

```typescript
const rolePermissions = {
  PROJECT_ADMIN: {
    projects: ['create', 'read', 'update'],
    members: ['read', 'create', 'update', 'delete'],
    tasks: ['create', 'read', 'update', 'delete'],
    requirements: ['create', 'read', 'update'],  // 无审核权限
    reviews: ['create', 'read', 'update', 'delete'],
    risks: ['create', 'read', 'update', 'delete'],
  },
  PROJECT_OWNER: {
    projects: ['create', 'read', 'update', 'delete'],  // 含删除权限
    members: ['read', 'create', 'update', 'delete'],
    tasks: ['create', 'read', 'update', 'delete'],
    requirements: ['create', 'read', 'update', 'approve'],  // 含审核权限
    reviews: ['create', 'read', 'update', 'delete'],
    risks: ['create', 'read', 'update', 'delete'],
  },
}
```

### A.3 邮件系统管理员权限范围

| 操作 | 是否允许 | 备注 |
|------|:--------:|------|
| 查看所有邮件配置 | ✅ 是 | 可查看所有邮件服务商配置 |
| 修改邮件配置 | ✅ 是 | 可添加/修改/删除邮件配置 |
| 查看邮件发送日志 | ✅ 是 | 可查看所有邮件发送记录 |
| 多租户隔离 | ❌ 否 | 当前版本为单租户，多租户为P2功能 |

---

## 附录B：V3.0更新日志

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| V1.0 | 2024-01 | 初版技术方案 |
| V2.0 | 2024-01 | 补充P0/P1功能，覆盖率100% |
| V3.0 | 2024-01 | 合并FINAL和OPTIMIZED文档，统一技术规范 |
| V3.1 | 2024-01 | 澄清问题答复合并，补充：技术栈版本确认、AI服务配置、通知机制、文件服务详细配置、权限矩阵、测试策略、验收标准 |
