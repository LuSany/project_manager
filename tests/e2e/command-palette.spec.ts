import { test, expect } from '@playwright/test'

test.use({ viewport: { width: 1280, height: 720 } })

test.describe('命令面板功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)
    await page.waitForTimeout(500)
  })

  test('应能通过 Ctrl+K 快捷键打开命令面板', async ({ page }) => {
    await page.keyboard.press('Control+K')
    await page.waitForTimeout(300)

    const commandInput = page.locator('[cmdk-input], .fixed.inset-0 input[placeholder*="搜索"]')
    await expect(commandInput).toBeVisible({ timeout: 5000 })
  })

  test('应能通过 ESC 关闭命令面板', async ({ page }) => {
    await page.keyboard.press('Control+K')
    await page.waitForTimeout(300)

    const commandInput = page.locator('[cmdk-input], .fixed.inset-0 input[placeholder*="搜索"]')
    await expect(commandInput).toBeVisible()

    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)

    await expect(commandInput).not.toBeVisible()
  })

  test('命令面板应显示导航命令', async ({ page }) => {
    await page.keyboard.press('Control+K')
    await page.waitForTimeout(500)

    await expect(page.getByText('前往工作台')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('前往项目列表')).toBeVisible()
  })

  test('命令面板应显示创建命令', async ({ page }) => {
    await page.keyboard.press('Control+K')
    await page.waitForTimeout(500)

    await expect(page.getByText('创建新项目')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('创建新任务')).toBeVisible()
  })

  test('应能通过命令面板导航到项目页面', async ({ page }) => {
    await page.keyboard.press('Control+K')
    await page.waitForTimeout(500)

    await page.getByText('前往项目列表').click()
    await expect(page).toHaveURL(/\/projects/, { timeout: 10000 })
  })

  test('应能通过搜索过滤命令', async ({ page }) => {
    await page.keyboard.press('Control+K')
    await page.waitForTimeout(500)

    const commandInput = page.locator('[cmdk-input], .fixed.inset-0 input[placeholder*="搜索"]')
    await commandInput.fill('项目')

    await expect(page.getByText('项目').first()).toBeVisible({ timeout: 5000 })
  })
})
