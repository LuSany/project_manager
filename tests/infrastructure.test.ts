/**
 * 测试基础设施验证测试
 *
 * 验证 Phase 1 创建的所有测试工具是否正常工作
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testPrisma, setupTestDatabase } from './helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestTask,
  createTestTag,
  createTestProjectStructure,
} from './helpers/test-data-factory'
import { createPrismaMock, mockTestData, resetAllMocks } from './mocks/prisma-mock'
import { createMockRequest, createAuthenticatedRequest } from './mocks/request-mock'

// ============================================
// 测试数据库隔离工具
// ============================================

describe('测试数据库隔离工具', () => {
  setupTestDatabase()

  it('应该正确创建和隔离测试数据', async () => {
    const user = await createTestUser({ email: 'test1@example.com' })
    expect(user).toBeDefined()
    expect(user.email).toBe('test1@example.com')
    expect(user.status).toBe('ACTIVE')
  })

  it('每个测试应该有独立的数据环境', async () => {
    // 这个测试不应该看到上一个测试的数据
    const users = await testPrisma.user.findMany()
    expect(users.length).toBe(0)
  })

  it('应该支持创建关联数据', async () => {
    const user = await createTestUser()
    const project = await createTestProject(user.id)
    const task = await createTestTask(project.id)

    expect(task.projectId).toBe(project.id)
    expect(project.ownerId).toBe(user.id)
  })
})

// ============================================
// 测试数据工厂
// ============================================

describe('测试数据工厂', () => {
  setupTestDatabase()

  it('createTestUser 应该创建默认用户', async () => {
    const user = await createTestUser()
    expect(user.email).toContain('@example.com')
    expect(user.status).toBe('ACTIVE')
    expect(user.role).toBe('EMPLOYEE')
  })

  it('createTestUser 应该支持自定义属性', async () => {
    const user = await createTestUser({
      email: 'custom@example.com',
      name: 'Custom User',
      role: 'ADMIN',
    })
    expect(user.email).toBe('custom@example.com')
    expect(user.name).toBe('Custom User')
    expect(user.role).toBe('ADMIN')
  })

  it('createTestTag 应该创建标签', async () => {
    const tag = await createTestTag({ name: 'bug', color: '#FF0000' })
    expect(tag.name).toBe('bug')
    expect(tag.color).toBe('#FF0000')
  })

  it('createTestProjectStructure 应该创建完整结构', async () => {
    const { user, project, milestone, task } = await createTestProjectStructure()

    expect(user).toBeDefined()
    expect(project).toBeDefined()
    expect(milestone).toBeDefined()
    expect(task).toBeDefined()

    expect(project.ownerId).toBe(user.id)
    expect(task.projectId).toBe(project.id)
  })
})

// ============================================
// Prisma Mock 工厂
// ============================================

describe('Prisma Mock 工厂', () => {
  it('应该创建完整的 Mock 对象', () => {
    const mockPrisma = createPrismaMock()

    expect(mockPrisma.user).toBeDefined()
    expect(mockPrisma.user.findUnique).toBeDefined()
    expect(mockPrisma.user.create).toBeDefined()
    expect(mockPrisma.project).toBeDefined()
    expect(mockPrisma.task).toBeDefined()
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
// Request Mock 工具
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
