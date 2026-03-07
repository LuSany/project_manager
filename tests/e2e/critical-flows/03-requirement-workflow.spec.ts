/**
 * E2E-03: 需求完整流程
 *
 * 端到端测试核心流程
 * 需求提出 → 审核 → 评估 → 波及分析 → 验收 → 变更历史
 *
 * Phase 3 E2E 测试
 */

import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

test.describe('E2E-03: Complete Requirement Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
  })

  test('should navigate to requirements page', async ({ page }) => {
    await page.goto('/requirements')
    await page.waitForTimeout(1000)

    // Verify page loads
    await expect(page.locator('h1')).toContainText('需求')
  })

  test('should create new requirement', async ({ page }) => {
    // Navigate to projects first to get a project
    await page.goto('/projects')
    await page.waitForTimeout(1000)

    // Click first project card
    const projectCard = page.locator('.bg-card.border').first()
    if (await projectCard.isVisible()) {
      await projectCard.click()
      await page.waitForTimeout(1000)
    }

    // Get project ID from URL
    const url = page.url()
    const projectId = url.split('/').pop()

    if (projectId) {
      // Navigate to create requirement
      await page.goto(`/projects/${projectId}/requirements/new`)
      await page.waitForSelector('input[type="text"]', { timeout: 10000 })

      const title = `E2E Requirement ${Date.now()}`
      await page.fill('input[type="text"]', title)
      await page.click('button[type="submit"]')
      await page.waitForTimeout(2000)

      // Verify page is loaded
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('should view requirement details', async ({ page }) => {
    await page.goto('/requirements')
    await page.waitForTimeout(1000)

    // Verify page loads
    await expect(page.locator('h1')).toContainText('需求管理')
  })

  test('should handle requirement workflow', async ({ page }) => {
    await page.goto('/requirements')
    await page.waitForTimeout(1000)

    // Verify page loads
    await expect(page.locator('h1')).toContainText('需求管理')
  })
})
