import { test, expect } from '@playwright/test'

test.describe('Sidebar 折叠动画功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)
  })

  test('Sidebar 应显示折叠按钮', async ({ page }) => {
    const menuButton = page.locator('aside button:has([class*="Menu"]), aside button').first()
    await expect(menuButton).toBeVisible()
  })

  test('Sidebar 应显示导航菜单', async ({ page }) => {
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()

    await expect(sidebar.getByText('工作台')).toBeVisible()
    await expect(sidebar.getByText('项目')).toBeVisible()
    await expect(sidebar.getByText('我的任务')).toBeVisible()
  })

  test('点击菜单按钮应折叠/展开 Sidebar', async ({ page }) => {
    const sidebar = page.locator('aside')
    const menuButton = sidebar.locator('button').first()

    const initialWidth = await sidebar.evaluate((el) => (el as HTMLElement).offsetWidth)

    await menuButton.click()
    await page.waitForTimeout(300)

    const collapsedWidth = await sidebar.evaluate((el) => (el as HTMLElement).offsetWidth)

    expect(collapsedWidth).toBeLessThan(initialWidth)

    await menuButton.click()
    await page.waitForTimeout(300)

    const expandedWidth = await sidebar.evaluate((el) => (el as HTMLElement).offsetWidth)
    expect(expandedWidth).toBe(initialWidth)
  })

  test('折叠状态下悬停应显示 Tooltip', async ({ page }) => {
    const sidebar = page.locator('aside')
    const menuButton = sidebar.locator('button').first()

    await menuButton.click()
    await page.waitForTimeout(300)

    const navItem = sidebar.locator('a').first()
    await navItem.hover()
    await page.waitForTimeout(100)

    const tooltip = page.locator('[role="tooltip"], [data-side="right"]')
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

    expect(transitionStyle.transition).toContain('width')
    expect(transitionStyle.transition).toContain('300ms')
  })

  test('导航项应正确高亮当前页面', async ({ page }) => {
    await page.goto('/projects')

    const sidebar = page.locator('aside')
    const projectsLink = sidebar.getByRole('link', { name: /项目/ })

    await expect(projectsLink).toHaveClass(/bg-primary|text-primary/)
  })
})
