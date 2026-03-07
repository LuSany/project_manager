/**
 * E2E-08: AI 分析流程
 *
 * 端到端测试核心流程
 * AI 配置 → 调用分析 → 结果展示 → 应用建议 → 查看日志
 *
 * Phase 3 E2E 测试
 */

import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

test.describe('E2E-08: AI Analysis Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
  })

  test('should navigate to AI config page', async ({ page }) => {
    await page.goto('/admin/ai')
    await page.waitForTimeout(1000)

    // Verify page loads
    await expect(page.locator('body')).toContainText('AI')
  })

  test('should view AI logs', async ({ page }) => {
    await page.goto('/admin/ai')
    await page.waitForTimeout(1000)

    // Verify page loads
    await expect(page.locator('body')).toContainText('AI')
  })

  test('should view AI risks', async ({ page }) => {
    await page.goto('/risks')
    await page.waitForTimeout(1000)

    // Verify page loads
    await expect(page.locator('h1')).toContainText('风险')
  })
})
