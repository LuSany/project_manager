---
status: awaiting_human_verify
trigger: "review-permission-control - 评审权限控制和评审启动问题"
created: 2026-04-06T00:00:00.000Z
updated: 2026-04-06T01:00:00.000Z
---

## Current Focus

所有修复已完成，准备验证：

修复 1 - 评审编辑权限控制:
- 文件：src/app/api/v1/reviews/[id]/route.ts
- 修改：PUT 方法检查参与者角色，只有 MODERATOR/SECRETARY 或项目管理员可编辑
- 前端：编辑按钮仅对 MODERATOR/SECRETARY 可见

修复 2 - 评审启动功能:
- 文件：src/app/api/v1/reviews/[id]/start/route.ts (新建)
- 功能：MODERATOR 可以启动评审 (PENDING -> IN_PROGRESS)

修复 3 - 评审结束权限:
- 文件：src/components/reviews/ReviewVoting.tsx
- 修改：结束评审按钮仅对主持人可见 (isModerator 检查)

修复 4 - 角色标签显示:
- 文件：src/app/projects/[id]/reviews/[reviewId]/page.tsx
- 修改：getParticipantRoleLabel 添加 MODERATOR 角色

修复 5 - 评论 API 字段映射:
- 文件：src/app/api/v1/reviews/[id]/comments/route.ts
- 修复：users→author, review_materials→material, review_items→item, other_review_comments→replies

next_action: 验证修复

## Symptoms

expected:
- 只有项目管理员或评审主持人可以修改评审单内容
- 评审创建后，在预订时间应该能够正常开始评审流程
- 评审人登录系统后应该能够发表评审意见

actual:
- 所有参与评审的用户都可以编辑评审单（权限过宽）
- 评审单创建后，无法在预订时间开始评审
- 评审人登录后无法发表意见

errors: 无具体错误信息，功能不可用或行为不符合预期

reproduction:
1. 创建一个评审单，指定评审主持人和评审人
2. 让评审人登录系统
3. 尝试编辑评审单 - 发现所有参与者都能编辑（问题 1）
4. 在预订时间尝试开始评审 - 无法开始（问题 2）
5. 评审人尝试发表意见 - 无法操作（问题 2）

started: 持续存在的问题

## Eliminated


## Evidence

- timestamp: 2026-04-06T00:00:00.000Z
  checked: 评审编辑 API (src/app/api/v1/reviews/[id]/route.ts PUT)
  found: 第 91-97 行只检查项目成员身份 (isOwner/isMember/isAdmin)，不检查评审参与者角色
  implication: 所有项目成员都能编辑评审，权限过宽 - 问题 1 根因确认

- timestamp: 2026-04-06T00:00:00.000Z
  checked: 评论编辑 API (src/app/api/v1/reviews/[id]/comments/[commentId]/route.ts PUT)
  found: 第 41-46 行只检查评论作者身份 (comment.authorId !== user.id)
  implication: 只有评论作者可以编辑自己的评论 - 这个逻辑正确

- timestamp: 2026-04-06T00:00:00.000Z
  checked: 评审完成 API (src/app/api/v1/reviews/[id]/complete/route.ts)
  found: 第 39-51 行检查 MODERATOR 角色才能完成评审
  implication: 完成评审的权限控制正确，需要 MODERATOR 角色

- timestamp: 2026-04-06T00:00:00.000Z
  checked: Prisma Schema review_participants 表
  found: 支持 MODERATOR, REVIEWER, OBSERVER, SECRETARY 四种角色
  implication: 数据模型支持角色区分，但编辑 API 没有使用角色检查

- timestamp: 2026-04-06T00:00:00.000Z
  checked: ReviewEditDialog.tsx 前端组件
  found: 没有任何权限检查，直接调用 API 编辑评审
  implication: 前端没有做权限控制，完全依赖后端 API

- timestamp: 2026-04-06T00:00:00.000Z
  checked: 评审启动逻辑
  found: 不存在启动评审的 API，review.status 只能是 PENDING 或 COMPLETED，没有 IN_PROGRESS 状态
  implication: 问题 2 根因 - 评审无法启动，AI 投票 API 检查 IN_PROGRESS 状态但永远无法进入此状态

- timestamp: 2026-04-06T00:00:00.000Z
  checked: ReviewVoting.tsx 组件
  found: 组件接收 isReviewer/isModerator 参数，但评审详情页没有传递 isModerator
  implication: 评审人无法看到投票按钮或启动评审的入口

## Resolution

root_cause: 
1. 评审编辑 API (PUT /api/v1/reviews/[id]) 仅检查项目成员身份，未验证评审参与者角色 (MODERATOR/SECRETARY)
2. 缺少评审启动 API，无法将状态从 PENDING 切换到 IN_PROGRESS
3. 评论 POST API 返回 Prisma 原始字段名 (users)，前端期望映射后的字段名 (author)

fix:
1. 修改 src/app/api/v1/reviews/[id]/route.ts 的 PUT 方法，添加评审参与者角色检查
2. 创建 src/app/api/v1/reviews/[id]/start/route.ts 新 API，允许 MODERATOR 启动评审
3. 更新 ReviewVoting.tsx 添加启动评审按钮
4. 更新评审详情页传递 isModerator 和 status 参数
5. 修复评论 API 字段映射：users→author, review_materials→material, review_items→item, other_review_comments→replies

verification:
- 类型检查通过 (tsc --noEmit)
- 待用户验证：1) 非 MODERATOR 无法编辑评审 2) MODERATOR 可以启动评审 3) 评审人可以发表评论

files_changed:
- src/app/api/v1/reviews/[id]/route.ts
- src/app/api/v1/reviews/[id]/start/route.ts (新建)
- src/app/api/v1/reviews/[id]/comments/route.ts
- src/components/reviews/ReviewVoting.tsx
- src/app/projects/[id]/reviews/[reviewId]/page.tsx

