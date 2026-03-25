import { test, expect } from '@playwright/test'

/**
 * 样式修复调试测试
 *
 * 目的：验证 WelcomeSection 品牌色渐变 CSS 语法修复
 * 修复内容：将 oklch(var(--brand-50)) 改为 var(--brand-50)
 */
test.describe('Style Fix Verification', () => {
  test('should display WelcomeSection with correct brand color gradient', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')

    await expect(page.getByRole('heading', { name: /早上好|中午好|下午好|晚上好/ })).toBeVisible({
      timeout: 10000,
    })

    const welcomeCard = page.locator('[class*="bg-gradient-to-br"]').first()
    await expect(welcomeCard).toBeVisible()

    const computedStyle = await welcomeCard.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return {
        backgroundImage: style.backgroundImage,
        backgroundColor: style.backgroundColor,
      }
    })

    console.log('WelcomeSection computed styles:', computedStyle)

    expect(computedStyle.backgroundImage).toContain('gradient')
    expect(computedStyle.backgroundImage).not.toBe('none')

    await welcomeCard.screenshot({ path: 'test-results/welcome-section-style.png' })
    await page.screenshot({ path: 'test-results/dashboard-full.png', fullPage: true })

    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.waitForTimeout(2000)

    const cssErrors = consoleErrors.filter(
      (e) =>
        e.includes('CSS') || e.includes('stylesheet') || e.includes('oklch') || e.includes('brand')
    )

    if (cssErrors.length > 0) {
      console.log('CSS-related console errors:', cssErrors)
    }

    expect(cssErrors).toHaveLength(0)
  })

  test('should verify CSS custom properties are defined', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /早上好|中午好|下午好|晚上好/ })).toBeVisible({
      timeout: 10000,
    })

    const cssVariables = await page.evaluate(() => {
      const root = document.documentElement
      const styles = window.getComputedStyle(root)
      return {
        brand50: styles.getPropertyValue('--brand-50').trim(),
        brand100: styles.getPropertyValue('--brand-100').trim(),
        brand500: styles.getPropertyValue('--brand-500').trim(),
      }
    })

    console.log('CSS Variables defined:', cssVariables)

    expect(cssVariables.brand50).toBeTruthy()
    expect(cssVariables.brand100).toBeTruthy()
    expect(cssVariables.brand500).toBeTruthy()

    expect(cssVariables.brand50).toContain('oklch')
    expect(cssVariables.brand100).toContain('oklch')
  })

  test('should verify no invalid CSS syntax in WelcomeSection', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /早上好|中午好|下午好|晚上好/ })).toBeVisible({
      timeout: 10000,
    })

    const welcomeCard = page.locator('[class*="bg-gradient-to-br"]').first()

    const classNames = await welcomeCard.getAttribute('class')
    console.log('WelcomeSection class names:', classNames)

    expect(classNames).not.toContain('oklch(var(--brand')

    expect(classNames).toContain('from-[')
    expect(classNames).toContain('to-[')
  })

  test('visual comparison of WelcomeSection', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /早上好|中午好|下午好|晚上好/ })).toBeVisible({
      timeout: 10000,
    })

    await page.waitForTimeout(1000)

    await page.screenshot({
      path: 'test-results/dashboard-visual-check.png',
      fullPage: false,
    })

    const body = page.locator('body')
    const box = await body.boundingBox()

    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(800)
    expect(box!.height).toBeGreaterThan(600)
  })
})
