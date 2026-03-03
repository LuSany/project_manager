/**
 * 审计日志集成测试
 *
 * 测试覆盖：
 * - 审计日志查询
 * - 审计动作记录
 * - 日志过滤
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestDatabase, testPrisma } from '../helpers/test-db'
import { createTestUser, createTestProject } from '../helpers/test-data-factory'

// ============================================
// 测试套件
// ============================================

describe('审计日志集成测试', () => {
  setupTestDatabase()

  let testUser: { id: string }
  let testProject: { id: string }

  beforeEach(async () => {
    testUser = await createTestUser()
    testProject = await createTestProject(testUser.id)
  })

  // ============================================
  // 审计日志 CRUD 测试
  // ============================================

  describe('审计日志管理', () => {
    it('应该能创建审计日志', async () => {
      const log = await testPrisma.auditLog.create({
        data: {
          userId: testUser.id,
          action: 'CREATE',
          entityType: 'Task',
          entityId: 'task-123',
          description: '创建任务',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
        },
      })

      expect(log).toBeDefined()
      expect(log.action).toBe('CREATE')
      expect(log.entityType).toBe('Task')
    })

    it('应该能获取所有审计日志', async () => {
      await testPrisma.auditLog.create({
        data: {
          userId: testUser.id,
          action: 'CREATE',
          entityType: 'Project',
          description: '创建项目',
        },
      })
      await testPrisma.auditLog.create({
        data: {
          userId: testUser.id,
          action: 'UPDATE',
          entityType: 'Task',
          description: '更新任务',
        },
      })

      const logs = await testPrisma.auditLog.findMany()
      expect(logs.length).toBe(2)
    })

    it('应该能按动作类型筛选日志', async () => {
      await testPrisma.auditLog.create({
        data: { userId: testUser.id, action: 'CREATE', entityType: 'Task', description: '创建' },
      })
      await testPrisma.auditLog.create({
        data: { userId: testUser.id, action: 'DELETE', entityType: 'Task', description: '删除' },
      })

      const createLogs = await testPrisma.auditLog.findMany({
        where: { action: 'CREATE' },
      })

      expect(createLogs.length).toBe(1)
    })

    it('应该能按实体类型筛选日志', async () => {
      await testPrisma.auditLog.create({
        data: {
          userId: testUser.id,
          action: 'CREATE',
          entityType: 'Task',
          description: '创建任务',
        },
      })
      await testPrisma.auditLog.create({
        data: {
          userId: testUser.id,
          action: 'CREATE',
          entityType: 'Project',
          description: '创建项目',
        },
      })

      const taskLogs = await testPrisma.auditLog.findMany({
        where: { entityType: 'Task' },
      })

      expect(taskLogs.length).toBe(1)
    })

    it('应该能按用户筛选日志', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' })

      await testPrisma.auditLog.create({
        data: {
          userId: testUser.id,
          action: 'CREATE',
          entityType: 'Task',
          description: '用户1操作',
        },
      })
      await testPrisma.auditLog.create({
        data: {
          userId: otherUser.id,
          action: 'CREATE',
          entityType: 'Task',
          description: '用户2操作',
        },
      })

      const userLogs = await testPrisma.auditLog.findMany({
        where: { userId: testUser.id },
      })

      expect(userLogs.length).toBe(1)
    })
  })

  // ============================================
  // 审计动作类型测试
  // ============================================

  describe('审计动作类型', () => {
    it('应该支持 CREATE 动作', async () => {
      const log = await testPrisma.auditLog.create({
        data: { userId: testUser.id, action: 'CREATE', entityType: 'Task', description: '创建' },
      })
      expect(log.action).toBe('CREATE')
    })

    it('应该支持 UPDATE 动作', async () => {
      const log = await testPrisma.auditLog.create({
        data: { userId: testUser.id, action: 'UPDATE', entityType: 'Task', description: '更新' },
      })
      expect(log.action).toBe('UPDATE')
    })

    it('应该支持 DELETE 动作', async () => {
      const log = await testPrisma.auditLog.create({
        data: { userId: testUser.id, action: 'DELETE', entityType: 'Task', description: '删除' },
      })
      expect(log.action).toBe('DELETE')
    })

    it('应该支持 LOGIN 动作', async () => {
      const log = await testPrisma.auditLog.create({
        data: { userId: testUser.id, action: 'LOGIN', entityType: 'User', description: '登录' },
      })
      expect(log.action).toBe('LOGIN')
    })
  })

  // ============================================
  // 审计日志详情测试
  // ============================================

  describe('审计日志详情', () => {
    it('应该能记录 IP 地址', async () => {
      const log = await testPrisma.auditLog.create({
        data: {
          userId: testUser.id,
          action: 'CREATE',
          entityType: 'Task',
          description: '测试',
          ipAddress: '192.168.1.1',
        },
      })

      expect(log.ipAddress).toBe('192.168.1.1')
    })

    it('应该能记录 User Agent', async () => {
      const log = await testPrisma.auditLog.create({
        data: {
          userId: testUser.id,
          action: 'CREATE',
          entityType: 'Task',
          description: '测试',
          userAgent: 'Chrome/120.0',
        },
      })

      expect(log.userAgent).toBe('Chrome/120.0')
    })

    it('应该能记录变更详情', async () => {
      const log = await testPrisma.auditLog.create({
        data: {
          userId: testUser.id,
          action: 'UPDATE',
          entityType: 'Task',
          entityId: 'task-1',
          description: '更新状态',
          oldValue: 'TODO',
          newValue: 'DONE',
        },
      })

      expect(log.oldValue).toBe('TODO')
      expect(log.newValue).toBe('DONE')
    })
  })
})
