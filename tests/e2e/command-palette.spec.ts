import { test, expect } from '@playwright/test'

test.describe('命令面板功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)
  })

  test('应能通过 Ctrl+K 快捷键打开命令面板', async ({ page }) => {
    await page.keyboard.press('Control+K')

    await expect(page.locator('[role="dialog"], .fixed.inset-0')).toBeVisible()
    await expect(page.getByPlaceholder(/搜索命令/)).toBeVisible()
  })

  test('应能通过 ESC 关闭命令面板', async ({ page }) => {
    await page.keyboard.press('Control+K')

    await expect(page.getByPlaceholder(/搜索命令/)).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(page.getByPlaceholder(/搜索命令/)).not.toBeVisible()
  })

  test('命令面板应显示导航命令', async ({ page }) => {
    await page.keyboard.press('Control+K')

    await expect(page.getByText('前往工作台')).toBeVisible()
    await expect(page.getByText('前往项目列表')).toBeVisible()
    await expect(page.getByText('前往任务列表')).toBeVisible()
  })

  test('命令面板应显示创建命令', async ({ page }) => {
    await page.keyboard.press('Control+K')

    await expect(page.getByText('创建新项目')).toBeVisible()
    await expect(page.getByText('创建新任务')).toBeVisible()
  })

  test('应能通过命令面板导航到项目页面', async ({ page }) => {
    await page.keyboard.press('Control+K')

    await page.getByText('前往项目列表').click()

    await expect(page).toHaveURL(/\/projects/)
  })

  test('应能通过搜索过滤命令', async ({ page }) => {
    await page.keyboard.press('Control+K')

    await page.getByPlaceholder(/搜索命令/).fill('项目')

    await expect(page.getByText('前往项目列表')).toBeVisible()
    await expect(page.getByText('创建新项目')).toBeVisible()
  })
})
