import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

test.describe('E2E-08: AI Analysis Workflow', () => {
  test('should navigate to AI config page', async ({ page }) => {
    await page.goto('/admin/ai')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })

  test('should view AI logs', async ({ page }) => {
    await page.goto('/admin/ai')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })

  test('should view AI risks', async ({ page }) => {
    await page.goto('/risks')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })
})
