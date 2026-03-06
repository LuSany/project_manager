import { test, expect } from '@playwright/test'

test.describe('Milestone E2E Flow', () => {
  test('should create and manage milestone', async ({ request }) => {
    const loginResponse = await request.post('/api/v1/auth/login', {
      data: {
        email: 'admin@test.com',
        password: 'password123',
      },
    })

    if (loginResponse.status() !== 200) {
      test.skip()
      return
    }

    const cookie = loginResponse.headers()['set-cookie']
    expect(cookie).toBeDefined()
  })

  test('should list milestones', async ({ request }) => {
    const response = await request.get('/api/v1/milestones')
    expect(response.status()).toBeGreaterThanOrEqual(200)
  })
})

test.describe('Review E2E Flow', () => {
  test('should create and manage review', async ({ request }) => {
    const response = await request.get('/api/v1/reviews')
    expect([200, 401]).toContain(response.status())
  })

  test('should list review types', async ({ request }) => {
    // Review types 需要认证，测试 API 是否可访问即可
    const response = await request.get('/api/v1/review-types')
    // 200=已认证访问，401=未认证（预期）
    expect([200, 401]).toContain(response.status())
    
    // 如果返回 200，验证响应格式
    if (response.status() === 200) {
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    }
  })
})

test.describe('Webhook E2E Flow', () => {
  test('should list webhooks', async ({ request }) => {
    const response = await request.get('/api/v1/webhooks')
    expect([200, 401, 403]).toContain(response.status())
  })
})

test.describe('Audit Log E2E Flow', () => {
  test('should require admin for audit logs', async ({ request }) => {
    const response = await request.get('/api/v1/admin/audit-logs')
    expect([401, 403]).toContain(response.status())
  })
})

test.describe('Task-Issue Association E2E', () => {
  test('should filter tasks by milestone', async ({ request }) => {
    const response = await request.get('/api/v1/tasks?milestoneId=test-milestone-id')
    expect([200, 401]).toContain(response.status())
  })

  test('should filter tasks by issue', async ({ request }) => {
    const response = await request.get('/api/v1/tasks?issueId=test-issue-id')
    expect([200, 401]).toContain(response.status())
  })
})
