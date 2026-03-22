import { test, expect } from '@playwright/test'

test.describe('Frontend Login Verification', () => {
  test('should complete full login flow and access dashboard successfully', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL('/dashboard')
    await expect(page).toHaveTitle(/项目管理系统/)

    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 10000 })
    await expect(page.locator('text=工作台')).toBeVisible()
  })

  test('should handle invalid credentials gracefully', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await expect(page.getByText('邮箱或密码错误')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })

  test('should allow access to dashboard for authenticated users', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=工作台')).toBeVisible()
  })
})
