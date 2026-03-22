import { Page } from '@playwright/test'

/**
 * 测试用户凭据
 */
export const TEST_USERS = {
  admin: {
    email: 'admin@example.com',
    password: 'admin123',
  },
  user: {
    email: 'test@example.com',
    password: 'test123',
  },
} as const

/**
 * 执行登录操作
 * @param page Playwright 页面对象
 * @param role 用户角色：'admin' 或 'user'
 */
export async function login(page: Page, role: 'admin' | 'user' = 'admin') {
  const { email, password } = TEST_USERS[role]
  await page.goto('/login')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard**')
}

/**
 * 执行登出操作
 * @param page Playwright 页面对象
 */
export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]')
  await page.click('[data-testid="logout-button"]')
  await page.waitForURL('**/login**')
}
