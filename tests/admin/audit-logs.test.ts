/**
 * Audit Logs 管理员测试 - 管理员后台专项测试
 *
 * 测试覆盖:
 * - 审计日志记录（CREATE/UPDATE/DELETE）
 * - 用户操作追踪
 * - 权限变更审计
 * - 日志查询与过滤
 * - 敏感操作审计
 *
 * 管理员后台专项 - Phase 2
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../helpers/test-db'
import { createTestUser } from '../helpers/test-data-factory'

describe('Admin - Audit Logs', () => {
  describe('Audit Log Creation', () => {
    it('should create audit log for user action', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const log = await testPrisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'CREATE',
          entityType: 'PROJECT',
          entityId: 'test-project-id',
          description: 'Created new project',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      })

      expect(log).toBeDefined()
      expect(log.action).toBe('CREATE')
      expect(log.entityType).toBe('PROJECT')
    })

    it('should create audit log for update action', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const log = await testPrisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'UPDATE',
          entityType: 'TASK',
          entityId: 'test-task-id',
          description: 'Updated task status',
          changes: JSON.stringify({
            status: { from: 'TODO', to: 'IN_PROGRESS' },
          }),
        },
      })

      expect(log.action).toBe('UPDATE')
      expect(log.changes).toContain('from')
    })

    it('should create audit log for delete action', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const log = await testPrisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'DELETE',
          entityType: 'REQUIREMENT',
          entityId: 'deleted-req-id',
          description: 'Deleted requirement',
          oldValues: JSON.stringify({
            title: 'Old Requirement',
            status: 'PENDING',
          }),
        },
      })

      expect(log.action).toBe('DELETE')
      expect(log.oldValues).toContain('title')
    })

    it('should create audit log with metadata', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const log = await testPrisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'CREATE',
          entityType: 'USER',
          entityId: 'new-user-id',
          description: 'Created new user account',
          ipAddress: '10.0.0.1',
          userAgent: 'Chrome/120.0',
          metadata: JSON.stringify({
            department: 'Engineering',
            role: 'DEVELOPER',
            source: 'ADMIN_PANEL',
          }),
        },
      })

      expect(log.metadata).toContain('Engineering')
    })
  })

  describe('Permission Change Auditing', () => {
    it('should audit role change', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const log = await testPrisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'PERMISSION_CHANGE',
          entityType: 'USER',
          entityId: 'target-user-id',
          description: 'Changed user role from EMPLOYEE to PROJECT_MANAGER',
          changes: JSON.stringify({
            role: { from: 'EMPLOYEE', to: 'PROJECT_MANAGER' },
          }),
        },
      })

      expect(log.action).toBe('PERMISSION_CHANGE')
      expect(log.changes).toContain('role')
    })

    it('should audit project access grant', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const log = await testPrisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'PERMISSION_CHANGE',
          entityType: 'PROJECT_MEMBER',
          entityId: 'membership-id',
          description: 'Granted project access to user',
          metadata: JSON.stringify({
            projectId: 'project-123',
            userId: 'user-456',
            accessLevel: 'ADMIN',
          }),
        },
      })

      expect(log.entityType).toBe('PROJECT_MEMBER')
      expect(log.metadata).toContain('project-123')
    })

    it('should audit permission revocation', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const log = await testPrisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'PERMISSION_CHANGE',
          entityType: 'PROJECT_MEMBER',
          entityId: 'membership-id',
          description: 'Revoked project access from user',
          changes: JSON.stringify({
            accessLevel: { from: 'ADMIN', to: 'NONE' },
          }),
        },
      })

      expect(log.action).toBe('PERMISSION_CHANGE')
    })
  })

  describe('Sensitive Operation Auditing', () => {
    it('should audit password change', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const log = await testPrisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'SENSITIVE_OPERATION',
          entityType: 'USER',
          entityId: 'user-password-change',
          description: 'Password reset initiated',
          metadata: JSON.stringify({
            operation: 'PASSWORD_RESET',
            method: 'ADMIN_INITIATED',
          }),
        },
      })

      expect(log.action).toBe('SENSITIVE_OPERATION')
      expect(log.metadata).toContain('PASSWORD_RESET')
    })

    it('should audit bulk data export', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const log = await testPrisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'SENSITIVE_OPERATION',
          entityType: 'DATA_EXPORT',
          entityId: 'export-123',
          description: 'Exported project data to CSV',
          metadata: JSON.stringify({
            exportType: 'CSV',
            recordCount: 5000,
            fileSize: '2.5MB',
          }),
        },
      })

      expect(log.entityType).toBe('DATA_EXPORT')
      expect(log.metadata).toContain('CSV')
    })

    it('should audit system configuration change', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const log = await testPrisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'SENSITIVE_OPERATION',
          entityType: 'SYSTEM_CONFIG',
          entityId: 'config-change-123',
          description: 'Updated email server configuration',
          changes: JSON.stringify({
            smtpHost: { from: 'old.smtp.com', to: 'new.smtp.com' },
          }),
        },
      })

      expect(log.entityType).toBe('SYSTEM_CONFIG')
    })
  })

  describe('Audit Log Queries', () => {
    it('should find logs by user', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()

      await testPrisma.auditLog.create({
        data: {
          userId: user1.id,
          action: 'CREATE',
          entityType: 'PROJECT',
          description: 'User 1 action',
        },
      })

      await testPrisma.auditLog.create({
        data: {
          userId: user2.id,
          action: 'UPDATE',
          entityType: 'TASK',
          description: 'User 2 action',
        },
      })

      const user1Logs = await testPrisma.auditLog.findMany({
        where: { userId: user1.id },
      })

      expect(user1Logs).toHaveLength(1)
      expect(user1Logs[0].userId).toBe(user1.id)
    })

    it('should find logs by action type', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      await testPrisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'CREATE',
          entityType: 'PROJECT',
          description: 'Create action',
        },
      })

      await testPrisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'DELETE',
          entityType: 'TASK',
          description: 'Delete action',
        },
      })

      const createLogs = await testPrisma.auditLog.findMany({
        where: { action: 'CREATE' },
      })

      expect(createLogs).toHaveLength(1)
      expect(createLogs[0].action).toBe('CREATE')
    })

    it('should find logs by entity type', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      await testPrisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'CREATE',
          entityType: 'PROJECT',
          description: 'Project action',
        },
      })

      await testPrisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'UPDATE',
          entityType: 'TASK',
          description: 'Task action',
        },
      })

      const projectLogs = await testPrisma.auditLog.findMany({
        where: { entityType: 'PROJECT' },
      })

      expect(projectLogs).toHaveLength(1)
    })

    it('should filter logs by date range', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const oldDate = new Date('2024-01-01')
      const newDate = new Date()

      await testPrisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'CREATE',
          entityType: 'PROJECT',
          description: 'Old log',
          createdAt: oldDate,
        },
      })

      await testPrisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'CREATE',
          entityType: 'PROJECT',
          description: 'Recent log',
        },
      })

      const recentLogs = await testPrisma.auditLog.findMany({
        where: {
          createdAt: {
            gte: new Date(newDate.getTime() - 86400000), // Last 24 hours
          },
        },
      })

      expect(recentLogs.length).toBeGreaterThanOrEqual(1)
    })

    it('should order logs by timestamp', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const log1 = await testPrisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'CREATE',
          entityType: 'PROJECT',
          description: 'First log',
        },
      })

      await new Promise((resolve) => setTimeout(resolve, 10))

      const log2 = await testPrisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'UPDATE',
          entityType: 'TASK',
          description: 'Second log',
        },
      })

      const logs = await testPrisma.auditLog.findMany({
        where: { userId: admin.id },
        orderBy: { createdAt: 'asc' },
      })

      expect(logs[0].id).toBe(log1.id)
      expect(logs[1].id).toBe(log2.id)
    })
  })

  describe('Audit Log Retention', () => {
    it('should store audit log with IP address', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const log = await testPrisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'CREATE',
          entityType: 'PROJECT',
          ipAddress: '192.168.1.100',
          description: 'Action from specific IP',
        },
      })

      expect(log.ipAddress).toBe('192.168.1.100')
    })

    it('should store audit log with user agent', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const log = await testPrisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'DELETE',
          entityType: 'REQUIREMENT',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          description: 'Deleted from browser',
        },
      })

      expect(log.userAgent).toContain('Mozilla')
    })
  })

  describe('Audit Statistics', () => {
    it('should calculate action statistics', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      // Create 5 CREATE, 3 UPDATE, 2 DELETE
      for (let i = 0; i < 5; i++) {
        await testPrisma.auditLog.create({
          data: {
            userId: admin.id,
            action: 'CREATE',
            entityType: 'PROJECT',
            description: `Create ${i}`,
          },
        })
      }

      for (let i = 0; i < 3; i++) {
        await testPrisma.auditLog.create({
          data: {
            userId: admin.id,
            action: 'UPDATE',
            entityType: 'TASK',
            description: `Update ${i}`,
          },
        })
      }

      for (let i = 0; i < 2; i++) {
        await testPrisma.auditLog.create({
          data: {
            userId: admin.id,
            action: 'DELETE',
            entityType: 'REQUIREMENT',
            description: `Delete ${i}`,
          },
        })
      }

      const logs = await testPrisma.auditLog.findMany({
        where: { userId: admin.id },
      })

      const creates = logs.filter((l) => l.action === 'CREATE').length
      const updates = logs.filter((l) => l.action === 'UPDATE').length
      const deletes = logs.filter((l) => l.action === 'DELETE').length

      expect(logs.length).toBe(10)
      expect(creates).toBe(5)
      expect(updates).toBe(3)
      expect(deletes).toBe(2)
    })
  })
})
