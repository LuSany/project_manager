---
status: resolved
trigger: "管理员控制台存在三个功能缺失问题：
1. 权限管理无法添加项目进行权限配置 - 添加项目按钮不存在
2. 模板管理只支持JSON格式，需要支持CSV/Excel格式模板
3. AI配置功能服务商选项固定为ollama，无法添加其他自定义服务商、URL、API Keys"
created: 2026-04-06T00:00:00Z
updated: 2026-04-22T00:00:00Z
---

## Resolution

root_cause:
  1. 权限管理无法获取项目列表：API只返回已有成员的项目，不返回所有项目
  2. AI配置自定义服务商缺少API Key字段：表单设计遗漏
  3. 评审模板缺少导入功能：功能未实现

fix:
  1. 权限管理页面（permissions/page.tsx）：
     - 修改fetchResources函数，先调用/admin/projects获取所有项目列表
     - 再调用/admin/permissions获取权限数据计算成员数量
     - 合并数据构建包含所有项目的资源列表

  2. AI配置对话框（AIConfigDialog.tsx）：
     - 在provider === 'CUSTOM'条件下添加API Key输入字段
     - 字段标记为可选

  3. 模板管理页面（templates/page.tsx）：
     - 添加评审模板导入功能
     - 支持JSON和CSV格式

verification: npm run build成功，无编译错误
files_changed: [
  src/app/(main)/admin/permissions/page.tsx,
  src/app/(main)/admin/ai/components/AIConfigDialog.tsx,
  src/app/(main)/admin/templates/page.tsx
]

## Final Fix (2026-04-22)

额外修复：approvals/page.tsx 类型定义问题
- ApprovalRecord接口添加 devices.typeId 和 device_types.id
- 构建验证成功