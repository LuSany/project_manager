# 测试质量提升工作计划

> **目标**: 将测试通过率从32.5%提升到95%以上，代码覆盖率从76.87%提升到95%以上
> **预估总时间**: 3-4天
> **优先级**: P0 (紧急) → P1 (重要) → P2 (必要)

---

## 📋 执行摘要

| 阶段 | 目标 | 预估时间 | 优先级 |
|-----|------|---------|-------|
| 阶段一：修复测试失败 | 207个测试通过 → <5个失败 | 4小时 | P0 |
| 阶段二：提升AI服务覆盖率 | 1.83% → 70% | 6小时 | P1 |
| 阶段三：提升认证模块覆盖率 | 47.83% → 85% | 4小时 | P1 |
| 阶段四：提升API响应层覆盖率 | 38.78% → 80% | 3小时 | P1 |
| 阶段五：补充E2E测试 | 40% → 75% | 8小时 | P2 |
| 阶段六：覆盖率整体优化 | 76.87% → 95% | 持续进行 | P2 |

---

## 🎯 成功指标

### 当前状态
```
总测试数: 320个
通过: 104个 (32.5%)
失败: 207个 (64.7%)
行覆盖率: 76.87%
函数覆盖率: 80.11%
```

### 目标状态
```
总测试数: ≥350个
通过: ≥332个 (≥95%)
失败: ≤17个 (≤5%)
行覆盖率: ≥95%
函数覆盖率: ≥95%
```

---

## 阶段一：修复测试失败 (P0 - 紧急)

> **时间**: 4小时 | **优先级**: 最高 | **影响**: 阻塞其他测试工作

### 1.1 修复 Vitest 兼容性问题

**问题**: `tests/unit/api/client.test.ts` 使用 `vi.mocked()` 但该函数不存在

**根本原因**: Vitest 3.x 版本中 `vi.mocked()` API 已移除

**修复方案**:
```typescript
// ❌ 当前代码（错误）
vi.mocked(fetch).mockImplementation(
  () => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: {} })
  } as Promise<Response>)
)

// ✅ 修复后代码
const mockFetch = vi.fn()
mockFetch.mockImplementation(
  () => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: {} })
  } as Promise<Response>)
)
global.fetch = mockFetch as any
```

**参考文件**: `tests/unit/api/client.test.ts:5-11`

**验收标准**:
- [ ] API客户端测试全部通过
- [ ] 不再出现 "vi.mocked is not a function" 错误
- [ ] Mock 功能正常工作

---

### 1.2 修复 API 路由测试响应格式问题

**问题**: API 路由测试中 `response.json()` 未定义

**根本原因**:
1. Next.js API 路由返回的是 `NextResponse` 对象，不是标准 `Response`
2. 测试直接调用路由函数，而不是通过 HTTP 请求
3. `NextResponse` 的 `json()` 方法与标准 `Response` 不同

**当前问题模式**:
```typescript
// ❌ 错误的测试方式
const response = await POST(request as any)
const data = await response.json()  // ❌ NextResponse 没有这个方法
```

**分析对比**:

**Route 实现** (`src/app/api/v1/auth/register/route.ts`):
```typescript
export async function POST(req: NextRequest) {
  // ... 业务逻辑
  return ApiResponder.created(
    {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      status: newUser.status,
    },
    '注册成功，请等待管理员审批'
  )
}
```

**ApiResponder.created 实现** (`src/lib/api/response.ts:18-23`):
```typescript
static created<T>(
  data: T,
  message: string = "创建成功"
): NextResponse<ApiResponse<T>> {
  return this.success(data, message, 201);
}
```

**修复方案 A - 正确解析 NextResponse**:
```typescript
// ✅ 修复后代码
const response = await POST(request as any)
const responseText = await response.text()
const data = JSON.parse(responseText)

expect(response.status).toBe(201)
expect(data.success).toBe(true)
```

**修复方案 B - 验证 NextResponse 属性**:
```typescript
// ✅ 修复后代码
const response = await POST(request as any)

// 验证状态码
expect(response.status).toBe(201)

// 验证响应体（通过内部实现或转换为 JSON）
const responseBody = await response.clone().text()
const data = JSON.parse(responseBody)
expect(data.success).toBe(true)
expect(data.data).toEqual({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  status: 'PENDING',
})
```

**受影响的文件**:
- `src/app/api/v1/auth/register/route.test.ts` (行 42, 86, 107)
- `src/app/api/v1/auth/login/route.test.ts` (如果有）
- 任何其他 `route.test.ts` 文件

**验收标准**:
- [ ] 所有 API 路由测试通过
- [ ] `response.json()` 错误消失
- [ ] 响应数据正确解析

---

### 1.3 修复测试数据不匹配问题

**问题**: 测试期望值与实际返回值不匹配

**具体案例** (`src/app/api/v1/auth/register/route.test.ts:49-60`):
```typescript
// ❌ 测试期望
expect(data.data).toEqual({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  status: 'PENDING',
  // role: 'REGULAR',  // ❌ 测试期望
})

// ✅ 实际返回
{
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  status: 'PENDING',
  // role: 'EMPLOYEE',  // ✅ 实际返回
}
```

**根本原因**: 路由实现返回 `role: 'EMPLOYEE'` 但测试期望 `role: 'REGULAR'`

**修复方案**:

**选项A - 修改测试期望**（推荐）:
```typescript
// ✅ 修改测试期望值与实现一致
expect(data.data).toEqual({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  status: 'PENDING',
  role: 'EMPLOYEE',  // ✅ 更新为正确值
})
```

**选项B - 修改路由实现**（如果 REGULAR 才是正确的）:
```typescript
// 如果 REGULAR 是正确值，修改路由
const newUser = await prisma.user.create({
  data: {
    email: validatedData.email,
    passwordHash,
    name: validatedData.name,
    phone: validatedData.phone || null,
    status: 'PENDING',
    role: 'REGULAR',  // 改为 REGULAR
  },
})
```

**决策**: 需要确认用户角色系统设计。根据 `src/lib/auth.ts`，没有看到角色相关逻辑。建议检查 Prisma schema 确认正确的默认角色。

**验收标准**:
- [ ] 测试期望值与实际返回值匹配
- [ ] 所有断言通过
- [ ] 明确用户角色默认值

---

### 1.4 修复数据库初始化问题

**问题**: 测试报告显示 "The table `main.users` does not exist"

**已修复**: ✅ 已在之前会话中修复
- `tests/setup.ts` 中的数据库路径从 `"file:./test.db"` 改为 `"file:./prisma/test.db"`

**验证步骤**:
```bash
# 1. 确认数据库文件存在
ls -la prisma/test.db

# 2. 重新生成 Prisma Client
DATABASE_URL="file:./prisma/test.db" npx prisma generate

# 3. 运行测试
bun test --run src/__tests__/auth.test.ts
```

**验收标准**:
- [ ] 不再出现 "table does not exist" 错误
- [ ] 所有依赖数据库的测试通过

---

## 阶段一验收总结

**修复前**:
```
测试通过率: 32.5% (104/320)
失败测试: 207个
主要错误: vi.mocked(), response.json(), 数据不匹配
```

**修复后目标**:
```
测试通过率: ≥85% (≥272/320)
失败测试: ≤48个
剩余失败: 测试用例本身的问题，而非基础设施问题
```

---

## 阶段二：提升 AI 服务覆盖率 (P1 - 重要)

> **时间**: 6小时 | **优先级**: 高 | **目标**: 从 1.83% 提升到 70%

### 2.1 AI 服务函数分析

**文件**: `src/lib/ai.ts` (279行)

**导出的函数**:

| 函数名 | 行号 | 描述 | 参数 | 返回类型 | 当前覆盖 |
|--------|------|------|------|---------|---------|
| `callAI()` | 65-279 | 调用 AI API 进行风险分析/评审/文档解析 | prompt, serviceType, userId?, projectId? | Promise<{success, response?, error?, logId?}> | ❌ 0% |
| `getDefaultAIConfig()` | 49-56 | 获取默认 AI 配置 | 无 | Promise<AIConfig> | ❌ 0% |
| `mapRiskScoreToLevel()` | 58-63 | 将风险分数映射到等级 | score | 'LOW' \| 'MEDIUM' \| 'HIGH' \| 'CRITICAL' | ❌ 0% |

**接口定义** (需要验证是否需要测试):

| 接口 | 用途 | 测试优先级 |
|-----|------|----------|
| `AIRequest` | AI 请求格式 | 低（类型定义） |
| `AIResponse` | AI 响应格式 | 低（类型定义） |
| `RiskAnalysisResult` | 风险分析结果 | 中 |
| `ReviewAuditResult` | 评审审计结果 | 中 |

---

### 2.2 测试策略

#### 2.2.1 `callAI()` 函数测试

**测试场景**:

**场景 1: 风险分析成功**
```typescript
describe('callAI - RISK_ANALYSIS', () => {
  it('应该成功调用风险分析 API', async () => {
    // Mock 外部 AI API
    vi.stubEnv('AI_API_KEY', 'test-key')
    vi.stubEnv('AI_BASE_URL', 'https://test.ai.com/v1')
    vi.stubEnv('AI_MODEL', 'gpt-4')

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            role: 'assistant',
            content: JSON.stringify({
              riskScore: 75,
              riskLevel: 'HIGH',
              analysis: '高风险项目',
              factors: ['技术复杂', '资源不足'],
              recommendations: ['增加资源', '简化设计']
            })
          }
        }]
      })
    } as Response)

    const result = await callAI(
      '分析项目风险',
      'RISK_ANALYSIS',
      'user-123',
      'project-456'
    )

    expect(result.success).toBe(true)
    expect(result.response).toBeDefined()
    const response = JSON.parse(result.response!)
    expect(response.riskLevel).toBe('HIGH')
  })
})
```

**场景 2: 评审审计成功**
```typescript
describe('callAI - REVIEW_AUDIT', () => {
  it('应该成功调用评审审计 API', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            role: 'assistant',
            content: JSON.stringify({
              isCompliant: true,
              issues: [],
              overallAssessment: '符合评审标准',
              score: 95
            })
          }
        }]
      })
    } as Response)

    const result = await callAI(
      '评审这个文档',
      'REVIEW_AUDIT',
      'user-123'
    )

    expect(result.success).toBe(true)
    const response = JSON.parse(result.response!)
    expect(response.isCompliant).toBe(true)
    expect(response.score).toBe(95)
  })
})
```

**场景 3: API 调用失败**
```typescript
describe('callAI - Error Handling', () => {
  it('应该处理 API 调用失败', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    const result = await callAI(
      '测试提示',
      'RISK_ANALYSIS'
    )

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('应该处理网络错误', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(
      new Error('Network error')
    )

    const result = await callAI(
      '测试提示',
      'DOC_PARSE'
    )

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})
```

**场景 4: 无 API Key**
```typescript
describe('callAI - No API Key', () => {
  it('缺少 API Key 时应该返回错误', async () => {
    delete process.env.AI_API_KEY

    const result = await callAI(
      '测试提示',
      'RISK_ANALYSIS'
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('API key')
  })
})
```

#### 2.2.2 `getDefaultAIConfig()` 函数测试

```typescript
describe('getDefaultAIConfig', () => {
  it('应该从数据库获取默认配置', async () => {
    const mockConfig = {
      id: 'config-1',
      isActive: true,
      isDefault: true,
      model: 'gpt-4',
      baseUrl: 'https://custom.ai.com',
      temperature: 0.7,
      maxTokens: 2000,
    }

    vi.mocked(prisma.aIConfig.findFirst).mockResolvedValueOnce(mockConfig)

    const config = await getDefaultAIConfig()

    expect(config).toEqual(mockConfig)
  })

  it('没有默认配置时应该返回 null', async () => {
    vi.mocked(prisma.aIConfig.findFirst).mockResolvedValueOnce(null)

    const config = await getDefaultAIConfig()

    expect(config).toBeNull()
  })
})
```

#### 2.2.3 `mapRiskScoreToLevel()` 函数测试

```typescript
describe('mapRiskScoreToLevel', () => {
  it('分数 ≤30 应返回 LOW', () => {
    expect(mapRiskScoreToLevel(30)).toBe('LOW')
    expect(mapRiskScoreToLevel(0)).toBe('LOW')
    expect(mapRiskScoreToLevel(25)).toBe('LOW')
  })

  it('分数 31-60 应返回 MEDIUM', () => {
    expect(mapRiskScoreToLevel(31)).toBe('MEDIUM')
    expect(mapRiskScoreToLevel(45)).toBe('MEDIUM')
    expect(mapRiskScoreToLevel(60)).toBe('MEDIUM')
  })

  it('分数 61-85 应返回 HIGH', () => {
    expect(mapRiskScoreToLevel(61)).toBe('HIGH')
    expect(mapRiskScoreToLevel(75)).toBe('HIGH')
    expect(mapRiskScoreToLevel(85)).toBe('HIGH')
  })

  it('分数 >85 应返回 CRITICAL', () => {
    expect(mapRiskScoreToLevel(86)).toBe('CRITICAL')
    expect(mapRiskScoreToLevel(100)).toBe('CRITICAL')
  })
})
```

---

### 2.3 Mock 策略

**外部依赖**:
1. **OpenAI API** (通过 `fetch` 调用)
   - Mock 策略: Mock `global.fetch`
   - 测试各种响应场景（成功、失败、超时）

2. **Prisma AI Config**
   - Mock 策略: `vi.mock('@/lib/prisma')`
   - 测试配置存在/不存在场景

3. **环境变量**
   - Mock 策略: `vi.stubEnv()` / `vi.unstubEnv()`

**Mock 配置**:
```typescript
// tests/mocks/ai-mock.ts
export function setupAIMocks() {
  // Mock Prisma
  vi.mock('@/lib/prisma', () => ({
    prisma: {
      aIConfig: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      aILog: {
        create: vi.fn(),
      },
    },
  }))

  // Mock environment
  vi.stubEnv('AI_API_KEY', 'test-api-key')
  vi.stubEnv('AI_BASE_URL', 'https://test.openai.com/v1')
  vi.stubEnv('AI_MODEL', 'gpt-4')
}

export function cleanupAIMocks() {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
}
```

---

### 2.4 新建测试文件

**文件**: `src/__tests__/ai.test.ts`

**结构**:
```typescript
// ============================================================================
// AI 服务模块单元测试
// ============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { callAI, getDefaultAIConfig, mapRiskScoreToLevel } from '@/lib/ai'
import { setupAIMocks, cleanupAIMocks } from '@/tests/mocks/ai-mock'

describe('AI Service', () => {
  beforeEach(() => {
    setupAIMocks()
  })

  afterEach(() => {
    cleanupAIMocks()
  })

  describe('callAI - RISK_ANALYSIS', () => {
    // 测试场景...
  })

  describe('callAI - REVIEW_AUDIT', () => {
    // 测试场景...
  })

  describe('callAI - DOC_PARSE', () => {
    // 测试场景...
  })

  describe('callAI - Error Handling', () => {
    // 测试场景...
  })

  describe('getDefaultAIConfig', () => {
    // 测试场景...
  })

  describe('mapRiskScoreToLevel', () => {
    // 测试场景...
  })
})
```

---

### 2.5 阶段二验收标准

**覆盖目标**:
```
AI 服务覆盖率: 70%+ (从 1.83% 提升)
新增测试文件: 1个 (ai.test.ts)
测试用例数: 15-20个
```

**验收清单**:
- [ ] `callAI()` 的所有 serviceType 都有测试
- [ ] 错误处理场景完整（API失败、网络错误、无 API Key）
- [ ] `getDefaultAIConfig()` 测试配置存在/不存在
- [ ] `mapRiskScoreToLevel()` 所有边界值都有测试
- [ ] Mock 配置正确，不干扰真实 API
- [ ] 所有新测试通过

---

## 阶段三：提升认证模块覆盖率 (P1 - 重要)

> **时间**: 4小时 | **优先级**: 高 | **目标**: 从 47.83% 提升到 85%

### 3.1 问题诊断

**根本问题** (来自调研 bg_4f6508f4):
```
❌ src/__tests__/auth.test.ts 测试的是本地 mock 函数
❌ 不是导入和测试 src/lib/auth.ts 中的真实函数

当前测试文件中的函数 (行 120-159):
- hashPassword()
- verifyPassword()
- generateToken()
- verifyToken()
- validateEmail()
- validatePassword()

src/lib/auth.ts 中实际函数:
✓ getAuthenticatedUser(request)
✓ requireAuth(request)
```

**覆盖率低的真实原因**:
- **0%**: `getAuthenticatedUser` 完全未测试
- **0%**: `requireAuth` 完全未测试
- **未覆盖行**: 11-21, 30-44

---

### 3.2 修复方案：创建真实的认证测试

**选项A - 重写现有测试文件**（推荐）:
删除 `src/__tests__/auth.test.ts` 中的本地 mock 函数，导入真实函数

**选项B - 创建新的认证测试文件**:
保持现有测试（用于其他目的），创建 `src/__tests__/auth-request.test.ts`

**推荐使用选项A**，因为现有测试名称暗示应该测试真实认证模块。

---

### 3.3 测试场景设计

#### 3.3.1 `getAuthenticatedUser()` 测试

```typescript
describe('getAuthenticatedUser', () => {
  it('无 user-id cookie 时应返回 null', async () => {
    const request = new Request('http://localhost:3000')

    const user = await getAuthenticatedUser(request)

    expect(user).toBeNull()
  })

  it('user-id cookie 为空字符串时应返回 null', async () => {
    const request = new Request('http://localhost:3000', {
      headers: {
        'Cookie': 'user-id=; path=/'
      }
    })

    const user = await getAuthenticatedUser(request)

    expect(user).toBeNull()
  })

  it('用户不存在时应返回 null', async () => {
    // Mock Prisma 返回 null
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

    const request = new Request('http://localhost:3000', {
      headers: {
        'Cookie': 'user-id=nonexistent-user; path=/'
      }
    })

    const user = await getAuthenticatedUser(request)

    expect(user).toBeNull()
  })

  it('用户存在时应返回用户对象', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
    }

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser)

    const request = new Request('http://localhost:3000', {
      headers: {
        'Cookie': 'user-id=user-123; path=/'
      }
    })

    const user = await getAuthenticatedUser(request)

    expect(user).toEqual(mockUser)
  })
})
```

#### 3.3.2 `requireAuth()` 测试

```typescript
describe('requireAuth', () => {
  it('无认证时应返回 401 错误响应', async () => {
    const request = new Request('http://localhost:3000')

    const result = await requireAuth(request)

    expect(result).toBeInstanceOf(Response)
    expect(result.status).toBe(401)
    const data = await result.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('UNAUTHORIZED_ERROR')
  })

  it('用户不存在时应返回 404 错误响应', async () => {
    // Mock Prisma 返回 null
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

    const request = new Request('http://localhost:3000', {
      headers: {
        'Cookie': 'user-id=nonexistent-user; path=/'
      }
    })

    const result = await requireAuth(request)

    expect(result).toBeInstanceOf(Response)
    expect(result.status).toBe(404)
    const data = await result.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('USER_NOT_FOUND_ERROR')
  })

  it('已认证时应返回用户对象', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
    }

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser)

    const request = new Request('http://localhost:3000', {
      headers: {
        'Cookie': 'user-id=user-123; path=/'
      }
    })

    const user = await requireAuth(request)

    expect(user).toEqual(mockUser)
  })
})
```

---

### 3.4 Mock 配置

```typescript
// tests/mocks/auth-mock.ts
import { vi } from 'vitest'
import { prisma } from '@/lib/prisma'

export function setupAuthMocks() {
  vi.mock('@/lib/prisma', () => ({
    prisma: {
      user: {
        findUnique: vi.fn(),
      },
    },
  }))
}

export function cleanupAuthMocks() {
  vi.clearAllMocks()
}
```

---

### 3.5 修改现有测试文件

**文件**: `src/__tests__/auth.test.ts`

**删除部分** (行 120-159):
```typescript
// ❌ 删除这些本地 mock 函数
async function hashPassword() { ... }
async function verifyPassword() { ... }
function generateToken() { ... }
function verifyToken() { ... }
function validateEmail() { ... }
function validatePassword() { ... }
```

**修改部分** (在文件顶部):
```typescript
// ✅ 添加真实导入
import { getAuthenticatedUser, requireAuth } from '@/lib/auth'
```

**添加测试块**:
```typescript
// 在文件末尾添加
describe('getAuthenticatedUser', () => {
  // 测试场景... (见 3.3.1)
})

describe('requireAuth', () => {
  // 测试场景... (见 3.3.2)
})
```

---

### 3.6 安全关键路径测试

**必须测试的场景** (安全审计要求):

| 场景 | 代码位置 | 风险等级 | 测试优先级 |
|-----|----------|----------|----------|
| 未认证访问受保护资源 | `requireAuth` 行 32-34 | 高 | 🔴 必须有 |
| 无效用户 ID 尝试访问 | `requireAuth` 行 36-42 | 高 | 🔴 必须有 |
| Cookie 篡改 | `getAuthenticatedUser` 行 17-19 | 中 | 🟡 应该有 |
| 撤销用户后的访问 | `requireAuth` 行 40-42 | 中 | 🟡 应该有 |

---

### 3.7 阶段三验收标准

**覆盖目标**:
```
认证模块覆盖率: 85%+ (从 47.83% 提升)
未覆盖的函数: 0个 (getAuthenticatedUser, requireAuth)
测试用例数: 新增 6-8个
```

**验收清单**:
- [ ] `getAuthenticatedUser()` 全部分支都有测试
- [ ] `requireAuth()` 全部分支都有测试
- [ ] 所有安全关键路径都有测试
- [ ] Mock 正确，不影响真实数据库
- [ ] 所有新测试通过
- [ ] 覆盖率报告显示显著提升

---

## 阶段四：提升 API 响应层覆盖率 (P1 - 重要)

> **时间**: 3小时 | **优先级**: 高 | **目标**: 从 38.78% 提升到 80%

### 4.1 API 响应模块分析

**文件**: `src/lib/api/response.ts` (68行)

**导出的函数**:

| 函数 | 行号 | 用途 | 参数 | 返回类型 | 当前覆盖 |
|-----|------|------|------|---------|---------|
| `success()` | 61 | 成功响应 | data, message?, status? | NextResponse | ✅ 部分覆盖 |
| `error()` | 62 | 错误响应 | code, message, details?, status? | NextResponse | ✅ 部分覆盖 |
| `created()` | 63 | 创建成功响应 | data, message? | NextResponse | ✅ 已测试 |
| `unauthorized()` | 64 | 未授权响应 | message? | NextResponse | ✅ 已测试 |
| `forbidden()` | 65 | 禁止访问响应 | message? | NextResponse | ✅ 已测试 |
| `notFound()` | 66 | 资源不存在响应 | message? | NextResponse | ✅ 已测试 |
| `serverError()` | 67 | 服务器错误响应 | message? | NextResponse | ✅ 已测试 |
| `validationError()` | 68 | 验证错误响应 | message, details? | NextResponse | ✅ 已测试 |

**未覆盖的代码** (根据覆盖率报告 38.78%):

| 代码行 | 内容 | 未覆盖原因 |
|-------|------|----------|
| 行 6-14 | ApiResponder 类定义 | 类型定义不需要测试 |
| 行 18-21 | ApiResponder.success() | 部分覆盖 |
| 行 25-33 | ApiResponder.error() | details 参数测试不足 |
| 行 37-39 | ApiResponder.unauthorized() | 自定义消息未测试 |
| 行 41-43 | ApiResponder.forbidden() | 自定义消息未测试 |
| 行 45-47 | ApiResponder.notFound() | 自定义消息未测试 |
| 行 49-51 | ApiResponder.serverError() | 自定义消息未测试 |
| 行 53-58 | ApiResponder.validationError() | details 参数测试不足 |

---

### 4.2 补充测试场景

#### 4.2.1 `success()` 函数

```typescript
describe('ApiResponder.success', () => {
  it('应该返回 200 默认状态码', async () => {
    const response = ApiResponder.success({ id: 1 })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toEqual({ id: 1 })
  })

  it('应该支持自定义状态码', async () => {
    const response = ApiResponder.success({ id: 1 }, '成功', 204)
    expect(response.status).toBe(204)
  })

  it('应该支持自定义消息', async () => {
    const response = ApiResponder.success({ id: 1 }, '操作成功')
    const data = await response.json()
    expect(data.message).toBe('操作成功')
  })

  it('消息为空时不包含 message 字段', async () => {
    const response = ApiResponder.success({ id: 1 })
    const data = await response.json()
    expect(data.message).toBeUndefined()
  })
})
```

#### 4.2.2 `error()` 函数

```typescript
describe('ApiResponder.error', () => {
  it('应该返回 400 默认状态码', async () => {
    const response = ApiResponder.error('BAD_REQUEST', '请求错误')
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('BAD_REQUEST')
  })

  it('应该支持自定义状态码', async () => {
    const response = ApiResponder.error('CUSTOM_ERROR', '自定义错误', undefined, 422)
    expect(response.status).toBe(422)
  })

  it('应该支持 details 参数', async () => {
    const response = ApiResponder.error(
      'VALIDATION_ERROR',
      '验证失败',
      { field: 'email', rule: 'required' }
    )
    const data = await response.json()
    expect(data.error.details).toEqual({ field: 'email', rule: 'required' })
  })

  it('details 为空时不包含 details 字段', async () => {
    const response = ApiResponder.error('SERVER_ERROR', '服务器错误')
    const data = await response.json()
    expect(data.error.details).toBeUndefined()
  })
})
```

#### 4.2.3 其他响应函数测试

```typescript
describe('ApiResponder 帮助方法', () => {
  describe('unauthorized', () => {
    it('应该返回 401 状态码', async () => {
      const response = ApiResponder.unauthorized()
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error.code).toBe('UNAUTHORIZED')
    })

    it('应该支持自定义消息', async () => {
      const response = ApiResponder.unauthorized('请先登录')
      const data = await response.json()
      expect(data.error.message).toBe('请先登录')
    })
  })

  describe('forbidden', () => {
    it('应该返回 403 状态码', async () => {
      const response = ApiResponder.forbidden()
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error.code).toBe('FORBIDDEN')
    })

    it('应该支持自定义消息', async () => {
      const response = ApiResponder.forbidden('权限不足')
      const data = await response.json()
      expect(data.error.message).toBe('权限不足')
    })
  })

  describe('notFound', () => {
    it('应该返回 404 状态码', async () => {
      const response = ApiResponder.notFound()
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error.code).toBe('NOT_FOUND')
    })

    it('应该支持自定义消息', async () => {
      const response = ApiResponder.notFound('资源不存在')
      const data = await response.json()
      expect(data.error.message).toBe('资源不存在')
    })
  })

  describe('serverError', () => {
    it('应该返回 500 状态码', async () => {
      const response = ApiResponder.serverError()
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })

    it('应该支持自定义消息', async () => {
      const response = ApiResponder.serverError('服务异常')
      const data = await response.json()
      expect(data.error.message).toBe('服务异常')
    })
  })

  describe('validationError', () => {
    it('应该返回 400 状态码', async () => {
      const response = ApiResponder.validationError('验证失败')
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('应该支持 details', async () => {
      const response = ApiResponder.validationError(
        '字段验证失败',
        { fields: ['email', 'password'] }
      )
      const data = await response.json()
      expect(data.error.details).toEqual({ fields: ['email', 'password'] })
    })
  })
})
```

---

### 4.3 修改现有测试文件

**文件**: `tests/unit/api/response.test.ts`

**现有测试**: 已测试基础功能（导出、基本响应）

**需要补充**: 参数化测试、边界场景

**修改策略**:
在现有测试文件末尾添加上述新测试场景

---

### 4.4 阶段四验收标准

**覆盖目标**:
```
API 响应层覆盖率: 80%+ (从 38.78% 提升)
测试用例数: 新增 15-20个
```

**验收清单**:
- [ ] 所有响应函数的参数化测试
- [ ] 自定义消息测试覆盖
- [ ] details 参数测试覆盖
- [ ] 所有测试通过
- [ ] 覆盖率报告显示提升

---

## 阶段五：补充 E2E 测试 (P2 - 必要)

> **时间**: 8小时 | **优先级**: 中 | **目标**: 从 40% 提升到 75%

### 5.1 E2E 测试模式分析

**测试框架**: Playwright (最新版)

**现有测试文件**:
- `tests/e2e/auth.spec.ts` (53行)
- `tests/e2e/p0-p1-features.spec.ts`

**测试结构**:
```typescript
import { test, expect } from "@playwright/test";

test.describe("功能模块", () => {
  test("测试场景描述", async ({ page }) => {
    // 1. 导航到页面
    await page.goto("/path")

    // 2. 填写表单
    await page.fill('input[name="field"]', "value")

    // 3. 点击按钮
    await page.click('button[type="submit"]')

    // 4. 验证结果
    await expect(page).toHaveURL(/\/expected\/path/)
  })
})
```

**页面定位器模式**:
```typescript
// 表单输入
await page.fill('input[name="email"]', "test@example.com")
await page.fill('input[name="password"]', "password123")

// 按钮
await page.click('button[type="submit"]')

// 错误消息
const errorMessage = page.getByText("邮箱或密码错误")
await expect(errorMessage).toBeVisible()
```

---

### 5.2 新增 E2E 测试文件

#### 5.2.1 需求管理 E2E 测试

**文件**: `tests/e2e/requirement.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("需求管理", () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "admin123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("应该成功创建需求", async ({ page }) => {
    // 导航到需求列表
    await page.goto("/requirements");

    // 点击创建按钮
    await page.click('button:has-text("创建需求")');

    // 填写需求信息
    await page.fill('input[name="title"]', "测试需求");
    await page.fill('textarea[name="description"]', "需求描述");
    await page.selectOption('select[name="priority"]', "HIGH");
    await page.selectOption('select[name="type"]', "FUNCTIONAL");

    // 提交
    await page.click('button[type="submit"]');

    // 验证成功
    await expect(page.getByText("需求创建成功")).toBeVisible();
  });

  test("应该成功更新需求状态", async ({ page }) => {
    await page.goto("/requirements");

    // 找到测试需求
    const requirement = page.getByText("测试需求");
    await requirement.click();

    // 点击状态变更
    await page.click('button:has-text("变更状态")');
    await page.selectOption('select[name="status"]', "IN_PROGRESS");
    await page.click('button:has-text("确认")');

    // 验证状态更新
    await expect(page.getByText("状态已更新")).toBeVisible();
  });

  test("应该成功分配需求给用户", async ({ page }) => {
    await page.goto("/requirements");

    const requirement = page.getByText("待分配需求");
    await requirement.click();

    // 点击分配按钮
    await page.click('button:has-text("分配")');
    await page.selectOption('select[name="assignee"]', "test-user@example.com");
    await page.click('button:has-text("确认")');

    // 验证分配成功
    await expect(page.getByText("已分配给 test-user@example.com")).toBeVisible();
  });
});
```

#### 5.2.2 文件预览 E2E 测试

**文件**: `tests/e2e/file-preview.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("文件管理", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "admin123");
    await page.click('button[type="submit"]');
  });

  test("应该成功上传文件", async ({ page }) => {
    await page.goto("/files");

    // 点击上传按钮
    await page.click('button:has-text("上传文件")');

    // 选择文件
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/test-document.pdf');

    // 填写文件信息
    await page.fill('input[name="fileName"]', "测试文档");

    // 提交
    await page.click('button:has-text("上传")');

    // 验证成功
    await expect(page.getByText("文件上传成功")).toBeVisible();
  });

  test("应该成功预览 PDF 文件", async ({ page }) => {
    await page.goto("/files");

    // 找到测试文件
    const file = page.getByText("test-document.pdf");
    await file.click();

    // 点击预览
    await page.click('button:has-text("预览")');

    // 验证预览窗口打开
    const previewModal = page.locator('[role="dialog"]');
    await expect(previewModal).toBeVisible();
    await expect(previewModal.locator('iframe')).toBeVisible();
  });

  test("应该成功下载文件", async ({ page }) => {
    await page.goto("/files");

    const file = page.getByText("test-document.pdf");
    await file.click();

    // 点击下载
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("下载")');
    const download = await downloadPromise;

    // 验证文件名
    expect(download.suggestedFilename()).toBe("test-document.pdf");
  });
});
```

#### 5.2.3 评审流程 E2E 测试

**文件**: `tests/e2e/review.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("评审管理", () => {
  test("应该成功创建评审", async ({ page }) => {
    await page.goto("/reviews");

    // 点击创建评审
    await page.click('button:has-text("创建评审")');

    // 填写评审信息
    await page.fill('input[name="title"]', "可行性评审");
    await page.selectOption('select[name="type"]', "FEASIBILITY");
    await page.fill('textarea[name="description"]', "评审描述");

    // 选择参与者
    await page.click('button:has-text("添加参与者")');
    await page.fill('input[placeholder="搜索用户"]', "test-user");
    await page.click('li:has-text("test-user@example.com")');

    // 提交
    await page.click('button[type="submit"]');

    // 验证成功
    await expect(page.getByText("评审创建成功")).toBeVisible();
  });

  test("应该成功提交评审意见", async ({ page }) => {
    await page.goto("/reviews/test-review-id");

    // 点击添加意见
    await page.click('button:has-text("添加意见")');

    // 填写意见
    await page.selectOption('select[name="decision"]', "APPROVED");
    await page.fill('textarea[name="comment"]', "评审通过，建议改进...");

    // 提交
    await page.click('button:has-text("提交意见")');

    // 验证成功
    await expect(page.getByText("意见提交成功")).toBeVisible();
  });
});
```

#### 5.2.4 通知系统 E2E 测试

**文件**: `tests/e2e/notification.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("通知系统", () => {
  test("应该实时显示新通知", async ({ page }) => {
    await page.goto("/dashboard");

    // 记录初始通知数
    const initialCount = await page.locator('[data-testid="notification-count"]').textContent();

    // 触发一个新通知（通过 API 或模拟）
    // 例如：创建一个新任务
    await page.goto("/tasks");
    await page.click('button:has-text("创建任务")');
    await page.fill('input[name="title"]', "触发通知的任务");
    await page.click('button[type="submit"]');

    // 返回仪表板
    await page.goto("/dashboard");

    // 验证通知数量增加
    const newCount = await page.locator('[data-testid="notification-count"]').textContent();
    expect(parseInt(newCount)).toBe(parseInt(initialCount) + 1);
  });

  test("应该成功标记通知为已读", async ({ page }) => {
    await page.goto("/dashboard");

    // 点击通知
    const notification = page.locator('[data-testid="notification-item"]').first();
    await notification.click();

    // 验证通知标记为已读（样式变化）
    await expect(notification).toHaveClass(/read/);
  });

  test("应该支持通知筛选", async ({ page }) => {
    await page.goto("/dashboard");

    // 点击筛选
    await page.click('button:has-text("筛选通知")');

    // 选择"未读"筛选
    await page.click('label:has-text("仅显示未读")');

    // 验证只有未读通知显示
    const notifications = page.locator('[data-testid="notification-item"]');
    const count = await notifications.count();

    for (let i = 0; i < count; i++) {
      const notification = notifications.nth(i);
      await expect(notification).toHaveClass(/unread/);
    }
  });
});
```

---

### 5.3 Playwright 配置优化

**文件**: `playwright.config.ts`

**确保配置包含**:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

---

### 5.4 页面对象模式 (可选优化)

创建可复用的页面对象：

**文件**: `tests/e2e/pages/DashboardPage.ts`
```typescript
import { Page, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async getNotificationCount(): Promise<number> {
    const count = await this.page.locator('[data-testid="notification-count"]').textContent();
    return parseInt(count || '0');
  }

  async getFirstNotification(): Promise<Locator> {
    return this.page.locator('[data-testid="notification-item"]').first();
  }

  async markNotificationAsRead(notification: Locator) {
    await notification.click();
    await expect(notification).toHaveClass(/read/);
  }
}
```

**在测试中使用**:
```typescript
import { test } from '@playwright/test';
import { DashboardPage } from './pages/DashboardPage';

test('通知测试', async ({ page }) => {
  const dashboard = new DashboardPage(page);
  await dashboard.goto();

  const countBefore = await dashboard.getNotificationCount();
  // ... 触发通知
  const countAfter = await dashboard.getNotificationCount();
  expect(countAfter).toBe(countBefore + 1);
});
```

---

### 5.5 阶段五验收标准

**覆盖目标**:
```
E2E 测试覆盖率: 75%+ (从 40% 提升)
新增 E2E 测试文件: 4个
测试场景数: 新增 12-15个
```

**验收清单**:
- [ ] 需求管理 E2E 测试创建并通过
- [ ] 文件预览 E2E 测试创建并通过
- [ ] 评审流程 E2E 测试创建并通过
- [ ] 通知系统 E2E 测试创建并通过
- [ ] 测试在所有浏览器（Chromium, Firefox, WebKit）通过
- [ ] 测试可以并行执行
- [ ] 失败时自动截图和 trace

---

## 阶段六：覆盖率整体优化 (P2 - 持续进行)

> **时间**: 持续 | **优先级**: 中 | **目标**: 从 76.87% 提升到 95%

### 6.1 邮件服务优化 (当前 75.76%)

**未覆盖代码**:
```typescript
// src/lib/email.ts
- 行 76-77: 发送邮件错误处理
- 行 80-88: 附件处理
- 行 90-92: 邮件模板渲染
- 行 112-114: 队列操作
- 行 117-118, 120-124: 批量操作
```

**补充测试场景**:
```typescript
describe('Email Service', () => {
  it('应该正确处理邮件附件', async () => {
    // 测试附件添加、验证、发送
  })

  it('应该使用正确的邮件模板', async () => {
    // 测试模板变量替换、HTML 渲染
  })

  it('应该正确处理发送失败', async () => {
    // 测试重试逻辑、错误记录
  })

  it('应该支持批量发送', async () => {
    // 测试批量邮件、队列管理
  })
})
```

---

### 6.2 边缘场景和错误处理

**检查清单**:
- [ ] 所有 `try-catch` 块的错误路径都有测试
- [ ] 所有 `if-else` 分支都有测试
- [ ] 所有边界值（空、null、undefined）都有测试
- [ ] 所有数据库操作失败都有错误处理测试

---

### 6.3 持续监控和优化

**定期执行**:
```bash
# 每周运行覆盖率报告
bun test --coverage

# 识别未覆盖的代码
# 制定测试补充计划
# 执行并验证
```

---

### 6.4 阶段六验收标准

**最终目标**:
```
整体行覆盖率: ≥95%
整体函数覆盖率: ≥95%
所有主要模块覆盖率 ≥85%
```

**验收清单**:
- [ ] 邮件服务覆盖率 ≥85%
- [ ] 所有核心业务逻辑覆盖率 ≥90%
- [ ] 工具函数覆盖率 = 100%
- [ ] 无关键代码路径未测试

---

## 📊 执行时间表

### Week 1 (P0 - 紧急)

| 天 | 任务 | 时间 |
|----|------|------|
| Day 1 (4h) | 阶段一：修复测试失败 | 4h |
| - | 1.1 修复 Vitest 兼容性 | 30m |
| - | 1.2 修复 API 路由测试 | 1h |
| - | 1.3 修复测试数据不匹配 | 30m |
| - | 1.4 验证数据库初始化 | 30m |
| - | 运行测试验证 | 1.5h |
| Day 2-5 | 阶段二：AI 服务覆盖率 | 6h |

### Week 2 (P1 - 重要)

| 天 | 任务 | 时间 |
|----|------|------|
| Day 1-2 | 阶段三：认证模块覆盖率 | 4h |
| Day 3 | 阶段四：API 响应层覆盖率 | 3h |
| Day 4-5 | 阶段五：E2E 测试（部分） | 4h |

### Week 3 (P2 - 必要)

| 天 | 任务 | 时间 |
|----|------|------|
| Day 1-2 | 阶段五：E2E 测试（完成） | 4h |
| Day 3-4 | 阶段六：覆盖率优化 | 4h |
| Day 5 | 最终验证和调整 | 4h |

---

## 🔧 工具和依赖

### 需要的工具
- ✅ Vitest (已安装)
- ✅ Playwright (已安装)
- ✅ Prisma (已安装)
- ✅ TypeScript (已安装)

### 需要的 Mock 工具
- `vi.fn()` - Vitest 内置
- `vi.mock()` - Vitest 内置
- `vi.stubEnv()` - 环境变量 mock
- `global.fetch` - 全局 fetch mock

---

## ✅ 最终验收标准

### 整体指标

| 指标 | 当前值 | 目标值 | 验收标准 |
|-----|-------|-------|---------|
| 测试通过率 | 32.5% | ≥95% | `bun test --run` 显示通过率≥95% |
| 行覆盖率 | 76.87% | ≥95% | 覆盖率报告显示行覆盖率≥95% |
| 函数覆盖率 | 80.11% | ≥95% | 覆盖率报告显示函数覆盖率≥95% |
| 测试文件数 | 43个 | ≥50个 | 至少新增7个测试文件 |
| E2E 测试文件 | 2个 | ≥6个 | 至少新增4个 E2E 测试文件 |

### 分模块指标

| 模块 | 当前覆盖率 | 目标覆盖率 | 验收标准 |
|-----|----------|----------|---------|
| AI 服务 | 1.83% | ≥70% | 新增 ai.test.ts，15+ 测试用例 |
| 认证模块 | 47.83% | ≥85% | 修复测试文件，6+ 新测试用例 |
| API 响应层 | 38.78% | ≥80% | 新增测试场景，15+ 测试用例 |
| 邮件服务 | 75.76% | ≥85% | 补充边缘场景，4+ 测试用例 |
| E2E 测试 | 40% | ≥75% | 新增4个测试文件，12+ 测试场景 |

---

## 📝 Git 提交规范

### 阶段一提交
```
test(fix):修复测试基础设施问题

- 修复 Vitest vi.mocked() 兼容性问题，使用 vi.fn()
- 修复 API 路由测试 NextResponse.json() 问题
- 修复测试数据不匹配（role: REGULAR → EMPLOYEE）
- 优化测试数据库路径配置
- 测试通过率: 32.5% → 85%
```

### 阶段二提交
```
test(ai): 添加 AI 服务完整测试覆盖

- 新增 src/__tests__/ai.test.ts (400+ 行)
- 测试 callAI() 所有 serviceType (RISK_ANALYSIS, REVIEW_AUDIT, DOC_PARSE)
- 测试错误处理（API失败、网络错误、无 API Key）
- 测试 getDefaultAIConfig() 和 mapRiskScoreToLevel()
- 添加 Mock 配置 (tests/mocks/ai-mock.ts)
- AI 服务覆盖率: 1.83% → 70%
```

### 阶段三提交
```
test(auth): 修复认证模块测试并提升覆盖率

- 重写 src/__tests__/auth.test.ts，导入真实函数
- 测试 getAuthenticatedUser() 全部分支
- 测试 requireAuth() 全部分支（含安全关键路径）
- 添加 Mock 配置 (tests/mocks/auth-mock.ts)
- 认证模块覆盖率: 47.83% → 85%
```

### 阶段四提交
```
test(api-response): 补充 API 响应层测试

- 新增参数化测试（自定义消息、details、status）
- 测试所有响应函数的边界场景
- API 响应层覆盖率: 38.78% → 80%
```

### 阶段五提交
```
test(e2e): 新增 E2E 测试覆盖核心流程

- 新增 tests/e2e/requirement.spec.ts
- 新增 tests/e2e/file-preview.spec.ts
- 新增 tests/e2e/review.spec.ts
- 新增 tests/e2e/notification.spec.ts
- E2E 测试覆盖率: 40% → 75%
```

### 阶段六提交
```
test(coverage): 优化整体测试覆盖率至95%

- 补充邮件服务边缘场景测试
- 优化错误处理测试覆盖
- 邮件服务覆盖率: 75.76% → 85%
- 整体行覆盖率: 76.87% → 95%
- 整体函数覆盖率: 80.11% → 95%
```

---

## 🚀 开始执行

准备好开始执行了吗？运行以下命令：

```bash
# 开始阶段一（修复测试失败）
/start-work
```

系统将根据此计划自动分配任务给执行代理，并跟踪进度。
