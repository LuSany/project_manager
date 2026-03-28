# 任务功能增强设计文档

**日期**: 2026-03-28
**状态**: 已确认

---

## 概述

本文档描述三个任务功能增强的设计方案：

1. 评论数据持久化
2. 子任务负责人支持
3. 任务验收流程

---

## 1. 评论持久化

### 1.1 数据模型

```prisma
model task_comments {
  id        String   @id
  taskId    String
  userId    String
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime
  tasks     tasks    @relation(fields: [taskId], references: [id], onDelete: Cascade)
  users     users    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@index([userId])
}
```

**设计决策**：

- 不支持回复功能（无 parentId），保持简单
- 支持删除（仅作者可删除自己的评论）

### 1.2 API 设计

| 方法   | 路径                                      | 功能         | 请求体        | 返回                           |
| ------ | ----------------------------------------- | ------------ | ------------- | ------------------------------ |
| GET    | `/api/v1/tasks/[id]/comments`             | 获取评论列表 | -             | `{ success, data: Comment[] }` |
| POST   | `/api/v1/tasks/[id]/comments`             | 创建评论     | `{ content }` | `{ success, data: Comment }`   |
| DELETE | `/api/v1/tasks/[id]/comments/[commentId]` | 删除评论     | -             | `{ success }`                  |

**权限**：

- 评论：任务负责人、项目成员、验收人
- 删除：仅作者可删除自己的评论

### 1.3 UI 改造

**CommentsTab**：

- 移除"预览状态"提示
- 评论输入框 + 提交按钮
- 评论列表：头像、姓名、时间、内容、删除按钮（仅作者）
- 空状态提示"暂无评论"

---

## 2. 子任务负责人

### 2.1 数据模型

```prisma
model subtasks {
  id          String     @id
  title       String
  description String?
  completed   Boolean    @default(false)
  taskId      String
  assigneeId  String?    // 新增：负责人ID
  parentId    String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime
  users       users?     @relation(fields: [assigneeId], references: [id]) // 新增
  subtasks    subtasks?  @relation("subtasksTosubtasks", fields: [parentId], references: [id], onDelete: Cascade)
  other_subtasks subtasks[] @relation("subtasksTosubtasks")
  tasks       tasks      @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([assigneeId]) // 新增
  @@index([completed])
  @@index([parentId])
  @@index([taskId])
}
```

### 2.2 API 设计

| 方法 | 路径                                      | 功能       | 请求体                                              | 返回                         |
| ---- | ----------------------------------------- | ---------- | --------------------------------------------------- | ---------------------------- |
| POST | `/api/v1/tasks/[id]/subtasks`             | 创建子任务 | `{ title, description?, assigneeId? }`              | `{ success, data: SubTask }` |
| PUT  | `/api/v1/tasks/[id]/subtasks/[subtaskId]` | 更新子任务 | `{ title?, description?, completed?, assigneeId? }` | `{ success, data: SubTask }` |

### 2.3 UI 改造

**SubTaskList**：

- 创建子任务时：负责人选择下拉框（项目成员列表）
- 子任务项：显示负责人头像和姓名
- 编辑模式：可修改负责人

---

## 3. 任务验收流程

### 3.1 数据模型

```prisma
model task_acceptances {
  id          String           @id
  taskId      String
  acceptorId  String           // 验收人ID
  requesterId String           // 发起验收的任务负责人ID
  result      AcceptanceResult @default(PENDING) // PENDING/PASSED/FAILED
  notes       String?          // 验收意见
  createdAt   DateTime         @default(now())
  updatedAt   DateTime
  tasks       tasks            @relation(fields: [taskId], references: [id], onDelete: Cascade)
  users_task_acceptances_acceptorIdTousers   users @relation("acceptorId", fields: [acceptorId], references: [id])
  users_task_acceptances_requesterIdTousers  users @relation("requesterId", fields: [requesterId], references: [id])

  @@index([taskId])
  @@index([acceptorId])
  @@index([result])
}
```

**使用现有枚举**：`AcceptanceResult` (PENDING/PASSED/FAILED/CONDITIONAL)

### 3.2 API 设计

| 方法 | 路径                            | 功能         | 请求体                         | 返回                                                 |
| ---- | ------------------------------- | ------------ | ------------------------------ | ---------------------------------------------------- |
| POST | `/api/v1/tasks/[id]/acceptance` | 发起验收     | `{ acceptorId }`               | `{ success, data: Acceptance }` 状态变为 REVIEW      |
| PUT  | `/api/v1/tasks/[id]/acceptance` | 验收通过     | `{ notes?, result: "PASSED" }` | `{ success, data: Acceptance }` 状态变为 DONE        |
| PUT  | `/api/v1/tasks/[id]/acceptance` | 验收不通过   | `{ notes, result: "FAILED" }`  | `{ success, data: Acceptance }` 状态变为 IN_PROGRESS |
| GET  | `/api/v1/tasks/[id]/acceptance` | 获取验收记录 | -                              | `{ success, data: Acceptance[] }`                    |

### 3.3 状态流转

```
TODO → IN_PROGRESS → REVIEW → DONE
         ↑              │
         └──────────────┘ (验收不通过)
```

| 触发条件        | 前状态      | 后状态      | 说明                         |
| --------------- | ----------- | ----------- | ---------------------------- |
| 进度更新到 100% | IN_PROGRESS | IN_PROGRESS | 进度达到 100%，可发起验收    |
| 点击"发起验收"  | IN_PROGRESS | REVIEW      | 创建验收记录，通知验收人     |
| 验收通过        | REVIEW      | DONE        | 任务完成，记录 `completedAt` |
| 验收不通过      | REVIEW      | IN_PROGRESS | 退回进行中，记录不通过原因   |

### 3.4 UI 设计

**发起验收按钮**（DetailTab 进度区域）：

- 显示条件：进度 = 100% 且 状态 ≠ REVIEW/DONE/CANCELLED
- 点击弹出对话框：选择验收人（项目成员下拉框）
- 确认后状态变为 REVIEW，通知验收人

**验收操作面板**（验收人可见）：

- 显示条件：当前用户 = 验收人 且 任务状态 = REVIEW
- 显示：验收通过按钮、验收不通过按钮、意见输入框

**验收记录展示**（DetailTab 底部）：

- 显示历史验收记录：发起时间、验收人、结果、意见

### 3.5 权限矩阵

| 操作             | 任务负责人 | 验收人 | 项目经理 | 项目成员 |
| ---------------- | ---------- | ------ | -------- | -------- |
| 发起验收         | ✓          | -      | ✓        | -        |
| 验收通过         | -          | ✓      | ✓        | -        |
| 验收不通过       | -          | ✓      | ✓        | -        |
| 评论             | ✓          | ✓      | ✓        | ✓        |
| 设置子任务负责人 | ✓          | -      | ✓        | ✓        |

---

## 实现顺序

1. **评论持久化**（最简单，独立）
   - 创建 `task_comments` Prisma 模型
   - 运行数据库迁移
   - 更新 comments API
   - 改造 CommentsTab UI

2. **子任务负责人**（中等复杂度）
   - 修改 `subtasks` Prisma 模型添加 `assigneeId`
   - 运行数据库迁移
   - 更新 subtasks API
   - 改造 SubTaskList UI

3. **任务验收流程**（最复杂）
   - 创建 `task_acceptances` Prisma 模型
   - 运行数据库迁移
   - 创建 acceptance API
   - 改造 DetailTab UI（发起验收、验收操作、验收记录）
   - 添加通知功能

---

## 文件清单

### 需要修改的文件

- `prisma/schema.prisma` — 添加 task_comments、修改 subtasks、添加 task_acceptances
- `src/app/api/v1/tasks/[id]/comments/route.ts` — 评论 API
- `src/app/api/v1/tasks/[id]/comments/[commentId]/route.ts` — 删除评论 API（新建）
- `src/app/api/v1/tasks/[id]/subtasks/route.ts` — 子任务 API（添加 assigneeId 支持）
- `src/app/api/v1/tasks/[id]/acceptance/route.ts` — 验收 API（新建）
- `src/components/tasks/detail/CommentsTab.tsx` — 评论 UI
- `src/components/tasks/SubTaskList.tsx` — 子任务 UI
- `src/components/tasks/detail/DetailTab.tsx` — 验收 UI

### 需要新建的文件

- `src/app/api/v1/tasks/[id]/comments/[commentId]/route.ts`
- `src/app/api/v1/tasks/[id]/acceptance/route.ts`
- `src/components/tasks/detail/AcceptancePanel.tsx` — 验收操作面板
- `src/components/tasks/detail/AcceptanceHistory.tsx` — 验收记录展示
