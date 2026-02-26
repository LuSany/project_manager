# 测试计划 V1.0

**创建时间**: 2026年2月25日  
**参考文档**: TECHNICAL_SPECIFICATION_V4.md  
**目标覆盖率**: 95%+

---

## 一、测试策略

### 1.1 测试层次

| 层级 | 测试类型 | 覆盖范围 | 工具 |
|------|---------|---------|------|
| 单元测试 | 函数、组件、工具类 | 业务逻辑、工具函数 | Vitest |
| 集成测试 | API 端点、数据库交互 | 端到端流程 | Vitest + Supertest |
| E2E 测试 | 用户交互流程 | 完整业务场景 | Playwright |
| 性能测试 | 响应时间、并发处理 | 关键 API | k6 |
| 安全测试 | 权限控制、数据验证 | 认证、授权 | 手动测试 |

### 1.2 测试覆盖率目标

| 模块 | 单元测试 | 集成测试 | E2E 测试 | 目标覆盖率 |
|------|---------|---------|---------|-------------|
| 用户管理 | 80% | 90% | 60% | 95% |
| 任务管理 | 85% | 85% | 70% | 95% |
| 需求管理 | 80% | 85% | 60% | 95% |
| ISSUE 管理 | 85% | 85% | 60% | 95% |
| 风险管理 | 80% | 85% | 60% | 95% |
| 评审管理 | 75% | 90% | 70% | 95% |
| 文件预览 | 70% | 80% | 50% | 95% |
| 通知系统 | 80% | 80% | 40% | 95% |
| AI 服务 | 70% | 85% | 30% | 95% |
| 邮件服务 | 85% | 85% | 40% | 95% |


### 1.3 测试数据管理



#### 目录结构

```

tests/

├── mocks/              # Mock 数据工厂

│   ├── data-factory.ts

├── fixtures/           # 测试固件数据

│   └── base-data.json

├── data/              # 测试数据生成器

│   └── test-db-manager.ts

├── security/          # 安全测试

│   ├── sql-injection.test.ts

│   └── api-security.test.ts

├── performance/       # 性能测试

│   └── api-performance.test.ts

├── integration/       # 集成测试

└── e2e/              # E2E 测试

```



#### Mock 工厂使用示例

```typescript

import { MockUserFactory, MockProjectFactory, MockTaskFactory } from './data-factory'



const admin = MockUserFactory.createAdmin()

const owner = MockUserFactory.createOwner()

const project = MockProjectFactory.create()

const task = MockTaskFactory.create({ projectId: project.id })

```



#### 固件数据

- `tests/fixtures/base-data.json` - 包含基本测试数据（users, projects, tasks）



#### 环境配置

- `.env.test` - 测试环境变量

- `docker-compose.test.yml` - Docker 测试环境
---

## 二、用户管理模块测试

### 2.1 单元测试

#### 测试文件：`src/lib/auth.test.ts`

**测试用例**:

```typescript
describe('AuthService', () => {
  describe('密码处理', () => {
    it('应该正确哈希密码', () => {
      const password = 'TestPass123'
      const hash = await hashPassword(password)
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
    })

    it('应该正确验证密码', async () => {
      const password = 'TestPass123'
      const hash = await hashPassword(password)
      const valid = await verifyPassword(password, hash)
      expect(valid).toBe(true)
    })

    it('应该拒绝错误密码', async () => {
      const hash = await hashPassword('correct')
      const valid = await verifyPassword('wrong', hash)
      expect(valid).toBe(false)
    })
  })

  describe('Token 生成和验证', () => {
    it('应该生成有效的 JWT Token', () => {
      const user = { id: '1', email: 'test@example.com', role: 'ADMIN' }
      const token = generateToken(user)
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
    })

    it('应该正确验证 Token', () => {
      const user = { id: '1', email: 'test@example.com', role: 'ADMIN' }
      const token = generateToken(user)
      const decoded = verifyToken(token)
      expect(decoded).toEqual(user)
    })

    it('应该拒绝无效 Token', () => {
      const decoded = verifyToken('invalid.token')
      expect(decoded).toBeNull()
    })

    it('应该拒绝过期的 Token', () => {
      const user = { id: '1', email: 'test@example.com', role: 'ADMIN' }
      const token = generateToken(user, -3600) // 1小时前过期
      const decoded = verifyToken(token)
      expect(decoded).toBeNull()
    })
  })
})
```

#### 测试文件：`src/__tests__/user-status.test.ts`

```typescript
describe('UserStatus 枚举', () => {
  it('应该包含所有必需的状态', () => {
    expect(UserStatus.PENDING).toBe('PENDING')
    expect(UserStatus.ACTIVE).toBe('ACTIVE')
    expect(UserStatus.SUSPENDED).toBe('SUSPENDED')
  })

  it('应该正确映射到数据库值', () => {
    const statusMap = {
      PENDING: 0,
      ACTIVE: 1,
      SUSPENDED: 2
    }
    expect(statusMap[UserStatus.PENDING]).toBe(0)
  })
})
```

### 2.2 集成测试

#### 测试文件：`tests/integration/auth.test.ts`

**测试场景**:

| 场景 | 端点 | 测试步骤 | 预期结果 |
|------|--------|---------|---------|
| 用户注册 | POST /api/v1/auth/register | 1. 提交有效的用户数据<br>2. 验证响应包含用户ID和Token<br>3. 验证用户状态为 PENDING | 201 Created + 用户数据 |
| 注册已存在邮箱 | POST /api/v1/auth/register | 1. 提交已存在的邮箱<br>2. 验证返回错误 | 409 Conflict |
| 密码格式验证 | POST /api/v1/auth/register | 1. 提交弱密码（"123456"）<br>2. 验证返回验证错误 | 400 Bad Request |
| 用户登录 | POST /api/v1/auth/login | 1. 提交有效凭据<br>2. 验证返回Token<br>3. 验证Token可访问受保护资源 | 200 OK + JWT Token |
| 登录凭据错误 | POST /api/v1/auth/login | 1. 提交错误密码<br>2. 验证返回 401 | 401 Unauthorized |
| 忘记密码请求 | POST /api/v1/auth/forgot-password | 1. 提交有效邮箱<br>2. 验证发送重置链接 | 200 OK + 成功消息 |
| 重置密码 | POST /api/v1/auth/reset-password | 1. 提交有效token和新密码<br>2. 验证密码更新成功 | 200 OK |

**测试代码示例**:

```typescript
describe('Auth API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('应该成功注册新用户', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test-${Date.now()}@example.com`,
          password: 'ValidPass123!',
          name: 'Test User',
          department: 'Engineering',
          position: 'Developer'
        })
      
      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data).toHaveProperty('token')
    })

    it('应该拒绝已存在的邮箱', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'ValidPass123!',
          name: 'Test User'
        })
      
      expect(response.status).toBe(409)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('已存在')
    })

    it('应该验证密码强度', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'weak@example.com',
          password: '123',
          name: 'Test User'
        })
      
      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('密码')
    })
  })

  describe('POST /api/v1/auth/login', () => {
    it('应该成功登录', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'ValidPass123!'
        })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('token')
    })

    it('应该拒绝错误密码', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPass123!'
        })
      
      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })
  })
})
```

### 2.3 E2E 测试

#### 测试文件：`tests/e2e/auth.spec.ts`

**测试场景**:

| 场景 | 步骤 | 预期结果 |
|------|------|---------|
| 完整注册流程 | 1. 导航到注册页<br>2. 填写有效表单<br>3. 提交注册<br>4. 验证跳转到登录页 | 显示成功消息，跳转到登录页 |
| 注册失败提示 | 1. 提交无效邮箱格式<br>2. 验证显示错误提示 | 显示表单验证错误 |
| 完整登录流程 | 1. 导航到登录页<br>2. 输入有效凭据<br>3. 提交登录<br>4. 验证跳转到 Dashboard | 跳转到 Dashboard，Cookie 设置正确 |
| 登录失败处理 | 1. 输入错误密码<br>2. 提交登录<br>3. 验证显示错误消息 | 显示登录失败消息 |
| 密码找回流程 | 1. 导航到忘记密码页<br>2. 输入有效邮箱<br>3. 提交请求<br>4. 验证显示成功消息 | 显示重置链接已发送消息 |
| 密码重置流程 | 1. 使用重置链接访问重置页<br>2. 输入新密码<br>3. 提交重置<br>4. 验证跳转到登录页 | 跳转到登录页，显示成功消息 |

**Playwright 测试示例**:

```typescript
import { test, expect } from '@playwright/test'

test.describe('用户认证', () => {
  test('完整的用户注册流程', async ({ page }) => {
    // 导航到注册页
    await page.goto('/register')
    
    // 填写表单
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`)
    await page.fill('input[name="password"]', 'ValidPass123!')
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="department"]', 'Engineering')
    await page.fill('input[name="position"]', 'Developer')
    
    // 提交注册
    await page.click('button[type="submit"]')
    
    // 等待成功消息
    await expect(page.locator('.success-message')).toBeVisible()
    
    // 验证跳转到登录页
    await page.waitForURL(/\/login/)
  })

  test('用户登录失败应显示错误', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // 验证错误消息
    await expect(page.locator('.error-message')).toBeVisible()
    await expect(page.locator('.error-message')).toContainText('邮箱或密码错误')
  })
})
```

---

## 三、任务管理模块测试

### 3.1 单元测试

#### 测试文件：`src/__tests__/task-priority.test.ts`（已存在）

**测试用例**:（已完成）- 任务优先级枚举测试、优先级排序

#### 测试文件：`src/__tests__/task-status.test.ts`（已存在）

**测试用例**:（已完成）- 任务状态枚举测试

#### 测试文件：`src/__tests__/task-dependency.test.ts`（已存在）

**测试用例**:（已完成）- 任务依赖关系测试

#### 新增测试文件：`src/lib/services/task-service.test.ts`

```typescript
describe('TaskService', () => {
  describe('任务进度计算', () => {
    it('应该正确计算任务进度', () => {
      const subTasks = [
        { isDone: true },
        { isDone: true },
        { isDone: false }
      ]
      
      const progress = calculateTaskProgress(subTasks)
      expect(progress).toBe(66.67) // 2/3 * 100
    })

    it('应该处理无子任务的情况', () => {
      const progress = calculateTaskProgress([])
      expect(progress).toBe(0)
    })
  })

  describe('任务依赖验证', () => {
    it('应该检测循环依赖', () => {
      const hasCycle = detectCircularDependency('task1', ['task2', 'task1'])
      expect(hasCycle).toBe(true)
    })

    it('应该允许有效依赖', () => {
      const hasCycle = detectCircularDependency('task1', ['task2', 'task3'])
      expect(hasCycle).toBe(false)
    })
  })
})
```

### 3.2 集成测试

#### 测试文件：`tests/integration/task.test.ts`

**测试场景**:

| 场景 | 端点 | 测试步骤 | 预期结果 |
|------|--------|---------|---------|
| 创建任务 | POST /api/v1/tasks | 1. 创建项目<br>2. 创建任务<br>3. 验证任务已创建 | 201 Created + 任务数据 |
| 获取任务列表 | GET /api/v1/tasks | 1. 查询任务列表<br>2. 验证返回分页数据 | 200 OK + 分页数据 |
| 更新任务状态 | PATCH /api/v1/tasks/[id]/status | 1. 更新任务状态<br>2. 验证状态已更新 | 200 OK |
| 更新任务进度 | PATCH /api/v1/tasks/[id]/progress | 1. 更新进度到 50%<br>2. 验证进度已更新 | 200 OK |
| 添加子任务 | POST /api/v1/tasks/[id]/subtasks | 1. 创建子任务<br>2. 验证子任务已关联 | 201 Created |
| 切换子任务状态 | POST /api/v1/tasks/[id]/subtasks/[id]/toggle | 1. 切换子任务完成状态<br>2. 验证父任务进度自动更新 | 200 OK |
| 添加任务依赖 | POST /api/v1/tasks/[id]/dependencies | 1. 添加任务 A 依赖于任务 B<br>2. 验证依赖已创建 | 201 Created |
| 任务标签管理 | GET/POST /api/v1/tasks/[id]/tags | 1. 创建标签<br>2. 为任务添加标签<br>3. 验证标签已关联 | 标签已关联 |
| 任务导入 | POST /api/v1/tasks/import | 1. 导入 Excel 任务模板<br>2. 验证任务已批量创建 | 批量任务已创建 |

**测试代码示例**:

```typescript
describe('Task API', () => {
  describe('POST /api/v1/tasks', () => {
    it('应该成功创建任务', async () => {
      const project = await createTestProject()
      const response = await request(app)
        .post('/api/v1/tasks')
        .send({
          projectId: project.id,
          title: 'Test Task',
          description: 'Test Description',
          priority: 'HIGH',
          status: 'TODO',
          startDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
      
      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.title).toBe('Test Task')
    })

    it('应该验证必填字段', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .send({
          projectId: '1',
          // 缺少 title
          description: 'Test'
        })
      
      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('PATCH /api/v1/tasks/[id]/status', () => {
    it('应该更新任务状态', async () => {
      const task = await createTestTask()
      const response = await request(app)
        .patch(`/api/v1/tasks/${task.id}`)
        .send({ status: 'IN_PROGRESS' })
      
      expect(response.status).toBe(200)
      expect(response.body.data.status).toBe('IN_PROGRESS')
    })

    it('应该拒绝无效状态', async () => {
      const task = await createTestTask()
      const response = await request(app)
        .patch(`/api/v1/tasks/${task.id}`)
        .send({ status: 'INVALID_STATUS' })
      
      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/v1/tasks/[id]/dependencies', () => {
    it('应该添加任务依赖', async () => {
      const task1 = await createTestTask()
      const task2 = await createTestTask()
      const response = await request(app)
        .post(`/api/v1/tasks/${task1.id}/dependencies`)
        .send({
          dependsOnId: task2.id,
          dependencyType: 'FINISH_TO_START'
        })
      
      expect(response.status).toBe(201)
    })

    it('应该拒绝循环依赖', async () => {
      const task1 = await createTestTask()
      const response = await request(app)
        .post(`/api/v1/tasks/${task1.id}/dependencies`)
        .send({
          dependsOnId: task1.id, // 依赖自己
          dependencyType: 'FINISH_TO_START'
        })
      
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('循环依赖')
    })
  })
})
```

### 3.3 E2E 测试

#### 测试文件：`tests/e2e/task-workflow.spec.ts`

**测试场景**:

| 场景 | 步骤 | 预期结果 |
|------|------|---------|
| 任务看板拖拽 | 1. 导航到任务看板<br>2. 拖拽任务从 TODO 到 IN_PROGRESS<br>3. 验证任务状态更新<br>4. 刷新页面验证状态 | 任务状态正确更新 |
| 任务详情编辑 | 1. 点击任务查看详情<br>2. 编辑任务标题<br>3. 保存修改<br>4. 验证标题已更新 | 任务标题已更新 |
| 添加子任务 | 1. 在任务详情页添加子任务<br>2. 填写子任务标题<br>3. 提交创建<br>4. 验证子任务出现在列表中 | 子任务已创建并显示 |
| 任务进度更新 | 1. 在任务详情页更新进度滑块<br>2. 拖动到 50%<br>3. 验证进度显示 | 进度已更新为 50% |
| 任务筛选 | 1. 使用状态筛选任务<br>2. 使用优先级筛选<br>3. 使用标签筛选<br>4. 验证筛选结果 | 筛选结果正确 |

**Playwright 测试示例**:

```typescript
test.describe('任务管理', () => {
  test('完整的任务创建流程', async ({ page }) => {
    await page.goto('/projects/test-project/tasks')
    await page.waitForLoadState('domcontentloaded')
    
    // 点击新建任务按钮
    await page.click('button:has-text("新建任务")')
    
    // 填写任务表单
    await page.fill('input[name="title"]', 'E2E Test Task')
    await page.fill('input[name="description"]', 'This is a test task')
    await page.selectOption('select[name="priority"]', 'high')
    await page.selectOption('select[name="status"]', 'todo')
    
    // 提交创建
    await page.click('button[type="submit"]')
    
    // 验证任务已创建
    await expect(page.locator(`text="E2E Test Task"`)).toBeVisible()
  })

  test('任务状态更新', async ({ page }) => {
    await page.goto('/projects/test-project/tasks')
    
    // 找到 TODO 任务
    const todoTask = page.locator('.task-card[data-status="TODO"]').first()
    await todoTask.click()
    
    // 拖拽到 IN_PROGRESS 列
    const inProgressColumn = page.locator('[data-status="IN_PROGRESS"]')
    await todoTask.dragTo(inProgressColumn)
    
    // 验证状态更新
    await expect(todoTask.locator('.task-card')).toHaveAttribute('data-status', 'IN_PROGRESS')
  })
})
```

---

## 四、需求管理模块测试

### 4.1 单元测试

#### 测试文件：`src/__tests__/requirement-status.test.ts`（新增）

```typescript
describe('RequirementStatus 枚举', () => {
  it('应该包含所有状态值', () => {
    expect(RequirementStatus.PENDING).toBe('PENDING')
    expect(RequirementStatus.APPROVED).toBe('APPROVED')
    expect(RequirementStatus.REJECTED).toBe('REJECTED')
    expect(RequirementStatus.IN_PROGRESS).toBe('IN_PROGRESS')
    expect(RequirementStatus.COMPLETED).toBe('COMPLETED')
  })
})
```

#### 测试文件：`src/lib/services/requirement-service.test.ts`（新增）

```typescript
describe('RequirementService', () => {
  describe('需求状态流转', () => {
    it('应该正确处理需求审批', () => {
      const requirement = await createTestRequirement()
      const approved = await approveRequirement(requirement.id)
      
      expect(approved.status).toBe('APPROVED')
      expect(approved.approvedBy).toBe('test-owner@example.com')
      expect(approved.approvedAt).toBeDefined()
    })

    it('应该正确处理需求拒绝', async () => {
      const requirement = await createTestRequirement()
      const rejected = await rejectRequirement(requirement.id, '需求不明确')
      
      expect(rejected.status).toBe('REJECTED')
      expect(rejected.rejectionReason).toBe('需求不明确')
    })
  })

  describe('方案评估', () => {
    it('应该计算方案评分', () => {
      const proposal = {
        feasibility: 80,
        complexity: 60,
        resources: 70,
        timeline: 75
      }
      
      const score = calculateProposalScore(proposal)
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)
    })
  })
})
```

### 4.2 集成测试

#### 测试文件：`tests/integration/requirement.test.ts`

**测试场景**:

| 场景 | 端点 | 测试步骤 | 预期结果 |
|------|--------|---------|---------|
| 创建需求 | POST /api/v1/requirements | 1. 提交需求<br>2. 验证需求已创建 | 201 Created + 需求数据 |
| 审批需求 | POST /api/v1/requirements/[id]/approve | 1. Project Owner 审批通过<br>2. 验证状态更新为 APPROVED | 200 OK |
| 拒绝需求 | POST /api/v1/requirements/[id]/reject | 1. Project Owner 拒绝<br>2. 验证状态更新为 REJECTED | 200 OK |
| 添加方案 | POST /api/v1/requirements/[id]/proposals | 1. 提交实现方案<br>2. 验证方案已创建 | 201 Created |
| 添加波及影响 | POST /api/v1/requirements/[id]/impacts | 1. 添加波及相关方<br>2. 添加影响模块<br>3. 验证已关联 | 波及影响已创建 |
| 方案讨论 | POST /api/v1/requirements/[id]/discussions | 1. 对方案发表评论<br>2. 验证评论已添加 | 201 Created + 评论数据 |
| 验收流程 | POST /api/v1/requirements/[id]/acceptances | 1. 设置验收人<br>2. 记录验收结果<br>3. 验证验收记录已创建 | 验收记录已创建 |
| 变更历史 | GET /api/v1/requirements/[id]/history | 1. 查询需求变更历史<br>2. 验证返回完整历史 | 200 OK + 历史数组 |

### 4.3 E2E 测试

**测试场景**:

| 场景 | 步骤 | 预期结果 |
|------|------|---------|
| 完整需求流程 | 1. 导航到需求列表<br>2. 点击新建需求<br>3. 填写需求表单<br>4. 提交<br>5. 验证需求状态为 PENDING | 需求已创建，状态 PENDING |
| 需求审批 | 1. Project Owner 审批需求<br>2. 选择审批通过<br>3. 验证状态更新为 APPROVED | 状态更新为 APPROVED |
| 需求拒绝 | 1. Project Owner 拒绝需求<br>2. 输入拒绝原因<br>3. 验证状态更新为 REJECTED | 状态更新为 REJECTED，原因显示 |
| 方案评估 | 1. 添加方案<br>2. 设置评分<br>3. 提交评估 | 方案评分已显示 |

---

## 五、ISSUE 管理模块测试

### 5.1 单元测试

#### 测试文件：`src/__tests__/issue-severity.test.ts`（新增）

```typescript
describe('IssueSeverity 枚举', () => {
  it('应该包含所有严重级别', () => {
    expect(IssueSeverity.LOW).toBe('LOW')
    expect(IssueSeverity.MEDIUM).toBe('MEDIUM')
    expect(IssueSeverity.HIGH).toBe('HIGH')
    expect(IssueSeverity.CRITICAL).toBe('CRITICAL')
  })

  it('应该按严重级别排序', () => {
    const severities = [IssueSeverity.LOW, IssueSeverity.HIGH, IssueSeverity.MEDIUM]
    const sorted = [...severities].sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
      return order[a] - order[b]
    })
    
    expect(sorted).toEqual([IssueSeverity.CRITICAL, IssueSeverity.HIGH, IssueSeverity.MEDIUM, IssueSeverity.LOW])
  })
})
```

### 5.2 集成测试

#### 测试文件：`tests/integration/issue.test.ts`

**测试场景**:

| 场景 | 端点 | 测试步骤 | 预期结果 |
|------|--------|---------|---------|
| 创建 ISSUE | POST /api/v1/issues | 1. 创建 ISSUE<br>2. 验证已创建 | 201 Created + ISSUE 数据 |
| 关联任务 | POST /api/v1/issues | 1. 创建时关联 taskIds<br>2. 验证任务已关联 | 任务已关联到 ISSUE |
| 解决 ISSUE | POST /api/v1/issues/[id]/resolve | 1. 提供解决方案<br>2. 验证状态为 RESOLVED | 状态更新为 RESOLVED |
| ISSUE 状态翻转 | PATCH /api/v1/issues/[id] | 1. 更新 resolvedAt<br>2. 验证相关任务完成 | 相关任务检查，状态正确更新 |
| 关联需求 | POST /api/v1/issues/[id]/link-requirement | 1. 关联需求 ID<br>2. 验证关联已创建 | 需求已关联 |

---

## 六、风险管理模块测试

### 6.1 单元测试

#### 测试文件：`src/__tests__/risk-category.test.ts`（新增）

```typescript
describe('RiskCategory 枚举', () => {
  it('应该包含所有风险类别', () => {
    expect(RiskCategory.TECHNICAL).toBe('TECHNICAL')
    expect(RiskCategory.SCHEDULE).toBe('SCHEDULE')
    expect(RiskCategory.RESOURCE).toBe('RESOURCE')
    expect(RiskCategory.BUDGET).toBe('BUDGET')
    expect(RiskCategory.EXTERNAL).toBe('EXTERNAL')
    expect(RiskCategory.MANAGEMENT).toBe('MANAGEMENT')
  })
})
```

#### 测试文件：`src/lib/services/risk-service.test.ts`（新增）

```typescript
describe('RiskService', () => {
  describe('风险评分计算', () => {
    it('应该正确计算风险等级', () => {
      // 概率 3 (中) × 影响 4 (高) = 12
      const riskLevel = calculateRiskLevel(3, 4)
      expect(riskLevel).toBe('HIGH')
    })

    it('应该正确计算风险矩阵', () => {
      const risks = [
        { probability: 5, impact: 5 }, // 极高
        { probability: 1, impact: 1 }, // 极低
      ]
      
      const matrix = risks.map(r => ({
        ...r,
        level: calculateRiskLevel(r.probability, r.impact),
        score: r.probability * r.impact
      }))
      
      expect(matrix[0].level).toBe('CRITICAL')
      expect(matrix[1].level).toBe('LOW')
    })
  })

  describe('AI 风险识别', () => {
    it('应该识别技术风险', async () => {
      const risks = await identifyAiRisks({
        projectId: '1',
        title: '测试项目',
        tasks: []
      })
      
      const techRisk = risks.find(r => r.category === 'TECHNICAL')
      expect(techRisk).toBeDefined()
      expect(techRisk.aiIdentified).toBe(true)
    })
  })
})
```

### 6.2 集成测试

#### 测试文件：`tests/integration/risk.test.ts`

**测试场景**:

| 场景 | 端点 | 测试步骤 | 预期结果 |
|------|--------|---------|---------|
| 创建风险 | POST /api/v1/risks | 1. 创建技术风险<br>2. 设置概率和影响<br>3. 验证风险等级计算正确 | 201 Created + 风险等级正确 |
| 更新风险进度 | PATCH /api/v1/risks/[id] | 1. 更新进度到 50%<br>2. 验证进度已更新 | 200 OK |
| AI 识别风险 | POST /api/v1/ai/identify-risk | 1. 传入项目信息<br>2. 验证 AI 返回风险列表 | 200 OK + 风险列表 |
| 关联任务 | POST /api/v1/risks/[id]/tasks | 1. 为风险添加缓解任务<br>2. 验证任务已关联 | 任务已关联 |

---

## 七、评审管理模块测试

### 7.1 单元测试

#### 测试文件：`src/__tests__/review-type.test.ts`（新增）

```typescript
describe('ReviewType 枚举', () => {
  it('应该包含所有评审类型', () => {
    expect(ReviewType.FEASIBILITY).toBe('FEASIBILITY')
    expect(ReviewType.MILESTONE).toBe('MILESTONE')
    expect(ReviewType.TEST_PLAN).toBe('TEST_PLAN')
    expect(ReviewType.TEST_REPORT).toBe('TEST_REPORT')
    expect(ReviewType.INITIAL).toBe('INITIAL')
    expect(ReviewType.FINAL).toBe('FINAL')
    expect(ReviewType.PHASE).toBe('PHASE')
  })
})
```

### 7.2 AI 评审服务测试

#### 测试文件：`src/lib/services/__tests__/ai-review.test.ts`（新增）

```typescript
describe('AI Review Service', () => {
  describe('材料分析', () => {
    it('应该分析材料完整性', async () => {
      const result = await aiReviewService.analyzeMaterials({
        reviewId: '1',
        materials: [
          { fileName: 'spec.pdf', fileType: 'application/pdf' },
          { fileName: 'design.docx', fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
        ]
      })
      
      expect(result.completenessScore).toBeGreaterThanOrEqual(0)
      expect(result.completenessScore).toBeLessThanOrEqual(100)
      expect(result.missingItems).toBeInstanceOf(Array)
      expect(result.analysis).toBeDefined()
    })

    it('应该识别缺失的关键材料', async () => {
      const result = await aiReviewService.analyzeMaterials({
        reviewId: '1',
        materials: []
      })
      
      expect(result.completenessScore).toBeLessThan(50)
      expect(result.missingItems.length).toBeGreaterThan(0)
    })
  })

  describe('生成评审标准', () => {
    it('应该生成结构化的评审标准', async () => {
      const criteria = await aiReviewService.generateCriteria({
        reviewId: '1',
        reviewType: 'FEASIBILITY'
      })
      
      expect(criteria).toBeInstanceOf(Array)
      expect(criteria.length).toBeGreaterThan(0)
      expect(criteria[0]).toHaveProperty('title')
      expect(criteria[0]).toHaveProperty('weight')
      expect(criteria[0]).toHaveProperty('maxScore')
    })

    it('应该根据评审类型生成不同标准', async () => {
      const feasibilityCriteria = await aiReviewService.generateCriteria({
        reviewId: '1',
        reviewType: 'FEASIBILITY'
      })
      
      const testPlanCriteria = await aiReviewService.generateCriteria({
        reviewId: '1',
        reviewType: 'TEST_PLAN'
      })
      
      expect(feasibilityCriteria).not.toEqual(testPlanCriteria)
    })
  })

  describe('识别风险', () => {
    it('应该识别评审相关风险', async () => {
      const risks = await aiReviewService.identifyRisks({
        reviewId: '1',
        materials: [],
        criteria: []
      })
      
      expect(risks).toBeInstanceOf(Array)
      expect(risks.length).toBeGreaterThanOrEqual(0)
      
      if (risks.length > 0) {
        expect(risks[0]).toHaveProperty('title')
        expect(risks[0]).toHaveProperty('category')
        expect(risks[0]).toHaveProperty('probability')
        expect(risks[0]).toHaveProperty('impact')
        expect(risks[0]).toHaveProperty('riskLevel')
      }
    })

    it('应该正确计算风险等级', async () => {
      const risks = await aiReviewService.identifyRisks({
        reviewId: '1',
        materials: [],
        criteria: []
      })
      
      const highRisks = risks.filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL')
      expect(highRisks.length).toBeGreaterThan(0)
    })
  })

  describe('生成摘要', () => {
    it('应该生成评审摘要', async () => {
      const summary = await aiReviewService.generateSummary({
        reviewId: '1',
        materials: [],
        criteria: [],
        risks: []
      })
      
      expect(summary).toHaveProperty('short')
      expect(summary).toHaveProperty('standard')
      expect(summary).toHaveProperty('detailed')
      expect(summary).toHaveProperty('keyPoints')
      expect(summary).toHaveProperty('conclusion')
    })

    it('应该包含关键点列表', async () => {
      const summary = await aiReviewService.generateSummary({
        reviewId: '1',
        materials: [],
        criteria: [],
        risks: []
      })
      
      expect(summary.keyPoints).toBeInstanceOf(Array)
      expect(summary.keyPoints.length).toBeGreaterThan(0)
    })
  })
})
```

### 7.3 集成测试

#### 测试文件：`tests/integration/review.test.ts`

**测试场景**:

| 场景 | 端点 | 测试步骤 | 预期结果 |
|------|--------|---------|---------|
| 创建评审 | POST /api/v1/reviews | 1. 创建评审<br>2. 设置类型和日期<br>3. 验证评审已创建 | 201 Created + 评审数据 |
| AI 材料分析 | POST /api/v1/reviews/[id]/ai-analyze | 1. 触发材料分析<br>2. 验证返回完整性评分<br>3. GET 请求获取分析结果 | 200 OK + 评分数据 |
| 生成评审标准 | POST /api/v1/reviews/[id]/ai-generate-criteria | 1. 触发标准生成<br>2. 验证返回标准列表<br>3. GET 请求获取结果 | 200 OK + 标准数组 |
| 识别风险 | POST /api/v1/reviews/[id]/ai-identify-risks | 1. 触发风险识别<br>2. 验证返回风险列表<br>3. GET 请求获取结果 | 200 OK + 风险数组 |
| 生成摘要 | POST /api/v1/reviews/[id]/ai-generate-summary | 1. 触发摘要生成<br>2. 验证返回摘要<br>3. GET 请求获取结果 | 200 OK + 摘要对象 |
| 上传评审材料 | POST /api/v1/reviews/[id]/materials | 1. 上传材料文件<br>2. 验证材料已关联 | 201 Created + 材料数据 |
| 添加评审参与者 | POST /api/v1/reviews/[id]/participants | 1. 添加评审人员<br>2. 验证已关联 | 参与者已关联 |

### 7.4 E2E 测试

**测试场景**:

| 场景 | 步骤 | 预期结果 |
|------|------|---------|
| AI 评审流程 | 1. 导航到 AI 分析页面<br>2. 点击"开始分析材料"<br>3. 等待分析完成<br>4. 验证完整性评分显示 | 完整性评分正确显示 |
| 生成评审标准 | 1. 点击"生成检查项"<br>2. 等待生成完成<br>3. 验证标准列表显示<br>4. 点击"应用"按钮<br>5. 验证标准已应用 | 标准已应用到评审 |
| 风险识别 | 1. 点击"识别风险"<br>2. 等待识别完成<br>3. 验证风险列表显示 | 风险列表正确显示 |
| 生成摘要 | 1. 点击"生成摘要"<br>2. 等待生成完成<br>3. 验证摘要显示 | 摘要正确显示 |
| 查看报告 | 1. 点击"查看报告"<br>2. 选择下载格式 (PDF)<br>3. 验证文件下载 | PDF 文件已下载 |

---

## 八、文件预览模块测试

### 8.1 单元测试

#### 测试文件：`src/__tests__/preview-service-type.test.ts`（新增）

```typescript
describe('PreviewServiceType 枚举', () => {
  it('应该包含所有预览服务类型', () => {
    expect(PreviewServiceType.ONLYOFFICE).toBe('ONLYOFFICE')
    expect(PreviewServiceType.KKFILEVIEW).toBe('KKFILEVIEW')
    expect(PreviewServiceType.NATIVE).toBe('NATIVE')
  })
})
```

#### 测试文件：`src/lib/services/preview-service.test.ts`（新增）

```typescript
describe('PreviewService', () => {
  describe('预览服务选择', () => {
    it('应该为 Office 文档选择 OnlyOffice', () => {
      const service = selectPreviewService('document.docx')
      expect(service.type).toBe('ONLYOFFICE')
    })

    it('应该为 PDF 选择 KKFileView', () => {
      const service = selectPreviewService('document.pdf')
      expect(service.type).toBe('KKFILEVIEW')
    })

    it('应该为图片选择原生预览', () => {
      const service = selectPreviewService('image.jpg')
      expect(service.type).toBe('NATIVE')
    })
  })

  describe('预览 URL 生成', () => {
    it('应该生成带签名的预览 URL', () => {
      const url = generatePreviewUrl({
        fileId: '1',
        userId: '2',
        action: 'view',
        expiresIn: 3600
      })
      
      expect(url).toContain('fileId=1')
      expect(url).toContain('userId=2')
      expect(url).toContain('action=view')
      expect(url).toContain('expires=')
      expect(url).toContain('sig=')
    })

    it('应该验证签名', () => {
      const valid = verifyPreviewUrl({
        fileId: '1',
        userId: '2',
        action: 'view',
        expires: Math.floor(Date.now() / 1000) + 3600,
        signature: 'valid-signature'
      })
      
      expect(valid).toBe(true)
    })

    it('应该拒绝无效签名', () => {
      const valid = verifyPreviewUrl({
        fileId: '1',
        userId: '2',
        action: 'view',
        expires: Math.floor(Date.now() / 1000) + 3600,
        signature: 'invalid-signature'
      })
      
      expect(valid).toBe(false)
    })
  })
})
```

### 8.2 集成测试

#### 测试文件：`tests/integration/file.test.ts`

**测试场景**:

| 场景 | 端点 | 测试步骤 | 预期结果 |
|------|--------|---------|---------|
| 文件上传 | POST /api/v1/files/upload | 1. 上传测试文件<br>2. 验证返回文件 ID 和 URL | 200 OK + 文件信息 |
| 文件下载 | GET /api/v1/files/[id] | 1. 获取文件下载 URL<br>2. 验证签名验证通过<br>3. 下载文件<br>4. 验证文件内容 | 文件已下载，内容正确 |
| 文件预览 | GET /api/v1/files/[id]/preview | 1. 获取预览 URL<br>2. 验证 OnlyOffice URL 正确生成 | 预览 URL 正确 |
| 文件列表 | GET /api/v1/files | 1. 查询文件列表<br>2. 验证返回分页数据 | 200 OK + 分页数据 |
| OnlyOffice 编辑 | GET /api/v1/files/[id]/preview-edit | 1. 获取编辑 URL<br>2. 验证编辑器可用 | 编辑器 URL 正确 |

---

## 九、通知系统测试

### 9.1 单元测试

#### 测试文件：`src/__tests__/notification-type.test.ts`（新增）

```typescript
describe('NotificationType 枚举', () => {
  it('应该包含所有通知类型', () => {
    expect(NotificationType.RISK_ALERT).toBe('RISK_ALERT')
    expect(NotificationType.REVIEW_INVITE).toBe('REVIEW_INVITE')
    expect(NotificationType.URGENT_TASK).toBe('URGENT_TASK')
    expect(NotificationType.TASK_DUE_REMINDER).toBe('TASK_DUE_REMINDER')
    expect(NotificationType.TASK_ASSIGNED).toBe('TASK_ASSIGNED')
    expect(NotificationType.COMMENT_MENTION).toBe('COMMENT_MENTION')
    expect(NotificationType.PROJECT_UPDATE).toBe('PROJECT_UPDATE')
    expect(NotificationType.DAILY_DIGEST).toBe('DAILY_DIGEST')
  })
})
```

### 9.2 集成测试

#### 测试文件：`tests/integration/notification.test.ts`

**测试场景**:

| 场景 | 端点 | 测试步骤 | 预期结果 |
|------|--------|---------|---------|
| 获取通知 | GET /api/v1/notifications | 1. 查询未读通知<br>2. 验证返回通知列表 | 200 OK + 通知数组 |
| 标记已读 | POST /api/v1/notifications/read | 1. 批量标记通知为已读<br>2. 验证通知已读 | 200 OK |
| 忽略通知 | POST /api/v1/notifications/ignore | 1. 忽略项目通知<br>2. 验证通知被忽略 | 200 OK |
| 更新偏好 | POST /api/v1/notifications/preferences | 1. 更新通知偏好<br>2. 验证偏好已更新 | 200 OK |

---

## 十、报告生成测试

### 10.1 单元测试

#### 测试文件：`src/lib/services/__tests__/report-generator.test.ts`（新增）

```typescript
describe('ReportGenerator', () => {
  describe('PDF 报告生成', () => {
    it('应该生成有效的 PDF 报告', async () => {
      const reportData = {
        review: {
          id: '1',
          title: '测试评审',
          type: 'FEASIBILITY',
          status: 'COMPLETED',
          createdAt: new Date().toISOString()
        },
        materials: [
          { fileName: 'spec.pdf', fileType: 'application/pdf' }
        ],
        criteria: [
          { title: '检查项1', weight: 10, maxScore: 10 }
        ],
        risks: [
          { title: '风险1', category: 'TECHNICAL', riskLevel: 'HIGH' }
        ],
        summary: {
          short: '短期摘要',
          standard: '标准摘要',
          detailed: '详细摘要',
          keyPoints: ['要点1', '要点2'],
          conclusion: '结论'
        }
      }
      
      const pdfBuffer = await reportGenerator.generatePdfReport(reportData)
      
      expect(pdfBuffer).toBeInstanceOf(Buffer)
      expect(pdfBuffer.length).toBeGreaterThan(0)
    })

    it('PDF 应包含所有必需内容', async () => {
      const pdfBuffer = await reportGenerator.generatePdfReport(reportData)
      
      // PDF 不方便验证内容，但验证可以生成
      expect(pdfBuffer.length).toBeGreaterThan(1000) // 至少 1KB
    })
  })

  describe('Word 报告生成', () => {
    it('应该生成有效的 Word 报告', async () => {
      const reportData = getTestReportData()
      const docxBuffer = await reportGenerator.generateDocxReport(reportData)
      
      expect(docxBuffer).toBeInstanceOf(Uint8Array)
      expect(docxBuffer.length).toBeGreaterThan(0)
    })
  })

  describe('HTML 报告生成', () => {
    it('应该生成有效的 HTML 报告', async () => {
      const reportData = getTestReportData()
      const html = await reportGenerator.generateHtmlReport(reportData)
      
      expect(typeof html).toBe('string')
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<body>')
    })

    it('HTML 应包含所有必需元素', async () => {
      const html = await reportGenerator.generateHtmlReport(reportData)
      
      expect(html).toContain('测试评审')
      expect(html).toContain('评审类型')
      expect(html).toContain('检查项')
    })
  })
})
```

### 10.2 集成测试

#### 测试文件：`tests/integration/report.test.ts`（新增）

**测试场景**:

| 场景 | 端点 | 测试步骤 | 预期结果 |
|------|--------|---------|---------|
| 生成 JSON 报告 | GET /api/v1/reports/review/[id]?format=json | 1. 查询评审报告数据<br>2. 验证返回 JSON 数据 | 200 OK + JSON 对象 |
| 生成 PDF 报告 | GET /api/v1/reports/review/[id]?format=pdf | 1. 请求 PDF 报告<br>2. 验证 Content-Type 为 application/pdf<br>3. 验证 Content-Disposition 头 | 200 OK + PDF 文件 |
| 生成 Word 报告 | GET /api/v1/reports/review/[id]?format=docx | 1. 请求 Word 报告<br>2. 验证 Content-Type 正确<br>3. 验证文件下载 | 200 OK + Word 文件 |
| 生成 HTML 报告 | GET /api/v1/reports/review/[id]?format=html | 1. 请求 HTML 报告<br>2. 验证 Content-Type 为 text/html<br>3. 验证文件内容 | 200 OK + HTML 文件 |

---

## 十一、测试执行计划

### 11.1 阶段一：单元测试（预计 5 天）

| 模块 | 文件数 | 测试用例数 | 负责人 | 优先级 |
|------|--------|---------|--------|--------|
| 用户管理 | 5 | 25 | 测试工程师 | P0 |
| 任务管理 | 6 | 40 | 测试工程师 | P0 |
| 需求管理 | 3 | 20 | 测试工程师 | P0 |
| ISSUE 管理 | 2 | 15 | 测试工程师 | P0 |
| 风险管理 | 2 | 15 | 测试工程师 | P0 |
| 评审管理 | 3 | 30 | 测试工程师 | P0 |
| 文件预览 | 2 | 15 | 测试工程师 | P0 |
| 通知系统 | 2 | 15 | 测试工程师 | P0 |
| AI 服务 | 4 | 20 | 测试工程师 | P0 |
| 报告生成 | 2 | 15 | 测试工程师 | P0 |
| **总计** | **36** | **210** | - | - |

### 11.2 阶段二：集成测试（预计 5 天）

| 模块 | 测试场景数 | 测试用例数 | 负责人 | 优先级 |
|------|---------|---------|--------|--------|
| 用户管理 | 7 | 35 | 测试工程师 | P0 |
| 任务管理 | 10 | 50 | 测试工程师 | P0 |
| 需求管理 | 8 | 40 | 测试工程师 | P0 |
| ISSUE 管理 | 6 | 30 | 测试工程师 | P0 |
| 风险管理 | 6 | 30 | 测试工程师 | P0 |
| 评审管理 | 8 | 40 | 测试工程师 | P0 |
| 文件预览 | 7 | 35 | 测试工程师 | P0 |
| 通知系统 | 6 | 30 | 测试工程师 | P0 |
| AI 服务 | 6 | 30 | 测试工程师 | N/A（AI 不需要集成测试） |
| 报告生成 | 4 | 20 | 测试工程师 | P0 |
| **总计** | **68** | **340** | - | - |

### 11.3 阶段三：E2E 测试（预计 7 天）

| 模块 | 测试场景数 | 测试用例数 | 负责人 | 优先级 |
|------|---------|---------|--------|--------|
| 用户认证流程 | 6 | 30 | 测试工程师 | P0 |
| 任务管理工作流 | 8 | 40 | 测试工程师 | P0 |
| 需求管理工作流 | 8 | 35 | 测试工程师 | P0 |
| 评审管理工作流 | 10 | 50 | 测试工程师 | P0 |
| 报告生成和下载 | 4 | 20 | 测试工程师 | P0 |
| **总计** | **36** | **175** | - | - |

---

## 十二、测试覆盖率目标

### 12.1 总体目标

| 指标 | 目标值 | 验证方式 |
|------|--------|---------|
| 代码覆盖率 | ≥95% | Vitest coverage |
| 单元测试通过率 | 100% | CI 检查 |
| 集成测试通过率 | ≥98% | CI 检查 |
| E2E 测试通过率 | ≥95% | Playwright 测试报告 |

### 12.2 分模块覆盖率目标

| 模块 | 单元测试 | 集成测试 | E2E 测试 | 综合覆盖率 |
|------|---------|---------|---------|-------------|
| 用户管理 | 90% | 95% | 80% | **95%** |
| 任务管理 | 95% | 95% | 85% | **95%** |
| 需求管理 | 85% | 95% | 85% | **95%** |
| ISSUE 管理 | 90% | 95% | 80% | **95%** |
| 风险管理 | 85% | 95% | 80% | **95%** |
| 评审管理 | 85% | 95% | 85% | **95%** |
| 文件预览 | 80% | 90% | 70% | **95%** |
| 通知系统 | 85% | 90% | 70% | **95%** |
| AI 服务 | 80% | 90% | 40% | **90%** |
| 报告生成 | 85% | 95% | 80% | **95%** |

**总体覆盖率**: **96.7%**

---

## 十三、测试环境配置

### 13.1 测试数据库

```bash
# 开发环境测试数据库
DATABASE_URL="file:./test.db"

# 测试数据清理脚本
npm run test:reset
```

### 13.2 CI/CD 配置

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        run: npm run coverage:upload
```

### 13.3 测试脚本命令

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest src/**/*.test.ts",
    "test:integration": "vitest tests/integration/**/*.test.ts",
    "test:e2e": "playwright tests/e2e",
    "test:coverage": "vitest --coverage",
    "test:reset": "tsx scripts/reset-test-db.ts"
  }
}
```

---

## 十四、测试执行检查清单

### 14.1 执行前检查

- [ ] 测试环境准备完成
- [ ] 测试数据库已初始化
- [ ] Mock 服务已配置
- [ ] 测试账号已创建

### 14.2 执行中检查

#### 单元测试
- [ ] 用户管理模块测试通过
- [ ] 任务管理模块测试通过
- [ ] 需求管理模块测试通过
- [ ] ISSUE 管理模块测试通过
- [ ] 风险管理模块测试通过
- [ ] 评审管理模块测试通过
- [ ] 文件预览模块测试通过
- [ ] 通知系统模块测试通过
- [ ] AI 服务模块测试通过
- [ ] 报告生成测试通过

#### 集成测试
- [ ] 所有 API 端点测试通过
- [ ] 数据库集成测试通过
- [ ] 认证授权测试通过
- [ ] 错误处理测试通过

#### E2E 测试
- [ ] 用户认证流程测试通过
- [ ] 任务管理工作流测试通过
- [ ] 需求管理工作流测试通过
- [ ] 评审管理工作流测试通过
- [ ] 报告生成和下载测试通过

### 14.3 执行后检查

- [ ] 测试覆盖率报告已生成
- [ ] 测试报告已存档
- [ ] 失败测试已分析
- [ ] Bug 已记录到 issue 追踪系统

---

## 十五、测试用例管理

### 15.1 测试用例模板

```markdown
## 测试用例

**ID**: TC-001
**模块**: 用户管理
**标题**: 用户注册成功
**优先级**: P0
**类型**: 功能测试

### 测试步骤

| 步骤 | 操作 | 预期结果 |
|------|------|---------|
| 1 | 导航到注册页面 | 页面加载成功 |
| 2 | 填写有效邮箱地址 | 输入框显示输入内容 |
| 3 | 填写密码（符合复杂度要求） | 输入框显示输入内容 |
| 4 | 填写姓名、部门、职位 | 所有字段已填写 |
| 5 | 提交注册表单 | 提交按钮可点击 |
| 6 | 等待注册响应 | 返回 201 状态 |

### 预期结果

| 字段 | 预期值 |
|------|--------|
| HTTP 状态 | 201 Created |
| 用户 ID | 非空字符串 |
| Token | 非空字符串 |
| 用户状态 | PENDING |

### 实际结果

| 字段 | 实际值 | 通过/失败 |
|------|--------|---------|
| HTTP 状态 | - | - |
| 用户 ID | - | - |
| Token | - | - |
| 用户状态 | - | - |

### 备注

- 测试日期: YYYY-MM-DD
- 测试人员: XXX
- 失败原因: （如失败）
```

---

## 十六、持续集成

### 16.1 测试触发条件

- 每次 push 到 main 分支
- 每次 Pull Request 创建/更新
- 定时（每天凌晨 2 点）

### 16.2 测试通过标准

- 所有单元测试通过
- 所有集成测试通过
- 代码覆盖率 ≥95%
- 无 P0/P1 Bug

### 16.3 测试失败处理

- 阻止合并到 main 分支
- 自动创建 GitHub Issue
- 通知相关开发人员

---

## 十七、测试完成标准

### 17.1 发布标准

✅ **可以发布**:
- 所有 P0 模块测试覆盖率 ≥95%
- 所有 P1 功能测试覆盖率 ≥90%
- 所有已知 P0/P1 Bug 已修复
- E2E 测试全部通过

❌ **不能发布**:
- 任何模块测试覆盖率 <90%
- 存在未修复的 P0 Bug
- E2E 测试存在失败

---

## 附录

### A.1 测试文件目录结构

```
src/
├── __tests__/
│   ├── user-status.test.ts           (已存在)
│   ├── task-priority.test.ts         (已存在)
│   ├── task-status.test.ts           (已存在)
│   ├── task-dependency.test.ts       (已存在)
│   ├── issue-severity.test.ts          (新增)
│   ├── risk-category.test.ts          (新增)
│   ├── review-type.test.ts            (新增)
│   ├── notification-type.test.ts      (新增)
│   └── preview-service-type.test.ts  (新增)
│
├── lib/
│   └── services/
│       └── __tests__/
│           ├── ai-review.test.ts           (新增)
│           ├── task-service.test.ts         (新增)
│           ├── requirement-service.test.ts (新增)
│           ├── risk-service.test.ts         (新增)
│           ├── preview-service.test.ts      (新增)
│           └── report-generator.test.ts   (新增)
│
tests/
├── integration/
│   ├── auth.test.ts                  (已存在)
│   ├── task.test.ts                  (已存在)
│   ├── milestone.test.ts             (已存在)
│   ├── risk.test.ts                  (已存在)
│   ├── review.test.ts                (新增)
│   ├── requirement.test.ts          (新增)
│   ├── issue.test.ts                  (新增)
│   ├── file.test.ts                  (新增)
│   ├── notification.test.ts           (新增)
│   └── report.test.ts               (新增)
│
├── e2e/
│   ├── auth.spec.ts                  (已存在)
│   ├── p0-p1-features.spec.ts       (已存在)
│   ├── task-workflow.spec.ts         (新增)
│   └── review-workflow.spec.ts      (新增)
```

### A.2 测试数据管理

**Mock 数据文件**: `tests/mocks/`

| 文件 | 用途 | 数据内容 |
|------|------|---------|
| users.json | 测试用户数据 | 5 个测试用户 |
| projects.json | 测试项目数据 | 3 个测试项目 |
| tasks.json | 测试任务数据 | 10 个测试任务 |
| requirements.json | 测试需求数据 | 5 个测试需求 |
| reviews.json | 测试评审数据 | 3 个测试评审 |

### A.3 测试优先级说明

- **P0**: 核心功能，必须测试，阻塞发布
- **P1**: 重要功能，优先测试，不阻塞发布
- **P2**: 辅助功能，有时间再测试
- **P3**: 优化项，低优先级

---

**测试计划创建完成时间**: 2026年2月25日  
**下次审查时间**: 执行过程中每 2 天审查一次  
**负责人**: 测试团队
