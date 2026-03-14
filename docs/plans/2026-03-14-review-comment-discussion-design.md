# Phase 3: 评审评论/讨论功能设计

## 概述

为评审系统添加评论讨论和投票功能，实现完整的评审工作流：
- 评审人可以针对评审整体、材料、评审项发表评论
- 作者可以回复评论
- 评审人可以投票同意/不同意
- 所有评审人同意后，主持人才能结束评审

## 功能需求

### 评论功能
- 支持三级评论粒度：评审整体、材料、评审项
- 线程式回复结构（评论 → 回复，仅一层）
- 评论状态追踪（OPEN/RESOLVED）
- 评审参与者都可以发表评论和回复

### 投票功能
- 仅 REVIEWER 角色可以投票
- 投票后可以修改
- 所有 REVIEWER 都同意后，MODERATOR 才能结束评审

### 通知功能
- 新评论通知评审作者
- 回复通知评论作者
- 所有人同意通知主持人

## 数据模型设计

### ReviewComment 模型

```prisma
model ReviewComment {
  id          String   @id @default(cuid())
  reviewId    String
  materialId  String?  // 可选，针对材料的评论
  itemId      String?  // 可选，针对评审项的评论
  parentId    String?  // 父评论ID，用于回复
  authorId    String
  content     String   // 纯文本内容
  status      CommentStatus @default(OPEN)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  review      Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  material    ReviewMaterial? @relation(fields: [materialId], references: [id], onDelete: Cascade)
  item        ReviewItem? @relation(fields: [itemId], references: [id], onDelete: Cascade)
  parent      ReviewComment? @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies     ReviewComment[] @relation("CommentReplies")
  author      User     @relation(fields: [authorId], references: [id], onDelete: Restrict)

  @@index([reviewId])
  @@index([materialId])
  @@index([itemId])
  @@map("review_comments")
}

enum CommentStatus {
  OPEN      // 待解决
  RESOLVED  // 已解决
}
```

### ReviewVote 模型

```prisma
model ReviewVote {
  reviewId     String
  userId       String
  agreed       Boolean  // true=同意, false=不同意
  votedAt      DateTime @default(now())

  review       Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([reviewId, userId])
  @@map("review_votes")
}
```

## API 设计

### 评论 API

| 端点 | 方法 | 描述 | 权限 |
|------|------|------|------|
| `/api/v1/reviews/[id]/comments` | GET | 获取评审所有评论 | 参与者 |
| `/api/v1/reviews/[id]/comments` | POST | 创建评论 | 参与者 |
| `/api/v1/reviews/[id]/comments/[commentId]` | PUT | 编辑评论 | 仅作者 |
| `/api/v1/reviews/[id]/comments/[commentId]` | DELETE | 删除评论 | 作者/管理员 |
| `/api/v1/reviews/[id]/comments/[commentId]/resolve` | POST | 标记已解决 | 评论作者/评审作者 |
| `/api/v1/reviews/[id]/comments/[commentId]/reopen` | POST | 重新打开 | 评论作者/评审作者 |

### 投票 API

| 端点 | 方法 | 描述 | 权限 |
|------|------|------|------|
| `/api/v1/reviews/[id]/votes` | GET | 获取投票情况 | 参与者 |
| `/api/v1/reviews/[id]/votes` | POST | 提交投票 | 仅 REVIEWER |
| `/api/v1/reviews/[id]/complete` | POST | 结束评审 | 仅 MODERATOR |

### 结束评审条件

1. 评审状态为 IN_PROGRESS
2. 所有 REVIEWER 角色的参与者都已投票
3. 所有投票都是 agreed=true

## 前端组件设计

### 组件结构

```
src/components/reviews/
├── ReviewComments.tsx        # 评论列表容器
├── CommentThread.tsx         # 单个评论线程
├── CommentForm.tsx           # 评论/回复输入框
├── ReviewVoting.tsx          # 投票面板
└── ReviewStatusBanner.tsx    # 评审状态横幅
```

### 交互设计

评论列表支持：
- 过滤：全部/未解决/已解决
- 排序：最新优先/最早优先
- 针对材料/评审项的评论显示关联标签

投票面板显示：
- 投票进度（X/Y 已同意）
- 每个评审人的投票状态
- 投票按钮（仅评审人可见）

## 通知设计

### 通知触发

| 事件 | 通知对象 | 通知类型 |
|------|----------|----------|
| 新评论 | 评审作者 | REVIEW_COMMENT |
| 回复 | 评论作者 | COMMENT_REPLY |
| 已解决 | 评论作者 | COMMENT_RESOLVED |
| 全部同意 | 主持人 | REVIEW_ALL_AGREED |

### 通知类型扩展

```prisma
enum NotificationType {
  // ... 现有类型
  REVIEW_COMMENT
  COMMENT_REPLY
  COMMENT_RESOLVED
  REVIEW_ALL_AGREED
}
```

## 实现步骤

### Step 1: 数据库模型

1. 修改 `prisma/schema.prisma`
2. 创建迁移文件
3. 生成 Prisma Client

### Step 2: 评论 API

1. 创建评论 CRUD 端点
2. 创建解决/重开端点
3. 添加权限验证

### Step 3: 投票 API

1. 创建投票端点
2. 创建结束评审端点
3. 实现投票逻辑

### Step 4: 前端组件

1. 创建评论组件
2. 创建投票组件
3. 集成到评审详情页

### Step 5: 通知集成

1. 扩展通知类型
2. 在 API 中触发通知

## 文件清单

### 新增文件

```
prisma/migrations/xxx_add_review_comments/

src/app/api/v1/reviews/[id]/comments/route.ts
src/app/api/v1/reviews/[id]/comments/[commentId]/route.ts
src/app/api/v1/reviews/[id]/comments/[commentId]/resolve/route.ts
src/app/api/v1/reviews/[id]/comments/[commentId]/reopen/route.ts
src/app/api/v1/reviews/[id]/votes/route.ts
src/app/api/v1/reviews/[id]/complete/route.ts

src/components/reviews/ReviewComments.tsx
src/components/reviews/CommentThread.tsx
src/components/reviews/CommentForm.tsx
src/components/reviews/ReviewVoting.tsx
src/components/reviews/ReviewStatusBanner.tsx
```

### 修改文件

```
prisma/schema.prisma
src/app/projects/[id]/reviews/[reviewId]/page.tsx
```

## 决策记录

1. **评论粒度**: 混合模式（评审/材料/评审项三级）- 更灵活
2. **回复结构**: 线程式，仅一层回复 - 简洁明了
3. **投票粒度**: 整体同意 + 评论状态追踪 - 平衡简洁与可控
4. **状态设计**: 保持现有三个状态 - 不增加复杂度
5. **评论格式**: 纯文本 - 最简单，避免安全风险
6. **通知方式**: 系统通知 - 利用现有基础设施