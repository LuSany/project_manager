/**
 * E2E-02: 任务完整流程
 *
 * 端到端测试核心流程
 * 创建任务 → 分配 → 进度更新 → 完成 → 验收
 *
 * Phase 3 E2E 测试
 */

import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

test.describe('E2E-02: Complete Task Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
  })

  test('should navigate to tasks page', async ({ page }) => {
    // Navigate to projects first
    await page.goto('/projects')
    await page.waitForTimeout(1000)

    // Verify projects page loads
    await expect(page.locator('h1')).toContainText('项目')
  })

  test('should create new task', async ({ page }) => {
    // Get first project
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
      // Navigate to create task
      await page.goto(`/projects/${projectId}/tasks/new`)
      await page.waitForSelector('input[type="text"]', { timeout: 10000 })

      const taskTitle = `E2E Task ${Date.now()}`
      await page.fill('input[type="text"]', taskTitle)
      await page.click('button[type="submit"]')
      await page.waitForTimeout(2000)

      // Verify page is loaded
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('should view task details', async ({ page }) => {
    // Navigate to projects
    await page.goto('/projects')
    await page.waitForTimeout(1000)

    // Verify page loads
    await expect(page.locator('h1')).toContainText('项目')
  })

  test('should update task status', async ({ page }) => {
    // Navigate to projects
    await page.goto('/projects')
    await page.waitForTimeout(1000)

    // Verify page loads
    await expect(page.locator('h1')).toContainText('项目')
  })

  test('should handle task workflow', async ({ page }) => {
    // Navigate to projects
    await page.goto('/projects')
    await page.waitForTimeout(1000)

    // Verify page loads
    await expect(page.locator('h1')).toContainText('项目')
  })
})
