import { describe, it, expect, beforeAll } from 'vitest'

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1'

let authToken = ''
let testUserId = ''
let testProjectId = ''
let testRequirementId = ''

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
  const testEmail = `test-req-${Date.now()}@example.com`

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
      description: '需求测试用项目',
    }),
  })
  testProjectId = projectResponse.data?.id || ''
}

describe('需求管理集成测试', () => {
  beforeAll(async () => {
    await setup()
  })

  describe('创建需求', () => {
    it('应该成功创建需求', async () => {
      const response = await apiCall('/requirements', {
        method: 'POST',
        body: JSON.stringify({
          title: `测试需求-${Date.now()}`,
          description: '这是一个测试需求',
          projectId: testProjectId,
          priority: 'HIGH',
        }),
      })

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('id')
      testRequirementId = response.data?.id || ''
    })

    it('缺少必填字段应该失败', async () => {
      const response = await apiCall('/requirements', {
        method: 'POST',
        body: JSON.stringify({
          description: '缺少标题',
        }),
      })

      expect(response.success).toBe(false)
    })

    it('应该支持设置需求类型', async () => {
      const response = await apiCall('/requirements', {
        method: 'POST',
        body: JSON.stringify({
          title: `功能需求-${Date.now()}`,
          description: '功能性需求描述',
          projectId: testProjectId,
          type: 'FUNCTIONAL',
          priority: 'MEDIUM',
        }),
      })

      expect(response.success).toBe(true)
      expect(response.data?.type).toBe('FUNCTIONAL')
    })

    it('应该支持设置优先级', async () => {
      const highPriorityResponse = await apiCall('/requirements', {
        method: 'POST',
        body: JSON.stringify({
          title: `高优先级需求-${Date.now()}`,
          projectId: testProjectId,
          priority: 'HIGH',
        }),
      })

      expect(highPriorityResponse.success).toBe(true)
      expect(highPriorityResponse.data?.priority).toBe('HIGH')
    })
  })

  describe('获取需求列表', () => {
    it('应该成功获取需求列表', async () => {
      const response = await apiCall(`/requirements?projectId=${testProjectId}`)

      expect(response.success).toBe(true)
      expect(Array.isArray(response.data?.items)).toBe(true)
    })

    it('应该支持按状态筛选', async () => {
      const response = await apiCall(`/requirements?projectId=${testProjectId}&status=PENDING`)

      expect(response.success).toBe(true)
    })

    it('应该支持按优先级筛选', async () => {
      const response = await apiCall(`/requirements?projectId=${testProjectId}&priority=HIGH`)

      expect(response.success).toBe(true)
    })

    it('应该支持按类型筛选', async () => {
      const response = await apiCall(`/requirements?projectId=${testProjectId}&type=FUNCTIONAL`)

      expect(response.success).toBe(true)
    })
  })

  describe('获取需求详情', () => {
    it('应该成功获取需求详情', async () => {
      if (!testRequirementId) return

      const response = await apiCall(`/requirements/${testRequirementId}`)

      expect(response.success).toBe(true)
      expect(response.data?.id).toBe(testRequirementId)
    })
  })

  describe('更新需求', () => {
    it('应该成功更新需求标题', async () => {
      if (!testRequirementId) return

      const response = await apiCall(`/requirements/${testRequirementId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: '更新后的需求标题',
        }),
      })

      expect(response.success).toBe(true)
      expect(response.data?.title).toBe('更新后的需求标题')
    })

    it('应该成功更新需求描述', async () => {
      if (!testRequirementId) return

      const response = await apiCall(`/requirements/${testRequirementId}`, {
        method: 'PUT',
        body: JSON.stringify({
          description: '更新后的需求描述',
        }),
      })

      expect(response.success).toBe(true)
    })

    it('应该成功更新需求优先级', async () => {
      if (!testRequirementId) return

      const response = await apiCall(`/requirements/${testRequirementId}`, {
        method: 'PUT',
        body: JSON.stringify({
          priority: 'MEDIUM',
        }),
      })

      expect(response.success).toBe(true)
      expect(response.data?.priority).toBe('MEDIUM')
    })
  })

  describe('更新需求状态', () => {
    it('应该成功更新需求状态', async () => {
      if (!testRequirementId) return

      const response = await apiCall(`/requirements/${testRequirementId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'APPROVED',
        }),
      })

      expect(response.success).toBe(true)
      expect(response.data?.status).toBe('APPROVED')
    })

    it('无效状态应该失败', async () => {
      if (!testRequirementId) return

      const response = await apiCall(`/requirements/${testRequirementId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'INVALID_STATUS',
        }),
      })

      expect(response.success).toBe(false)
    })
  })

  describe('需求分配', () => {
    it('应该成功分配需求给用户', async () => {
      const createResponse = await apiCall('/requirements', {
        method: 'POST',
        body: JSON.stringify({
          title: `待分配需求-${Date.now()}`,
          projectId: testProjectId,
          priority: 'MEDIUM',
        }),
      })

      const requirementId = createResponse.data?.id
      if (!requirementId) return

      const assignResponse = await apiCall(`/requirements/${requirementId}/assign`, {
        method: 'PUT',
        body: JSON.stringify({
          assigneeId: testUserId,
        }),
      })

      expect(assignResponse.success).toBe(true)
    })
  })

  describe('需求评论', () => {
    let requirementWithCommentId = ''

    it('应该成功添加评论', async () => {
      const createResponse = await apiCall('/requirements', {
        method: 'POST',
        body: JSON.stringify({
          title: `待评论需求-${Date.now()}`,
          projectId: testProjectId,
          priority: 'LOW',
        }),
      })

      requirementWithCommentId = createResponse.data?.id || ''
      if (!requirementWithCommentId) return

      const commentResponse = await apiCall(`/requirements/${requirementWithCommentId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: '这是一条测试评论',
        }),
      })

      expect(commentResponse.success).toBe(true)
      expect(commentResponse.data).toHaveProperty('id')
    })

    it('应该成功获取评论列表', async () => {
      if (!requirementWithCommentId) return

      const response = await apiCall(`/requirements/${requirementWithCommentId}/comments`)

      expect(response.success).toBe(true)
      expect(Array.isArray(response.data?.items)).toBe(true)
    })
  })

  describe('需求附件', () => {
    it('应该支持上传附件', async () => {
      const createResponse = await apiCall('/requirements', {
        method: 'POST',
        body: JSON.stringify({
          title: `待添加附件需求-${Date.now()}`,
          projectId: testProjectId,
          priority: 'LOW',
        }),
      })

      const requirementId = createResponse.data?.id
      if (!requirementId) return

      // 模拟附件上传响应
      const attachmentResponse = await apiCall(`/requirements/${requirementId}/attachments`, {
        method: 'POST',
        body: JSON.stringify({
          fileName: 'test-attachment.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
        }),
      })

      expect(attachmentResponse.success).toBe(true)
    })

    it('应该支持删除附件', async () => {
      const createResponse = await apiCall('/requirements', {
        method: 'POST',
        body: JSON.stringify({
          title: `待删除附件需求-${Date.now()}`,
          projectId: testProjectId,
          priority: 'LOW',
        }),
      })

      const requirementId = createResponse.data?.id
      if (!requirementId) return

      const uploadResponse = await apiCall(`/requirements/${requirementId}/attachments`, {
        method: 'POST',
        body: JSON.stringify({
          fileName: 'test-attachment-2.pdf',
          fileSize: 2048,
          fileType: 'application/pdf',
        }),
      })

      const attachmentId = uploadResponse.data?.id
      if (!attachmentId) return

      const deleteResponse = await apiCall(
        `/requirements/${requirementId}/attachments/${attachmentId}`,
        {
          method: 'DELETE',
        }
      )

      expect(deleteResponse.success).toBe(true)
    })
  })

  describe('删除需求', () => {
    it('应该成功删除需求', async () => {
      const createResponse = await apiCall('/requirements', {
        method: 'POST',
        body: JSON.stringify({
          title: `待删除需求-${Date.now()}`,
          projectId: testProjectId,
          priority: 'LOW',
        }),
      })

      const requirementId = createResponse.data?.id
      if (!requirementId) return

      const deleteResponse = await apiCall(`/requirements/${requirementId}`, {
        method: 'DELETE',
      })

      expect(deleteResponse.success).toBe(true)
    })
  })
})
