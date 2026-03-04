/**
 * E2E-01: 用户注册 → 登录 → 创建项目
 *
 * 端到端测试核心流程
 * 使用 Playwright 测试框架
 *
 * 测试场景:
 * 1. 用户注册新账户
 * 2. 使用注册的账户登录
 * 3. 创建新项目
 * 4. 验证项目创建成功
 * 5. 验证项目数据完整性
 *
 * Phase 3 E2E 测试
 */

import { test, expect } from '@playwright/test'

test.describe('E2E-01: User Registration → Login → Create Project', () => {
  test('should complete user registration flow', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register')

    // Fill registration form
    await page.fill('[name="email"]', `e2e-test-${Date.now()}@example.com`)
    await page.fill('[name="password"]', 'TestPassword123!')
    await page.fill('[name="confirmPassword"]', 'TestPassword123!')
    await page.fill('[name="name"]', 'E2E Test User')

    // Submit registration
    await page.click('button[type="submit"]')

    // Wait for success message or redirect
    await expect(page).toHaveURL(/\/login/)
  })

  test('should login with registered credentials', async ({ page }) => {
    const email = `login-test-${Date.now()}@example.com`
    const password = 'LoginTest123!'

    // First register
    await page.goto('/register')
    await page.fill('[name="email"]', email)
    await page.fill('[name="password"]', password)
    await page.fill('[name="confirmPassword"]', password)
    await page.fill('[name="name"]', 'Login Test User')
    await page.click('button[type="submit"]')

    // Then login
    await page.goto('/login')
    await page.fill('[name="email"]', email)
    await page.fill('[name="password"]', password)
    await page.click('button[type="submit"]')

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard|\/projects/)
  })

  test('should create new project after login', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('[name="email"]', 'test-admin@example.com')
    await page.fill('[name="password"]', 'AdminPassword123!')
    await page.click('button[type="submit"]')

    // Navigate to projects
    await page.goto('/projects')

    // Click create project button
    await page.click('text=New Project, text=创建项目')

    // Fill project form
    const projectName = `E2E Test Project ${Date.now()}`
    await page.fill('[name="name"]', projectName)
    await page.fill('[name="description"]', 'E2E test project description')

    // Submit project creation
    await page.click('button[type="submit"]')

    // Verify project created
    await expect(page).toHaveURL(/\/projects\/[^\/]+/)
    await expect(page.locator('h1')).toContainText(projectName)
  })

  test('should verify project data integrity', async ({ page }) => {
    const projectName = `Data Integrity Test ${Date.now()}`

    // Login and create project
    await page.goto('/login')
    await page.fill('[name="email"]', 'test-admin@example.com')
    await page.fill('[name="password"]', 'AdminPassword123!')
    await page.click('button[type="submit"]')

    await page.goto('/projects/new')
    await page.fill('[name="name"]', projectName)
    await page.fill('[name="description"]', 'Testing data integrity')
    await page.selectOption('[name="status"]', 'PLANNING')
    await page.click('button[type="submit"]')

    // Verify project details
    await expect(page.locator('h1')).toContainText(projectName)
    await expect(page.locator('text=Testing data integrity')).toBeVisible()
    await expect(page.locator('text=PLANNING, text=规划中')).toBeVisible()
  })

  test('should handle complete user journey', async ({ page }) => {
    // Step 1: Register
    await page.goto('/register')
    await page.fill('[name="email"]', `journey-${Date.now()}@example.com`)
    await page.fill('[name="password"]', 'Journey123!')
    await page.fill('[name="confirmPassword"]', 'Journey123!')
    await page.fill('[name="name"]', 'Journey User')
    await page.click('button[type="submit"]')

    // Step 2: Login
    await page.waitForURL(/\/login/)
    await page.fill('[name="email"]', /journey-.*@example\.com/)
    await page.fill('[name="password"]', 'Journey123!')
    await page.click('button[type="submit"]')

    // Step 3: Create project
    await page.waitForURL(/\/dashboard|\/projects/)
    await page.goto('/projects/new')
    await page.fill('[name="name"]', 'Journey Project')
    await page.fill('[name="description"]', 'Complete user journey test')
    await page.click('button[type="submit"]')

    // Step 4: Verify
    await page.waitForURL(/\/projects\/[^\/]+/)
    await expect(page.locator('h1')).toContainText('Journey Project')

    // Step 5: Navigate to project settings
    await page.click('text=Settings, text=设置')
    await expect(page).toHaveURL(/\/projects\/[^\/]+\/settings/)
  })
})
