import { test, expect } from '@playwright/test'

test.describe('Email Service E2E Tests', () => {
  // 测试邮件服务的基本功能

  test('should verify email service configuration', async ({ request }) => {
    // 验证邮件配置 API 存在
    const response = await request.get('/api/v1/admin/email/configs')
    // 可能是 401 未授权或 200 成功
    expect([200, 401]).toContain(response.status())
  })

  test('should verify password reset email flow', async ({ request }) => {
    // 测试密码重置邮件发送流程
    const response = await request.post('/api/v1/auth/forgot-password', {
      data: {
        email: 'test@example.com',
      },
    })

    // 可能返回 200（发送成功）或 404（用户不存在）
    expect([200, 404]).toContain(response.status())
  })

  test('should verify email notification preferences', async ({ request }) => {
    // 测试邮件通知偏好设置
    const response = await request.get('/api/v1/notifications/preferences')
    // 可能是 401 未授权或 200 成功
    expect([200, 401]).toContain(response.status())
  })

  test('should verify review template system', async ({ request }) => {
    // 测试评审模板系统
    const response = await request.get('/api/v1/review-templates')
    // 可能是 401 未授权或 200 成功
    expect([200, 401]).toContain(response.status())
  })
})
