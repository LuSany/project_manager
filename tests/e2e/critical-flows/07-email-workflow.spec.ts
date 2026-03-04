/**
 * E2E-07: 邮件流程
 *
 * 端到端测试核心流程
 * 邮件配置 → 模板管理 → 发送邮件 → 查看日志 → 统计报告
 *
 * Phase 3 E2E 测试 - 5 用例
 */

import { test, expect } from '@playwright/test'

test.describe('E2E-07: Email Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'test-admin@example.com')
    await page.fill('[name="password"]', 'AdminPassword123!')
    await page.click('button[type="submit"]')
  })

  test('should configure email provider', async ({ page }) => {
    await page.goto('/admin/email/configs')
    await page.click('text=New Config, text=新建配置')

    await page.fill('[name="name"]', `E2E Email Config ${Date.now()}`)
    await page.selectOption('[name="provider"]', 'SMTP')
    await page.fill('[name="smtpHost"]', 'smtp.example.com')
    await page.fill('[name="smtpPort"]', '587')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=E2E Email Config')).toBeVisible()
  })

  test('should create email template', async ({ page }) => {
    await page.goto('/admin/email/templates')
    await page.click('text=New Template, text=新建模板')

    await page.fill('[name="name"]', `E2E Template ${Date.now()}`)
    await page.fill('[name="subject"]', 'Test Email Subject')
    await page.fill('[name="body"]', 'Hello {{name}}, welcome to {{project}}!')
    await page.selectOption('[name="templateType"]', 'NOTIFICATION')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=E2E Template')).toBeVisible()
  })

  test('should send test email', async ({ page }) => {
    await page.goto('/admin/email/configs')
    await page.click('text=Email Config')

    await page.click('text=Send Test Email, text=发送测试邮件')
    await page.fill('[name="recipient"]', 'test@example.com')
    await page.fill('[name="subject"]', 'Test Email')
    await page.fill('[name="body"]', 'This is a test email')
    await page.click('button:has-text("Send")')

    await expect(page.locator('text=Email sent successfully, text=发送成功')).toBeVisible()
  })

  test('should view email logs', async ({ page }) => {
    await page.goto('/admin/email/logs')

    // Filter by status
    await page.selectOption('[name="status"]', 'SENT')
    await page.click('text=Filter, text=过滤')

    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('text=Sent')).toBeVisible()
  })

  test('should view email statistics', async ({ page }) => {
    await page.goto('/admin/email/stats')

    // Check statistics display
    await expect(page.locator('text=Total Sent')).toBeVisible()
    await expect(page.locator('text=Success Rate')).toBeVisible()
    await expect(page.locator('text=Failed')).toBeVisible()

    // Check date range filter
    await page.selectOption('[name="dateRange"]', 'LAST_7_DAYS')
    await page.click('text=Apply, text=应用')
  })
})
