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

## permission-control — API 缺少基于项目成员关系的权限过滤

- **Date:** 2026-04-06T00:40:00.000Z
- **Error patterns:** 权限, 所有员工, 看到不该看, 项目数据, 需求列表, 问题列表, 任务列表, 未过滤
- **Root cause:** requirements, issues, tasks API 缺少基于项目成员关系的权限过滤，任何登录用户都能看到所有项目的数据，而不像 projects, reviews, risks API 那样正确过滤用户只能看到自己参与的项目数据
- **Fix:** 为三个 API 路由添加 getUserProjectIds 辅助函数，在 GET 处理器中过滤用户可见项目数据，在 POST 处理器中验证用户项目权限
- **Files changed:** src/app/api/v1/requirements/route.ts, src/app/api/v1/issues/route.ts, src/app/api/v1/tasks/route.ts

---
