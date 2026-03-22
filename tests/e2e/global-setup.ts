import { chromium, FullConfig } from '@playwright/test'
import { execSync } from 'child_process'

/**
 * Playwright 全局 Setup
 * 在所有测试运行前执行：
 * 1. 运行数据库种子数据
 * 2. 创建管理员和普通用户的认证状态
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 开始全局 Setup...')

  // 1. 运行种子数据确保测试数据就绪
  console.log('📦 运行数据库种子数据...')
  try {
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' })
    console.log('✅ 种子数据完成')
  } catch (error) {
    console.warn('⚠️ 种子数据运行失败，继续执行...')
  }

  // 2. 创建浏览器实例
  const browser = await chromium.launch()
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000'

  // 3. 登录管理员并保存认证状态
  console.log('🔐 创建管理员认证状态...')
  const adminContext = await browser.newContext()
  const adminPage = await adminContext.newPage()

  try {
    await adminPage.goto(`${baseURL}/login`)
    await adminPage.fill('input[name="email"]', 'admin@example.com')
    await adminPage.fill('input[name="password"]', 'admin123')
    await adminPage.click('button[type="submit"]')

    // 等待登录成功跳转
    await adminPage.waitForURL('**/dashboard**', { timeout: 15000 })

    // 保存认证状态
    await adminContext.storageState({ path: 'tests/e2e/.auth/admin.json' })
    console.log('✅ 管理员认证状态已保存')
  } catch (error) {
    console.error('❌ 管理员登录失败:', error)
    throw error
  } finally {
    await adminContext.close()
  }

  // 4. 登录普通用户并保存认证状态
  console.log('🔐 创建普通用户认证状态...')
  const userContext = await browser.newContext()
  const userPage = await userContext.newPage()

  try {
    await userPage.goto(`${baseURL}/login`)
    await userPage.fill('input[name="email"]', 'test@example.com')
    await userPage.fill('input[name="password"]', 'test123')
    await userPage.click('button[type="submit"]')

    // 等待登录成功跳转
    await userPage.waitForURL('**/dashboard**', { timeout: 15000 })

    // 保存认证状态
    await userContext.storageState({ path: 'tests/e2e/.auth/user.json' })
    console.log('✅ 普通用户认证状态已保存')
  } catch (error) {
    console.error('❌ 普通用户登录失败:', error)
    throw error
  } finally {
    await userContext.close()
  }

  await browser.close()
  console.log('🎉 全局 Setup 完成')
}

export default globalSetup
