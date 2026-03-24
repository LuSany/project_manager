import { test, expect } from '@playwright/test'

test.describe('面包屑导航功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)
  })

  test('Dashboard 页面应显示首页图标', async ({ page }) => {
    await page.goto('/dashboard')

    const homeLink = page.locator('nav[aria-label="breadcrumb"] a[href="/dashboard"]')
    await expect(homeLink).toBeVisible()
  })

  test('项目列表页面应显示正确的面包屑', async ({ page }) => {
    await page.goto('/projects')

    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]')
    await expect(breadcrumb).toBeVisible()
    await expect(breadcrumb.getByText('项目')).toBeVisible()
  })

  test('任务列表页面应显示正确的面包屑', async ({ page }) => {
    await page.goto('/tasks')

    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]')
    await expect(breadcrumb).toBeVisible()
    await expect(breadcrumb.getByText('任务')).toBeVisible()
  })

  test('设置页面应显示正确的面包屑', async ({ page }) => {
    await page.goto('/settings')

    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]')
    await expect(breadcrumb).toBeVisible()
    await expect(breadcrumb.getByText('设置')).toBeVisible()
  })

  test('点击首页图标应返回 Dashboard', async ({ page }) => {
    await page.goto('/projects')

    await page.locator('nav[aria-label="breadcrumb"] a[href="/dashboard"]').click()

    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('嵌套页面应显示完整的面包屑路径', async ({ page }) => {
    await page.goto('/settings/profile')

    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]')
    await expect(breadcrumb.getByText('设置')).toBeVisible()
    await expect(breadcrumb.getByText('个人资料')).toBeVisible()
  })
})
