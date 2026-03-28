# Testing Patterns

**分析日期:** 2026-03-25

## 测试框架

**单元测试 Runner:**
- Vitest v3.2.4
- 配置：`vitest.config.ts`
- 环境：jsdom (用于 React 组件测试)

**E2E 测试 Runner:**
- Playwright v1.58.2
- 配置：`playwright.config.ts`
- 浏览器：Chrome (Desktop Chrome)

**断言库:**
- `@testing-library/jest-dom` v6.9.1 (Vitest 集成)
- Vitest 内置 `expect`

**运行命令:**
```bash
npm run test:unit              # 运行单元测试
npm run test:unit:coverage     # 带覆盖率报告
npm run test:e2e               # 运行 E2E 测试
npm run test:e2e:ui            # Playwright UI 模式
```

## 测试文件组织

**目录结构:**
```
tests/
├── e2e/                    # E2E 测试
│   ├── *.spec.ts          # 端到端测试
│   └── auth.setup.ts      # 认证设置
├── integration/            # 集成测试
│   ├── api/               # API 集成测试
│   └── database/          # 数据库集成测试
├── unit/                  # 单元测试
│   ├── api/              # API 客户端测试
│   ├── components/       # 组件单元测试
│   └── *.test.ts         # 其他单元测试
├── mocks/                # Mock 数据和工具
│   ├── factories.ts      # 数据工厂
│   └── handlers.ts       # MSW 请求处理器
├── helpers/              # 测试工具函数
│   ├── test-db.ts        # 数据库测试工具
│   └── assertions.ts     # 自定义断言
└── setup.ts              # 全局测试设置
```

**源文件中的测试:**
```
src/
├── components/
│   └── __tests__/        # 组件测试 (co-located)
│   └── *.test.tsx        # 同目录测试
├── hooks/
│   └── __tests__/        # Hooks 测试
├── stores/
│   └── __tests__/        # Zustand stores 测试
└── blocks/
    └── __tests__/        # 业务逻辑测试
```

**命名约定:**
- 单元测试：`*.test.ts` / `*.test.tsx`
- 集成测试：`*.test.ts` / `*.integration.test.ts`
- E2E 测试：`*.spec.ts`

## 测试结构

**单元测试模式 (Vitest):**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('组件名称/功能', () => {
  beforeEach(() => {
    // 重置状态
  })

  afterEach(() => {
    // 清理
  })

  it('应该 [预期行为]', () => {
    // Arrange
    // Act
    // Assert
  })
})
```

**React 组件测试模式:**
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

describe('ComponentName', () => {
  const defaultProps = { ... }

  it('应该渲染 [元素]', () => {
    render(<ComponentName {...defaultProps} />)
    expect(screen.getByText('...')).toBeInTheDocument()
  })

  it('应该在没有 [属性] 时不显示 [元素]', () => {
    render(<ComponentName {...modifiedProps} />)
    expect(screen.queryBy...('...')).not.toBeInTheDocument()
  })
})
```

**Hook 测试模式:**
```typescript
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('useHookName', () => {
  let mockDependency: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockDependency = vi.fn()
  })

  it('应该返回 [预期值]', () => {
    const { result } = renderHook(() => useHookName(mockDependency))
    expect(result.current).toHaveProperty('expectedProperty')
  })

  it('应该在 [条件] 时调用 [回调]', () => {
    const { result } = renderHook(() => useHookName(mockDependency))
    act(() => {
      result.current.someAction()
    })
    expect(mockDependency).toHaveBeenCalled()
  })
})
```

**Zustand Store 测试模式:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useStore } from '../store'

describe('StoreName', () => {
  beforeEach(() => {
    // 重置 store 到初始状态
    useStore.setState({ /* initial state */ })
  })

  afterEach(() => {
    // 清理
    useStore.setState({ /* initial state */ })
  })

  it('应该 [行为]', () => {
    const mockFn = vi.fn().mockResolvedValue(undefined)
    useStore.getState().action({ undo: mockFn, redo: mockFn })
    expect(mockFn).toHaveBeenCalled()
  })
})
```

**集成测试模式 (带数据库):**
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('API 功能', () => {
  let testUser: User

  beforeAll(async () => {
    // 创建测试数据
    testUser = await createTestUser({ email: 'test@example.com' })
  })

  afterAll(async () => {
    // 清理测试数据
    await prisma.user.delete({ where: { id: testUser.id } })
  })

  it('应该 [行为]', async () => {
    const response = await fetch('/api/...', {
      headers: { 'cookie': `user-id=${testUser.id}` }
    })
    expect(response.status).toBe(200)
  })
})
```

**E2E 测试模式 (Playwright):**
```typescript
import { test, expect } from '@playwright/test'

test.describe('功能模块', () => {
  test('应该 [行为]', async ({ page }) => {
    await page.goto('/path')
    await expect(page).toHaveURL('/expected')
  })
})
```

## Mocking

**Mock 框架:**
- Vitest 内置 `vi.fn()`, `vi.mock()`, `vi.spyOn()`

**全局 Mock 设置:**
```typescript
// tests/setup.mock.ts
global.fetch = vi.fn()
vi.mocked(fetch).mockImplementation(
  () => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: {} }),
  }) as Promise<Response>
)
```

**MSW (Mock Service Worker):**
- 用于 API 请求模拟
- 依赖：`msw` v2.12.10
- 文件：`tests/mocks/handlers.ts`

**Mock 数据工厂:**
```typescript
// tests/mocks/factories.ts
import { faker } from "@faker-js/faker/locale/zh_CN"

export const userFactory = {
  create(overrides: Partial<User> = {}) {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      role: "REGULAR",
      ...overrides,
    }
  },
  createMany(count: number, overrides: Partial<User> = {}) {
    return Array.from({ length: count }, () => this.create(overrides))
  }
}
```

**组件测试中的 Mock:**
```typescript
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
}))
```

**数据库 Mock:**
- 文件：`tests/mocks/prisma-mock.ts`
- 使用 Prisma 的 `jest` 扩展或手动 mock

## Fixtures 和 Factories

**测试数据位置:**
- 工厂函数：`tests/mocks/factories.ts`
- 请求 Mock：`tests/mocks/request-mock.ts`
- Prisma Mock：`tests/mocks/prisma-mock.ts`

**工厂使用示例:**
```typescript
import { userFactory, projectFactory } from '@/mocks/factories'

const users = userFactory.createMany(5)
const project = projectFactory.create({ status: 'ACTIVE' })
```

**数据库测试工具:**
- 文件：`tests/helpers/test-db.ts`
- 功能：
  - `setupTestDatabase()`: 事务隔离
  - `testPrisma`: 测试用 Prisma 客户端
  - `cleanupAllData()`: 清理所有数据
  - `resetSequences()`: 重置序列

**事务隔离模式:**
```typescript
// 在测试中使用
setupTestDatabase()

// 内部实现
beforeEach(async () => {
  await testPrismaClient.$executeRaw`BEGIN`
})

afterEach(async () => {
  await testPrismaClient.$executeRaw`ROLLBACK`
})
```

## 覆盖率

**覆盖率目标:**
- 语句：90%
- 分支：85%
- 函数：90%
- 行：90%

**覆盖范围配置:**
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  include: [
    'src/lib/**/*.ts',
    'src/app/api/**/*.ts',
    'src/stores/**/*.ts'
  ],
  exclude: ['src/types/**', '**/*.d.ts', '**/index.ts'],
}
```

**查看覆盖率:**
```bash
npm run test:unit:coverage
# 报告位置：coverage/index.html
```

## 测试类型

**单元测试:**
- 范围：单个函数、组件、Hook、Store
- 位置：`src/**/__tests__/` 或 `tests/unit/`
- 特点：快速、隔离、使用 mock

**集成测试:**
- 范围：模块间交互、API 端点、数据库操作
- 位置：`tests/integration/`
- 特点：多模块协作、真实数据库连接

**E2E 测试:**
- 范围：完整用户流程
- 位置：`tests/e2e/`
- 特点：真实浏览器、完整应用栈
- 认证设置：`tests/e2e/auth.setup.ts`

## 常用模式

**异步测试:**
```typescript
it('应该异步 [行为]', async () => {
  await act(async () => {
    result.current.asyncAction()
  })
  expect(mockFn).toHaveBeenCalled()
})
```

**错误测试:**
```typescript
it('应该在 [条件] 时抛出错误', async () => {
  await expect(() => actionThatThrows()).rejects.toThrow('错误消息')
})
```

**超时处理:**
- 默认测试超时：30 秒 (`testTimeout: 30000`)
- Hook 超时：30 秒 (`hookTimeout: 30000`)

**自定义断言扩展:**
```typescript
// tests/helpers/assertions.ts
import '@testing-library/jest-dom/vitest'
// 可以添加自定义 matcher
```

---

*测试分析：2026-03-25*
