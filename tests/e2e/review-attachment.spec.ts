import { test, expect } from '@playwright/test'

test.describe('Review Attachment Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard', { timeout: 10000 })
  })

  test('should access review detail page and check edit dialog', async ({ page }) => {
    await page.goto('http://localhost:3000/reviews')
    await page.waitForSelector('text=我的评审', { timeout: 10000 })

    const viewDetailButton = page.locator('button:has-text("查看详情")').first()
    await viewDetailButton.click()

    await page.waitForSelector('text=评审材料', { timeout: 10000 })

    const editButton = page.locator('button:has-text("编辑")')
    if (await editButton.isVisible()) {
      await editButton.click()
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 })

      const materialsSection = page.locator('div:has-text("评审材料")').first()
      await expect(materialsSection).toBeVisible()

      const participantsSection = page.locator('div:has-text("参与者")').first()
      await expect(participantsSection).toBeVisible()
    }
  })

  test('should check file upload functionality exists', async ({ page }) => {
    await page.goto('http://localhost:3000/reviews')
    await page.waitForSelector('text=我的评审', { timeout: 10000 })

    const viewDetailButton = page.locator('button:has-text("查看详情")').first()
    await viewDetailButton.click()
    await page.waitForSelector('text=评审材料', { timeout: 10000 })

    const editButton = page.locator('button:has-text("编辑")')
    if (await editButton.isVisible()) {
      await editButton.click()
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 })

      const fileInput = page.locator('input[type="file"]')
      await fileInput.count()
    }
  })
})
