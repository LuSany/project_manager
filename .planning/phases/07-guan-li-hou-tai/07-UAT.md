---
status: complete
phase: 07-guan-li-hou-tai
source:
  [
    07-00-SUMMARY.md,
    07-01-SUMMARY.md,
    07-02-SUMMARY.md,
    07-03-SUMMARY.md,
    07-04-SUMMARY.md,
    07-05-SUMMARY.md,
  ]
started: 2026-04-03T00:00:00Z
updated: 2026-04-03T01:30:00Z
---

## Current Test

[testing complete]

## Tests

### 30. 暗色主题兼容性

expected: 切换系统或应用主题为暗色模式，所有管理后台页面（用户、项目、AI、邮件、模板、权限、项目设置）的UI元素（徽章、按钮、对话框、表格）正确渲染，颜色适配暗色背景（使用dark:前缀样式）。
result: issue
reported: "里程碑管理、需求管理、问题管理页面暗色主题未适配 - 颜色没有适配暗色背景。且这些页面缺少导航按钮 - 无法返回上一级或dashboard"
severity: major

## Tests

### 25. 项目设置页面导航

expected: 在项目管理页面，点击某个项目的"设置"按钮或链接，进入项目设置页面。页面显示三个Tab："Webhook配置"、"通知设置"、"默认值"。
result: blocked
blocked_by: server
reason: "项目设置页面无法访问 - 项目页面崩溃（Issue 5: blocker级别），无法进入项目设置页面"

### 26. Webhook配置管理

expected: 在项目设置Webhook Tab中，显示已配置的Webhook列表（URL、事件类型、状态）。点击"创建Webhook"，弹出对话框，填写URL、选择触发事件（如任务创建、任务完成），点击"提交"，Webhook出现在列表中。
result: blocked
blocked_by: server
reason: "项目设置页面无法访问 - 项目页面崩溃（Issue 5: blocker级别）"

### 27. Webhook连接测试

expected: 在Webhook创建对话框或编辑对话框中，点击"测试连接"按钮。按钮显示加载状态，POST请求发送到Webhook URL，返回结果通过Toast提示（成功/失败）。
result: blocked
blocked_by: server
reason: "项目设置页面无法访问 - 项目页面崩溃（Issue 5: blocker级别）"

### 28. 通知设置配置

expected: 在项目设置通知Tab中，显示通知设置表单。包含开关："任务分配通知"、"任务截止提醒"、"成员通知"。任务截止提醒有时间选择器（提前多少天）。风险阈值告警有阈值输入框。
result: blocked
blocked_by: server
reason: "项目设置页面无法访问 - 项目页面崩溃（Issue 5: blocker级别）"

### 29. 项目默认值配置

expected: 在项目设置默认值Tab中，显示默认值表单。包含"默认任务负责人"下拉框（可选择项目成员），"默认优先级"下拉框（高/中/低），"默认状态"下拉框，"默认可见性"下拉框。
result: blocked
blocked_by: server
reason: "项目设置页面无法访问 - 项目页面崩溃（Issue 5: blocker级别）"

## Tests

### 1. 用户列表表格功能

expected: 访问管理后台用户页面，表格显示用户列表，支持排序（点击列头）、筛选（搜索框）、分页（底部分页器）、行选择（勾选框）。表格列包含用户名、邮箱、角色、状态等信息。
result: pass

### 2. CSV批量导入用户

expected: 点击"导入"按钮，弹出CSV导入对话框。上传CSV文件后，对话框显示解析预览（表格形式，显示邮箱、姓名、角色列）。点击"确认导入"后，成功导入的用户出现在列表中，重复邮箱被自动跳过。
result: pass

### 3. 批量激活/禁用用户

expected: 在用户列表勾选多个用户，底部出现批量操作栏。点击"激活"按钮，弹出确认对话框，确认后所选用户状态变为ACTIVE。点击"禁用"，确认后状态变为INACTIVE。Toast显示操作成功提示。
result: issue
reported: "激活或禁用状态修改后无法立即更新，需要刷新页面才能看到变化。同时出现React Hydration Mismatch错误（className顺序不一致导致服务端/客户端渲染不匹配）"
severity: major

### 4. 批量修改用户角色

expected: 在用户列表勾选多个用户，批量操作栏显示角色下拉框。选择新角色（如EMPLOYEE、PROJECT_ADMIN、ADMIN），点击"应用"，所选用户角色更新为新角色。Toast提示"批量修改成功"。
result: issue
reported: "用户角色更新，需刷新页面后才能显示新的角色，无法立即显示修改后的角色"
severity: major

### 5. 项目列表表格功能

expected: 访问管理后台项目页面，表格显示项目列表，支持搜索（项目名称/描述/负责人搜索框）、排序、分页。表格列包含项目名、描述、负责人、状态等信息。
result: issue
reported: "页面崩溃报错 - Cannot read properties of undefined (reading 'avatar') at MembersPanel.tsx:241 - member.users.avatar为undefined，成员数据结构不匹配"
severity: blocker

### 6. 创建新项目

expected: 点击"创建项目"按钮，弹出创建对话框。填写项目名称、描述、选择负责人，点击"提交"，项目出现在列表中，Toast提示"创建成功"。
result: issue
reported: "创建项目时无法选择负责人 - 负责人选择器组件不工作"
severity: major

### 7. 编辑项目

expected: 点击项目行的"编辑"按钮，弹出编辑对话框，显示现有项目信息（名称、描述、负责人）。修改字段后点击"提交"，项目信息更新，Toast提示"更新成功"。
result: issue
reported: "项目管理页面缺少编辑按钮 - 无法编辑现有项目"
severity: major

### 8. 删除项目

expected: 点击项目行的"删除"按钮，弹出确认对话框（使用shadcn Dialog组件，不是浏览器confirm()）。确认后项目从列表中移除，Toast提示"删除成功"。
result: issue
reported: "删除确认对话框使用浏览器原生confirm() - 应使用shadcn Dialog组件保持UI一致性"
severity: minor

### 9. 归档/取消归档项目

expected: 点击项目行的"归档"按钮，弹出确认对话框（shadcn Dialog组件）。确认后项目状态变为ARCHIVED，显示归档徽章（灰色背景）。点击"取消归档"，状态恢复为ACTIVE，徽章消失。Toast提示操作成功。
result: issue
reported: "项目管理页面缺少归档功能 - 无法归档或取消归档项目"
severity: major

### 10. 项目成员管理

expected: 在项目页面点击"成员管理"或进入项目详情，显示成员列表。搜索框可搜索用户（输入姓名或邮箱），点击"添加成员"弹出对话框，选择用户和角色后添加。点击成员的"移除"按钮，弹出确认对话框后移除该成员。
result: issue
reported: "添加项目成员时一次只能选择一个用户，无法多选批量添加成员"
severity: minor

### 11. AI配置管理

expected: 访问AI配置页面，列表显示已配置的AI Provider（OpenAI、Anthropic、Custom）。点击"创建"按钮，弹出对话框，选择Provider类型（下拉框），填写API Key和Base URL（Custom类型显示Base URL字段）。点击"提交"，配置出现在列表中。
result: issue
reported: "AI配置页面自定义服务商选项受限 - 仅支持Ollama，不支持其他自定义API URL格式"
severity: major

### 12. AI连接测试

expected: 在AI配置创建对话框或编辑对话框中，点击"测试连接"按钮。按钮显示加载状态（spinner图标），10秒内返回结果。成功时Toast提示"连接成功"并显示可用模型列表，失败时Toast提示错误信息（如超时、认证失败、网络错误）。
result: blocked
blocked_by: prior-phase
reason: "AI连接测试功能无法验证 - 依赖于自定义API URL支持（Issue 5）的修复，当前仅支持Ollama"

### 13. 编辑/删除AI配置

expected: 点击AI配置的"编辑"按钮，弹出对话框显示现有配置（Provider类型、API Key、Base URL）。修改后点击"提交"更新配置。点击"删除"按钮，弹出确认对话框后配置从列表移除，Toast提示"删除成功"。
result: pass

### 14. 邮件配置管理

expected: 访问邮件配置页面，列表显示已配置的邮件服务。点击"创建"按钮，弹出对话框，选择Provider类型（SMTP/SendGrid/Company），填写Host、Port、User、Password等SMTP字段。点击"提交"，配置出现在列表中。
result: issue
reported: "页面崩溃报错 - logs.slice is not a function at email/page.tsx:242 - logs变量不是数组，可能是undefined或null"
severity: blocker

### 15. 邮件SMTP连接测试

expected: 在邮件配置对话框中，点击"测试连接"按钮。按钮显示加载状态（spinner图标），5秒内返回结果。成功时Toast提示"SMTP连接成功"，失败时Toast提示错误信息（如连接超时、认证失败）。
result: blocked
blocked_by: server
reason: "邮件配置页面崩溃（Issue 4: blocker级别），无法访问SMTP连接测试功能"

### 16. 模板管理列表

expected: 访问模板管理页面，显示两个Tab："任务模板"和"评审模板"。每个Tab显示对应类型的模板列表，包含模板名称、类型、创建时间等信息。
result: pass

### 17. 创建/编辑模板

expected: 点击"创建模板"按钮，弹出对话框。选择模板类型（任务/评审），填写模板名称和内容（支持文本编辑）。内容区域使用Monospace字体格式。点击"提交"，模板出现在列表中。点击"编辑"按钮可修改现有模板。
result: issue
reported: "模板格式支持受限 - 任务模板仅支持JSON格式，评审模板不支持自定义格式，无法使用文本、Markdown等灵活格式"
severity: major

### 18. 模板预览变量高亮

expected: 在模板编辑对话框中，预览面板显示模板内容，其中{{variable}}占位符（如{{name}}、{{project}}、{{date}}）以黄色背景高亮显示，便于识别变量位置。
result: issue
reported: "模板预览功能缺失 - 模板编辑对话框中没有预览面板，无法预览模板内容和变量高亮"
severity: major

### 19. 模板导入/导出

expected: 在模板管理页面顶部，点击"导入"按钮，选择JSON文件，解析后批量导入模板（支持任务和评审模板）。点击"导出"按钮，下载当前Tab的所有模板为JSON文件（文件名格式：{type}-templates-{date}.json）。
result: issue
reported: "模板导入/导出功能异常 - 不支持模板内容的导出以及导入"
severity: major

### 20. 权限配置页面布局

expected: 访问权限配置页面，左侧显示资源树（项目列表，每个项目显示成员数量徽章），右侧显示权限编辑器。点击左侧项目，右侧加载该项目的权限配置。
result: issue
reported: "权限配置页面无法使用 - 页面功能完全不工作"
severity: blocker

### 21. 添加项目成员权限

expected: 在权限编辑器中，点击"添加成员"按钮，弹出对话框。搜索框可搜索用户（输入姓名或邮箱），选择用户后选择角色（PROJECT_OWNER/PROJECT_MEMBER），点击"添加"，成员出现在列表中。
result: blocked
blocked_by: server
reason: "权限配置页面无法使用（Issue 20: blocker级别），无法测试添加成员权限功能"

### 22. 移除项目成员权限

expected: 在权限编辑器成员列表中，点击成员的"移除"按钮，弹出确认对话框。确认后成员从列表移除，Toast提示"移除成功"。
result: blocked
blocked_by: server
reason: "权限配置页面无法使用（Issue 20: blocker级别），无法测试移除成员权限功能"

### 23. 查看继承权限

expected: 在权限编辑器成员列表中，某些成员显示"继承"徽章，表示其权限从项目成员关系自动继承。继承权限显示为"查看"级别。
result: blocked
blocked_by: server
reason: "权限配置页面无法使用（Issue 20: blocker级别），无法测试继承权限功能"

### 24. 修改成员角色

expected: 在权限编辑器成员列表中，点击成员的角色下拉框，选择新角色（PROJECT_OWNER或PROJECT_MEMBER）。角色更新后，Toast提示"角色更新成功"。
result: blocked
blocked_by: server
reason: "权限配置页面无法使用（Issue 20: blocker级别），无法测试修改成员角色功能"

### 6. 创建新项目

expected: 点击"创建项目"按钮，弹出创建对话框。填写项目名称、描述、选择负责人，点击"提交"，项目出现在列表中，Toast提示"创建成功"。
result: issue
reported: "创建项目时无法选择负责人 - 负责人选择器组件不工作"
severity: major

### 7. 编辑项目

expected: 点击项目行的"编辑"按钮，弹出编辑对话框，显示现有项目信息（名称、描述、负责人）。修改字段后点击"提交"，项目信息更新，Toast提示"更新成功"。
result: issue
reported: "项目管理页面缺少编辑按钮 - 无法编辑现有项目"
severity: major

### 8. 删除项目

expected: 点击项目行的"删除"按钮，弹出确认对话框（使用shadcn Dialog组件，不是浏览器confirm()）。确认后项目从列表中移除，Toast提示"删除成功"。
result: issue
reported: "删除确认对话框使用浏览器原生confirm() - 应使用shadcn Dialog组件保持UI一致性"
severity: minor

### 9. 归档/取消归档项目

expected: 点击项目行的"归档"按钮，弹出确认对话框（shadcn Dialog组件）。确认后项目状态变为ARCHIVED，显示归档徽章（灰色背景）。点击"取消归档"，状态恢复为ACTIVE，徽章消失。Toast提示操作成功。
result: issue
reported: "项目管理页面缺少归档功能 - 无法归档或取消归档项目"
severity: major

### 10. 项目成员管理

expected: 在项目页面点击"成员管理"或进入项目详情，显示成员列表。搜索框可搜索用户（输入姓名或邮箱），点击"添加成员"弹出对话框，选择用户和角色后添加。点击成员的"移除"按钮，弹出确认对话框后移除该成员。
result: issue
reported: "添加项目成员时一次只能选择一个用户，无法多选批量添加成员"
severity: minor

### 11. AI配置管理

expected: 访问AI配置页面，列表显示已配置的AI Provider（OpenAI、Anthropic、Custom）。点击"创建"按钮，弹出对话框，选择Provider类型（下拉框），填写API Key和Base URL（Custom类型显示Base URL字段）。点击"提交"，配置出现在列表中。
result: issue
reported: "AI配置页面自定义服务商选项受限 - 仅支持Ollama，不支持其他自定义API URL格式"
severity: major

### 12. AI连接测试

expected: 在AI配置创建对话框或编辑对话框中，点击"测试连接"按钮。按钮显示加载状态（spinner图标），10秒内返回结果。成功时Toast提示"连接成功"并显示可用模型列表，失败时Toast提示错误信息（如超时、认证失败、网络错误）。
result: blocked
blocked_by: prior-phase
reason: "AI连接测试功能无法验证 - 依赖于自定义API URL支持（Issue 5）的修复，当前仅支持Ollama"

### 13. 编辑/删除AI配置

expected: 点击AI配置的"编辑"按钮，弹出对话框显示现有配置（Provider类型、API Key、Base URL）。修改后点击"提交"更新配置。点击"删除"按钮，弹出确认对话框后配置从列表移除，Toast提示"删除成功"。
result: pass

### 14. 邮件配置管理

expected: 访问邮件配置页面，列表显示已配置的邮件服务。点击"创建"按钮，弹出对话框，选择Provider类型（SMTP/SendGrid/Company），填写Host、Port、User、Password等SMTP字段。点击"提交"，配置出现在列表中。
result: issue
reported: "页面崩溃报错 - logs.slice is not a function at email/page.tsx:242 - logs变量不是数组，可能是undefined或null"
severity: blocker

### 15. 邮件SMTP连接测试

expected: 在邮件配置对话框中，点击"测试连接"按钮。按钮显示加载状态（spinner图标），5秒内返回结果。成功时Toast提示"SMTP连接成功"，失败时Toast提示错误信息（如连接超时、认证失败）。
result: blocked
blocked_by: server
reason: "邮件配置页面崩溃（Issue 4: blocker级别），无法访问SMTP连接测试功能"

### 16. 模板管理列表

expected: 访问模板管理页面，显示两个Tab："任务模板"和"评审模板"。每个Tab显示对应类型的模板列表，包含模板名称、类型、创建时间等信息。
result: pass

### 17. 创建/编辑模板

expected: 点击"创建模板"按钮，弹出对话框。选择模板类型（任务/评审），填写模板名称和内容（支持文本编辑）。内容区域使用Monospace字体格式。点击"提交"，模板出现在列表中。点击"编辑"按钮可修改现有模板。
result: issue
reported: "模板格式支持受限 - 任务模板仅支持JSON格式，评审模板不支持自定义格式，无法使用文本、Markdown等灵活格式"
severity: major

### 18. 模板预览变量高亮

expected: 在模板编辑对话框中，预览面板显示模板内容，其中{{variable}}占位符（如{{name}}、{{project}}、{{date}}）以黄色背景高亮显示，便于识别变量位置。
result: issue
reported: "模板预览功能缺失 - 模板编辑对话框中没有预览面板，无法预览模板内容和变量高亮"
severity: major

### 19. 模板导入/导出

expected: 在模板管理页面顶部，点击"导入"按钮，选择JSON文件，解析后批量导入模板（支持任务和评审模板）。点击"导出"按钮，下载当前Tab的所有模板为JSON文件（文件名格式：{type}-templates-{date}.json）。
result: issue
reported: "模板导入/导出功能异常 - 不支持模板内容的导出以及导入"
severity: major

### 20. 权限配置页面布局

expected: 访问权限配置页面，左侧显示资源树（项目列表，每个项目显示成员数量徽章），右侧显示权限编辑器。点击左侧项目，右侧加载该项目的权限配置。
result: issue
reported: "权限配置页面功能缺失 - 无法增加新项目并配置权限，无法进行权限配置测试"
severity: major

### 4. 批量修改用户角色

expected: 在用户列表勾选多个用户，批量操作栏显示角色下拉框。选择新角色（如EMPLOYEE、PROJECT_ADMIN、ADMIN），点击"应用"，所选用户角色更新为新角色。Toast提示"批量修改成功"。
result: issue
reported: "用户角色更新，需刷新页面后才能显示新的角色，无法立即显示修改后的角色"
severity: major

### 5. 项目列表表格功能

expected: 访问管理后台项目页面，表格显示项目列表，支持搜索（项目名称/描述/负责人搜索框）、排序、分页。表格列包含项目名、描述、负责人、状态等信息。
result: issue
reported: "页面崩溃报错 - Cannot read properties of undefined (reading 'avatar') at MembersPanel.tsx:241 - member.users.avatar为undefined，成员数据结构不匹配"
severity: blocker

### 6. 创建新项目

expected: 点击"创建项目"按钮，弹出创建对话框。填写项目名称、描述、选择负责人，点击"提交"，项目出现在列表中，Toast提示"创建成功"。
result: issue
reported: "创建项目时无法选择负责人 - 负责人选择器组件不工作"
severity: major

### 7. 编辑项目

expected: 点击项目行的"编辑"按钮，弹出编辑对话框，显示现有项目信息（名称、描述、负责人）。修改字段后点击"提交"，项目信息更新，Toast提示"更新成功"。
result: issue
reported: "项目管理页面缺少编辑按钮 - 无法编辑现有项目"
severity: major

### 8. 删除项目

expected: 点击项目行的"删除"按钮，弹出确认对话框（使用shadcn Dialog组件，不是浏览器confirm()）。确认后项目从列表中移除，Toast提示"删除成功"。
result: issue
reported: "删除确认对话框使用浏览器原生confirm() - 应使用shadcn Dialog组件保持UI一致性"
severity: minor

### 9. 归档/取消归档项目

expected: 点击项目行的"归档"按钮，弹出确认对话框（shadcn Dialog组件）。确认后项目状态变为ARCHIVED，显示归档徽章（灰色背景）。点击"取消归档"，状态恢复为ACTIVE，徽章消失。Toast提示操作成功。
result: issue
reported: "项目管理页面缺少归档功能 - 无法归档或取消归档项目"
severity: major

### 10. 项目成员管理

expected: 在项目页面点击"成员管理"或进入项目详情，显示成员列表。搜索框可搜索用户（输入姓名或邮箱），点击"添加成员"弹出对话框，选择用户和角色后添加。点击成员的"移除"按钮，弹出确认对话框后移除该成员。
result: issue
reported: "添加项目成员时一次只能选择一个用户，无法多选批量添加成员"
severity: minor

### 11. AI配置管理

expected: 访问AI配置页面，列表显示已配置的AI Provider（OpenAI、Anthropic、Custom）。点击"创建"按钮，弹出对话框，选择Provider类型（下拉框），填写API Key和Base URL（Custom类型显示Base URL字段）。点击"提交"，配置出现在列表中。
result: issue
reported: "AI配置页面自定义服务商选项受限 - 仅支持Ollama，不支持其他自定义API URL格式"
severity: major

### 12. AI连接测试

expected: 在AI配置创建对话框或编辑对话框中，点击"测试连接"按钮。按钮显示加载状态（spinner图标），10秒内返回结果。成功时Toast提示"连接成功"并显示可用模型列表，失败时Toast提示错误信息（如超时、认证失败、网络错误）。
result: blocked
blocked_by: prior-phase
reason: "AI连接测试功能无法验证 - 依赖于自定义API URL支持（Issue 5）的修复，当前仅支持Ollama"

### 13. 编辑/删除AI配置

expected: 点击AI配置的"编辑"按钮，弹出对话框显示现有配置（Provider类型、API Key、Base URL）。修改后点击"提交"更新配置。点击"删除"按钮，弹出确认对话框后配置从列表移除，Toast提示"删除成功"。
result: pass

### 14. 邮件配置管理

expected: 访问邮件配置页面，列表显示已配置的邮件服务。点击"创建"按钮，弹出对话框，选择Provider类型（SMTP/SendGrid/Company），填写Host、Port、User、Password等SMTP字段。点击"提交"，配置出现在列表中。
result: issue
reported: "页面崩溃报错 - logs.slice is not a function at email/page.tsx:242 - logs变量不是数组，可能是undefined或null"
severity: blocker

### 15. 邮件SMTP连接测试

expected: 在邮件配置对话框中，点击"测试连接"按钮。按钮显示加载状态（spinner图标），5秒内返回结果。成功时Toast提示"SMTP连接成功"，失败时Toast提示错误信息（如连接超时、认证失败）。
result: blocked
blocked_by: server
reason: "邮件配置页面崩溃（Issue 4: blocker级别），无法访问SMTP连接测试功能"

### 16. 模板管理列表

expected: 访问模板管理页面，显示两个Tab："任务模板"和"评审模板"。每个Tab显示对应类型的模板列表，包含模板名称、类型、创建时间等信息。
result: pass

### 17. 创建/编辑模板

expected: 点击"创建模板"按钮，弹出对话框。选择模板类型（任务/评审），填写模板名称和内容（支持文本编辑）。内容区域使用Monospace字体格式。点击"提交"，模板出现在列表中。点击"编辑"按钮可修改现有模板。
result: issue
reported: "模板格式支持受限 - 任务模板仅支持JSON格式，评审模板不支持自定义格式，无法使用文本、Markdown等灵活格式"
severity: major

### 18. 模板预览变量高亮

expected: 在模板编辑对话框中，预览面板显示模板内容，其中{{variable}}占位符（如{{name}}、{{project}}、{{date}}）以黄色背景高亮显示，便于识别变量位置。
result: issue
reported: "模板预览功能缺失 - 模板编辑对话框中没有预览面板，无法预览模板内容和变量高亮"
severity: major

### 19. 模板导入/导出

expected: 在模板管理页面顶部，点击"导入"按钮，选择JSON文件，解析后批量导入模板（支持任务和评审模板）。点击"导出"按钮，下载当前Tab的所有模板为JSON文件（文件名格式：{type}-templates-{date}.json）。
result: issue
reported: "模板导入/导出功能异常 - 不支持模板内容的导出以及导入"
severity: major

### 4. 批量修改用户角色

expected: 在用户列表勾选多个用户，批量操作栏显示角色下拉框。选择新角色（如EMPLOYEE、PROJECT_ADMIN、ADMIN），点击"应用"，所选用户角色更新为新角色。Toast提示"批量修改成功"。
result: issue
reported: "用户角色更新，需刷新页面后才能显示新的角色，无法立即显示修改后的角色"
severity: major

### 5. 项目列表表格功能

expected: 访问管理后台项目页面，表格显示项目列表，支持搜索（项目名称/描述/负责人搜索框）、排序、分页。表格列包含项目名、描述、负责人、状态等信息。
result: issue
reported: "页面崩溃报错 - Cannot read properties of undefined (reading 'avatar') at MembersPanel.tsx:241 - member.users.avatar为undefined，成员数据结构不匹配"
severity: blocker

### 6. 创建新项目

expected: 点击"创建项目"按钮，弹出创建对话框。填写项目名称、描述、选择负责人，点击"提交"，项目出现在列表中，Toast提示"创建成功"。
result: issue
reported: "创建项目时无法选择负责人 - 负责人选择器组件不工作"
severity: major

### 7. 编辑项目

expected: 点击项目行的"编辑"按钮，弹出编辑对话框，显示现有项目信息（名称、描述、负责人）。修改字段后点击"提交"，项目信息更新，Toast提示"更新成功"。
result: issue
reported: "项目管理页面缺少编辑按钮 - 无法编辑现有项目"
severity: major

### 8. 删除项目

expected: 点击项目行的"删除"按钮，弹出确认对话框（使用shadcn Dialog组件，不是浏览器confirm()）。确认后项目从列表中移除，Toast提示"删除成功"。
result: issue
reported: "删除确认对话框使用浏览器原生confirm() - 应使用shadcn Dialog组件保持UI一致性"
severity: minor

### 9. 归档/取消归档项目

expected: 点击项目行的"归档"按钮，弹出确认对话框（shadcn Dialog组件）。确认后项目状态变为ARCHIVED，显示归档徽章（灰色背景）。点击"取消归档"，状态恢复为ACTIVE，徽章消失。Toast提示操作成功。
result: issue
reported: "项目管理页面缺少归档功能 - 无法归档或取消归档项目"
severity: major

### 10. 项目成员管理

expected: 在项目页面点击"成员管理"或进入项目详情，显示成员列表。搜索框可搜索用户（输入姓名或邮箱），点击"添加成员"弹出对话框，选择用户和角色后添加。点击成员的"移除"按钮，弹出确认对话框后移除该成员。
result: issue
reported: "添加项目成员时一次只能选择一个用户，无法多选批量添加成员"
severity: minor

### 11. AI配置管理

expected: 访问AI配置页面，列表显示已配置的AI Provider（OpenAI、Anthropic、Custom）。点击"创建"按钮，弹出对话框，选择Provider类型（下拉框），填写API Key和Base URL（Custom类型显示Base URL字段）。点击"提交"，配置出现在列表中。
result: issue
reported: "AI配置页面自定义服务商选项受限 - 仅支持Ollama，不支持其他自定义API URL格式"
severity: major

### 12. AI连接测试

expected: 在AI配置创建对话框或编辑对话框中，点击"测试连接"按钮。按钮显示加载状态（spinner图标），10秒内返回结果。成功时Toast提示"连接成功"并显示可用模型列表，失败时Toast提示错误信息（如超时、认证失败、网络错误）。
result: blocked
blocked_by: prior-phase
reason: "AI连接测试功能无法验证 - 依赖于自定义API URL支持（Issue 5）的修复，当前仅支持Ollama"

### 13. 编辑/删除AI配置

expected: 点击AI配置的"编辑"按钮，弹出对话框显示现有配置（Provider类型、API Key、Base URL）。修改后点击"提交"更新配置。点击"删除"按钮，弹出确认对话框后配置从列表移除，Toast提示"删除成功"。
result: pass

### 14. 邮件配置管理

expected: 访问邮件配置页面，列表显示已配置的邮件服务。点击"创建"按钮，弹出对话框，选择Provider类型（SMTP/SendGrid/Company），填写Host、Port、User、Password等SMTP字段。点击"提交"，配置出现在列表中。
result: issue
reported: "页面崩溃报错 - logs.slice is not a function at email/page.tsx:242 - logs变量不是数组，可能是undefined或null"
severity: blocker

### 15. 邮件SMTP连接测试

expected: 在邮件配置对话框中，点击"测试连接"按钮。按钮显示加载状态（spinner图标），5秒内返回结果。成功时Toast提示"SMTP连接成功"，失败时Toast提示错误信息（如连接超时、认证失败）。
result: blocked
blocked_by: server
reason: "邮件配置页面崩溃（Issue 4: blocker级别），无法访问SMTP连接测试功能"

### 16. 模板管理列表

expected: 访问模板管理页面，显示两个Tab："任务模板"和"评审模板"。每个Tab显示对应类型的模板列表，包含模板名称、类型、创建时间等信息。
result: pass

### 17. 创建/编辑模板

expected: 点击"创建模板"按钮，弹出对话框。选择模板类型（任务/评审），填写模板名称和内容（支持文本编辑）。内容区域使用Monospace字体格式。点击"提交"，模板出现在列表中。点击"编辑"按钮可修改现有模板。
result: issue
reported: "模板格式支持受限 - 任务模板仅支持JSON格式，评审模板不支持自定义格式，无法使用文本、Markdown等灵活格式"
severity: major

### 18. 模板预览变量高亮

expected: 在模板编辑对话框中，预览面板显示模板内容，其中{{variable}}占位符（如{{name}}、{{project}}、{{date}}）以黄色背景高亮显示，便于识别变量位置。
result: issue
reported: "模板预览功能缺失 - 模板编辑对话框中没有预览面板，无法预览模板内容和变量高亮"
severity: major

### 4. 批量修改用户角色

expected: 在用户列表勾选多个用户，批量操作栏显示角色下拉框。选择新角色（如EMPLOYEE、PROJECT_ADMIN、ADMIN），点击"应用"，所选用户角色更新为新角色。Toast提示"批量修改成功"。
result: issue
reported: "用户角色更新，需刷新页面后才能显示新的角色，无法立即显示修改后的角色"
severity: major

### 5. 项目列表表格功能

expected: 访问管理后台项目页面，表格显示项目列表，支持搜索（项目名称/描述/负责人搜索框）、排序、分页。表格列包含项目名、描述、负责人、状态等信息。
result: issue
reported: "页面崩溃报错 - Cannot read properties of undefined (reading 'avatar') at MembersPanel.tsx:241 - member.users.avatar为undefined，成员数据结构不匹配"
severity: blocker

### 6. 创建新项目

expected: 点击"创建项目"按钮，弹出创建对话框。填写项目名称、描述、选择负责人，点击"提交"，项目出现在列表中，Toast提示"创建成功"。
result: issue
reported: "创建项目时无法选择负责人 - 负责人选择器组件不工作"
severity: major

### 7. 编辑项目

expected: 点击项目行的"编辑"按钮，弹出编辑对话框，显示现有项目信息（名称、描述、负责人）。修改字段后点击"提交"，项目信息更新，Toast提示"更新成功"。
result: issue
reported: "项目管理页面缺少编辑按钮 - 无法编辑现有项目"
severity: major

### 8. 删除项目

expected: 点击项目行的"删除"按钮，弹出确认对话框（使用shadcn Dialog组件，不是浏览器confirm()）。确认后项目从列表中移除，Toast提示"删除成功"。
result: issue
reported: "删除确认对话框使用浏览器原生confirm() - 应使用shadcn Dialog组件保持UI一致性"
severity: minor

### 9. 归档/取消归档项目

expected: 点击项目行的"归档"按钮，弹出确认对话框（shadcn Dialog组件）。确认后项目状态变为ARCHIVED，显示归档徽章（灰色背景）。点击"取消归档"，状态恢复为ACTIVE，徽章消失。Toast提示操作成功。
result: issue
reported: "项目管理页面缺少归档功能 - 无法归档或取消归档项目"
severity: major

### 10. 项目成员管理

expected: 在项目页面点击"成员管理"或进入项目详情，显示成员列表。搜索框可搜索用户（输入姓名或邮箱），点击"添加成员"弹出对话框，选择用户和角色后添加。点击成员的"移除"按钮，弹出确认对话框后移除该成员。
result: issue
reported: "添加项目成员时一次只能选择一个用户，无法多选批量添加成员"
severity: minor

### 11. AI配置管理

expected: 访问AI配置页面，列表显示已配置的AI Provider（OpenAI、Anthropic、Custom）。点击"创建"按钮，弹出对话框，选择Provider类型（下拉框），填写API Key和Base URL（Custom类型显示Base URL字段）。点击"提交"，配置出现在列表中。
result: issue
reported: "AI配置页面自定义服务商选项受限 - 仅支持Ollama，不支持其他自定义API URL格式"
severity: major

### 12. AI连接测试

expected: 在AI配置创建对话框或编辑对话框中，点击"测试连接"按钮。按钮显示加载状态（spinner图标），10秒内返回结果。成功时Toast提示"连接成功"并显示可用模型列表，失败时Toast提示错误信息（如超时、认证失败、网络错误）。
result: blocked
blocked_by: prior-phase
reason: "AI连接测试功能无法验证 - 依赖于自定义API URL支持（Issue 5）的修复，当前仅支持Ollama"

### 13. 编辑/删除AI配置

expected: 点击AI配置的"编辑"按钮，弹出对话框显示现有配置（Provider类型、API Key、Base URL）。修改后点击"提交"更新配置。点击"删除"按钮，弹出确认对话框后配置从列表移除，Toast提示"删除成功"。
result: pass

### 14. 邮件配置管理

expected: 访问邮件配置页面，列表显示已配置的邮件服务。点击"创建"按钮，弹出对话框，选择Provider类型（SMTP/SendGrid/Company），填写Host、Port、User、Password等SMTP字段。点击"提交"，配置出现在列表中。
result: issue
reported: "页面崩溃报错 - logs.slice is not a function at email/page.tsx:242 - logs变量不是数组，可能是undefined或null"
severity: blocker

### 15. 邮件SMTP连接测试

expected: 在邮件配置对话框中，点击"测试连接"按钮。按钮显示加载状态（spinner图标），5秒内返回结果。成功时Toast提示"SMTP连接成功"，失败时Toast提示错误信息（如连接超时、认证失败）。
result: blocked
blocked_by: server
reason: "邮件配置页面崩溃（Issue 4: blocker级别），无法访问SMTP连接测试功能"

### 16. 模板管理列表

expected: 访问模板管理页面，显示两个Tab："任务模板"和"评审模板"。每个Tab显示对应类型的模板列表，包含模板名称、类型、创建时间等信息。
result: pass

### 17. 创建/编辑模板

expected: 点击"创建模板"按钮，弹出对话框。选择模板类型（任务/评审），填写模板名称和内容（支持文本编辑）。内容区域使用Monospace字体格式。点击"提交"，模板出现在列表中。点击"编辑"按钮可修改现有模板。
result: issue
reported: "模板格式支持受限 - 任务模板仅支持JSON格式，评审模板不支持自定义格式，无法使用文本、Markdown等灵活格式"
severity: major

### 6. 创建新项目

expected: 点击"创建项目"按钮，弹出创建对话框。填写项目名称、描述、选择负责人，点击"提交"，项目出现在列表中，Toast提示"创建成功"。
result: issue
reported: "创建项目时无法选择负责人 - 负责人选择器组件不工作"
severity: major

### 7. 编辑项目

expected: 点击项目行的"编辑"按钮，弹出编辑对话框，显示现有项目信息（名称、描述、负责人）。修改字段后点击"提交"，项目信息更新，Toast提示"更新成功"。
result: issue
reported: "项目管理页面缺少编辑按钮 - 无法编辑现有项目"
severity: major

### 8. 删除项目

expected: 点击项目行的"删除"按钮，弹出确认对话框（使用shadcn Dialog组件，不是浏览器confirm()）。确认后项目从列表中移除，Toast提示"删除成功"。
result: issue
reported: "删除确认对话框使用浏览器原生confirm() - 应使用shadcn Dialog组件保持UI一致性"
severity: minor

### 9. 归档/取消归档项目

expected: 点击项目行的"归档"按钮，弹出确认对话框（shadcn Dialog组件）。确认后项目状态变为ARCHIVED，显示归档徽章（灰色背景）。点击"取消归档"，状态恢复为ACTIVE，徽章消失。Toast提示操作成功。
result: issue
reported: "项目管理页面缺少归档功能 - 无法归档或取消归档项目"
severity: major

### 10. 项目成员管理

expected: 在项目页面点击"成员管理"或进入项目详情，显示成员列表。搜索框可搜索用户（输入姓名或邮箱），点击"添加成员"弹出对话框，选择用户和角色后添加。点击成员的"移除"按钮，弹出确认对话框后移除该成员。
result: issue
reported: "添加项目成员时一次只能选择一个用户，无法多选批量添加成员"
severity: minor

### 11. AI配置管理

expected: 访问AI配置页面，列表显示已配置的AI Provider（OpenAI、Anthropic、Custom）。点击"创建"按钮，弹出对话框，选择Provider类型（下拉框），填写API Key和Base URL（Custom类型显示Base URL字段）。点击"提交"，配置出现在列表中。
result: issue
reported: "AI配置页面自定义服务商选项受限 - 仅支持Ollama，不支持其他自定义API URL格式"
severity: major

### 12. AI连接测试

expected: 在AI配置创建对话框或编辑对话框中，点击"测试连接"按钮。按钮显示加载状态（spinner图标），10秒内返回结果。成功时Toast提示"连接成功"并显示可用模型列表，失败时Toast提示错误信息（如超时、认证失败、网络错误）。
result: blocked
blocked_by: prior-phase
reason: "AI连接测试功能无法验证 - 依赖于自定义API URL支持（Issue 5）的修复，当前仅支持Ollama"

### 13. 编辑/删除AI配置

expected: 点击AI配置的"编辑"按钮，弹出对话框显示现有配置（Provider类型、API Key、Base URL）。修改后点击"提交"更新配置。点击"删除"按钮，弹出确认对话框后配置从列表移除，Toast提示"删除成功"。
result: pass

### 14. 邮件配置管理

expected: 访问邮件配置页面，列表显示已配置的邮件服务。点击"创建"按钮，弹出对话框，选择Provider类型（SMTP/SendGrid/Company），填写Host、Port、User、Password等SMTP字段。点击"提交"，配置出现在列表中。
result: issue
reported: "页面崩溃报错 - logs.slice is not a function at email/page.tsx:242 - logs变量不是数组，可能是undefined或null"
severity: blocker

### 2. CSV批量导入用户

expected: 点击"导入"按钮，弹出CSV导入对话框。上传CSV文件后，对话框显示解析预览（表格形式，显示邮箱、姓名、角色列）。点击"确认导入"后，成功导入的用户出现在列表中，重复邮箱被自动跳过。
result: pass

### 3. 批量激活/禁用用户

expected: 在用户列表勾选多个用户，底部出现批量操作栏。点击"激活"按钮，弹出确认对话框，确认后所选用户状态变为ACTIVE。点击"禁用"，确认后状态变为INACTIVE。Toast显示操作成功提示。
result: issue
reported: "激活或禁用状态修改后无法立即更新，需要刷新页面才能看到变化。同时出现React Hydration Mismatch错误（className顺序不一致导致服务端/客户端渲染不匹配）"
severity: major

### 4. 批量修改用户角色

expected: 在用户列表勾选多个用户，批量操作栏显示角色下拉框。选择新角色（如EMPLOYEE、PROJECT_ADMIN、ADMIN），点击"应用"，所选用户角色更新为新角色。Toast提示"批量修改成功"。
result: issue
reported: "用户角色更新，需刷新页面后才能显示新的角色，无法立即显示修改后的角色"
severity: major

### 5. 项目列表表格功能

expected: 访问管理后台项目页面，表格显示项目列表，支持搜索（项目名称/描述/负责人搜索框）、排序、分页。表格列包含项目名、描述、负责人、状态等信息。
result: issue
reported: "页面崩溃报错 - Cannot read properties of undefined (reading 'avatar') at MembersPanel.tsx:241 - member.users.avatar为undefined，成员数据结构不匹配"
severity: blocker

### 6. 创建新项目

expected: 点击"创建项目"按钮，弹出创建对话框。填写项目名称、描述、选择负责人，点击"提交"，项目出现在列表中，Toast提示"创建成功"。
result: issue
reported: "创建项目时无法选择负责人 - 负责人选择器组件不工作"
severity: major

### 7. 编辑项目

expected: 点击项目行的"编辑"按钮，弹出编辑对话框，显示现有项目信息（名称、描述、负责人）。修改字段后点击"提交"，项目信息更新，Toast提示"更新成功"。
result: issue
reported: "项目管理页面缺少编辑按钮 - 无法编辑现有项目"
severity: major

### 8. 删除项目

expected: 点击项目行的"删除"按钮，弹出确认对话框（使用shadcn Dialog组件，不是浏览器confirm()）。确认后项目从列表中移除，Toast提示"删除成功"。
result: issue
reported: "删除确认对话框使用浏览器原生confirm() - 应使用shadcn Dialog组件保持UI一致性"
severity: minor

### 9. 归档/取消归档项目

expected: 点击项目行的"归档"按钮，弹出确认对话框（shadcn Dialog组件）。确认后项目状态变为ARCHIVED，显示归档徽章（灰色背景）。点击"取消归档"，状态恢复为ACTIVE，徽章消失。Toast提示操作成功。
result: issue
reported: "项目管理页面缺少归档功能 - 无法归档或取消归档项目"
severity: major

### 10. 项目成员管理

expected: 在项目页面点击"成员管理"或进入项目详情，显示成员列表。搜索框可搜索用户（输入姓名或邮箱），点击"添加成员"弹出对话框，选择用户和角色后添加。点击成员的"移除"按钮，弹出确认对话框后移除该成员。
result: issue
reported: "添加项目成员时一次只能选择一个用户，无法多选批量添加成员"
severity: minor

### 11. AI配置管理

expected: 访问AI配置页面，列表显示已配置的AI Provider（OpenAI、Anthropic、Custom）。点击"创建"按钮，弹出对话框，选择Provider类型（下拉框），填写API Key和Base URL（Custom类型显示Base URL字段）。点击"提交"，配置出现在列表中。
result: issue
reported: "AI配置页面自定义服务商选项受限 - 仅支持Ollama，不支持其他自定义API URL格式"
severity: major

### 12. AI连接测试

expected: 在AI配置创建对话框或编辑对话框中，点击"测试连接"按钮。按钮显示加载状态（spinner图标），10秒内返回结果。成功时Toast提示"连接成功"并显示可用模型列表，失败时Toast提示错误信息（如超时、认证失败、网络错误）。
result: blocked
blocked_by: prior-phase
reason: "AI连接测试功能无法验证 - 依赖于自定义API URL支持（Issue 5）的修复，当前仅支持Ollama"

### 13. 编辑/删除AI配置

expected: 点击AI配置的"编辑"按钮，弹出对话框显示现有配置（Provider类型、API Key、Base URL）。修改后点击"提交"更新配置。点击"删除"按钮，弹出确认对话框后配置从列表移除，Toast提示"删除成功"。
result: pass

### 4. 批量修改用户角色

expected: 在用户列表勾选多个用户，批量操作栏显示角色下拉框。选择新角色（如EMPLOYEE、PROJECT_ADMIN、ADMIN），点击"应用"，所选用户角色更新为新角色。Toast提示"批量修改成功"。
result: issue
reported: "用户角色更新，需刷新页面后才能显示新的角色，无法立即显示修改后的角色"
severity: major

### 5. 项目列表表格功能

expected: 访问管理后台项目页面，表格显示项目列表，支持搜索（项目名称/描述/负责人搜索框）、排序、分页。表格列包含项目名、描述、负责人、状态等信息。
result: issue
reported: "页面崩溃报错 - Cannot read properties of undefined (reading 'avatar') at MembersPanel.tsx:241 - member.users.avatar为undefined，成员数据结构不匹配"
severity: blocker

### 6. 创建新项目

expected: 点击"创建项目"按钮，弹出创建对话框。填写项目名称、描述、选择负责人，点击"提交"，项目出现在列表中，Toast提示"创建成功"。
result: issue
reported: "创建项目时无法选择负责人 - 负责人选择器组件不工作"
severity: major

### 7. 编辑项目

expected: 点击项目行的"编辑"按钮，弹出编辑对话框，显示现有项目信息（名称、描述、负责人）。修改字段后点击"提交"，项目信息更新，Toast提示"更新成功"。
result: issue
reported: "项目管理页面缺少编辑按钮 - 无法编辑现有项目"
severity: major

### 8. 删除项目

expected: 点击项目行的"删除"按钮，弹出确认对话框（使用shadcn Dialog组件，不是浏览器confirm()）。确认后项目从列表中移除，Toast提示"删除成功"。
result: issue
reported: "删除确认对话框使用浏览器原生confirm() - 应使用shadcn Dialog组件保持UI一致性"
severity: minor

### 9. 归档/取消归档项目

expected: 点击项目行的"归档"按钮，弹出确认对话框（shadcn Dialog组件）。确认后项目状态变为ARCHIVED，显示归档徽章（灰色背景）。点击"取消归档"，状态恢复为ACTIVE，徽章消失。Toast提示操作成功。
result: issue
reported: "项目管理页面缺少归档功能 - 无法归档或取消归档项目"
severity: major

### 10. 项目成员管理

expected: 在项目页面点击"成员管理"或进入项目详情，显示成员列表。搜索框可搜索用户（输入姓名或邮箱），点击"添加成员"弹出对话框，选择用户和角色后添加。点击成员的"移除"按钮，弹出确认对话框后移除该成员。
result: issue
reported: "添加项目成员时一次只能选择一个用户，无法多选批量添加成员"
severity: minor

### 11. AI配置管理

expected: 访问AI配置页面，列表显示已配置的AI Provider（OpenAI、Anthropic、Custom）。点击"创建"按钮，弹出对话框，选择Provider类型（下拉框），填写API Key和Base URL（Custom类型显示Base URL字段）。点击"提交"，配置出现在列表中。
result: issue
reported: "AI配置页面自定义服务商选项受限 - 仅支持Ollama，不支持其他自定义API URL格式"
severity: major

### 9. 归档/取消归档项目

expected: 点击项目行的"归档"按钮，弹出确认对话框（shadcn Dialog组件）。确认后项目状态变为ARCHIVED，显示归档徽章（灰色背景）。点击"取消归档"，状态恢复为ACTIVE，徽章消失。Toast提示操作成功。
result: issue
reported: "项目管理页面缺少归档功能 - 无法归档或取消归档项目"
severity: major

### 10. 项目成员管理

expected: 在项目页面点击"成员管理"或进入项目详情，显示成员列表。搜索框可搜索用户（输入姓名或邮箱），点击"添加成员"弹出对话框，选择用户和角色后添加。点击成员的"移除"按钮，弹出确认对话框后移除该成员。
result: issue
reported: "添加项目成员时一次只能选择一个用户，无法多选批量添加成员"
severity: minor

### 4. 批量修改用户角色

expected: 在用户列表勾选多个用户，批量操作栏显示角色下拉框。选择新角色（如EMPLOYEE、PROJECT_ADMIN、ADMIN），点击"应用"，所选用户角色更新为新角色。Toast提示"批量修改成功"。
result: issue
reported: "用户角色更新，需刷新页面后才能显示新的角色，无法立即显示修改后的角色"
severity: major

### 5. 项目列表表格功能

expected: 访问管理后台项目页面，表格显示项目列表，支持搜索（项目名称/描述/负责人搜索框）、排序、分页。表格列包含项目名、描述、负责人、状态等信息。
result: issue
reported: "页面崩溃报错 - Cannot read properties of undefined (reading 'avatar') at MembersPanel.tsx:241 - member.users.avatar为undefined，成员数据结构不匹配"
severity: blocker

### 6. 创建新项目

expected: 点击"创建项目"按钮，弹出创建对话框。填写项目名称、描述、选择负责人，点击"提交"，项目出现在列表中，Toast提示"创建成功"。
result: issue
reported: "创建项目时无法选择负责人 - 负责人选择器组件不工作"
severity: major

### 7. 编辑项目

expected: 点击项目行的"编辑"按钮，弹出编辑对话框，显示现有项目信息（名称、描述、负责人）。修改字段后点击"提交"，项目信息更新，Toast提示"更新成功"。
result: issue
reported: "项目管理页面缺少编辑按钮 - 无法编辑现有项目"
severity: major

### 8. 删除项目

expected: 点击项目行的"删除"按钮，弹出确认对话框（使用shadcn Dialog组件，不是浏览器confirm()）。确认后项目从列表中移除，Toast提示"删除成功"。
result: issue
reported: "删除确认对话框使用浏览器原生confirm() - 应使用shadcn Dialog组件保持UI一致性"
severity: minor

### 9. 归档/取消归档项目

expected: 点击项目行的"归档"按钮，弹出确认对话框（shadcn Dialog组件）。确认后项目状态变为ARCHIVED，显示归档徽章（灰色背景）。点击"取消归档"，状态恢复为ACTIVE，徽章消失。Toast提示操作成功。
result: issue
reported: "项目管理页面缺少归档功能 - 无法归档或取消归档项目"
severity: major

### 4. 批量修改用户角色

expected: 在用户列表勾选多个用户，批量操作栏显示角色下拉框。选择新角色（如EMPLOYEE、PROJECT_ADMIN、ADMIN），点击"应用"，所选用户角色更新为新角色。Toast提示"批量修改成功"。
result: issue
reported: "用户角色更新，需刷新页面后才能显示新的角色，无法立即显示修改后的角色"
severity: major

### 5. 项目列表表格功能

expected: 访问管理后台项目页面，表格显示项目列表，支持搜索（项目名称/描述/负责人搜索框）、排序、分页。表格列包含项目名、描述、负责人、状态等信息。
result: issue
reported: "页面崩溃报错 - Cannot read properties of undefined (reading 'avatar') at MembersPanel.tsx:241 - member.users.avatar为undefined，成员数据结构不匹配"
severity: blocker

### 6. 创建新项目

expected: 点击"创建项目"按钮，弹出创建对话框。填写项目名称、描述、选择负责人，点击"提交"，项目出现在列表中，Toast提示"创建成功"。
result: issue
reported: "创建项目时无法选择负责人 - 负责人选择器组件不工作"
severity: major

### 7. 编辑项目

expected: 点击项目行的"编辑"按钮，弹出编辑对话框，显示现有项目信息（名称、描述、负责人）。修改字段后点击"提交"，项目信息更新，Toast提示"更新成功"。
result: issue
reported: "项目管理页面缺少编辑按钮 - 无法编辑现有项目"
severity: major

### 4. 批量修改用户角色

expected: 在用户列表勾选多个用户，批量操作栏显示角色下拉框。选择新角色（如EMPLOYEE、PROJECT_ADMIN、ADMIN），点击"应用"，所选用户角色更新为新角色。Toast提示"批量修改成功"。
result: issue
reported: "用户角色更新，需刷新页面后才能显示新的角色，无法立即显示修改后的角色"
severity: major

### 5. 项目列表表格功能

expected: 访问管理后台项目页面，表格显示项目列表，支持搜索（项目名称/描述/负责人搜索框）、排序、分页。表格列包含项目名、描述、负责人、状态等信息。
result: issue
reported: "页面崩溃报错 - Cannot read properties of undefined (reading 'avatar') at MembersPanel.tsx:241 - member.users.avatar为undefined，成员数据结构不匹配"
severity: blocker

### 6. 创建新项目

expected: 点击"创建项目"按钮，弹出创建对话框。填写项目名称、描述、选择负责人，点击"提交"，项目出现在列表中，Toast提示"创建成功"。
result: issue
reported: "创建项目时无法选择负责人 - 负责人选择器组件不工作"
severity: major

### 4. 批量修改用户角色

expected: 在用户列表勾选多个用户，批量操作栏显示角色下拉框。选择新角色（如EMPLOYEE、PROJECT_ADMIN、ADMIN），点击"应用"按钮，所选用户角色更新为新角色。Toast提示"批量修改成功"。
result: issue
reported: "用户角色更新，需要刷新页面后才能显示新的角色，无法立即显示修改后的角色"
severity: major

### 2. CSV批量导入用户

expected: 点击"导入"按钮，弹出CSV导入对话框。上传CSV文件后，对话框显示解析预览（表格形式，显示邮箱、姓名、角色列）。点击"确认导入"后，成功导入的用户出现在列表中，重复邮箱被自动跳过。
result: pass

### 2. CSV批量导入用户

expected: 点击"导入"按钮，弹出CSV导入对话框。上传CSV文件后，对话框显示解析预览（表格形式，显示邮箱、姓名、角色列）。点击"确认导入"后，成功导入的用户出现在列表中，重复邮箱被自动跳过。
result: [pending]

### 3. 批量激活/禁用用户

expected: 在用户列表勾选多个用户（行选择），底部出现批量操作栏。点击"激活"按钮，弹出确认对话框，确认后所选用户状态变为ACTIVE。点击"禁用"，确认后状态变为INACTIVE。
result: [pending]

### 4. 批量修改用户角色

expected: 在用户列表勾选多个用户，批量操作栏显示角色下拉框。选择新角色（如EMPLOYEE、PROJECT_ADMIN），点击"应用"，所选用户角色更新为新角色。
result: [pending]

### 5. 项目列表表格功能

expected: 访问管理后台项目页面，表格显示项目列表，支持搜索（项目名称/描述/负责人搜索框）、排序、分页。表格列包含项目名、描述、负责人、状态等信息。
result: [pending]

### 6. 创建新项目

expected: 点击"创建项目"按钮，弹出创建对话框。填写项目名称、描述、选择负责人，点击"提交"，项目出现在列表中，Toast提示"创建成功"。
result: [pending]

### 7. 编辑项目

expected: 点击项目行的"编辑"按钮，弹出编辑对话框，显示现有项目信息。修改字段后点击"提交"，项目信息更新，Toast提示"更新成功"。
result: [pending]

### 8. 删除项目

expected: 点击项目行的"删除"按钮，弹出确认对话框（不是浏览器confirm()）。确认后项目从列表中移除，Toast提示"删除成功"。
result: [pending]

### 9. 归档/取消归档项目

expected: 点击项目行的"归档"按钮，弹出确认对话框。确认后项目状态变为ARCHIVED，显示归档徽章。点击"取消归档"，状态恢复为ACTIVE。
result: [pending]

### 10. 项目成员管理

expected: 在项目页面点击"成员管理"或进入项目详情，显示成员列表。搜索框可搜索用户，点击"添加成员"弹出对话框，选择用户和角色后添加。点击成员的"移除"，弹出确认对话框后移除该成员。
result: [pending]

### 11. AI配置管理

expected: 访问AI配置页面，列表显示已配置的AI Provider（OpenAI、Anthropic、Custom）。点击"创建"，弹出对话框，选择Provider类型（下拉框），填写API Key和Base URL（Custom类型显示Base URL字段）。点击"提交"，配置出现在列表中。
result: [pending]

### 12. AI连接测试

expected: 在AI配置创建对话框或编辑对话框中，点击"测试连接"按钮。按钮显示加载状态（spinner），10秒内返回结果。成功时Toast提示连接成功及模型列表，失败时Toast提示错误信息（如超时、认证失败）。
result: [pending]

### 13. 编辑/删除AI配置

expected: 点击AI配置的"编辑"按钮，弹出对话框显示现有配置。修改后点击"提交"更新。点击"删除"，弹出确认对话框后配置从列表移除。
result: [pending]

### 14. 邮件配置管理

expected: 访问邮件配置页面，列表显示已配置的邮件服务。点击"创建"，弹出对话框，选择Provider类型（SMTP/SendGrid/Company），填写Host、Port、User、Password等SMTP字段。点击"提交"，配置出现在列表中。
result: [pending]

### 15. 邮件SMTP连接测试

expected: 在邮件配置对话框中，点击"测试连接"按钮。按钮显示加载状态，5秒内返回结果。成功时Toast提示SMTP连接成功，失败时Toast提示错误信息。
result: [pending]

### 16. 模板管理列表

expected: 访问模板管理页面，显示两个Tab："任务模板"和"评审模板"。每个Tab显示对应类型的模板列表，包含模板名称、类型、创建时间等信息。
result: [pending]

### 17. 创建/编辑模板

expected: 点击"创建模板"按钮，弹出对话框。选择模板类型（任务/评审），填写模板名称和内容（支持文本编辑）。内容区域支持Monospace字体格式。点击"提交"，模板出现在列表中。点击"编辑"可修改现有模板。
result: [pending]

### 18. 模板预览变量高亮

expected: 在模板编辑对话框中，预览面板显示模板内容，其中{{variable}}占位符（如{{name}}、{{project}}）以黄色背景高亮显示。
result: [pending]

### 19. 模板导入/导出

expected: 在模板管理页面顶部，点击"导入"按钮，选择JSON文件，解析后批量导入模板。点击"导出"按钮，下载当前Tab的所有模板为JSON文件（文件名包含类型和日期）。
result: [pending]

### 20. 权限配置页面布局

expected: 访问权限配置页面，左侧显示资源树（项目列表，每个项目显示成员数量徽章），右侧显示权限编辑器。点击左侧项目，右侧加载该项目的权限配置。
result: [pending]

### 21. 添加项目成员权限

expected: 在权限编辑器中，点击"添加成员"按钮，弹出对话框。搜索框可搜索用户（输入姓名或邮箱），选择用户后选择角色（PROJECT_OWNER/PROJECT_MEMBER），点击"添加"，成员出现在列表中。
result: [pending]

### 22. 移除项目成员权限

expected: 在权限编辑器成员列表中，点击成员的"移除"按钮，弹出确认对话框。确认后成员从列表移除，Toast提示"移除成功"。
result: [pending]

### 23. 查看继承权限

expected: 在权限编辑器成员列表中，某些成员显示"继承"徽章，表示其权限从项目成员关系自动继承。继承权限显示为"查看"级别。
result: [pending]

### 24. 修改成员角色

expected: 在权限编辑器成员列表中，点击成员的角色下拉框，选择新角色（PROJECT_OWNER或PROJECT_MEMBER）。角色更新后，Toast提示"角色更新成功"。
result: [pending]

### 25. 项目设置页面导航

expected: 在项目管理页面，点击某个项目的"设置"按钮或链接，进入项目设置页面。页面显示三个Tab："Webhook配置"、"通知设置"、"默认值"。
result: [pending]

### 26. Webhook配置管理

expected: 在项目设置Webhook Tab中，显示已配置的Webhook列表（URL、事件类型、状态）。点击"创建Webhook"，弹出对话框，填写URL、选择触发事件（如任务创建、任务完成），点击"提交"，Webhook出现在列表中。
result: [pending]

### 27. Webhook连接测试

expected: 在Webhook创建对话框或编辑对话框中，点击"测试连接"按钮。按钮显示加载状态，POST请求发送到Webhook URL，返回结果通过Toast提示（成功/失败）。
result: [pending]

### 28. 通知设置配置

expected: 在项目设置通知Tab中，显示通知设置表单。包含开关："任务分配通知"、"任务截止提醒"、"成员通知"。任务截止提醒有时间选择器（提前多少天）。风险阈值告警有阈值输入框。
result: [pending]

### 29. 项目默认值配置

expected: 在项目设置默认值Tab中，显示默认值表单。包含"默认任务负责人"下拉框（可选择项目成员），"默认优先级"下拉框（高/中/低），"默认状态"下拉框，"默认可见性"下拉框。
result: [pending]

### 30. 暗色主题兼容性

expected: 切换系统或应用主题为暗色模式，所有管理后台页面（用户、项目、AI、邮件、模板、权限、项目设置）的UI元素（徽章、按钮、对话框、表格）正确渲染，颜色适配暗色背景（使用dark:前缀样式）。
result: [pending]

## Summary

total: 30
passed: 4
issues: 16
pending: 0
skipped: 0
blocked: 10

## Gaps

- truth: "批量激活/禁用操作后，用户状态立即在表格中更新显示，无需手动刷新页面"
  status: failed
  reason: "User reported: 激活或禁用状态修改后无法立即更新，需要刷新页面才能看到变化"
  severity: major
  test: 3
  artifacts: []
  missing: []

- truth: "页面渲染无React hydration错误，className顺序在服务端和客户端保持一致"
  status: failed
  reason: "User reported: React Hydration Mismatch错误 - className顺序不一致导致服务端/客户端渲染不匹配"
  severity: major
  test: 3
  artifacts: []
  missing: []

- truth: "批量修改角色操作后，角色立即在表格中更新显示，无需手动刷新页面"
  status: failed
  reason: "User reported: 用户角色更新，需刷新页面后才能显示新的角色，无法立即显示修改后的角色"
  severity: major
  test: 4
  artifacts: []
  missing: []

- truth: "项目页面正常加载，显示项目列表和成员数据"
  status: failed
  reason: "User reported: 页面崩溃报错 - Cannot read properties of undefined (reading 'avatar') at MembersPanel.tsx:241 - member.users.avatar为undefined，成员数据结构不匹配"
  severity: blocker
  test: 5
  artifacts: ["src/app/(main)/admin/projects/components/MembersPanel.tsx"]
  missing: []

- truth: "创建项目对话框中负责人选择器正常工作，可搜索并选择用户"
  status: failed
  reason: "User reported: 创建项目时无法选择负责人 - 负责人选择器组件不工作"
  severity: major
  test: 6
  artifacts: []
  missing: []

- truth: "项目管理页面每行有编辑按钮，点击弹出编辑对话框修改项目信息"
  status: failed
  reason: "User reported: 项目管理页面缺少编辑按钮 - 无法编辑现有项目"
  severity: major
  test: 7
  artifacts: []
  missing: []

- truth: "删除项目确认对话框使用shadcn Dialog组件，保持UI一致性"
  status: failed
  reason: "User reported: 删除确认对话框使用浏览器原生confirm() - 应使用shadcn Dialog组件"
  severity: minor
  test: 8
  artifacts: []
  missing: []

- truth: "项目管理页面有归档按钮，点击后可归档或取消归档项目"
  status: failed
  reason: "User reported: 项目管理页面缺少归档功能 - 无法归档或取消归档项目"
  severity: major
  test: 9
  artifacts: []
  missing: []

- truth: "添加项目成员对话框支持批量多选，可一次添加多个成员"
  status: failed
  reason: "User reported: 添加项目成员时一次只能选择一个用户，无法多选批量添加成员"
  severity: minor
  test: 10
  artifacts: []
  missing: []

- truth: "AI配置页面支持多种自定义服务商，可输入任意API URL"
  status: failed
  reason: "User reported: AI配置页面自定义服务商选项受限 - 仅支持Ollama，不支持其他自定义API URL格式"
  severity: major
  test: 11
  artifacts: []
  missing: []

- truth: "邮件配置页面正常加载，显示邮件服务配置列表和发送记录"
  status: failed
  reason: "User reported: 页面崩溃报错 - logs.slice is not a function at email/page.tsx:242 - logs变量不是数组，可能是undefined或null"
  severity: blocker
  test: 14
  artifacts: ["src/app/(main)/admin/email/page.tsx"]
  missing: []

- truth: "模板管理支持多种格式（JSON、文本、Markdown等），用户可灵活选择模板格式"
  status: failed
  reason: "User reported: 模板格式支持受限 - 任务模板仅支持JSON格式，评审模板不支持自定义格式，无法使用文本、Markdown等灵活格式"
  severity: major
  test: 17
  artifacts: []
  missing: []

- truth: "模板编辑对话框有预览面板，显示模板内容并高亮{{variable}}占位符"
  status: failed
  reason: "User reported: 模板预览功能缺失 - 模板编辑对话框中没有预览面板，无法预览模板内容和变量高亮"
  severity: major
  test: 18
  artifacts: []
  missing: []

- truth: "模板管理页面支持导入JSON文件批量导入模板，支持导出当前Tab所有模板为JSON文件"
  status: failed
  reason: "User reported: 模板导入/导出功能异常 - 不支持模板内容的导出以及导入"
  severity: major
  test: 19
  artifacts: []
  missing: []

- truth: "权限配置页面正常加载，显示项目资源树和权限编辑器，可管理项目权限"
  status: failed
  reason: "User reported: 权限配置页面无法使用 - 页面功能完全不工作"
  severity: blocker
  test: 20
  artifacts: []
  missing: []

- truth: "项目设置页面可正常访问，显示Webhook配置、通知设置、默认值三个Tab"
  status: failed
  reason: "User reported: 项目设置页面无法访问 - 项目页面崩溃导致无法进入项目设置页面"
  severity: blocker
  test: 25
  artifacts: []
  missing: []

- truth: "所有管理后台页面（包括里程碑、需求、问题管理）正确适配暗色主题，UI元素使用dark:前缀样式"
  status: failed
  reason: "User reported: 里程碑管理、需求管理、问题管理页面暗色主题未适配 - 颜色没有适配暗色背景。且这些页面缺少导航按钮 - 无法返回上一级或dashboard"
  severity: major
  test: 30
  artifacts: []
  missing: []

- truth: "权限配置页面正常工作，可增加新项目并配置权限"
  status: failed
  reason: "User reported: 权限配置页面功能缺失 - 无法增加新项目并配置权限，无法进行权限配置测试"
  severity: major
  test: 20
  artifacts: []
  missing: []

- truth: "页面渲染无React hydration错误，className顺序在服务端和客户端保持一致"
  status: failed
  reason: "User reported: React Hydration Mismatch错误 - className顺序不一致导致服务端/客户端渲染不匹配"
  severity: major
  test: 3
  artifacts: []
  missing: []

- truth: "批量修改角色操作后，角色立即在表格中更新显示，无需手动刷新页面"
  status: failed
  reason: "User reported: 用户角色更新，需刷新页面后才能显示新的角色，无法立即显示修改后的角色"
  severity: major
  test: 4
  artifacts: []
  missing: []

- truth: "项目管理页面正常加载，显示项目列表和成员信息"
  status: failed
  reason: "User reported: 页面崩溃报错 - Cannot read properties of undefined (reading 'avatar') at MembersPanel.tsx:241 - member.users.avatar为undefined，成员数据结构不匹配"
  severity: blocker
  test: 5
  artifacts: ["src/app/(main)/admin/projects/components/MembersPanel.tsx"]
  missing: []

- truth: "页面渲染无React hydration错误，className顺序在服务端和客户端保持一致"
  status: failed
  reason: "User reported: React Hydration Mismatch错误 - className顺序不一致导致服务端/客户端渲染不匹配"
  severity: major
  test: 3
  artifacts: []
  missing: []

- truth: "批量修改角色操作后，用户角色立即在表格中更新显示，无需手动刷新页面"
  status: failed
  reason: "User reported: 用户角色更新，需要刷新页面后才能显示新的角色，无法立即显示修改后的角色"
  severity: major
  test: 4
  artifacts: []
  missing: []
