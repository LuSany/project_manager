import { test, expect } from '@playwright/test'

test('Simple login verification', async ({ page }) => {
  await page.goto('/login')

  await expect(page.locator('h1')).toContainText('欢迎回来')

  await page.fill('input[name="email"]', 'admin@example.com')
  await page.fill('input[name="password"]', 'admin123')
  await page.click('button[type="submit"]')

  await page.waitForURL('/dashboard')

  await expect(page).toHaveURL('/dashboard')

  await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15000 })

  const localStorage = await page.evaluate(() => localStorage.getItem('pm_user'))
  expect(localStorage).toBeTruthy()

  const userData = JSON.parse(localStorage)
  expect(userData.email).toBe('admin@example.com')
  expect(userData.name).toBe('系统管理员')
})
