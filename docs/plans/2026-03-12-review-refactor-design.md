# 评审管理功能重构设计方案

## 概述

本文档描述评审管理模块的重构设计方案，将评审创建流程从单一对话框改为多步骤向导式表单，并新增评审组管理功能。

---

## 一、设计目标

| 目标 | 描述 |
|------|------|
| 统一创建流程 | 多步骤向导式表单，提供更好的用户体验 |
| 完善参与者管理 | 支持主持人、评审人、观察者角色 |
| 灵活的评审人选择 | 支持项目成员、系统用户、评审组三种选择方式 |
| 评审组功能 | 可复用的评审人组合，支持快速添加预定义团队 |
| 材料上传集成 | 拖拽上传、多文件、预览支持 |

---

## 二、向导步骤设计

```
步骤1: 基本信息 → 标题、类型、描述、计划时间
步骤2: 主持人/评审人 → 从项目成员/系统用户/评审组中选择
步骤3: 评审材料 → 上传文件、支持预览
步骤4: 确认提交 → 预览所有信息，提交创建
```

---

## 三、组件架构

```
src/components/reviews/
├── ReviewWizard.tsx          # 主向导容器组件
├── steps/
│   ├── BasicInfoStep.tsx     # 步骤1: 基本信息
│   ├── ParticipantsStep.tsx  # 步骤2: 参与者选择
│   ├── MaterialsStep.tsx     # 步骤3: 材料上传
│   └── ConfirmStep.tsx       # 步骤4: 确认提交
├── ParticipantSelector.tsx   # 参与者选择器
├── MaterialUploader.tsx      # 材料上传组件（重构）
└── ReviewTemplateSelect.tsx  # 模板选择组件

src/app/(main)/review-groups/
└── page.tsx                  # 评审组管理页面
```

---

## 四、数据库Schema设计

### 4.1 修改现有枚举

```prisma
enum ReviewParticipantRole {
  MODERATOR  // 评审主持人 - 新增
  REVIEWER   // 评审人
  OBSERVER   // 观察者
  SECRETARY  // 记录员
}
```

### 4.2 新增评审组模型

```prisma
// 评审组 - 可复用的评审人组合
model ReviewGroup {
  id          String   @id @default(cuid())
  name        String
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String

  members     ReviewGroupMember[]

  @@map("review_groups")
}

// 评审组成员
model ReviewGroupMember {
  id        String   @id @default(cuid())
  groupId   String
  userId    String
  role      ReviewParticipantRole @default(REVIEWER)
  createdAt DateTime @default(now())

  group     ReviewGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
  @@map("review_group_members")
}
```

### 4.3 User模型添加关系

```prisma
model User {
  // ... 现有字段
  reviewGroupMembers  ReviewGroupMember[]
}
```

---

## 五、API设计

### 5.1 评审组API

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/v1/review-groups` | GET | 获取评审组列表 |
| `/api/v1/review-groups` | POST | 创建评审组 |
| `/api/v1/review-groups/[id]` | GET | 获取评审组详情 |
| `/api/v1/review-groups/[id]` | PUT | 更新评审组 |
| `/api/v1/review-groups/[id]` | DELETE | 删除评审组 |
| `/api/v1/review-groups/[id]/members` | POST | 添加成员 |
| `/api/v1/review-groups/[id]/members/[userId]` | DELETE | 移除成员 |

### 5.2 增强创建评审API

```typescript
// POST /api/v1/reviews 请求体
{
  projectId: string
  title: string
  description?: string
  typeId: string
  scheduledAt?: string  // ISO格式
  participants: Array<{
    userId: string
    role: 'MODERATOR' | 'REVIEWER' | 'OBSERVER' | 'SECRETARY'
  }>
  materials: Array<{
    fileId: string
    fileName: string
    fileType: string
    fileSize: number
  }>
}
```

---

## 六、前端组件详细设计

### 6.1 主向导组件 ReviewWizard.tsx

```typescript
interface ReviewWizardProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface WizardData {
  // 步骤1: 基本信息
  title: string
  description: string
  typeId: string
  scheduledAt: string

  // 步骤2: 参与者
  moderatorId: string | null
  reviewers: string[]
  observers: string[]

  // 步骤3: 材料
  materials: MaterialFile[]
}
```

### 6.2 步骤指示器UI

```
┌─────────────────────────────────────────────────────────┐
│  ①基本信息 ──→ ②参与者 ──→ ③材料 ──→ ④确认              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              当前步骤内容区域                            │
│                                                         │
│               [上一步]    [下一步/提交]                  │
└─────────────────────────────────────────────────────────┘
```

### 6.3 参与者选择组件 ParticipantsStep.tsx

**三种选择方式**：

| 方式 | 数据来源 | 特点 |
|------|---------|------|
| 项目成员 | `/api/v1/projects/[id]/members` | 快速选择熟悉项目的成员 |
| 系统用户 | `/api/v1/users` | 搜索所有注册用户，支持跨项目邀请专家 |
| 评审组 | `/api/v1/review-groups` | 一键添加预定义的评审团队 |

**UI结构**：
- 选择方式切换Tab
- 主持人选择（单选）
- 评审人选择（多选，支持搜索）
- 观察者选择（多选，可选）
- 已选人员标签显示

### 6.4 材料上传组件 MaterialsStep.tsx

**功能特性**：
- 文件拖拽上传
- 多文件批量上传
- 上传进度显示
- 文件类型识别
- 支持预览（集成OnlyOffice/KKFileView）

**UI结构**：
- 拖拽区域
- 已上传文件列表
- 预览/删除操作

### 6.5 确认步骤组件 ConfirmStep.tsx

**功能**：汇总展示所有步骤信息，用户确认后提交创建

**UI结构**：
- 基本信息汇总（可点击修改）
- 参与人员汇总（可点击修改）
- 评审材料汇总（可点击修改）
- 确认创建按钮

---

## 七、实施计划

### 阶段1: 数据库与API（预计1天）

1. 修改`ReviewParticipantRole`枚举，添加`MODERATOR`
2. 创建`ReviewGroup`和`ReviewGroupMember`模型
3. 运行数据库迁移
4. 实现评审组CRUD API
5. 增强创建评审API支持参与者和材料

### 阶段2: 向导组件开发（预计2天）

1. 创建`ReviewWizard`主组件
2. 实现`BasicInfoStep`组件
3. 实现`ParticipantsStep`组件
4. 实现`MaterialsStep`组件
5. 实现`ConfirmStep`组件

### 阶段3: 参与者选择器（预计1天）

1. 创建`ParticipantSelector`组件
2. 实现项目成员选择
3. 实现系统用户搜索选择
4. 实现评审组选择集成

### 阶段4: 材料上传重构（预计1天）

1. 重构`MaterialUploader`组件
2. 集成拖拽上传
3. 集成文件预览服务

### 阶段5: 评审组管理页面（预计0.5天）

1. 创建评审组列表页面
2. 创建评审组表单组件
3. 实现成员管理

### 阶段6: 集成测试（预计0.5天）

1. 端到端测试向导流程
2. 测试各种边界情况
3. 性能优化

---

## 八、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 大文件上传超时 | 用户体验差 | 添加上传进度条，支持断点续传 |
| 评审组数据量大 | 选择器卡顿 | 实现分页和虚拟滚动 |
| 权限控制复杂 | 数据安全 | 后端严格校验用户权限 |

---

## 九、验收标准

- [ ] 可通过向导流程创建评审
- [ ] 主持人、评审人、观察者可正确选择和保存
- [ ] 支持从项目成员、系统用户、评审组中选择评审人
- [ ] 评审组可创建、编辑、删除
- [ ] 材料可上传、预览、删除
- [ ] 创建评审后数据完整无误