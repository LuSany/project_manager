/**
 * User 模型测试 - P0 核心业务模型
 *
 * 测试覆盖:
 * - CRUD 操作完整性
 * - 唯一性约束（email）
 * - 角色和状态验证
 * - 关联关系（Project, Task, Notification 等）
 *
 * 优先级：P0 - 核心业务模型
 * 目标覆盖率：100%
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { testPrisma } from '../helpers/test-db'
import {
  createTestUser,
  createTestAdminUser,
  createTestPendingUser,
  createTestProject,
  createTestTask,
  createTestNotification,
} from '../helpers/test-data-factory'
import { Prisma } from '@prisma/client'

describe('User Model - P0 Core', () => {
  describe('CRUD Operations', () => {
    it('should create user successfully', async () => {
      const user = await createTestUser({
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
      })

      expect(user).toBeDefined()
      expect(user.id).toBeDefined()
      expect(user.email).toMatch(/test-.*@example\.com/)
      expect(user.name).toBe('Test User')
      expect(user.status).toBe('ACTIVE')
      expect(user.role).toBe('EMPLOYEE')
    })

    it('should create user with all optional fields', async () => {
      const user = await createTestUser({
        email: `complete-${Date.now()}@example.com`,
        name: 'Complete User',
        avatar: 'https://example.com/avatar.jpg',
        phone: '+86-138-0000-0000',
        department: '研发部',
        position: '高级工程师',
        status: 'ACTIVE',
        role: 'PROJECT_OWNER',
      })

      expect(user.avatar).toBe('https://example.com/avatar.jpg')
      expect(user.phone).toBe('+86-138-0000-0000')
      expect(user.department).toBe('研发部')
      expect(user.position).toBe('高级工程师')
      expect(user.role).toBe('PROJECT_OWNER')
    })

    it('should fail to create duplicate email', async () => {
      const duplicateEmail = `duplicate-${Date.now()}@example.com`

      await createTestUser({ email: duplicateEmail })

      await expect(createTestUser({ email: duplicateEmail })).rejects.toThrow()
    })

    it('should update user successfully', async () => {
      const user = await createTestUser()

      const updated = await testPrisma.user.update({
        where: { id: user.id },
        data: {
          name: 'Updated Name',
          department: '新部门',
          position: '新职位',
        },
      })

      expect(updated.name).toBe('Updated Name')
      expect(updated.department).toBe('新部门')
      expect(updated.position).toBe('新职位')
    })

    it('should delete user successfully', async () => {
      const user = await createTestUser()

      const deleted = await testPrisma.user.delete({
        where: { id: user.id },
      })

      expect(deleted.id).toBe(user.id)

      // Verify deletion
      const found = await testPrisma.user.findUnique({
        where: { id: user.id },
      })
      expect(found).toBeNull()
    })
  })

  describe('Email Uniqueness Constraint', () => {
    it('should enforce email uniqueness', async () => {
      const email = `unique-${Date.now()}@example.com`

      const user1 = await createTestUser({ email })
      expect(user1.email).toBe(email)

      // Try to create another user with same email (should fail)
      await expect(
        testPrisma.user.create({
          data: {
            email,
            passwordHash: 'hash2',
            name: 'User 2',
          },
        })
      ).rejects.toThrow()
    })

    it('should allow case-sensitive email (depending on DB collation)', async () => {
      // Note: PostgreSQL is case-sensitive by default
      const email1 = `casesensitive-${Date.now()}@example.com`
      const email2 = email1.toUpperCase()

      const user1 = await createTestUser({ email: email1 })
      const user2 = await createTestUser({ email: email2 })

      expect(user1.email).toBe(email1)
      expect(user2.email).toBe(email2)
      expect(user1.email).not.toBe(user2.email)
    })
  })

  describe('User Roles', () => {
    it('should create user with ADMIN role', async () => {
      const admin = await createTestAdminUser()
      expect(admin.role).toBe('ADMIN')
    })

    it('should create user with PROJECT_OWNER role', async () => {
      const owner = await createTestUser({ role: 'PROJECT_OWNER' })
      expect(owner.role).toBe('PROJECT_OWNER')
    })

    it('should create user with PROJECT_ADMIN role', async () => {
      const admin = await createTestUser({ role: 'PROJECT_ADMIN' })
      expect(admin.role).toBe('PROJECT_ADMIN')
    })

    it('should create user with PROJECT_MEMBER role', async () => {
      const member = await createTestUser({ role: 'PROJECT_MEMBER' })
      expect(member.role).toBe('PROJECT_MEMBER')
    })

    it('should create user with EMPLOYEE role (default)', async () => {
      const employee = await createTestUser()
      expect(employee.role).toBe('EMPLOYEE')
    })
  })

  describe('User Status', () => {
    it('should create user with ACTIVE status (default)', async () => {
      const user = await createTestUser()
      expect(user.status).toBe('ACTIVE')
    })

    it('should create user with PENDING status', async () => {
      const pending = await createTestPendingUser()
      expect(pending.status).toBe('PENDING')
    })

    it('should create user with DISABLED status', async () => {
      const disabled = await createTestUser({ status: 'DISABLED' })
      expect(disabled.status).toBe('DISABLED')
    })

    it('should update user status from PENDING to ACTIVE', async () => {
      const pending = await createTestPendingUser()

      const activated = await testPrisma.user.update({
        where: { id: pending.id },
        data: { status: 'ACTIVE' },
      })

      expect(activated.status).toBe('ACTIVE')
    })
  })

  describe('User Relationships', () => {
    it('should create user with owned projects', async () => {
      const user = await createTestUser()

      const project = await createTestProject(user.id)

      expect(project.ownerId).toBe(user.id)

      // Verify relationship from user side
      const userWithProjects = await testPrisma.user.findUnique({
        where: { id: user.id },
        include: { ownedProjects: true },
      })

      expect(userWithProjects?.ownedProjects).toHaveLength(1)
      expect(userWithProjects?.ownedProjects[0].id).toBe(project.id)
    })

    it('should create user with tasks', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      const task = await createTestTask(project.id, user.id)

      expect(task).toBeDefined()

      // Verify task assignee relationship
      const taskWithAssignees = await testPrisma.task.findUnique({
        where: { id: task.id },
        include: { assignees: true },
      })

      expect(taskWithAssignees?.assignees).toHaveLength(1)
    })

    it('should create user with notifications', async () => {
      const user = await createTestUser()

      const notification = await createTestNotification(user.id)

      expect(notification.userId).toBe(user.id)

      // Verify relationship
      const userWithNotifications = await testPrisma.user.findUnique({
        where: { id: user.id },
        include: { notifications: { take: 1 } },
      })

      expect(userWithNotifications?.notifications).toHaveLength(1)
    })

    it('should cascade delete user dependencies', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      // Delete user
      await testPrisma.user.delete({
        where: { id: user.id },
      })

      // Verify project is also deleted (CASCADE)
      const deletedProject = await testPrisma.project.findUnique({
        where: { id: project.id },
      })
      expect(deletedProject).toBeNull()
    })
  })

  describe('User Queries', () => {
    beforeEach(async () => {
      // Create test data
      await createTestUser({ email: 'query-test-1@example.com', department: '研发部' })
      await createTestUser({ email: 'query-test-2@example.com', department: '研发部' })
      await createTestUser({ email: 'query-test-3@example.com', department: '测试部' })
    })

    it('should find user by email', async () => {
      const email = `find-by-email-${Date.now()}@example.com`
      await createTestUser({ email })

      const found = await testPrisma.user.findUnique({
        where: { email },
      })

      expect(found).toBeDefined()
      expect(found?.email).toBe(email)
    })

    it('should find users by department', async () => {
      const users = await testPrisma.user.findMany({
        where: { department: '研发部' },
      })

      expect(users.length).toBeGreaterThanOrEqual(2)
    })

    it('should find users by role', async () => {
      const admins = await testPrisma.user.findMany({
        where: { role: 'ADMIN' },
      })

      // At least the one we created
      expect(admins.length).toBeGreaterThanOrEqual(1)
    })

    it('should paginate users', async () => {
      const page1 = await testPrisma.user.findMany({
        take: 2,
        skip: 0,
      })

      const page2 = await testPrisma.user.findMany({
        take: 2,
        skip: 2,
      })

      expect(page1.length).toBeLessThanOrEqual(2)
      expect(page2.length).toBeLessThanOrEqual(2)
      expect(page1[0].id).not.toBe(page2[0].id)
    })
  })
})
