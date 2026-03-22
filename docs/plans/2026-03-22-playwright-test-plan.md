# Playwright E2E 测试修复与优化计划

> 创建时间: 2026-03-22
> 目标: 修复 Playwright 配置问题，实现稳定可靠的 E2E 测试

---

## 一、问题诊断

### 1.1 Playwright 配置问题

| 问题             | 当前状态             | 影响               |
| ---------------- | -------------------- | ------------------ |
| 无全局 Setup     | `globalSetup` 未配置 | 测试环境不可预测   |
| 无认证状态持久化 | 每个测试单独登录     | 测试运行慢、不稳定 |
| 无数据库重置     | 测试间数据可能冲突   | 测试结果不可靠     |
| 仅 Chromium      | 未配置多浏览器       | 兼容性覆盖有限     |

### 1.2 测试凭据不一致

| 测试文件                    | 使用的凭据                     | 问题    |
| --------------------------- | ------------------------------ | ------- |
| `auth.spec.ts`              | `admin@example.com / admin123` | ✅ 正确 |
| `p0-p1-features.spec.ts`    | `admin@test.com / password123` | ❌ 错误 |
| `simple-login-test.spec.ts` | 待检查                         | ?       |

**正确的测试凭据**（来自 `prisma/seed.ts`）:

- 管理员: `admin@example.com / admin123`
- 普通用户: `test@example.com / test123`

### 1.3 现有测试文件清单

```
tests/e2e/
├── auth.spec.ts                    # 认证测试
├── auth-dashboard.spec.ts          # 认证仪表板
├── simple-login-test.spec.ts       # 简单登录测试
├── frontend-login-verification.spec.ts
├── project-features.spec.ts        # 项目功能
├── role-system.spec.ts             # 角色系统
├── task-dependencies.spec.ts       # 任务依赖
├── review-attachment.spec.ts       # 评审附件
├── settings.spec.ts                # 设置
├── notifications.spec.ts           # 通知
├── email-sending.spec.ts           # 邮件发送
├── admin-users.spec.ts             # 用户管理
├── debug-preview.spec.ts           # 调试预览
├── p0-p1-features.spec.ts          # P0/P1 功能
└── critical-flows/
    ├── 01-user-registration-to-project.spec.ts
    ├── 02-task-workflow.spec.ts
    ├── 03-requirement-workflow.spec.ts
    ├── 04-review-workflow.spec.ts
    ├── 05-risk-workflow.spec.ts
    ├── 06-file-management.spec.ts
    ├── 07-email-workflow.spec.ts
    └── 08-ai-analysis-workflow.spec.ts
```

---

## 二、修复方案

### 2.1 配置修复（优先级：P0）

#### 步骤 1: 创建全局 Setup 文件

**文件**: `tests/e2e/global-setup.ts`

```typescript
import { chromium, FullConfig } from '@playwright/test'
import { prisma } from '../../src/lib/prisma'

async function globalSetup(config: FullConfig) {
  // 1. 确保数据库连接
  await prisma.$connect()

  // 2. 运行种子数据
  const { execSync } = require('child_process')
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' })

  // 3. 创建认证状态
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  // 登录管理员
  await page.goto('http://localhost:3000/login')
  await page.fill('input[name="email"]', 'admin@example.com')
  await page.fill('input[name="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard**')
  await context.storageState({ path: 'tests/e2e/.auth/admin.json' })

  // 登录普通用户
  const userContext = await browser.newContext()
  const userPage = await userContext.newPage()
  await userPage.goto('http://localhost:3000/login')
  await userPage.fill('input[name="email"]', 'test@example.com')
  await userPage.fill('input[name="password"]', 'test123')
  await userPage.click('button[type="submit"]')
  await userPage.waitForURL('**/dashboard**')
  await userContext.storageState({ path: 'tests/e2e/.auth/user.json' })

  await browser.close()
  await prisma.$disconnect()
}

export default globalSetup
```

#### 步骤 2: 更新 Playwright 配置

**文件**: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['junit', { outputFile: 'test-results/junit.xml' }]],

  // 新增: 全局 Setup
  globalSetup: './tests/e2e/global-setup.ts',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // 新增: 认证 Setup 项目
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // 管理员测试
    {
      name: 'chromium-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    // 普通用户测试
    {
      name: 'chromium-user',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})
```

### 2.2 测试文件修复（优先级：P1）

#### 需要修复凭据的文件

1. **`p0-p1-features.spec.ts`** - 修改 `admin@test.com` → `admin@example.com`

```typescript
// 修复前
email: 'admin@test.com',
password: 'password123',

// 修复后
email: 'admin@example.com',
password: 'admin123',
```

#### 使用认证状态的测试改造

**修复前**（每次测试都登录）:

```typescript
test('应该成功登录', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[name="email"]', 'admin@example.com')
  await page.fill('input[name="password"]', 'admin123')
  await page.click('button[type="submit"]')
  // ...测试逻辑
})
```

**修复后**（使用预认证状态）:

```typescript
import { test, expect } from '@playwright/test'

test.use({ storageState: 'tests/e2e/.auth/admin.json' })

test('应该显示仪表板', async ({ page }) => {
  await page.goto('/dashboard')
  // 已经登录，直接测试
  await expect(page.locator('h1')).toContainText('工作台')
})
```

### 2.3 添加测试辅助工具（优先级：P2）

#### 创建测试辅助函数

**文件**: `tests/e2e/helpers/auth.ts`

```typescript
import { Page } from '@playwright/test'

export const TEST_USERS = {
  admin: {
    email: 'admin@example.com',
    password: 'admin123',
  },
  user: {
    email: 'test@example.com',
    password: 'test123',
  },
} as const

export async function login(page: Page, role: 'admin' | 'user' = 'admin') {
  const { email, password } = TEST_USERS[role]
  await page.goto('/login')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard**')
}

export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]')
  await page.click('[data-testid="logout-button"]')
  await page.waitForURL('**/login**')
}
```

---

## 三、执行计划

### Phase 1: 配置修复（预计 30 分钟）

| 步骤 | 操作                 | 文件                        |
| ---- | -------------------- | --------------------------- |
| 1.1  | 创建全局 Setup       | `tests/e2e/global-setup.ts` |
| 1.2  | 创建认证状态目录     | `tests/e2e/.auth/`          |
| 1.3  | 更新 Playwright 配置 | `playwright.config.ts`      |
| 1.4  | 创建测试辅助函数     | `tests/e2e/helpers/auth.ts` |

### Phase 2: 测试文件修复（预计 1 小时）

| 步骤 | 操作                 | 文件                     |
| ---- | -------------------- | ------------------------ |
| 2.1  | 修复凭据不一致       | `p0-p1-features.spec.ts` |
| 2.2  | 添加 .gitignore 规则 | `.gitignore`             |
| 2.3  | 检查其他测试文件     | 所有 .spec.ts            |

### Phase 3: 运行测试（预计 30 分钟）

| 步骤 | 操作          | 命令               |
| ---- | ------------- | ------------------ |
| 3.1  | 运行种子数据  | `npm run db:seed`  |
| 3.2  | 运行 E2E 测试 | `npm run test:e2e` |
| 3.3  | 分析失败测试  | -                  |
| 3.4  | 修复失败测试  | -                  |

---

## 四、验收标准

- [ ] 所有 22 个 E2E 测试文件可以运行
- [ ] 无凭据不一致问题
- [ ] 测试失败时生成截图和 trace
- [ ] 测试报告输出到 `playwright-report/`
- [ ] JUnit 报告输出到 `test-results/junit.xml`

---

## 五、风险与缓解

| 风险           | 影响               | 缓解措施                             |
| -------------- | ------------------ | ------------------------------------ |
| 数据库连接失败 | 测试无法运行       | 确保 PostgreSQL 运行，检查 .env.test |
| 端口冲突       | 开发服务器启动失败 | 检查 3000 端口是否被占用             |
| 认证状态过期   | 测试失败           | globalSetup 每次运行时重新生成       |
| 测试数据冲突   | 结果不可预测       | 使用事务回滚或独立测试数据库         |

---

## 六、后续优化（可选）

1. **多浏览器支持**: 添加 Firefox、WebKit 配置
2. **并行测试**: 配置 workers 数量
3. **测试数据工厂**: 创建更完善的测试数据生成器
4. **视觉回归测试**: 添加截图比对
5. **性能测试**: 添加页面加载时间断言
