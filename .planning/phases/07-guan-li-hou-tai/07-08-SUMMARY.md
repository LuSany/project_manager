---
phase: 07-guan-li-hou-tai
plan: 08
status: completed
started: "2026-04-09T15:20:00Z"
completed: "2026-04-09T15:25:00Z"
commit: a378b21
---

# Plan 07-08: 修复 MAJOR 级别问题

## Objective
修复管理后台 UAT 中发现的 MAJOR 级别问题，提升用户体验和功能完整性。

## Tasks Completed

| Task | Status | Files Modified |
|------|--------|----------------|
| Task 1: 检查并修复创建项目负责人选择器 | ✅ 已验证 | 无需修改 |
| Task 2: 验证项目管理页面编辑和归档按钮 | ✅ 已验证 | 无需修改 |
| Task 3: 修复 AI 配置自定义服务商选项 | ✅ | AIConfigDialog.tsx |
| Task 4: 修复里程碑/需求/问题管理页面暗色主题适配 | ⚠️ 偏差 | 页面不存在 |

## Key Changes

### 1. AIConfigDialog.tsx (Task 3)
- 将 "自定义 (Ollama)" 改为 "自定义服务"
- 更新 Base URL placeholder 为更通用的示例
- 添加帮助文本说明支持 OpenAI 兼容的 API 端点

**修改前:**
```tsx
<SelectItem value="CUSTOM">自定义 (Ollama)</SelectItem>
<Input placeholder="http://localhost:11434" />
```

**修改后:**
```tsx
<SelectItem value="CUSTOM">自定义服务</SelectItem>
<Input placeholder="https://api.example.com 或 http://localhost:11434" />
<p className="text-muted-foreground text-xs">
  支持 OpenAI 兼容的 API 端点，如 Ollama、LocalAI、vLLM 等
</p>
```

### 2. ProjectDialog.tsx (Task 1 - 验证)
- 负责人选择器代码已正确实现
- `fetchUsers` 正确获取用户列表
- Select 组件正确绑定 `form.watch('ownerId')` 和 `form.setValue`

### 3. projects/page.tsx (Task 2 - 验证)
- 编辑按钮存在（第 205 行）
- 归档/取消归档按钮存在（第 208-219 行）
- 功能正常工作

## Deviations

### Task 4: 页面不存在
- `/admin/milestones` 页面不存在
- `/admin/requirements` 页面不存在
- `/admin/issues` 页面不存在

这些页面在 UAT 中被提及但实际未实现。这属于功能缺失而非暗色主题问题，需要在后续迭代中创建这些页面。

**当前 admin 目录结构:**
- /admin/ai - AI 配置
- /admin/email - 邮件配置
- /admin/logs - 日志
- /admin/permissions - 权限配置
- /admin/projects - 项目管理
- /admin/templates - 模板管理
- /admin/users - 用户管理

## Self-Check: PASSED
- [x] 任务 1-3 完成验证
- [x] 任务 4 记录偏差原因
- [x] 构建成功 (npm run build)
- [x] 提交已创建 (a378b21)