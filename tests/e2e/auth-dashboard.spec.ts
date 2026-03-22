import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should login successfully and redirect to dashboard', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/项目管理/)
    await expect(page.locator('h1')).toContainText('欢迎回来')

    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    await page.waitForURL('/dashboard')
    await expect(page.locator('text=工作台')).toBeVisible()
  })

  test('should handle invalid login credentials gracefully', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await expect(page.getByText('邮箱或密码错误')).toBeVisible({ timeout: 10000 })
    await expect(page).toHaveURL(/\/login/)
  })
})
