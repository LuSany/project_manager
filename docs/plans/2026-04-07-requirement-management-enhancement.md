# 需求管理功能改进设计方案

> 参考文档：腾讯云开发者社区《如何开发研发项目管理中的需求管理板块？》
> 创建日期：2026-04-07
> 状态：待审核

---

## 一、背景与目标

### 1.1 当前问题

当前需求管理功能存在以下不足：
- 仅支持列表视图，无法直观展示需求进度
- 状态流转简单，缺乏规范的审批流程
- 字段信息不足，缺少业务线、标签、工时等关键信息
- 无变更管理机制，范围/交期变更无法追溯

### 1.2 改进目标

1. **看板视图**：实现拖拽式 Kanban，直观展示需求状态
2. **流程规范化**：完善状态流转、审批机制、变更管理
3. **字段完善**：增加业务线、标签、附件、预估工时等字段

### 1.3 实施策略

采用**渐进式改进**策略，分三阶段实施：
- P1：字段完善（基础）
- P2：看板视图（交互）
- P3：流程规范化（流程）

---

## 二、阶段一 (P1)：字段完善

### 2.1 数据库改动

#### 2.1.1 扩展 `requirements` 表

新增字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `assigneeId` | String? | 否 | 指派人 ID，关联 users 表 |
| `reporterId` | String | 是 | 提出人 ID，默认为创建人 |
| `dueDate` | DateTime? | 否 | 截止日期 |
| `estimateHours` | Float? | 否 | 预估工时（小时） |
| `actualHours` | Float? | 否 | 实际工时（小时） |
| `businessLine` | String? | 否 | 业务线/产品线 |
| `tags` | String[] | 否 | 标签数组 |

#### 2.1.2 Prisma Schema 变更

```prisma
model requirements {
  id                      String                    @id
  title                   String
  description             String?
  status                  RequirementStatus         @default(PENDING)
  priority                RequirementPriority       @default(MEDIUM)
  projectId               String
  assigneeId              String?                   // 新增
  reporterId              String                    // 新增
  dueDate                 DateTime?                 // 新增
  estimateHours           Float?                    // 新增
  actualHours             Float?                    // 新增
  businessLine            String?                   // 新增
  tags                    String[]                  // 新增
  reviewedBy              String?
  reviewedAt              DateTime?
  rejectReason            String?
  createdAt               DateTime                  @default(now())
  updatedAt               DateTime
  
  // 关联关系
  assignee                users?                    @relation("RequirementAssignee", fields: [assigneeId], references: [id])
  reporter                users                     @relation("RequirementReporter", fields: [reporterId], references: [id])
  issues                  issues[]
  proposals               proposals[]
  requirement_acceptances requirement_acceptances[]
  requirement_discussions requirement_discussions[]
  requirement_history     requirement_history[]
  requirement_impacts     requirement_impacts[]
  projects                projects                  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  users                   users?                    @relation(fields: [reviewedBy], references: [id])

  @@index([assigneeId])
  @@index([reporterId])
  @@index([businessLine])
  @@index([priority])
  @@index([projectId])
  @@index([reviewedBy])
  @@index([status])
}
```

### 2.2 API 改动

#### 2.2.1 扩展创建/更新接口

**POST /api/v1/requirements**

请求体扩展：

```typescript
{
  title: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  projectId: string;
  // 新增字段
  assigneeId?: string;
  reporterId?: string;      // 可选，默认当前用户
  dueDate?: string;         // ISO 日期字符串
  estimateHours?: number;
  businessLine?: string;
  tags?: string[];
}
```

#### 2.2.2 扩展列表查询

**GET /api/v1/requirements**

新增查询参数：

| 参数 | 说明 |
|------|------|
| `businessLine` | 按业务线筛选 |
| `tags` | 按标签筛选（逗号分隔） |
| `assigneeId` | 按指派人筛选 |
| `reporterId` | 按提出人筛选 |
| `dueDateFrom` | 截止日期起 |
| `dueDateTo` | 截止日期止 |

### 2.3 前端改动

#### 2.3.1 新建/编辑表单

文件：`src/app/projects/[id]/requirements/new/page.tsx`

新增表单字段：
- 指派人（用户选择器）
- 截止日期（日期选择器）
- 预估工时（数字输入）
- 业务线（文本输入）
- 标签（多选标签输入）

#### 2.3.2 列表页筛选

文件：`src/app/projects/[id]/requirements/page.tsx`

新增筛选项：
- 业务线下拉筛选
- 标签多选筛选
- 指派人筛选

### 2.4 验收标准

- [ ] 创建需求时可填写所有新字段
- [ ] 编辑需求时可修改所有新字段
- [ ] 列表页可按新字段筛选
- [ ] 存量数据迁移正常，无报错

---

## 三、阶段二 (P2)：看板视图

### 3.1 数据库改动

#### 3.1.1 新增看板配置表

```prisma
model requirement_board_configs {
  id        String   @id
  projectId String   @unique
  columns   Json     // [{id, title, status, color, wipLimit, order}]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  projects  projects  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@index([projectId])
}
```

#### 3.1.2 列配置 JSON 结构

```typescript
interface BoardColumn {
  id: string;           // 列唯一标识
  title: string;        // 列标题（如：待评审、开发中）
  status: string;       // 映射的状态值
  color: string;        // 列颜色（hex）
  wipLimit?: number;    // WIP 限制（可选）
  order: number;        // 排序
}
```

#### 3.1.3 扩展 projects 表关联

```prisma
model projects {
  // ... 现有字段
  requirement_board_configs requirement_board_configs?
}
```

### 3.2 API 改动

#### 3.2.1 看板配置接口

**GET /api/v1/projects/[id]/board-config**

响应：
```typescript
{
  success: true;
  data: {
    id: string;
    projectId: string;
    columns: BoardColumn[];
  }
}
```

**PUT /api/v1/projects/[id]/board-config**

请求体：
```typescript
{
  columns: BoardColumn[];
}
```

#### 3.2.2 状态变更接口

**POST /api/v1/requirements/[id]/change-status**

请求体：
```typescript
{
  toStatus: string;
  comment?: string;
}
```

功能：
- 更新需求状态
- 记录变更历史
- 发送通知（可选）

### 3.3 前端改动

#### 3.3.1 新增看板页面

路由：`/projects/[id]/requirements/board`

文件结构：
```
src/app/projects/[id]/requirements/board/
├── page.tsx                    # 看板页面入口
├── components/
│   ├── Board.tsx               # 看板容器
│   ├── Column.tsx              # 看板列
│   ├── Card.tsx                # 需求卡片
│   └── ColumnConfigDialog.tsx  # 列配置弹窗
```

#### 3.3.2 拖拽实现

使用 `@dnd-kit/core`（项目已安装）：

```typescript
// 核心拖拽逻辑
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';

function Board() {
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    
    // 更新状态
    await fetch(`/api/v1/requirements/${active.id}/change-status`, {
      method: 'POST',
      body: JSON.stringify({
        toStatus: over.id,
        comment: '通过看板拖拽变更'
      })
    });
  };
  
  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
      {/* 列和卡片 */}
    </DndContext>
  );
}
```

#### 3.3.3 看板卡片信息

卡片显示：
- 标题
- 优先级标签
- 指派人头像
- 截止日期
- 预估工时

### 3.4 默认看板配置

新项目创建时自动生成默认配置：

```typescript
const DEFAULT_BOARD_COLUMNS: BoardColumn[] = [
  { id: 'pending', title: '待评审', status: 'PENDING', color: '#FFA940', order: 0 },
  { id: 'approved', title: '已批准', status: 'APPROVED', color: '#1890FF', order: 1 },
  { id: 'in_progress', title: '开发中', status: 'IN_PROGRESS', color: '#52C41A', order: 2 },
  { id: 'completed', title: '已完成', status: 'COMPLETED', color: '#8C8C8C', order: 3 },
];
```

### 3.5 验收标准

- [ ] 看板页面正常渲染，显示各列需求卡片
- [ ] 拖拽卡片可变更状态，后端数据同步更新
- [ ] 项目管理员可自定义列配置（添加、删除、重命名、排序）
- [ ] 状态变更记录到历史表
- [ ] 支持按指派人、标签、优先级筛选

---

## 四、阶段三 (P3)：流程规范化

### 4.1 数据库改动

#### 4.1.1 状态枚举扩展

```prisma
enum RequirementStatus {
  DRAFT        // 草稿
  PENDING      // 待评审
  APPROVED     // 已批准（待排期）
  SCHEDULED    // 已排期
  IN_PROGRESS  // 开发中
  TESTING      // 测试中
  ACCEPTANCE   // 待验收
  COMPLETED    // 已完成
  REJECTED     // 已拒绝
  CANCELLED    // 已取消
}
```

#### 4.1.2 新增需求类型表

```prisma
model requirement_types {
  id            String              @id
  projectId     String
  name          String              // 类型名称
  description   String?
  reviewerRoles ProjectMemberRole[] // 可评审角色
  isDefault     Boolean             @default(false)
  isActive      Boolean             @default(true)
  order         Int                 @default(0)
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
  
  projects      projects            @relation(fields: [projectId], references: [id], onDelete: Cascade)
  requirements  requirements[]
  
  @@unique([projectId, name])
  @@index([projectId])
}
```

#### 4.1.3 新增评审配置表

```prisma
model requirement_settings {
  id                   String              @id
  projectId            String              @unique
  defaultReviewerRoles ProjectMemberRole[] // 默认评审角色
  requireReviewerCount Int                 @default(1) // 需要几人评审通过
  allowSelfApprove     Boolean             @default(false) // 是否允许自审
  createdAt            DateTime            @default(now())
  updatedAt            DateTime            @updatedAt
  
  projects             projects            @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@index([projectId])
}
```

#### 4.1.4 新增变更单表

```prisma
model requirement_changes {
  id              String              @id
  requirementId   String
  changeType      RequirementChangeType
  reason          String              // 变更原因
  impact          String?             // 影响范围
  proposedData    Json?               // 提议的新数据
  status          ChangeRequestStatus @default(PENDING)
  proposedById    String              // 申请人
  reviewedById    String?             // 审批人
  reviewedAt      DateTime?           // 审批时间
  reviewComment   String?             // 审批意见
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  requirement     requirements        @relation(fields: [requirementId], references: [id], onDelete: Cascade)
  proposedBy      users               @relation("ChangeProposedBy", fields: [proposedById], references: [id])
  reviewedBy      users?              @relation("ChangeReviewedBy", fields: [reviewedById], references: [id])
  
  @@index([requirementId])
  @@index([status])
  @@index([proposedById])
}

enum RequirementChangeType {
  SCOPE_CHANGE    // 范围变更
  DATE_CHANGE     // 日期变更
  PRIORITY_CHANGE // 优先级变更
  STATUS_CHANGE   // 状态回退
}

enum ChangeRequestStatus {
  PENDING   // 待审批
  APPROVED  // 已批准
  REJECTED  // 已拒绝
  CANCELLED // 已取消
}
```

#### 4.1.5 扩展需求表关联

```prisma
model requirements {
  // ... 现有字段
  typeId          String?             // 新增：需求类型
  
  // 关联关系
  type            requirement_types?  @relation(fields: [typeId], references: [id])
  changes         requirement_changes[]
}
```

#### 4.1.6 扩展 users 表关联

```prisma
model users {
  // ... 现有字段
  requirementAssignees   requirements[]        @relation("RequirementAssignee")
  requirementReporters   requirements[]        @relation("RequirementReporter")
  proposedChanges        requirement_changes[] @relation("ChangeProposedBy")
  reviewedChanges        requirement_changes[] @relation("ChangeReviewedBy")
}
```

### 4.2 状态流转规则

#### 4.2.1 状态流转矩阵

| 当前状态 | 可流转到 | 触发操作 | 权限要求 |
|----------|----------|----------|----------|
| DRAFT | PENDING | 提交评审 | 创建人或指派人 |
| PENDING | APPROVED | 审批通过 | 评审角色 |
| PENDING | REJECTED | 审批拒绝 | 评审角色 |
| APPROVED | SCHEDULED | 排期指派 | 项目管理员 |
| SCHEDULED | IN_PROGRESS | 开始开发 | 指派人 |
| IN_PROGRESS | TESTING | 提交测试 | 指派人 |
| TESTING | ACCEPTANCE | 测试通过 | 测试人员 |
| TESTING | IN_PROGRESS | 测试失败 | 测试人员 |
| ACCEPTANCE | COMPLETED | 验收通过 | 提出人或评审角色 |
| ACCEPTANCE | IN_PROGRESS | 验收失败 | 提出人或评审角色 |
| 任意 | CANCELLED | 取消需求 | 项目管理员 |
| REJECTED | DRAFT | 重新编辑 | 创建人 |

#### 4.2.2 状态流转实现

```typescript
// 状态机定义
const STATE_TRANSITIONS: Record<RequirementStatus, RequirementStatus[]> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['SCHEDULED', 'CANCELLED'],
  SCHEDULED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['TESTING', 'CANCELLED'],
  TESTING: ['ACCEPTANCE', 'IN_PROGRESS'],
  ACCEPTANCE: ['COMPLETED', 'IN_PROGRESS'],
  COMPLETED: [],
  REJECTED: ['DRAFT', 'CANCELLED'],
  CANCELLED: [],
};

function canTransition(from: RequirementStatus, to: RequirementStatus): boolean {
  return STATE_TRANSITIONS[from]?.includes(to) ?? false;
}
```

### 4.3 评审权限逻辑

#### 4.3.1 权限校验流程

```
1. 获取需求的需求类型 (typeId)
2. 若有类型，检查类型的 reviewerRoles
3. 若无类型或类型无配置，使用项目的 defaultReviewerRoles
4. 若项目无配置，使用系统默认：[PROJECT_OWNER, PROJECT_ADMIN]
5. 检查当前用户在项目中的角色是否在允许的角色列表中
```

#### 4.3.2 权限校验代码

```typescript
async function canReviewRequirement(
  userId: string,
  requirementId: string
): Promise<boolean> {
  const requirement = await db.requirements.findUnique({
    where: { id: requirementId },
    include: {
      type: true,
      projects: {
        include: {
          requirement_settings: true,
          project_members: { where: { userId } }
        }
      }
    }
  });
  
  if (!requirement) return false;
  
  // 获取用户在项目中的角色
  const member = requirement.projects.project_members[0];
  if (!member) return false;
  
  // 确定评审角色列表
  let reviewerRoles: ProjectMemberRole[] = [];
  
  if (requirement.type?.reviewerRoles?.length) {
    // 类型配置
    reviewerRoles = requirement.type.reviewerRoles;
  } else if (requirement.projects.requirement_settings?.defaultReviewerRoles?.length) {
    // 项目配置
    reviewerRoles = requirement.projects.requirement_settings.defaultReviewerRoles;
  } else {
    // 系统默认
    reviewerRoles = ['PROJECT_OWNER', 'PROJECT_ADMIN'];
  }
  
  return reviewerRoles.includes(member.role);
}
```

### 4.4 API 改动

#### 4.4.1 评审相关接口

**POST /api/v1/requirements/[id]/submit**
- 提交评审（DRAFT → PENDING）

**POST /api/v1/requirements/[id]/approve**
- 审批通过（PENDING → APPROVED）
- 校验评审权限

**POST /api/v1/requirements/[id]/reject**
- 审批拒绝（PENDING → REJECTED）
- 校验评审权限
- 请求体：`{ reason: string }`

#### 4.4.2 变更单接口

**POST /api/v1/requirements/[id]/changes**
- 创建变更申请
- 请求体：
```typescript
{
  changeType: 'SCOPE_CHANGE' | 'DATE_CHANGE' | 'PRIORITY_CHANGE';
  reason: string;
  impact?: string;
  proposedData?: object; // 提议的新值
}
```

**GET /api/v1/requirements/[id]/changes**
- 获取变更历史列表

**PUT /api/v1/requirement-changes/[id]/review**
- 审批变更申请
- 请求体：
```typescript
{
  approved: boolean;
  comment?: string;
}
```

#### 4.4.3 需求类型接口

**GET /api/v1/projects/[id]/requirement-types**
- 获取项目的需求类型列表

**POST /api/v1/projects/[id]/requirement-types**
- 创建需求类型
- 请求体：
```typescript
{
  name: string;
  description?: string;
  reviewerRoles: ProjectMemberRole[];
  isDefault?: boolean;
}
```

**PUT /api/v1/projects/[id]/requirement-types/[typeId]**
- 更新需求类型

**DELETE /api/v1/projects/[id]/requirement-types/[typeId]**
- 删除需求类型

#### 4.4.4 评审配置接口

**GET /api/v1/projects/[id]/requirement-settings**
- 获取评审配置

**PUT /api/v1/projects/[id]/requirement-settings**
- 更新评审配置
- 请求体：
```typescript
{
  defaultReviewerRoles: ProjectMemberRole[];
  requireReviewerCount: number;
  allowSelfApprove: boolean;
}
```

### 4.5 前端改动

#### 4.5.1 新增页面/组件

```
src/app/projects/[id]/settings/
├── requirement-types/
│   └── page.tsx              # 需求类型管理
└── requirement-settings/
    └── page.tsx              # 评审配置

src/app/projects/[id]/requirements/[reqId]/
├── changes/
│   └── page.tsx              # 变更记录页面
└── components/
    ├── StatusFlowButtons.tsx # 状态操作按钮
    ├── ApproveDialog.tsx     # 审批弹窗
    ├── RejectDialog.tsx      # 拒绝弹窗
    └── ChangeRequestDialog.tsx # 变更申请弹窗
```

#### 4.5.2 需求详情页改造

- 显示当前状态及可执行操作
- 根据用户权限显示/隐藏操作按钮
- 状态变更时弹出确认/填写原因
- 变更申请入口

### 4.6 数据迁移

#### 4.6.1 状态迁移映射

```typescript
const STATUS_MIGRATION_MAP = {
  'PENDING': 'PENDING',      // 保持不变
  'APPROVED': 'APPROVED',    // 保持不变
  'REJECTED': 'REJECTED',    // 保持不变
  'IN_PROGRESS': 'IN_PROGRESS', // 保持不变
  'COMPLETED': 'COMPLETED',  // 保持不变
};
```

#### 4.6.2 迁移脚本

```sql
-- 1. 添加新字段
ALTER TABLE requirements ADD COLUMN "typeId" TEXT;
ALTER TABLE requirements ADD COLUMN "assigneeId" TEXT;
ALTER TABLE requirements ADD COLUMN "reporterId" TEXT NOT NULL DEFAULT '';
ALTER TABLE requirements ADD COLUMN "dueDate" TIMESTAMP;
ALTER TABLE requirements ADD COLUMN "estimateHours" FLOAT;
ALTER TABLE requirements ADD COLUMN "actualHours" FLOAT;
ALTER TABLE requirements ADD COLUMN "businessLine" TEXT;
ALTER TABLE requirements ADD COLUMN "tags" TEXT[] DEFAULT '{}';

-- 2. 迁移 reporterId（设置为创建人）
UPDATE requirements SET "reporterId" = "reviewedById" WHERE "reporterId" = '';
-- 如果 reviewedById 为空，需要从 history 表获取创建人

-- 3. 创建新表
-- (由 Prisma migrate 处理)
```

### 4.7 验收标准

- [ ] 状态按规则流转，不可跳跃
- [ ] 评审权限正确校验（类型配置 > 项目配置 > 系统默认）
- [ ] 变更申请流程完整（申请 → 审批 → 生效）
- [ ] 历史记录完整可追溯
- [ ] 存量数据迁移无报错
- [ ] 所有 API 单元测试通过

---

## 五、实施计划

### 5.1 时间安排

| 阶段 | 任务 | 预估时间 | 依赖 |
|------|------|----------|------|
| P1 | 数据库 Schema 变更 + 迁移 | 0.5 天 | - |
| P1 | API 扩展 | 0.5 天 | Schema |
| P1 | 前端表单改造 | 0.5 天 | API |
| P1 | 测试 + 修复 | 0.5 天 | 全部 |
| **P1 小计** | | **2 天** | |
| P2 | 看板配置 API | 0.5 天 | P1 |
| P2 | 看板前端组件 | 1.5 天 | API |
| P2 | 拖拽交互 + 状态同步 | 0.5 天 | 组件 |
| P2 | 测试 + 修复 | 0.5 天 | 全部 |
| **P2 小计** | | **3 天** | |
| P3 | 状态扩展 + 迁移 | 0.5 天 | P1, P2 |
| P3 | 评审权限系统 | 1 天 | Schema |
| P3 | 变更管理功能 | 1 天 | 权限 |
| P3 | 前端流程交互 | 1 天 | API |
| P3 | 测试 + 修复 | 0.5 天 | 全部 |
| **P3 小计** | | **4 天** | |

**总计：9 天**

### 5.2 里程碑

| 里程碑 | 内容 | 预期交付 |
|--------|------|----------|
| M1 | P1 完成，可部署 | 第 2 天 |
| M2 | P2 完成，可部署 | 第 5 天 |
| M3 | P3 完成，全功能上线 | 第 9 天 |

---

## 六、风险与应对

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|----------|
| 数据迁移失败 | 中 | 高 | 先备份，写回滚脚本 |
| 状态扩展影响现有流程 | 中 | 中 | 保持向后兼容，渐进迁移 |
| 评审权限逻辑复杂 | 低 | 中 | 充分测试，写单元测试 |
| 前端拖拽性能问题 | 低 | 低 | 虚拟列表，懒加载 |

---

## 七、附录

### 7.1 现有角色说明

```prisma
enum ProjectMemberRole {
  PROJECT_OWNER    // 项目所有者
  PROJECT_ADMIN    // 项目管理员
  PROJECT_MEMBER   // 项目成员
  PROJECT_DIRECTOR // 项目主管
}
```

### 7.2 系统默认评审角色

```typescript
const SYSTEM_DEFAULT_REVIEWER_ROLES: ProjectMemberRole[] = [
  'PROJECT_OWNER',
  'PROJECT_ADMIN'
];
```

### 7.3 参考资源

- 腾讯云开发者社区：《如何开发研发项目管理中的需求管理板块？》
- 项目现有代码：`src/app/projects/[id]/requirements/`
- Prisma Schema：`prisma/schema.prisma`