/**
 * 全局 Mock Setup
 * 用于集成测试的 Mock 环境
 */

import { vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { mockPrisma, resetDatabase } from './__mocks__/prisma'

// Mock @/lib/prisma
vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

// Mock @/lib/email
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'test-id' }),
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'test-id' }),
}))

// Mock @/lib/email-providers/smtp
vi.mock('@/lib/email-providers/smtp', () => ({
  sendSMTPEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'test-id' }),
}))

// Mock @/lib/notification
vi.mock('@/lib/notification', () => ({
  createNotification: vi.fn().mockResolvedValue({ id: 'notif-1', success: true }),
}))

// 全局 setup
beforeAll(async () => {
  // 设置测试环境变量
  process.env.DATABASE_URL = 'file:./test.db'
  process.env.JWT_SECRET = 'test-jwt-secret-key'
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
})

// 每个测试前重置数据库
beforeEach(() => {
  resetDatabase()
  vi.clearAllMocks()
})

// 清理
afterAll(async () => {
  vi.restoreAllMocks()
})

// 导出工具函数供测试使用
export { mockPrisma, resetDatabase }
