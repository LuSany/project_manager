import { describe, it, expect, beforeAll } from 'vitest'

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1'

let authToken = ''
let testUserId = ''

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
  const testEmail = `test-notify-${Date.now()}@example.com`

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

describe('通知系统集成测试', () => {
  beforeAll(async () => {
    await setup()
  })

  describe('获取通知列表', () => {
    it('应该成功获取通知列表', async () => {
      const response = await apiCall('/notifications')

      expect(response.success).toBe(true)
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('应该支持只获取未读通知', async () => {
      const response = await apiCall('/notifications?unreadOnly=true')

      expect(response.success).toBe(true)
      if (response.data.length > 0) {
        response.data.forEach((notification: any) => {
          expect(notification.isRead).toBe(false)
        })
      }
    })
  })

  describe('创建通知', () => {
    it('应该成功创建通知', async () => {
      const response = await apiCall('/notifications', {
        method: 'POST',
        body: JSON.stringify({
          type: 'TASK_ASSIGNED',
          title: '测试通知',
          content: '这是一个测试通知',
        }),
      })

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('id')
    })

    it('缺少必填字段应该失败', async () => {
      const response = await apiCall('/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: '缺少类型',
        }),
      })

      expect(response.success).toBe(false)
    })
  })

  describe('标记通知为已读', () => {
    let notificationId = ''

    it('应该成功创建测试通知', async () => {
      const createResponse = await apiCall('/notifications', {
        method: 'POST',
        body: JSON.stringify({
          type: 'TASK_ASSIGNED',
          title: '待标记通知',
          content: '测试标记已读',
        }),
      })

      notificationId = createResponse.data?.id || ''
      expect(notificationId).toBeTruthy()
    })

    it('应该成功标记通知为已读', async () => {
      if (!notificationId) return

      const response = await apiCall(`/notifications/${notificationId}`, {
        method: 'PUT',
      })

      expect(response.success).toBe(true)
    })
  })

  describe('删除通知', () => {
    let deleteNotificationId = ''

    it('应该成功创建待删除的通知', async () => {
      const createResponse = await apiCall('/notifications', {
        method: 'POST',
        body: JSON.stringify({
          type: 'TASK_ASSIGNED',
          title: '待删除通知',
          content: '测试删除',
        }),
      })

      deleteNotificationId = createResponse.data?.id || ''
      expect(deleteNotificationId).toBeTruthy()
    })

    it('应该成功删除通知', async () => {
      if (!deleteNotificationId) return

      const response = await apiCall(`/notifications/${deleteNotificationId}`, {
        method: 'DELETE',
      })

      expect(response.success).toBe(true)
    })

    it('删除不存在的通知应该失败', async () => {
      const response = await apiCall('/notifications/non-exist-id', {
        method: 'DELETE',
      })

      expect(response.success).toBe(false)
    })
  })

  describe('通知偏好设置', () => {
    it('应该成功获取通知偏好', async () => {
      const response = await apiCall('/notifications/preferences')

      expect(response.success).toBe(true)
    })

    it('应该成功更新通知偏好', async () => {
      const response = await apiCall('/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          preferences: [
            { type: 'TASK_ASSIGNED', enabled: true, channel: 'IN_APP' },
            { type: 'RISK_ALERT', enabled: true, channel: 'EMAIL' },
          ],
        }),
      })

      expect(response.success).toBe(true)
    })
  })
})
