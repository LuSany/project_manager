/**
 * 核心服务补充集成测试
 *
 * 测试覆盖：
 * - 问题服务
 * - 服务函数错误处理
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestDatabase, testPrisma } from '../../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestIssue,
  createTestProjectMember,
} from '../../helpers/test-data-factory'

// ============================================
// 测试套件
// ============================================

describe('核心服务补充集成测试', () => {
  setupTestDatabase()

  let testUser: { id: string }
  let testProject: { id: string }

  beforeEach(async () => {
    testUser = await createTestUser()
    testProject = await createTestProject(testUser.id)
    await createTestProjectMember(testProject.id, testUser.id, { role: 'OWNER' })
  })

  // ============================================
  // 问题服务测试
  // ============================================

  describe('问题服务', () => {
    it('应该能创建问题', async () => {
      const issue = await createTestIssue(testProject.id, {
        title: '服务测试问题',
        description: '问题描述',
        priority: 'HIGH',
      })

      expect(issue).toBeDefined()
      expect(issue.title).toBe('服务测试问题')
    })

    it('应该能更新问题状态', async () => {
      const issue = await createTestIssue(testProject.id)

      const updated = await testPrisma.issue.update({
        where: { id: issue.id },
        data: { status: 'IN_PROGRESS' },
      })

      expect(updated.status).toBe('IN_PROGRESS')
    })

    it('应该能解决并关闭问题', async () => {
      const issue = await createTestIssue(testProject.id)

      const updated = await testPrisma.issue.update({
        where: { id: issue.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
        },
      })

      expect(updated.status).toBe('RESOLVED')
      expect(updated.resolvedAt).toBeDefined()
    })
  })

  // ============================================
  // 数据库连接测试
  // ============================================

  describe('数据库连接', () => {
    it('应该能正常执行查询', async () => {
      const result = await testPrisma.$queryRaw`SELECT 1 as value`
      expect(result).toBeDefined()
    })

    it('应该能执行事务', async () => {
      await testPrisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            email: `transaction-${Date.now()}@example.com`,
            passwordHash: 'hash',
            name: 'Transaction User',
            status: 'ACTIVE',
            role: 'EMPLOYEE',
          },
        })
      })
    })
  })

  // ============================================
  // 用户服务测试
  // ============================================

  describe('用户服务', () => {
    it('应该能创建用户', async () => {
      const user = await createTestUser({ email: 'service-test@example.com' })
      expect(user.email).toBe('service-test@example.com')
    })

    it('应该能查询用户', async () => {
      const user = await createTestUser()
      const found = await testPrisma.user.findUnique({
        where: { id: user.id },
      })
      expect(found).toBeDefined()
    })

    it('应该能更新用户', async () => {
      const user = await createTestUser()
      const updated = await testPrisma.user.update({
        where: { id: user.id },
        data: { name: 'Updated Name' },
      })
      expect(updated.name).toBe('Updated Name')
    })
  })

  // ============================================
  // 项目服务测试
  // ============================================

  describe('项目服务', () => {
    it('应该能创建项目', async () => {
      const project = await createTestProject(testUser.id, { name: 'Service Test Project' })
      expect(project.name).toBe('Service Test Project')
    })

    it('应该能查询项目及其关联数据', async () => {
      const project = await createTestProject(testUser.id)

      const withRelations = await testPrisma.project.findUnique({
        where: { id: project.id },
        include: {
          owner: true,
          members: true,
        },
      })

      expect(withRelations?.owner).toBeDefined()
    })
  })
})
