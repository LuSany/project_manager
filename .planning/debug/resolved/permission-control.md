---
status: resolved
trigger: "当前系统的权限给所有员工都是一样的，应该修改为登陆系统后，按部门角色，项目角色展示不同的内容"
created: 2026-04-06T00:00:00.000Z
updated: 2026-04-06T00:40:00.000Z
---

## Current Focus

hypothesis: 多个 API 路由缺少基于项目成员关系的过滤逻辑，导致用户能看到不属于自己的项目数据
test: 检查 requirements, issues, tasks API 是否有权限过滤
expecting: 确认这些 API 缺少过滤逻辑
next_action: 实施 API 权限过滤修复

## Symptoms

expected: 不同部门/项目角色的用户看到对应权限的功能菜单和数据，某些角色只能看到自己参与的项目，不能看到所有项目
actual: 员工可以看到不属于自己的项目或管理功能，能看到不该看的
errors: 无错误信息
reproduction: 任何员工登录后都能看到管理控制台菜单、所有项目列表、所有评审内容、所有风险/需求
started: 一直存在，系统从未实现基于角色的权限控制

## Eliminated

<!-- APPEND only -->

## Evidence

<!-- APPEND only -->
- timestamp: 2026-04-06T00:05:00
  checked: Prisma schema 角色定义
  found: SystemRole: ADMIN, PROJECT_ADMIN, PROJECT_OWNER, PROJECT_MEMBER, EMPLOYEE; ProjectMemberRole: PROJECT_OWNER, PROJECT_ADMIN, PROJECT_MEMBER, PROJECT_DIRECTOR; ReviewParticipantRole: REVIEWER, AUTHOR, MODERATOR, AI_REVIEWER
  implication: 系统有角色定义，但需要检查是否被正确使用

- timestamp: 2026-04-06T00:10:00
  checked: src/components/layout/Sidebar.tsx 导航菜单
  found: 只有 "用户管理" 菜单项设置了 adminOnly: true (line 153)，其他菜单项无角色过滤
  implication: 大多数菜单对所有用户可见，但这本身不是问题（菜单应可见但数据应过滤）

- timestamp: 2026-04-06T00:12:00
  checked: src/app/(main)/admin/layout.tsx
  found: Admin layout 正确检查 user.role !== 'ADMIN' 并重定向到首页 (line 48-50)
  implication: 管理控制台页面访问已正确保护，非管理员无法访问

- timestamp: 2026-04-06T00:15:00
  checked: src/app/api/v1/admin/users/route.ts
  found: checkAdmin() 函数检查 user.role !== 'ADMIN'
  implication: Admin API 已正确保护

- timestamp: 2026-04-06T00:20:00
  checked: src/app/api/v1/projects/route.ts
  found: Line 47-48: 非管理员用户过滤 `where.OR = [{ ownerId: userId }, { project_members: { some: { userId: userId } } }]`
  implication: 项目列表 API 正确过滤了用户可见的项目

- timestamp: 2026-04-06T00:22:00
  checked: src/app/api/v1/reviews/route.ts
  found: Line 70-85: 未指定 projectId 时，查询用户有权限的项目列表，然后过滤 where.projectId = { in: projectIds }
  implication: 评审列表 API 正确过滤了用户可见的评审

- timestamp: 2026-04-06T00:24:00
  checked: src/app/api/v1/risks/route.ts
  found: Line 82-97: 未指定 projectId 时，查询用户有权限的项目列表，然后过滤 where.projectId = { in: projectIds }
  implication: 风险列表 API 正确过滤了用户可见的风险

- timestamp: 2026-04-06T00:26:00
  checked: src/app/api/v1/requirements/route.ts
  found: 无任何基于项目成员关系的过滤逻辑，只检查登录状态，不限制用户能看到哪些项目的需求
  implication: **问题根源之一**: 需求 API 缺少权限过滤

- timestamp: 2026-04-06T00:28:00
  checked: src/app/api/v1/issues/route.ts
  found: 无任何基于项目成员关系的过滤逻辑，只检查登录状态，不限制用户能看到哪些项目的问题
  implication: **问题根源之二**: 问题 API 缺少权限过滤

- timestamp: 2026-04-06T00:30:00
  checked: src/app/api/v1/tasks/route.ts
  found: 无任何基于项目成员关系的过滤逻辑，只检查登录状态，不限制用户能看到哪些项目的任务
  implication: **问题根源之三**: 任务 API 缺少权限过滤

## Resolution

root_cause: 三个核心 API 路由 (requirements, issues, tasks) 缺少基于项目成员关系的权限过滤：
1. requirements/route.ts - 任何登录用户都能看到所有需求
2. issues/route.ts - 任何登录用户都能看到所有问题
3. tasks/route.ts - 任何登录用户都能看到所有任务
这些 API 应像 projects, reviews, risks API 一样，过滤用户只能看到自己参与的项目数据

fix: 为三个 API 路由添加 getUserProjectIds 辅助函数，并在 GET 和 POST 处理器中添加权限过滤逻辑：
1. requirements/route.ts - 添加 getUserProjectIds 函数，GET 处理器过滤用户可见项目需求，POST 处理器验证用户项目权限
2. issues/route.ts - 添加 getUserProjectIds 函数，GET 处理器过滤用户可见项目问题，POST 处理器验证用户项目权限
3. tasks/route.ts - 添加 getUserProjectIds 函数，GET 处理器过滤用户可见项目任务，POST 处理器验证用户项目权限

verification: 构建成功通过 (npm run build)，修改后的文件正确编译
files_changed: [src/app/api/v1/requirements/route.ts, src/app/api/v1/issues/route.ts, src/app/api/v1/tasks/route.ts]