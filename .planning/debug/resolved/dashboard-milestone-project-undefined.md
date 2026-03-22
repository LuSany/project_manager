---
status: resolved
trigger: '前端页面http://localhost:3001后跳转到dashboard报错'
created: 2026-03-22T12:00:00.000Z
updated: 2026-03-22T15:40:00.000Z
---

## Summary

本次调试会话解决了一个系统性问题：**Prisma 关系名称与前端期望的属性名称不一致**，导致了多个页面的运行时错误。

## Root Cause

**核心问题：** Prisma schema 中关系名称使用复数形式或表名（如 `users`、`projects`、`review_materials`），但前端代码使用语义化单数名称（如 `owner`、`project`、`materials`）。

**影响范围：** 全局性影响，涉及：

- Dashboard 页面
- 项目详情页面
- 评审管理页面
- 风险管理页面
- 成员管理功能
- 文件上传和预览功能

## Categories of Fixes

### 1. 前端类型定义和渲染代码修复

将前端属性名改为与 Prisma 关系名称一致：

| 前端原属性            | Prisma 关系名                | 修复文件数 |
| --------------------- | ---------------------------- | ---------- |
| `project.owner`       | `project.users`              | 4          |
| `milestone.project`   | `milestone.projects`         | 4          |
| `risk.project`        | `risk.projects`              | 2          |
| `risk.owner`          | `risk.users`                 | 2          |
| `review.type`         | `review.ReviewTypeConfig`    | 2          |
| `review.materials`    | `review.review_materials`    | 1          |
| `review.participants` | `review.review_participants` | 1          |
| `group.members`       | `group.review_group_members` | 1          |

### 2. API 返回对象修复

API 手动构建返回对象时遗漏了关系字段：

| API                     | 遗漏字段 | 修复                        |
| ----------------------- | -------- | --------------------------- |
| `/api/v1/projects/[id]` | `users`  | 添加 `users: project.users` |

### 3. API 关系名称修复

API 中使用了错误的 Prisma 关系名称：

| API             | 错误名称                          | 正确名称                      |
| --------------- | --------------------------------- | ----------------------------- |
| `/api/v1/users` | `ownedProjects`, `projectMembers` | `projects`, `project_members` |

### 4. 文件上传和预览修复

- 扩展了 MIME 类型列表，支持更多文档格式
- 添加了文件扩展名验证（MIME 类型或扩展名任一匹配即可）
- 修复了文件预览时显示 UUID 文件名的问题（改用 `originalName`）
- 修复了 OnlyOffice 配置中的文件名问题

### 5. 环境配置修复

- 修改 `ONLYOFFICE_CALLBACK_URL` 从旧 IP 改为 `host.docker.internal`
- 添加 `/api/v1/files/onlyoffice-callback` 到公开路由列表

## Files Changed

**前端组件 (10 files):**

- src/components/dashboard/QuickActions.tsx
- src/components/dashboard/RiskBoard.tsx
- src/components/dashboard/RiskOverview.tsx
- src/components/reviews/ReviewEditDialog.tsx
- src/app/milestones/[id]/page.tsx
- src/app/projects/[id]/page.tsx
- src/app/projects/[id]/settings/page.tsx
- src/app/projects/[id]/reviews/[reviewId]/page.tsx
- src/app/(main)/risks/page.tsx
- src/app/(main)/admin/projects/page.tsx

**类型定义 (1 file):**

- src/types/milestone.ts

**API 路由 (9 files):**

- src/app/api/v1/projects/[id]/route.ts
- src/app/api/v1/users/route.ts
- src/app/api/v1/review-groups/route.ts
- src/app/api/v1/reviews/route.ts
- src/app/api/v1/reviews/[id]/route.ts
- src/app/api/v1/files/upload/route.ts
- src/app/api/v1/files/[id]/download/route.ts
- src/app/api/v1/files/[id]/preview-edit/route.ts
- src/middleware.ts

**配置文件 (1 file):**

- .env

## Lessons Learned

1. **命名一致性**：前后端使用的属性名称应保持一致，建议在项目初期建立命名规范文档
2. **API 响应验证**：API 手动构建返回对象时容易遗漏字段，建议使用 TypeScript 类型检查确保完整性
3. **关系名称映射**：可以考虑在 API 层统一做属性名称映射，避免前端直接使用 Prisma 原始关系名

## Recommendations

1. 建立项目命名规范文档，明确 Prisma 关系名称与前端属性名称的对应关系
2. 考虑创建 API 响应类型定义，确保 API 返回数据与前端期望一致
3. 添加端到端测试覆盖关键用户流程
