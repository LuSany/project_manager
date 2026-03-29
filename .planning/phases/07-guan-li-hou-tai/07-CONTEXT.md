# Phase 7: 管理后台 - Context

**Gathered:** 2026-03-29
**Updated:** 2026-03-29 (v4)
**Status:** Ready for planning

<domain>
## Phase Boundary

管理员可以配置系统基础数据，包括用户管理、项目管理、权限配置、审计日志查看、AI 服务配置、邮件配置、模板管理。
此阶段在现有管理后台页面基础上进行增强，统一 UI 模式并补全缺失功能。

**Requirements:** ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05

</domain>

<decisions>
## Implementation Decisions

### 用户管理 (ADMIN-01)

- **D-01:** 添加 CSV 导入用户功能，批量创建账户
- **D-02:** 支持选中多个用户批量修改状态（激活/禁用）
- **D-03:** 支持选中多个用户批量修改角色

### 项目管理 (ADMIN-02)

- **D-04:** 扩展现有页面，在列表基础上添加创建、编辑对话框
- **D-05:** 添加成员管理面板，支持在列表中搜索选择用户添加
- **D-06:** 添加归档/取消归档功能
- **D-23:** 添加项目设置页，包含 Webhook 配置、通知/集成设置、项目默认值配置

### 权限配置 (ADMIN-03)

- **D-07:** 采用混合权限模式：角色级（RBAC）+ 资源级（Resource-based）组合
- **D-08:** RBAC 控制操作权限（创建/编辑/删除），资源级控制具体项目/任务访问
- **D-09:** 权限自动继承：项目成员自动拥有项目的任务访问权限
- **D-10:** 基于现有 Prisma 权限模型扩展

### 审计日志 (ADMIN-04)

- **D-11:** 现有页面已完整，保持筛选和导出功能不变

### AI 配置 (ADMIN-05)

- **D-12:** 添加"测试连接"功能，验证 API Key 有效性
- **D-13:** 支持创建、编辑、删除 AI 配置
- **D-14:** 多 Provider 支持：OpenAI、Anthropic、本地模型（如 Ollama）
- **D-15:** 模型选择需显示 provider 和 model 关联

### 邮件配置

- **D-19:** 完善 CRUD：添加编辑、删除邮件服务配置功能
- **D-20:** 邮件服务配置支持 SMTP 表单（host、port、user、password、fromAddress）

### 模板管理

- **D-21:** 完善 CRUD：添加编辑、删除任务模板和评审模板
- **D-22:** 支持模板内容编辑和预览功能
- **D-24:** 添加模板导入/导出功能，支持 JSON 格式

### UI 统一

- **D-16:** 统一使用 TanStack Table（与 Phase 3 列表视图一致）
- **D-17:** 所有管理表格添加筛选、排序、分页功能
- **D-18:** 保持与现有 shadcn/ui 组件风格一致
- **D-25:** 管理后台页面需适配暗色/浅色主题，确保所有自定义颜色使用 CSS 变量

### Claude's Discretion

- 具体的权限判断逻辑实现细节
- 测试连接的超时时间和错误提示文案
- 分页的默认每页数量和可选项
- CSV 导入的字段映射规则
- 批量操作的最大选中数量限制
- 邮件配置的连接测试逻辑
- 模板内容编辑的富文本/纯文本选择
- 项目设置页的具体 Tab 结构
- 模板导入/导出的文件格式规范
- 暗色主题下的颜色适配细节

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目规划文档

- `.planning/PROJECT.md` — 项目愿景、约束、关键决策
- `.planning/REQUIREMENTS.md` — 需求定义和追踪
- `.planning/ROADMAP.md` — 阶段规划和依赖关系

### UI 模式参考

- `src/app/(main)/admin/users/page.tsx` — 现有用户管理页面参考
- `src/app/(main)/admin/projects/page.tsx` — 现有项目管理页面参考
- `src/app/(main)/admin/email/page.tsx` — 现有邮件配置页面参考
- `src/app/(main)/admin/templates/page.tsx` — 现有模板管理页面参考
- `src/app/(main)/admin/ai/page.tsx` — 现有 AI 配置页面参考
- `src/app/(main)/admin/layout.tsx` — 管理后台布局和导航定义
- `src/app/(main)/tasks/page.tsx` — TanStack Table 使用示例（Phase 3）
- `.planning/phases/03-kanban-list/03-CONTEXT.md` — TanStack Table 模式参考

### API 端点

- `src/app/api/v1/admin/users/route.ts` — 用户管理 API
- `src/app/api/v1/admin/projects/` — 项目管理 API
- `src/app/api/v1/admin/audit-logs/route.ts` — 审计日志 API
- `src/app/api/v1/admin/ai/configs/` — AI 配置 API
- `src/app/api/v1/admin/email/configs/` — 邮件配置 API
- `src/app/api/v1/admin/email/templates/` — 邮件模板 API
- `src/app/api/v1/templates/` — 任务模板 API
- `src/app/api/v1/review-templates/` — 评审模板 API
- `src/app/api/v1/webhooks/` — Webhook API（项目设置页参考）

### 数据库模型

- `prisma/schema.prisma` — User, Project, Role, Permission 模型

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `src/components/ui/table.tsx` — TanStack Table 封装
- `src/components/ui/dialog.tsx` — 创建/编辑对话框
- `src/components/ui/select.tsx` — 下拉选择
- `src/components/ui/data-table.tsx` — TanStack Table 基础实现（Phase 3）
- `src/lib/api/client.ts` — API 客户端

### Established Patterns

- Phase 3 列表视图使用 TanStack Table + Zustand
- 用户管理页面已有完整的 CRUD 对话框模式
- 审计日志页面已有筛选和导出功能
- CSV 导出模式可参考审计日志的导出实现

### Integration Points

- `/admin/users` — 用户管理入口
- `/admin/projects` — 项目管理入口
- `/admin/logs` — 审计日志入口
- `/admin/ai` — AI 配置入口
- `/admin/email` — 邮件配置入口
- `/admin/templates` — 模板管理入口

</code_context>

<specifics>
## Specific Ideas

- AI 测试连接应在保存前验证，显示成功/失败提示
- 成员管理可使用已存在的成员选择组件
- 权限配置需要与现有的 role-based access 兼容
- CSV 导入需提供模板下载，支持姓名、邮箱、部门、角色字段
- 批量操作使用 Checkbox 选中，顶部显示操作栏
- 邮件配置编辑表单需支持 SMTP 连接参数配置
- 模板内容编辑支持变量占位符（如 {{name}}、{{project}}）
- 项目设置页支持 Webhook URL 测试和事件类型选择
- 模板导入/导出使用 JSON 格式，- 暗色主题下所有自定义 Badge 颜色使用 CSS 变量而非硬编码
- 项目设置页包含 Webhook 配置、通知集成、项目默认值三个 Tab
- 模板导入/导出使用 JSON 格式，支持批量操作
- 管理后台所有自定义颜色需使用 CSS 变量，确保暗色/浅色主题切换正常

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 07-guan-li-hou-tai_
_Context gathered: 2026-03-29_
_Updated: 2026-03-29_
