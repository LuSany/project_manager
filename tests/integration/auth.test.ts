// 跳过：需要运行中的服务器
// 运行服务器后手动执行：npm run dev 然后 npm run test:integration
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
describe.skip('用户认证集成测试', () => {

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  return response.json()
}

async function loginUser(email: string, password: string) {
  return apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

async function registerUser(email: string, password: string, name: string) {
  return apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  })
}

describe('用户认证集成测试', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: '测试用户',
  }

  describe('用户注册', () => {
    it('应该成功注册新用户', async () => {
      const response = await registerUser(testUser.email, testUser.password, testUser.name)

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('id')
      expect(response.data?.email).toBe(testUser.email)
    })

    it('注册重复邮箱应该失败', async () => {
      const response = await registerUser(testUser.email, testUser.password, testUser.name)

      expect(response.success).toBe(false)
    })

    it('缺少必填字段应该失败', async () => {
      const response = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      })

      expect(response.success).toBe(false)
    })

    it('邮箱格式错误应该失败', async () => {
      const response = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'password123',
          name: '测试',
        }),
      })

      expect(response.success).toBe(false)
    })
  })

  describe('用户登录', () => {
    it('应该成功登录', async () => {
      const response = await loginUser(testUser.email, testUser.password)

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('token')
    })

    it('错误密码应该登录失败', async () => {
      const response = await loginUser(testUser.email, 'wrongpassword')

      expect(response.success).toBe(false)
    })

    it('不存在的用户应该登录失败', async () => {
      const response = await loginUser('notexist@example.com', 'password')

      expect(response.success).toBe(false)
    })
  })

  describe('密码重置', () => {
    it('请求重置密码应该成功', async () => {
      const response = await apiCall('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: testUser.email }),
      })

      expect(response.success).toBe(true)
    })

    it('不存在的邮箱应该返回错误', async () => {
      const response = await apiCall('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'notexist@example.com' }),
      })

      expect(response.success).toBe(false)
    })
  })
})
