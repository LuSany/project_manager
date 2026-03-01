# PostgreSQL 迁移 + Mock 策略实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将项目从 SQLite 迁移到 PostgreSQL，实现 Mock 策略，恢复所有 263 个被跳过的集成测试

**Architecture:**

- PostgreSQL 作为主数据库（支持事务和并发）
- Docker 容器化 PostgreSQL（开发环境）
- Vitest 隔离测试数据库
- MSW (Mock Service Worker) 处理外部依赖

**Tech Stack:** PostgreSQL 16, Docker, Prisma 6.x, Vitest 3.x, MSW 2.x

---

## 并行执行策略

此计划设计为**最大化并行执行**，分为 3 个并行轨道：

```
┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│  轨道 A: 数据库  │  │  轨道 B: 测试    │  │  轨道 C: Mock   │
│  PostgreSQL     │  │  基础设施        │  │  策略实现       │
└─────────────────┘  └──────────────────┘  └─────────────────┘
      ↓                      ↓                      ↓
   安装配置              测试工具链             Mock 实现
      ↓                      ↓                      ↓
   Schema迁移            测试启用               外部依赖
      ↓                      ↓                      ↓
   数据迁移              验证测试               集成测试
```

**预估总时间:** 4-6 小时（并行执行）  
**风险等级:** 中等（数据库迁移有回滚风险）

---

## 阶段 1: 环境准备（并行轨道启动）

### 轨道 A: PostgreSQL 安装与配置

#### Task A1: 安装 PostgreSQL（Linux 系统）

**预估时间:** 15 分钟  
**风险:** 低

**Step 1: 安装 PostgreSQL 16**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16

# 或者使用 Docker（推荐用于开发环境）
docker run --name project-manager-postgres \
  -e POSTGRES_USER=pm_user \
  -e POSTGRES_PASSWORD=pm_password \
  -e POSTGRES_DB=project_manager \
  -p 5432:5432 \
  -d postgres:16-alpine
```

**Step 2: 验证安装**

```bash
# 本地安装
sudo systemctl status postgresql
psql --version

# Docker
docker ps | grep postgres
docker exec -it project-manager-postgres psql -U pm_user -d project_manager -c "SELECT version();"
```

预期输出: PostgreSQL 16.x 版本信息

**Step 3: 创建数据库和用户（本地安装）**

```bash
sudo -u postgres psql <<EOF
CREATE USER pm_user WITH PASSWORD 'pm_password';
CREATE DATABASE project_manager OWNER pm_user;
GRANT ALL PRIVILEGES ON DATABASE project_manager TO pm_user;
\c project_manager
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOF
```

---

#### Task A2: 配置环境变量

**预估时间:** 5 分钟  
**风险:** 低

**Files:**

- Modify: `.env`
- Modify: `.env.example`
- Create: `.env.test`

**Step 1: 更新 .env 文件**

```bash
# 备份现有 .env
cp .env .env.backup

# 更新 DATABASE_URL
cat > .env.new <<'EOF'
# Database - PostgreSQL
DATABASE_URL="postgresql://pm_user:pm_password@localhost:5432/project_manager?schema=public"

# Test Database
TEST_DATABASE_URL="postgresql://pm_user:pm_password@localhost:5432/project_manager_test?schema=public"

# JWT Secret
JWT_SECRET="your-secret-key-change-in-production-use-at-least-64-chars-long-random-string"

# Encryption Key
ENCRYPTION_KEY="your-encryption-key-change-in-production-minimum-32-characters-long"

# URL Signing Secret
URL_SIGN_SECRET="your-url-signing-secret-change-in-production-minimum-32-characters"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="项目管理系统"

# Email
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM=""

# AI Service
AI_API_KEY=""
AI_BASE_URL="https://api.openai.com/v1"
AI_MODEL="gpt-4o-mini"

# OnlyOffice
ONLYOFFICE_API_URL="http://localhost:8080"
NEXT_PUBLIC_ONLYOFFICE_API_URL="http://localhost:8080"
ONLYOFFICE_API_KEY=""
ONLYOFFICE_MOCK_MODE="true"
EOF

# 合并现有配置
mv .env .env.old
mv .env.new .env
```

**Step 2: 创建测试环境配置**

```bash
cat > .env.test <<'EOF'
DATABASE_URL="postgresql://pm_user:pm_password@localhost:5432/project_manager_test?schema=public"
JWT_SECRET="test-secret-key-for-testing-only-do-not-use-in-production"
ENCRYPTION_KEY="test-encryption-key-32-chars"
URL_SIGN_SECRET="test-url-sign-secret-32-chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="项目管理系统测试"
NODE_ENV="test"
EOF
```

---

### 轨道 B: 测试基础设施

#### Task B1: 升级测试配置

**预估时间:** 10 分钟  
**风险:** 低

**Files:**

- Modify: `vitest.config.ts`
- Create: `vitest.setup.db.ts`
- Modify: `tests/setup.ts`

**Step 1: 更新 vitest.config.ts**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['tests/e2e/**/*', 'tests/**/*.e2e.ts'],
    setupFiles: ['tests/setup.ts', 'vitest.setup.db.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.ts'],
    },
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Step 2: 创建数据库测试设置**

```typescript
// vitest.setup.db.ts
import { beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

beforeAll(async () => {
  // 推送测试数据库 schema
  execSync('npx prisma db push --skip-generate', {
    env: {
      ...process.env,
      DATABASE_URL: process.env.TEST_DATABASE_URL,
    },
    stdio: 'inherit',
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})

// 导出供测试使用
export { prisma }
```

**Step 3: 更新 tests/setup.ts**

```typescript
// tests/setup.ts
import { beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

beforeEach(async () => {
  // 清理测试数据（在每个测试前）
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ')

  if (tables.length > 0) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
  }
})

afterAll(async () => {
  await prisma.$disconnect()
})

export { prisma }
```

---

### 轨道 C: Mock 策略设计

#### Task C1: 设计 Mock 架构

**预估时间:** 15 分钟  
**风险:** 低

**Files:**

- Create: `tests/mocks/README.md`
- Create: `tests/mocks/handlers/index.ts`

**Step 1: 创建 Mock 架构文档**

```markdown
# tests/mocks/README.md

# Mock 策略架构

## 外部依赖分类

### 1. 完全 Mock 的服务

- **Email Service**: `tests/mocks/email.ts`
- **AI Service**: `tests/mocks/ai.ts`
- **OnlyOffice**: `tests/mocks/onlyoffice.ts`
- **Webhook Deliveries**: `tests/mocks/webhook.ts`

### 2. 数据库 Mock 策略

- **集成测试**: 使用真实 PostgreSQL 测试数据库
- **单元测试**: 不涉及数据库，纯逻辑测试

### 3. 文件系统 Mock

- 使用 `vitest` 的内置文件系统模拟
- 测试文件存储在内存中

## MSW (Mock Service Worker) 集成

使用 MSW 拦截 HTTP 请求：

- API 路由测试：直接测试 Next.js API handlers
- 外部服务：MSW 拦截并返回 mock 数据

## 测试数据生成

使用 Faker.js 生成测试数据：

- `tests/factories/user.ts`
- `tests/factories/project.ts`
- `tests/factories/task.ts`
```

**Step 2: 创建 MSW handlers 入口**

```typescript
// tests/mocks/handlers/index.ts
import { emailHandlers } from './email'
import { aiHandlers } from './ai'
import { onlyofficeHandlers } from './onlyoffice'

export const handlers = [...emailHandlers, ...aiHandlers, ...onlyofficeHandlers]
```

---

## 阶段 2: Prisma Schema 迁移

### Task A3: 迁移 Prisma Schema

**预估时间:** 20 分钟  
**风险:** 高（需要仔细处理数据类型差异）

**Files:**

- Modify: `prisma/schema.prisma`

**Step 1: 备份现有 schema**

```bash
cp prisma/schema.prisma prisma/schema.prisma.sqlite.backup
```

**Step 2: 更新 datasource 配置**

将 `schema.prisma` 第 8-11 行从：

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

修改为：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Step 3: 处理 SQLite 特有的语法**

需要检查和修改以下 SQLite 特有语法：

1. **DateTime 字段**: PostgreSQL 使用 `TIMESTAMP` 而非 SQLite 的 `DATETIME`
2. **Boolean 默认值**: PostgreSQL 使用 `true/false` 而非 SQLite 的 `0/1`
3. **Json 类型**: PostgreSQL 有原生 `Json` 类型

**Step 4: 生成迁移 SQL**

```bash
# 创建迁移
npx prisma migrate dev --name migrate_to_postgresql --create-only

# 检查生成的迁移文件
ls -la prisma/migrations/
```

**Step 5: 应用迁移**

```bash
# 应用迁移到开发数据库
npx prisma migrate dev

# 验证数据库结构
npx prisma studio
```

**验证标准:**

- `prisma migrate dev` 成功执行
- 所有模型在 PostgreSQL 中正确创建
- 关系和外键约束正确设置

---

### Task A4: 数据迁移（如果有生产数据）

**预估时间:** 30 分钟  
**风险:** 高

**Files:**

- Create: `scripts/migrate-data.ts`

**Step 1: 创建数据迁移脚本**

```typescript
// scripts/migrate-data.ts
import { PrismaClient } from '@prisma/client'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const sqlitePrisma = new PrismaClient({
  datasourceUrl: 'file:./prisma/dev.db',
})

const postgresPrisma = new PrismaClient()

async function migrateData() {
  console.log('开始数据迁移...')

  // 1. 迁移用户
  const users = await sqlitePrisma.user.findMany()
  console.log(`迁移 ${users.length} 个用户...`)
  for (const user of users) {
    await postgresPrisma.user.create({ data: user })
  }

  // 2. 迁移项目
  const projects = await sqlitePrisma.project.findMany()
  console.log(`迁移 ${projects.length} 个项目...`)
  for (const project of projects) {
    await postgresPrisma.project.create({ data: project })
  }

  // ... 继续其他模型

  console.log('数据迁移完成！')
}

migrateData()
  .catch(console.error)
  .finally(async () => {
    await sqlitePrisma.$disconnect()
    await postgresPrisma.$disconnect()
  })
```

**Step 2: 执行迁移**

```bash
tsx scripts/migrate-data.ts
```

---

## 阶段 3: Mock 实现（并行任务）

### Task C2: Email Service Mock

**预估时间:** 20 分钟  
**风险:** 低

**Files:**

- Create: `tests/mocks/email.ts`
- Create: `tests/mocks/handlers/email.ts`
- Create: `tests/__mocks__/nodemailer.ts`

**Step 1: 创建 Email Mock**

```typescript
// tests/mocks/email.ts
import { vi } from 'vitest'

export const mockSendEmail = vi.fn().mockResolvedValue({
  messageId: 'test-message-id',
  accepted: ['test@example.com'],
  rejected: [],
})

export const mockTransporter = {
  sendMail: mockSendEmail,
}

export const createMockEmailService = () => ({
  sendEmail: mockSendEmail,
  sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
  sendTaskAssignedEmail: vi.fn().mockResolvedValue(true),
  sendReviewInviteEmail: vi.fn().mockResolvedValue(true),
  sendRiskAlertEmail: vi.fn().mockResolvedValue(true),
})
```

**Step 2: 创建 Nodemailer Mock**

```typescript
// tests/__mocks__/nodemailer.ts
import { vi } from 'vitest'
import { mockTransporter } from '../mocks/email'

export default {
  createTransport: vi.fn(() => mockTransporter),
}
```

**Step 3: 创建 MSW handlers**

```typescript
// tests/mocks/handlers/email.ts
import { http, HttpResponse } from 'msw'

export const emailHandlers = [
  http.post('/api/email/send', () => {
    return HttpResponse.json({
      success: true,
      messageId: 'test-message-id',
    })
  }),
]
```

---

### Task C3: AI Service Mock

**预估时间:** 15 分钟  
**风险:** 低

**Files:**

- Create: `tests/mocks/ai.ts`
- Create: `tests/mocks/handlers/ai.ts`

**Step 1: 创建 AI Mock**

```typescript
// tests/mocks/ai.ts
import { vi } from 'vitest'

export const mockAICompletion = vi.fn().mockResolvedValue({
  id: 'chatcmpl-test',
  choices: [
    {
      message: {
        content: JSON.stringify({
          risks: [{ title: '测试风险', severity: 'HIGH', description: 'Mock 风险描述' }],
        }),
      },
    },
  ],
})

export const createMockAIService = () => ({
  analyzeRisk: mockAICompletion,
  generateReviewCriteria: vi
    .fn()
    .mockResolvedValue([{ title: '代码质量', description: '评估代码质量', weight: 1.0 }]),
  parseDocument: vi.fn().mockResolvedValue({
    content: 'Mock 文档内容',
    metadata: {},
  }),
})
```

---

### Task C4: OnlyOffice Mock

**预估时间:** 15 分钟  
**风险:** 低

**Files:**

- Create: `tests/mocks/onlyoffice.ts`
- Create: `tests/mocks/handlers/onlyoffice.ts`

**Step 1: 创建 OnlyOffice Mock**

```typescript
// tests/mocks/onlyoffice.ts
import { vi } from 'vitest'

export const mockOnlyOfficeService = {
  getPreviewUrl: vi.fn().mockReturnValue('http://localhost:8080/preview/test'),
  isAvailable: vi.fn().mockReturnValue(true),
  supportedFormats: ['docx', 'xlsx', 'pptx', 'pdf'],
}

export const createMockOnlyOfficeService = () => mockOnlyOfficeService
```

---

### Task C5: 测试数据工厂

**预估时间:** 30 分钟  
**风险:** 低

**Files:**

- Create: `tests/factories/user.ts`
- Create: `tests/factories/project.ts`
- Create: `tests/factories/task.ts`
- Create: `tests/factories/index.ts`

**Step 1: 创建 User Factory**

```typescript
// tests/factories/user.ts
import { faker } from '@faker-js/faker'
import { User, UserStatus, SystemRole } from '@prisma/client'
import { prisma } from '../setup'

type CreateUserInput = Partial<User>

export async function createUser(overrides: CreateUserInput = {}): Promise<User> {
  return prisma.user.create({
    data: {
      email: faker.internet.email(),
      passwordHash: faker.string.alphanumeric(60),
      name: faker.person.fullName(),
      status: UserStatus.ACTIVE,
      role: SystemRole.EMPLOYEE,
      ...overrides,
    },
  })
}

export async function createAdminUser(overrides: CreateUserInput = {}): Promise<User> {
  return createUser({ ...overrides, role: SystemRole.ADMIN })
}
```

**Step 2: 创建 Project Factory**

```typescript
// tests/factories/project.ts
import { faker } from '@faker-js/faker'
import { Project, ProjectStatus } from '@prisma/client'
import { prisma } from '../setup'
import { createUser } from './user'

type CreateProjectInput = Partial<Project> & { ownerId?: string }

export async function createProject(overrides: CreateProjectInput = {}): Promise<Project> {
  let ownerId = overrides.ownerId
  if (!ownerId) {
    const owner = await createUser()
    ownerId = owner.id
  }

  return prisma.project.create({
    data: {
      name: faker.company.name(),
      description: faker.company.catchPhrase(),
      status: ProjectStatus.ACTIVE,
      ...overrides,
      ownerId,
    },
  })
}
```

**Step 3: 创建 Task Factory**

```typescript
// tests/factories/task.ts
import { faker } from '@faker-js/faker'
import { Task, TaskStatus, TaskPriority } from '@prisma/client'
import { prisma } from '../setup'
import { createProject } from './project'

type CreateTaskInput = Partial<Task> & { projectId?: string }

export async function createTask(overrides: CreateTaskInput = {}): Promise<Task> {
  let projectId = overrides.projectId
  if (!projectId) {
    const project = await createProject()
    projectId = project.id
  }

  return prisma.task.create({
    data: {
      title: faker.hacker.phrase(),
      description: faker.lorem.paragraph(),
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      ...overrides,
      projectId,
    },
  })
}
```

**Step 4: 导出所有工厂**

```typescript
// tests/factories/index.ts
export * from './user'
export * from './project'
export * from './task'
```

---

## 阶段 4: 测试启用（按优先级）

### Task B2: 启用数据库集成测试

**预估时间:** 45 分钟  
**风险:** 中

**启用顺序:**

1. 基础模型测试（User, Project）
2. 关系测试（Task, Milestone）
3. 复杂业务逻辑测试（Review, Requirement）

**Step 1: 批量移除 describe.skip**

```bash
# 创建启用测试的脚本
cat > scripts/enable-integration-tests.sh <<'EOF'
#!/bin/bash

# 启用数据库集成测试
for file in tests/integration/database/*.test.ts; do
  sed -i 's/describe.skip/describe/g' "$file"
done

echo "已启用所有数据库集成测试"
EOF

chmod +x scripts/enable-integration-tests.sh
./scripts/enable-integration-tests.sh
```

**Step 2: 修复测试中的 SQLite 特有语法**

检查并修复：

- `RETURNING` 子句（PostgreSQL 支持）
- 事务隔离级别
- 自增 ID 处理

**Step 3: 运行测试验证**

```bash
npm run test:unit -- tests/integration/database/
```

---

### Task B3: 启用 API 集成测试

**预估时间:** 60 分钟  
**风险:** 中

**Files:**

- Modify: `tests/integration/api.test.ts`
- Modify: `tests/integration/project.test.ts`
- Modify: `tests/integration/task.test.ts`

**Step 1: 更新 API 测试使用真实数据库**

```typescript
// tests/integration/api.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../setup'
import { createUser, createProject } from '../factories'

describe('API 集成测试', () => {
  beforeEach(async () => {
    // 数据库在每个测试前已被清空
  })

  it('应该返回用户列表', async () => {
    const user = await createUser()

    const response = await fetch('/api/users')
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.users).toHaveLength(1)
    expect(data.users[0].email).toBe(user.email)
  })
})
```

**Step 2: 启用测试**

```bash
# 移除 API 测试的 skip
sed -i 's/describe.skip/describe/g' tests/integration/api.test.ts
sed -i 's/describe.skip/describe/g' tests/integration/project.test.ts
sed -i 's/describe.skip/describe/g' tests/integration/task.test.ts
```

---

### Task B4: 启用业务流程测试

**预估时间:** 45 分钟  
**风险:** 中

**Files:**

- Modify: `tests/integration/user-flow.test.ts`
- Modify: `tests/integration/review.test.ts`
- Modify: `tests/integration/requirement.test.ts`

**Step 1: 更新测试使用 Mock 服务**

```typescript
// tests/integration/user-flow.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mockSendEmail } from '../mocks/email'

describe('用户注册和登录流程', () => {
  it('应该成功注册用户并发送欢迎邮件', async () => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      }),
    })

    expect(response.status).toBe(201)
    expect(mockSendEmail).toHaveBeenCalled()
  })
})
```

---

## 阶段 5: 验证和清理

### Task V1: 完整测试验证

**预估时间:** 30 分钟  
**风险:** 低

**Step 1: 运行所有单元测试**

```bash
npm run test:unit
```

预期结果: 204 个测试通过

**Step 2: 运行所有集成测试**

```bash
npm run test:unit -- tests/integration/
```

预期结果: 263 个测试通过

**Step 3: 运行测试覆盖率**

```bash
npm run test:unit:coverage
```

目标覆盖率: > 80%

---

### Task V2: 性能验证

**预估时间:** 15 分钟  
**风险:** 低

**Step 1: 测试并发性能**

```bash
# 使用 pgbench 测试 PostgreSQL 性能
docker exec -it project-manager-postgres pgbench -U pm_user -d project_manager -c 10 -t 100
```

**Step 2: 验证事务隔离**

创建事务测试脚本验证并发场景。

---

### Task V3: 文档更新

**预估时间:** 10 分钟  
**风险:** 低

**Files:**

- Update: `README.md`
- Update: `.env.example`
- Create: `docs/TESTING.md`

**Step 1: 更新 README.md**

在测试章节添加：

```markdown
## 测试

### 环境要求

- PostgreSQL 16
- Node.js 20+

### 运行测试

\`\`\`bash

# 单元测试（204 个）

npm run test:unit

# 集成测试（263 个）

npm run test:unit -- tests/integration/

# 测试覆盖率

npm run test:unit:coverage
\`\`\`

### 测试数据库

集成测试使用独立的测试数据库 \`project_manager_test\`，每个测试前自动清空。
```

---

## 风险评估和缓解策略

### 高风险项

1. **Schema 迁移失败**
   - 缓解: 备份现有 schema 和数据
   - 回滚: `prisma migrate reset` 或恢复 SQLite

2. **数据类型不兼容**
   - 缓解: 手动检查每个字段的类型转换
   - 回滚: 保持 SQLite 备份

### 中风险项

1. **测试性能下降**
   - 缓解: 使用连接池和并行测试
   - 监控: 定期检查测试执行时间

2. **Mock 不完整导致测试失败**
   - 缓解: 逐步启用测试，逐个修复
   - 回滚: 重新添加 `describe.skip`

### 低风险项

1. **环境配置错误**
   - 缓解: 使用 `.env.example` 模板
   - 验证: 启动脚本自动检查

---

## 回滚计划

如果迁移失败，执行以下步骤：

1. **停止所有服务**

   ```bash
   docker stop project-manager-postgres
   ```

2. **恢复 SQLite 配置**

   ```bash
   cp prisma/schema.prisma.sqlite.backup prisma/schema.prisma
   cp .env.backup .env
   ```

3. **重新生成 Prisma Client**

   ```bash
   npx prisma generate
   ```

4. **重新启用 SQLite 测试**
   ```bash
   # 恢复测试配置
   git checkout tests/setup.ts vitest.config.ts
   ```

---

## 成功标准

✅ **基础设施**

- PostgreSQL 容器正常运行
- 数据库连接成功
- Schema 迁移完成

✅ **测试恢复**

- 204 单元测试通过 (100%)
- 263 集成测试通过 (100%)
- 0 失败

✅ **性能**

- 单元测试 < 10 秒
- 集成测试 < 60 秒
- 测试覆盖率 > 80%

✅ **Mock 策略**

- 所有外部服务已 Mock
- 测试独立运行无副作用
- 测试数据工厂可用

---

## 执行时间线（并行优化）

```
时间轴 | 轨道 A (DB)     | 轨道 B (Test)    | 轨道 C (Mock)
-------|----------------|------------------|----------------
0:00   | 安装 PostgreSQL | 更新测试配置      | 设计 Mock 架构
0:15   | 配置环境变量   | 创建测试工具      | 创建 Email Mock
0:30   | Schema 迁移    |                  | 创建 AI Mock
0:50   | 数据迁移       | 启用 DB 测试     | 创建 OnlyOffice Mock
1:20   |                | 修复测试         | 创建测试工厂
1:50   |                | 启用 API 测试    |
2:20   |                | 启用业务测试     |
2:50   | 验证性能       | 验证测试         | 验证 Mock
3:00   | 更新文档       | 更新文档         | 更新文档
3:15   | ✓ 完成         | ✓ 完成           | ✓ 完成
```

**预计总时间:** 3-4 小时（并行执行）

---

## 下一步行动

计划完成后，选择执行方式：

**1. Subagent-Driven (当前会话)** - 派遣独立子代理执行每个任务，任务间代码审查

**2. Parallel Session (新会话)** - 在新会话中使用 executing-plans 批量执行

**选择哪种方式？**
