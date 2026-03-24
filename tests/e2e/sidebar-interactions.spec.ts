import { test, expect } from '@playwright/test'

test.use({ viewport: { width: 1280, height: 720 } })

test.describe('Sidebar 折叠动画功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)
    await page.waitForTimeout(500)
  })

  test('Sidebar 应显示折叠按钮', async ({ page }) => {
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()

    const menuButton = sidebar.locator('button').first()
    await expect(menuButton).toBeVisible()
  })

  test('Sidebar 应显示导航菜单', async ({ page }) => {
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()

    await expect(sidebar.getByRole('link', { name: '工作台' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: '项目', exact: true })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: '我的任务' })).toBeVisible()
  })

  test('点击菜单按钮应折叠/展开 Sidebar', async ({ page }) => {
    const sidebar = page.locator('aside')
    const menuButton = sidebar.locator('button').first()

    const initialWidth = await sidebar.evaluate((el) => (el as HTMLElement).offsetWidth)

    await menuButton.click()
    await page.waitForTimeout(500)

    const collapsedWidth = await sidebar.evaluate((el) => (el as HTMLElement).offsetWidth)
    expect(collapsedWidth).toBeLessThan(initialWidth)

    await menuButton.click()
    await page.waitForTimeout(500)

    const expandedWidth = await sidebar.evaluate((el) => (el as HTMLElement).offsetWidth)
    expect(expandedWidth).toBe(initialWidth)
  })

  test('Sidebar 应有平滑的过渡动画', async ({ page }) => {
    const sidebar = page.locator('aside')

    const transitionStyle = await sidebar.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return {
        transition: style.transition,
        transitionDuration: style.transitionDuration,
      }
    })

    expect(transitionStyle.transition).toBeTruthy()
    const duration = parseFloat(transitionStyle.transitionDuration)
    expect(duration).toBeGreaterThan(0)
  })

  test('导航项应正确高亮当前页面', async ({ page }) => {
    await page.goto('/projects')
    await page.waitForTimeout(300)

    const sidebar = page.locator('aside')
    const projectsLink = sidebar.getByRole('link', { name: '项目', exact: true })

    await expect(projectsLink).toHaveClass(/bg-primary|text-primary/)
  })
})
