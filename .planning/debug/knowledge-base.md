# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## dashboard-milestone-project-undefined — Prisma 关系名称与前端属性名不一致

- **Date:** 2026-03-22T15:40:00.000Z
- **Error patterns:** Cannot read properties of undefined, reading 'name', TypeError, project.owner, milestone.project, risk.project, review.type, review.materials, review.participants, group.members
- **Root cause:** Prisma schema 中关系名称使用复数形式或表名（如 `users`、`projects`、`review_materials`），但前端代码使用语义化单数名称（如 `owner`、`project`、`materials`），导致 API 返回的属性在前端访问时为 undefined
- **Fix:** 将前端属性名改为与 Prisma 关系名称一致；API 手动构建返回对象时包含所有必要的关系字段
- **Files changed:** src/components/dashboard/QuickActions.tsx, src/types/milestone.ts, src/app/api/v1/projects/[id]/route.ts, src/app/api/v1/users/route.ts, src/app/api/v1/reviews/route.ts, src/middleware.ts

---
