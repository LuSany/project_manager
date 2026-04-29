/**
 * 单元测试 Mock Setup
 * 提供全局 mock 设置，但不 mock Prisma（测试文件有自己的 mock）
 */

import { vi, beforeAll, afterAll, beforeEach } from 'vitest'

// Mock Email (全局服务，不需要每个测试单独 mock)
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'test-id' }),
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'test-id' }),
}))

// Mock Notification (全局服务)
vi.mock('@/lib/notification', () => ({
  createNotification: vi.fn().mockResolvedValue({ id: 'notif-1', success: true }),
}))

// 全局 setup
beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret-key'
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
})

// 每个测试前重置 mock
beforeEach(() => {
  vi.clearAllMocks()
})

// 清理
afterAll(() => {
  vi.restoreAllMocks()
})