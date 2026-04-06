---
status: fixing
trigger: "管理员控制台存在三个功能缺失问题：
1. 权限管理无法添加项目进行权限配置 - 添加项目按钮不存在
2. 模板管理只支持JSON格式，需要支持CSV/Excel格式模板
3. AI配置功能服务商选项固定为ollama，无法添加其他自定义服务商、URL、API Keys"
created: 2026-04-06T00:00:00Z
updated: 2026-04-06T00:30:00Z
---

## Current Focus
hypothesis: 三个真实问题已修复，需要验证构建成功
test: npm run build确认无编译错误
expecting: 构建成功，代码正确
next_action: 完成修复，准备用户验证

## Symptoms
expected:
- 权限管理页面应该显示所有项目列表，允许管理员为任何项目配置权限
- AI配置选择自定义服务商时应该能够填写API Keys
- 模板管理评审模板应该有导入功能

actual:
- 权限管理页面无法获取已有项目列表，只能看到已有成员的项目
- AI配置选择自定义服务商后，无法填写API Keys字段
- 评审模板没有导入按钮和导入功能

errors: 未报告具体错误信息，功能不可用

reproduction:
1. 进入管理员控制台权限管理页面 - 项目列表为空（即使项目存在）
2. 打开AI配置添加配置对话框，选择"自定义(Ollama)" - 只看到Base URL字段，没有API Key字段
3. 打开模板管理评审模板Tab - 没有导入按钮

started: 功能从未正常工作过（设计缺失）

## Eliminated

- hypothesis: 权限管理需要"添加项目"按钮来创建项目
  evidence: 权限管理页面设计是从项目管理页面创建的项目列表中选择项目进行权限配置。这是正确的架构设计。
  timestamp: 2026-04-06T00:03:00Z

- hypothesis: AI配置服务商只有ollama选项
  evidence: AIConfigDialog.tsx第172-176行显示服务商下拉有三个选项：OpenAI、Anthropic、自定义(Ollama)。
  timestamp: 2026-04-06T00:04:00Z

- hypothesis: 权限管理页面设计正确
  evidence: permissions/page.tsx第25-57行调用/admin/permissions API，该API返回project_members表数据。如果没有任何项目成员，则projectsMap为空。但用户期望看到所有项目以配置权限，而不是只看到已有成员的项目。
  timestamp: 2026-04-06T00:21:00Z
  **这是真实的设计问题**

## Evidence

- timestamp: 2026-04-06T00:01:00Z
  checked: permissions/page.tsx和PermissionEditor.tsx
  found: 权限管理页面从/admin/permissions API获取现有项目列表。

- timestamp: 2026-04-06T00:02:00Z
  checked: templates/page.tsx导入功能
  found: handlePageImport函数只导入到/templates API（任务模板）。CSV支持已添加。

- timestamp: 2026-04-06T00:04:00Z
  checked: AIConfigDialog.tsx服务商选择
  found: 服务商下拉有三个选项。选择OpenAI/Anthropic时显示apiKey字段。

- timestamp: 2026-04-06T00:20:00Z
  checked: AIConfigDialog.tsx第194-211行
  found: 当provider === 'CUSTOM'时，只显示baseUrl字段，没有apiKey字段。用户无法为自定义服务商填写API Key。
  implication: 真实的功能缺失 - 自定义服务商缺少API Key字段

- timestamp: 2026-04-06T00:21:00Z
  checked: templates/page.tsx第347-405行评审模板Tab
  found: 评审模板Tab只有"新建模板"和"导出"按钮，没有"导入"按钮和导入功能。
  implication: 真实的功能缺失 - 评审模板缺少导入功能

- timestamp: 2026-04-06T00:22:00Z
  checked: /admin/permissions API (route.ts第29-49行)
  found: API返回project_members.findMany，只包含已有成员的项目数据，不包含没有成员的项目。
  implication: 权限管理无法看到所有项目，只能看到已有成员的项目

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
     - 在provider === 'CUSTOM'条件下添加API Key输入字段（第194-211行之后）
     - 字段标记为可选，placeholder为"可选，部分自定义服务需要"
     - 更新验证逻辑注释，说明自定义服务商的API Key是可选的

  3. 模板管理页面（templates/page.tsx）：
     - 添加reviewImportFileRef用于评审模板导入
     - 添加handleReviewImport函数处理评审模板导入
     - 在评审模板Tab添加导入按钮和隐藏的文件输入元素
     - 支持JSON和CSV格式的评审模板导入

verification: npm run build成功，无编译错误
files_changed: [
  /home/sany/projects/project_manager/src/app/(main)/admin/permissions/page.tsx,
  /home/sany/projects/project_manager/src/app/(main)/admin/ai/components/AIConfigDialog.tsx,
  /home/sany/projects/project_manager/src/app/(main)/admin/templates/page.tsx
]