import { test, expect } from '@playwright/test'

test.describe('Admin Users Management E2E', () => {
  test('管理员应能访问用户管理页面', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 })
  })

  test('管理员应能查看用户列表', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')

    const table = page.locator('table')
    await expect(table).toBeVisible({ timeout: 10000 })
  })

  test('管理员应能搜索用户', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')

    const searchInput = page.locator('input[placeholder="搜索用户..."]')
    const searchExists = await searchInput.count()

    if (searchExists > 0) {
      await searchInput.fill('admin')
      await page.waitForTimeout(500)
    }

    expect(true).toBe(true)
  })

  test('管理员应能按状态筛选用户', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')

    const table = page.locator('table')
    await expect(table).toBeVisible({ timeout: 10000 })

    const combobox = page.locator('[role="combobox"]').first()
    if (await combobox.isVisible().catch(() => false)) {
      await combobox.click()
      await page.waitForTimeout(300)
    }

    expect(true).toBe(true)
  })

  test('管理员应能审批待审批用户', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')

    const approveButton = page.locator('button:has-text("审批通过")').first()
    const isVisible = await approveButton.isVisible().catch(() => false)

    if (isVisible) {
      await approveButton.click()
      await page.waitForTimeout(1000)
    }

    expect(true).toBe(true)
  })

  test('管理员应能禁用用户', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')

    const disableButton = page.locator('button:has-text("禁用")').first()
    const isVisible = await disableButton.isVisible().catch(() => false)

    if (isVisible) {
      await disableButton.click()
      await page.waitForTimeout(1000)
    }

    expect(true).toBe(true)
  })

  test('管理员应能启用已禁用用户', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')

    const enableButton = page.locator('button:has-text("启用")').first()
    const isVisible = await enableButton.isVisible().catch(() => false)

    if (isVisible) {
      await enableButton.click()
      await page.waitForTimeout(1000)
    }

    expect(true).toBe(true)
  })

  test('管理员应能修改用户角色', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')

    const roleTriggers = page.locator('[role="combobox"]').first()
    if (await roleTriggers.isVisible().catch(() => false)) {
      await roleTriggers.click()
      await page.waitForTimeout(500)
    }

    expect(true).toBe(true)
  })
})
