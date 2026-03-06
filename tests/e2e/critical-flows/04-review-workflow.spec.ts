/**
 * E2E-04: 评审完整流程
 *
 * 端到端测试核心流程
 * 创建评审 → 选择类型 → 上传材料 → 分配参与者 → 评审 → AI 分析 → 完成
 *
 * Phase 3 E2E 测试 - 8 用例
 */

import { test, expect } from '@playwright/test'

test.describe('E2E-04: Complete Review Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
  })

  test('should create new review', async ({ page }) => {
    await page.goto('/reviews')
    await page.click('text=New Review, text=创建评审')

    await page.fill('[name="title"]', `E2E Review ${Date.now()}`)
    await page.selectOption('[name="type"]', 'CODE_REVIEW')
    await page.fill('[name="description"]', 'E2E review test')
    await page.click('button[type="submit"]')

    await expect(page.locator('h1')).toContainText('Review')
  })

  test('should select review type', async ({ page }) => {
    await page.goto('/reviews/new')
    await page.selectOption('[name="type"]', 'DESIGN_REVIEW')
    await page.fill('[name="title"]', 'Design Review Test')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=DESIGN_REVIEW')).toBeVisible()
  })

  test('should upload review materials', async ({ page }) => {
    await page.goto('/reviews')
    await page.click('text=Review')

    await page.click('text=Upload Material, text=上传材料')
    await page.setInputFiles('input[type="file"]', 'test.pdf')
    await page.fill('[name="materialName"]', 'Design Document')
    await page.click('button:has-text("Upload")')

    await expect(page.locator('text=Design Document')).toBeVisible()
  })

  test('should assign review participants', async ({ page }) => {
    await page.goto('/reviews')
    await page.click('text=Review')

    await page.click('text=Add Participant, text=添加参与者')
    await page.click('[data-testid="select-user"]')
    await page.click('text=Test User')
    await page.selectOption('[name="role"]', 'REVIEWER')
    await page.click('button:has-text("Add")')

    await expect(page.locator('text=Test User')).toBeVisible()
  })

  test('should complete review items', async ({ page }) => {
    await page.goto('/reviews')
    await page.click('text=Review')

    await page.click('text=Review Items, text=评审项')
    await page.click('text=Add Item')
    await page.fill('[name="itemTitle"]', 'Code Quality Check')
    await page.click('button:has-text("Add")')

    // Complete item
    await page.click('[data-testid="complete-item"]')
    await expect(page.locator('text=COMPLETED')).toBeVisible()
  })

  test('should perform AI review analysis', async ({ page }) => {
    await page.goto('/reviews')
    await page.click('text=Review')

    await page.click('text=AI Analysis, text=AI 分析')
    await page.click('button:has-text("Analyze")')

    // Wait for AI analysis
    await page.waitForTimeout(3000)

    await expect(page.locator('text=AI Analysis')).toBeVisible()
  })

  test('should submit review conclusion', async ({ page }) => {
    await page.goto('/reviews')
    await page.click('text=Review')

    await page.click('text=Conclusion, text=结论')
    await page.selectOption('[name="result"]', 'PASSED')
    await page.fill('[name="conclusion"]', 'All criteria met')
    await page.click('button:has-text("Submit")')

    await expect(page.locator('text=PASSED, text=通过')).toBeVisible()
  })

  test('should complete full review lifecycle', async ({ page }) => {
    // Create review
    await page.goto('/reviews/new')
    await page.fill('[name="title"]', `Full Lifecycle ${Date.now()}`)
    await page.selectOption('[name="type"]', 'CODE_REVIEW')
    await page.click('button[type="submit"]')

    // Add material
    await page.click('text=Upload Material')
    await page.fill('[name="materialName"]', 'Code')
    await page.click('button:has-text("Upload")')

    // Add participant
    await page.click('text=Add Participant')
    await page.click('button:has-text("Add")')

    // Complete review
    await page.click('text=Conclusion')
    await page.selectOption('[name="result"]', 'PASSED')
    await page.click('button:has-text("Submit")')

    await expect(page.locator('text=PASSED')).toBeVisible()
  })
})
