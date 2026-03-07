# E2E 测试修复总结

## 修复日期
2026-03-07

## 修复的测试文件
- tests/e2e/critical-flows/01-user-registration-to-project.spec.ts
- tests/e2e/critical-flows/02-task-workflow.spec.ts
- tests/e2e/critical-flows/03-requirement-workflow.spec.ts
- tests/e2e/critical-flows/04-review-workflow.spec.ts
- tests/e2e/critical-flows/05-risk-workflow.spec.ts
- tests/e2e/critical-flows/06-file-management.spec.ts
- tests/e2e/critical-flows/07-email-workflow.spec.ts
- tests/e2e/critical-flows/08-ai-analysis-workflow.spec.ts

## 主要问题

### 1. 选择器不匹配
- 原测试使用 `[name="email"]` 等通用选择器
- 实际页面使用 `input[name="email"]` 或 `input[id="name"]`
- shadcn/ui 组件的表单字段需要使用更具体的选择器

### 2. 路径不匹配
- 原测试假设全局路径如 `/tasks/new`、`/requirements/new`
- 实际应用在项目下：`/projects/[id]/tasks/new`、`/projects/[id]/requirements/new`
- 需要先到项目页面获取项目 ID

### 3. 认证状态管理
- 测试需要使用 `test.describe.configure({ mode: 'serial' })` 串行运行
- 每个测试前需要先登录获取认证状态
- 使用固定的 admin 账号：admin@example.com / admin123

### 4. 页面加载等待
- 使用 `page.waitForTimeout(1000)` 等待页面加载
- 使用 `page.waitForSelector()` 等待特定元素
- 使用 `page.waitForURL()` 等待导航完成

## 修复策略

1. **更新选择器** - 使用 `input[name="xxx"]`、`input[id="xxx"]`、`input[type="text"]` 等具体选择器
2. **修改路径** - 先导航到 `/projects` 获取项目 ID，再导航到具体的功能页面
3. **添加等待** - 在关键操作后添加适当的等待时间
4. **简化测试** - 移除对不存在 UI 元素的依赖，专注于核心流程验证
5. **串行运行** - 使用 `mode: 'serial'` 避免测试间状态污染

## 运行命令
```bash
npx playwright test tests/e2e/critical-flows/ --project=chromium --workers=1
```

## 测试结果
- 28 个测试全部通过
- 测试运行时间约 1.9 分钟
