/**
 * 测试基础设施验证测试（Mock 工具）
 *
 * 此测试文件验证 Mock 工具是否正常工作
 * 不需要数据库连接
 */

import { describe, it, expect } from 'vitest'
import { createPrismaMock, mockTestData, resetAllMocks } from './mocks/prisma-mock'
import { createMockRequest, createAuthenticatedRequest } from './mocks/request-mock'

// ============================================
// Prisma Mock 工厂测试
// ============================================

describe('Prisma Mock 工厂', () => {
  it('应该创建完整的 Mock 对象', () => {
    const mockPrisma = createPrismaMock()

    expect(mockPrisma.user).toBeDefined()
    expect(mockPrisma.user.findUnique).toBeDefined()
    expect(mockPrisma.user.create).toBeDefined()
    expect(mockPrisma.project).toBeDefined()
    expect(mockPrisma.task).toBeDefined()
    expect(mockPrisma.$connect).toBeDefined()
    expect(mockPrisma.$disconnect).toBeDefined()
  })

  it('应该支持设置返回值', async () => {
    const mockPrisma = createPrismaMock()
    mockPrisma.user.findUnique.mockResolvedValue(mockTestData.user)

    const result = await mockPrisma.user.findUnique({ where: { id: '1' } })
    expect(result).toEqual(mockTestData.user)
  })

  it('resetAllMocks 应该清除所有 Mock', async () => {
    const mockPrisma = createPrismaMock()
    mockPrisma.user.findUnique.mockResolvedValue(mockTestData.user)

    resetAllMocks(mockPrisma)

    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
  })
})

// ============================================
// Request Mock 工具测试
// ============================================

describe('Request Mock 工具', () => {
  it('createMockRequest 应该创建基本请求', () => {
    const req = createMockRequest({ method: 'GET' })

    expect(req.method).toBe('GET')
    expect(req.url).toContain('/api/v1/test')
  })

  it('createMockRequest 应该支持自定义 URL', () => {
    const req = createMockRequest({ url: 'http://localhost:3000/api/v1/users' })

    expect(req.url).toBe('http://localhost:3000/api/v1/users')
  })

  it('createMockRequest 应该支持 cookies', () => {
    const req = createMockRequest({
      cookies: { 'user-id': '123', session: 'abc' },
    })

    expect(req.cookies.get('user-id')).toEqual({ name: 'user-id', value: '123' })
    expect(req.cookies.get('session')).toEqual({ name: 'session', value: 'abc' })
  })

  it('createMockRequest 应该支持 body', async () => {
    const body = { name: 'Test', email: 'test@example.com' }
    const req = createMockRequest({ method: 'POST', body })

    const jsonBody = await req.json()
    expect(jsonBody).toEqual(body)
  })

  it('createAuthenticatedRequest 应该包含认证信息', () => {
    const req = createAuthenticatedRequest({ userId: 'user-123' })

    expect(req.cookies.get('user-id')).toEqual({ name: 'user-id', value: 'user-123' })
    expect(req.cookies.get('user-role')).toEqual({ name: 'user-role', value: 'EMPLOYEE' })
  })

  it('createAuthenticatedRequest 应该支持管理员角色', () => {
    const req = createAuthenticatedRequest({ userRole: 'ADMIN' })

    expect(req.cookies.get('user-role')).toEqual({ name: 'user-role', value: 'ADMIN' })
  })
})
