/**
 * E2E-05: 风险完整流程
 *
 * 端到端测试核心流程
 * 风险识别 → 评估 → 关联任务 → 缓解 → 关闭
 *
 * Phase 3 E2E 测试 - 6 用例
 */

import { test, expect } from '@playwright/test'

test.describe('E2E-05: Complete Risk Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
  })

  test('should identify and create new risk', async ({ page }) => {
    await page.goto('/risks')
    await page.click('text=New Risk, text=创建风险')

    await page.fill('[name="title"]', `E2E Risk ${Date.now()}`)
    await page.fill('[name="description"]', 'Risk identification test')
    await page.selectOption('[name="category"]', 'TECHNICAL')
    await page.click('button[type="submit"]')

    await expect(page.locator('h1')).toContainText('Risk')
  })

  test('should assess risk probability and impact', async ({ page }) => {
    await page.goto('/risks')
    await page.click('text=Risk')

    await page.click('text=Assess, text=评估')
    await page.selectOption('[name="probability"]', '4')
    await page.selectOption('[name="impact"]', '5')
    await page.click('button:has-text("Save")')

    await expect(page.locator('text=Risk Level: HIGH, text=风险等级：高')).toBeVisible()
  })

  test('should associate risk with mitigation task', async ({ page }) => {
    await page.goto('/risks')
    await page.click('text=Risk')

    await page.click('text=Add Task, text=关联任务')
    await page.fill('[name="taskTitle"]', 'Risk Mitigation Task')
    await page.click('button:has-text("Create")')

    await expect(page.locator('text=Risk Mitigation Task')).toBeVisible()
  })

  test('should track risk mitigation progress', async ({ page }) => {
    await page.goto('/risks')
    await page.click('text=Risk')

    await page.click('text=Progress, text=进展')
    await page.fill('[name="progressNote"]', 'Mitigation in progress')
    await page.fill('[name="progressPercent"]', '50')
    await page.click('button:has-text("Update")')

    await expect(page.locator('text=50%')).toBeVisible()
  })

  test('should mark risk as resolved', async ({ page }) => {
    await page.goto('/risks')
    await page.click('text=Risk')

    await page.click('text=Resolve, text=解决')
    await page.fill('[name="resolutionNotes"]', 'Risk successfully mitigated')
    await page.click('button:has-text("Resolve")')

    await expect(page.locator('text=RESOLVED, text=已解决')).toBeVisible()
  })

  test('should complete full risk lifecycle', async ({ page }) => {
    // Identify
    await page.goto('/risks/new')
    await page.fill('[name="title"]', `Lifecycle Risk ${Date.now()}`)
    await page.selectOption('[name="category"]', 'TECHNICAL')
    await page.click('button[type="submit"]')

    // Assess
    await page.click('text=Assess')
    await page.selectOption('[name="probability"]', '3')
    await page.selectOption('[name="impact"]', '3')
    await page.click('button:has-text("Save")')

    // Mitigate
    await page.click('text=Add Task')
    await page.click('button:has-text("Create")')

    // Update progress
    await page.click('text=Progress')
    await page.fill('[name="progressPercent"]', '100')
    await page.click('button:has-text("Update")')

    // Resolve
    await page.click('text=Resolve')
    await page.click('button:has-text("Resolve")')

    // Close
    await page.click('text=Close, text=关闭')

    await expect(page.locator('text=CLOSED, text=已关闭')).toBeVisible()
  })
})
