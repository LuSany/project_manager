import { describe, it, expect, beforeAll } from 'vitest'

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1'

let authToken = ''
let testUserId = ''
let testProjectId = ''

async function apiCall<T = any>(endpoint: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
  })
  return response.json()
}

async function loginAndGetToken() {
  const testEmail = `test-user-${Date.now()}@example.com`

  await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: 'TestPassword123!',
      name: '测试用户',
    }),
  })

  const loginResponse = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: 'TestPassword123!',
    }),
  })

  authToken = loginResponse.data?.token || ''
  testUserId = loginResponse.data?.user?.id || ''
}

describe('项目管理集成测试', () => {
  beforeAll(async () => {
    await loginAndGetToken()
  })

  describe('创建项目', () => {
    it('应该成功创建项目', async () => {
      const response = await apiCall('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: `测试项目-${Date.now()}`,
          description: '这是一个测试项目',
        }),
      })

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('id')
      testProjectId = response.data?.id || ''
    })

    it('未登录创建项目应该失败', async () => {
      const response = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '测试项目',
          description: '测试',
        }),
      })
      const data = await response.json()

      expect(data.success).toBe(false)
    })

    it('缺少项目名称应该失败', async () => {
      const response = await apiCall('/projects', {
        method: 'POST',
        body: JSON.stringify({
          description: '测试描述',
        }),
      })

      expect(response.success).toBe(false)
    })
  })

  describe('获取项目列表', () => {
    it('应该成功获取项目列表', async () => {
      const response = await apiCall('/projects')

      expect(response.success).toBe(true)
      expect(Array.isArray(response.data?.items)).toBe(true)
    })

    it('应该支持分页', async () => {
      const response = await apiCall('/projects?page=1&pageSize=10')

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('total')
      expect(response.data).toHaveProperty('page')
      expect(response.data).toHaveProperty('pageSize')
    })
  })

  describe('获取项目详情', () => {
    it('应该成功获取项目详情', async () => {
      if (!testProjectId) return

      const response = await apiCall(`/projects/${testProjectId}`)

      expect(response.success).toBe(true)
      expect(response.data?.id).toBe(testProjectId)
    })

    it('不存在的项目应该返回错误', async () => {
      const response = await apiCall('/projects/non-exist-id')

      expect(response.success).toBe(false)
    })
  })

  describe('更新项目', () => {
    it('应该成功更新项目', async () => {
      if (!testProjectId) return

      const response = await apiCall(`/projects/${testProjectId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: '更新后的项目名称',
          description: '更新后的描述',
        }),
      })

      expect(response.success).toBe(true)
      expect(response.data?.name).toBe('更新后的项目名称')
    })
  })

  describe('项目成员管理', () => {
    it('应该成功添加项目成员', async () => {
      if (!testProjectId || !testUserId) return

      const response = await apiCall(`/projects/${testProjectId}/members`, {
        method: 'POST',
        body: JSON.stringify({
          userId: testUserId,
          role: 'MEMBER',
        }),
      })

      expect(response.success).toBe(true)
    })

    it('应该成功获取项目成员列表', async () => {
      if (!testProjectId) return

      const response = await apiCall(`/projects/${testProjectId}/members`)

      expect(response.success).toBe(true)
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('应该成功移除项目成员', async () => {
      if (!testProjectId || !testUserId) return

      const response = await apiCall(`/projects/${testProjectId}/members?userId=${testUserId}`, {
        method: 'DELETE',
      })

      expect(response.success).toBe(true)
    })
  })

  describe('删除项目', () => {
    it('应该成功删除项目', async () => {
      const createResponse = await apiCall('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: `待删除项目-${Date.now()}`,
          description: '测试删除',
        }),
      })

      const projectId = createResponse.data?.id
      if (!projectId) return

      const deleteResponse = await apiCall(`/projects/${projectId}`, {
        method: 'DELETE',
      })

      expect(deleteResponse.success).toBe(true)
    })
  })
})
