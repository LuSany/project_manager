/**
 * E2E-03: 需求完整流程
 *
 * 端到端测试核心流程
 * 需求提出 → 审核 → 评估 → 波及分析 → 验收 → 变更历史
 *
 * Phase 3 E2E 测试 - 10 用例
 */

import { test, expect } from '@playwright/test'

test.describe('E2E-03: Complete Requirement Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'test-admin@example.com')
    await page.fill('[name="password"]', 'AdminPassword123!')
    await page.click('button[type="submit"]')
  })

  test('should create new requirement', async ({ page }) => {
    await page.goto('/requirements')
    await page.click('text=New Requirement, text=创建需求')

    await page.fill('[name="title"]', `E2E Requirement ${Date.now()}`)
    await page.fill('[name="description"]', 'E2E requirement creation test')
    await page.selectOption('[name="priority"]', 'MEDIUM')
    await page.click('button[type="submit"]')

    await expect(page.locator('h1')).toContainText('Requirement')
  })

  test('should submit requirement for review', async ({ page }) => {
    await page.goto('/requirements/new')
    await page.fill('[name="title"]', `Review Request ${Date.now()}`)
    await page.click('button[type="submit"]')

    await page.click('text=Submit for Review, text=提交审核')
    await expect(page.locator('text=PENDING, text=待审核')).toBeVisible()
  })

  test('should review and approve requirement', async ({ page }) => {
    await page.goto('/requirements?status=PENDING')
    await page.click('text=Requirement')

    await page.click('text=Approve, text=批准')
    await page.fill('[name="reviewComment"]', 'Approved with minor changes')
    await page.click('button:has-text("Approve")')

    await expect(page.locator('text=APPROVED, text=已批准')).toBeVisible()
  })

  test('should assess requirement impact', async ({ page }) => {
    await page.goto('/requirements')
    await page.click('text=Requirement')

    await page.click('text=Impact Analysis, text=影响分析')
    await page.fill('[name="impactDescription"]', 'Technical impact assessment')
    await page.selectOption('[name="severity"]', 'HIGH')
    await page.click('button:has-text("Save")')

    await expect(page.locator('text=HIGH, text=高')).toBeVisible()
  })

  test('should perform波及 analysis', async ({ page }) => {
    await page.goto('/requirements')
    await page.click('text=Requirement')

    await page.click('text=Impact Analysis, text=波及分析')
    await page.fill('[name="affectedSystems"]', 'System A, System B')
    await page.fill('[name="estimatedEffort"]', '40 hours')
    await page.click('button:has-text("Analyze")')

    await expect(page.locator('text=System A')).toBeVisible()
  })

  test('should accept completed requirement', async ({ page }) => {
    await page.goto('/requirements?status=IMPLEMENTED')
    await page.click('text=Requirement')

    await page.click('text=Accept, text=验收')
    await page.fill('[name="acceptanceNotes"]', 'All criteria met')
    await page.click('button:has-text("Accept")')

    await expect(page.locator('text=ACCEPTED, text=已验收')).toBeVisible()
  })

  test('should track requirement changes', async ({ page }) => {
    await page.goto('/requirements')
    await page.click('text=Requirement')

    // Make a change
    await page.click('text=Edit, text=编辑')
    await page.fill('[name="description"]', 'Updated description')
    await page.click('button:has-text("Save")')

    // View history
    await page.click('text=History, text=变更历史')
    await expect(page.locator('text=DESCRIPTION_CHANGED')).toBeVisible()
  })

  test('should handle requirement rejection', async ({ page }) => {
    await page.goto('/requirements?status=PENDING')
    await page.click('text=Requirement')

    await page.click('text=Reject, text=拒绝')
    await page.fill('[name="rejectionReason"]', 'Incomplete requirements')
    await page.click('button:has-text("Reject")')

    await expect(page.locator('text=REJECTED, text=已拒绝')).toBeVisible()
  })

  test('should manage requirement discussions', async ({ page }) => {
    await page.goto('/requirements')
    await page.click('text=Requirement')

    await page.click('text=Discussion, text=讨论')
    await page.fill('[name="comment"]', 'Discussion comment')
    await page.click('button:has-text("Post")')

    await expect(page.locator('text=Discussion comment')).toBeVisible()
  })

  test('should complete full requirement lifecycle', async ({ page }) => {
    // Create
    await page.goto('/requirements/new')
    await page.fill('[name="title"]', `Lifecycle Test ${Date.now()}`)
    await page.click('button[type="submit"]')

    // Submit for review
    await page.click('text=Submit for Review')

    // Approve
    await page.click('text=Approve')
    await page.click('button:has-text("Confirm")')

    // Implement (simulate)
    await page.click('text=Start Implementation')

    // Accept
    await page.click('text=Mark Complete')
    await page.click('text=Accept')

    // Verify final status
    await expect(page.locator('text=ACCEPTED, text=已验收')).toBeVisible()
  })
})
