/**
 * E2E-08: AI 分析流程
 *
 * 端到端测试核心流程
 * AI 配置 → 调用分析 → 结果展示 → 应用建议 → 查看日志
 *
 * Phase 3 E2E 测试 - 5 用例
 */

import { test, expect } from '@playwright/test'

test.describe('E2E-08: AI Analysis Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
  })

  test('should configure AI provider', async ({ page }) => {
    await page.goto('/admin/ai/configs')
    await page.click('text=New Config, text=新建配置')

    await page.fill('[name="name"]', `E2E AI Config ${Date.now()}`)
    await page.selectOption('[name="provider"]', 'OPENAI')
    await page.fill('[name="apiKey"]', 'sk-test-key-xxxxx')
    await page.fill('[name="model"]', 'gpt-4o')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=E2E AI Config')).toBeVisible()
  })

  test('should perform AI risk analysis', async ({ page }) => {
    await page.goto('/risks')
    await page.click('text=Risk')

    await page.click('text=AI Analysis, text=AI 分析')
    await page.click('button:has-text("Analyze")')

    // Wait for AI analysis
    await page.waitForTimeout(5000)

    await expect(page.locator('text=AI Analysis Result')).toBeVisible()
    await expect(page.locator('text=Recommendation')).toBeVisible()
  })

  test('should view AI analysis results', async ({ page }) => {
    await page.goto('/risks')
    await page.click('text=Risk')

    await page.click('text=AI Analysis')
    await page.click('button:has-text("Analyze")')
    await page.waitForTimeout(5000)

    // Check result sections
    await expect(page.locator('text=Severity')).toBeVisible()
    await expect(page.locator('text=Impact')).toBeVisible()
    await expect(page.locator('text=Mitigation Suggestions')).toBeVisible()
  })

  test('should apply AI recommendations', async ({ page }) => {
    await page.goto('/risks')
    await page.click('text=Risk')

    await page.click('text=AI Analysis')
    await page.click('button:has-text("Analyze")')
    await page.waitForTimeout(5000)

    // Apply recommendation
    await page.click('text=Apply Recommendations, text=应用建议')
    await page.check('[data-testid="recommendation-1"]')
    await page.click('button:has-text("Apply")')

    await expect(page.locator('text=Applied successfully')).toBeVisible()
  })

  test('should view AI usage logs', async ({ page }) => {
    await page.goto('/admin/ai/logs')

    // Check logs table
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('text=Request')).toBeVisible()
    await expect(page.locator('text=Response Time')).toBeVisible()

    // Filter by service type
    await page.selectOption('[name="serviceType"]', 'RISK_ANALYSIS')
    await page.click('text=Filter, text=过滤')

    // Check statistics
    await expect(page.locator('text=Total Requests')).toBeVisible()
    await expect(page.locator('text=Average Response Time')).toBeVisible()
  })
})
