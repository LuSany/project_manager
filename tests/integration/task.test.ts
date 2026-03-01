import { describe, it, expect, beforeAll } from 'vitest'

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1'

let authToken = ''
let testUserId = ''
let testProjectId = ''
let testTaskId = ''

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

async function setup() {
  const testEmail = `test-task-${Date.now()}@example.com`

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

  const projectResponse = await apiCall('/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: `测试项目-${Date.now()}`,
      description: '任务测试用项目',
    }),
  })
  testProjectId = projectResponse.data?.id || ''
}

describe.skip('任务管理集成测试', () => {
  beforeAll(async () => {
    await setup()
  })

  describe('创建任务', () => {
    it('应该成功创建任务', async () => {
      const response = await apiCall('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: `测试任务-${Date.now()}`,
          description: '这是一个测试任务',
          projectId: testProjectId,
          priority: 'HIGH',
        }),
      })

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('id')
      testTaskId = response.data?.id || ''
    })

    it('缺少必填字段应该失败', async () => {
      const response = await apiCall('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          description: '缺少标题',
        }),
      })

      expect(response.success).toBe(false)
    })

    it('应该支持分配任务给用户', async () => {
      const response = await apiCall('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: `带分配的任务-${Date.now()}`,
          projectId: testProjectId,
          assigneeIds: [testUserId],
        }),
      })

      expect(response.success).toBe(true)
      expect(response.data?.assignees?.length).toBeGreaterThan(0)
    })
  })

  describe('获取任务列表', () => {
    it('应该成功获取任务列表', async () => {
      const response = await apiCall(`/tasks?projectId=${testProjectId}`)

      expect(response.success).toBe(true)
      expect(Array.isArray(response.data?.items)).toBe(true)
    })

    it('应该支持按状态筛选', async () => {
      const response = await apiCall(`/tasks?projectId=${testProjectId}&status=TODO`)

      expect(response.success).toBe(true)
    })

    it('应该支持按优先级筛选', async () => {
      const response = await apiCall(`/tasks?projectId=${testProjectId}&priority=HIGH`)

      expect(response.success).toBe(true)
    })
  })

  describe('获取任务详情', () => {
    it('应该成功获取任务详情', async () => {
      if (!testTaskId) return

      const response = await apiCall(`/tasks/${testTaskId}`)

      expect(response.success).toBe(true)
      expect(response.data?.id).toBe(testTaskId)
    })
  })

  describe('更新任务', () => {
    it('应该成功更新任务标题', async () => {
      if (!testTaskId) return

      const response = await apiCall(`/tasks/${testTaskId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: '更新后的任务标题',
        }),
      })

      expect(response.success).toBe(true)
      expect(response.data?.title).toBe('更新后的任务标题')
    })

    it('应该成功更新任务描述', async () => {
      if (!testTaskId) return

      const response = await apiCall(`/tasks/${testTaskId}`, {
        method: 'PUT',
        body: JSON.stringify({
          description: '更新后的任务描述',
        }),
      })

      expect(response.success).toBe(true)
    })
  })

  describe('更新任务状态', () => {
    it('应该成功更新任务状态', async () => {
      if (!testTaskId) return

      const response = await apiCall(`/tasks/${testTaskId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'IN_PROGRESS',
        }),
      })

      expect(response.success).toBe(true)
      expect(response.data?.status).toBe('IN_PROGRESS')
    })

    it('无效状态应该失败', async () => {
      if (!testTaskId) return

      const response = await apiCall(`/tasks/${testTaskId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'INVALID_STATUS',
        }),
      })

      expect(response.success).toBe(false)
    })
  })

  describe('更新任务进度', () => {
    it('应该成功更新任务进度', async () => {
      if (!testTaskId) return

      const response = await apiCall(`/tasks/${testTaskId}/progress`, {
        method: 'PUT',
        body: JSON.stringify({
          progress: 50,
        }),
      })

      expect(response.success).toBe(true)
      expect(response.data?.progress).toBe(50)
    })

    it('进度超出范围应该失败', async () => {
      if (!testTaskId) return

      const response = await apiCall(`/tasks/${testTaskId}/progress`, {
        method: 'PUT',
        body: JSON.stringify({
          progress: 150,
        }),
      })

      expect(response.success).toBe(false)
    })
  })

  describe('子任务管理', () => {
    let subtaskId = ''

    it('应该成功创建子任务', async () => {
      if (!testTaskId) return

      const response = await apiCall(`/tasks/${testTaskId}/subtasks`, {
        method: 'POST',
        body: JSON.stringify({
          title: '测试子任务',
        }),
      })

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('id')
      subtaskId = response.data?.id || ''
    })

    it('应该成功切换子任务状态', async () => {
      if (!testTaskId || !subtaskId) return

      const response = await apiCall(`/tasks/${testTaskId}/subtasks/${subtaskId}/toggle`, {
        method: 'PUT',
      })

      expect(response.success).toBe(true)
    })
  })

  describe('删除任务', () => {
    it('应该成功删除任务', async () => {
      const createResponse = await apiCall('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: `待删除任务-${Date.now()}`,
          projectId: testProjectId,
        }),
      })

      const taskId = createResponse.data?.id
      if (!taskId) return

      const deleteResponse = await apiCall(`/tasks/${taskId}`, {
        method: 'DELETE',
      })

      expect(deleteResponse.success).toBe(true)
    })
  })
})
