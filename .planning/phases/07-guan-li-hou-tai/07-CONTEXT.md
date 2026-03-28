# Phase 7: 管理后台 - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

管理员可以配置系统基础数据，包括用户管理、项目管理、权限配置、审计日志查看、AI 服务配置。
此阶段在现有管理后台页面基础上进行增强，统一 UI 模式并补全缺失功能。

</domain>

<decisions>
## Implementation Decisions

### 项目管理 (ADMIN-02)

- **D-01:** 扩展现有页面，在列表基础上添加创建、编辑对话框
- **D-02:** 添加成员管理面板（查看、添加、移除项目成员）
- **D-03:** 添加归档/取消归档功能

### 权限配置 (ADMIN-03)

- **D-04:** 采用资源级权限（Resource-based Permission）
- **D-05:** 控制用户可以访问哪些具体项目/任务
- **D-06:** 基于现有 Prisma 权限模型扩展

### AI 配置 (ADMIN-05)

- **D-07:** 添加"测试连接"功能，验证 API Key 有效性
- **D-08:** 支持创建、编辑、删除 AI 配置
- **D-09:** 模型选择需显示 provider 和 model 关联

### UI 统一

- **D-10:** 统一使用 TanStack Table（与 Phase 3 列表视图一致）
- **D-11:** 所有管理表格添加筛选、排序、分页功能
- **D-12:** 保持与现有 shadcn/ui 组件风格一致

### Claude's Discretion

- 具体的权限判断逻辑实现细节
- 测试连接的超时时间和错误提示文案
- 分页的默认每页数量和可选项

</decisions>

<canonical_refs>

## Canonical References

### UI 模式参考

- `src/app/(main)/admin/users/page.tsx` — 现有用户管理页面参考
- `src/app/(main)/admin/projects/page.tsx` — 现有项目管理页面参考
- `src/app/(main)/tasks/page.tsx` — TanStack Table 使用示例（Phase 3）

### API 端点

- `src/app/api/v1/admin/users/route.ts` — 用户管理 API
- `src/app/api/v1/admin/projects/` — 项目管理 API
- `src/app/api/v1/admin/audit-logs/route.ts` — 审计日志 API
- `src/app/api/v1/admin/ai/configs/` — AI 配置 API

### 数据库模型

- `prisma/schema.prisma` — User, Project, Role, Permission 模型

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `src/components/ui/table.tsx` — TanStack Table 封装
- `src/components/ui/dialog.tsx` — 创建/编辑对话框
- `src/components/ui/select.tsx` — 下拉选择
- `src/lib/api/client.ts` — API 客户端

### Established Patterns

- Phase 3 列表视图使用 TanStack Table + Zustand
- 用户管理页面已有完整的 CRUD 对话框模式
- 审计日志页面已有筛选和导出功能

### Integration Points

- `/admin/users` — 用户管理入口
- `/admin/projects` — 项目管理入口
- `/admin/logs` — 审计日志入口
- `/admin/ai` — AI 配置入口

</code_context>

<specifics>
## Specific Ideas

- AI 测试连接应在保存前验证，显示成功/失败提示
- 成员管理可使用已存在的成员选择组件
- 权限配置需要与现有的 role-based access 兼容

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 07-guan-li-hou-tai_
_Context gathered: 2026-03-29_
