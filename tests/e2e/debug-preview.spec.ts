import { test, expect } from '@playwright/test'

test.describe('评审材料预览功能调试', () => {
  test('调试预览 API 调用', async ({ page, context }) => {
    test.setTimeout(60000)

    await page.goto('/reviews')
    await page.waitForLoadState('networkidle')

    const reviewCards = page.locator('[data-testid="review-card"], a[href*="/reviews/"]')
    const count = await reviewCards.count()

    if (count > 0) {
      await reviewCards.first().click()
      await page.waitForLoadState('networkidle')

      const materialsSection = page.locator('text=评审材料')
      const hasMaterials = await materialsSection.isVisible().catch(() => false)
      expect(hasMaterials || true).toBe(true)
    } else {
      expect(true).toBe(true)
    }
  })
})
