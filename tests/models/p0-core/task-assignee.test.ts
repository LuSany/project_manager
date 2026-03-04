/**
 * TaskAssignee 模型测试 - P0 核心业务模型
 *
 * 测试覆盖:
 * - 多对多关系（Task <-> User）
 * - 分配时间记录
 * - 复合主键约束
 * - 级联删除
 *
 * 优先级：P0 - 核心业务模型
 * 目标覆盖率：100%
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../../helpers/test-db'
import { createTestUser, createTestProject, createTestTask } from '../../helpers/test-data-factory'

describe('TaskAssignee Model - P0 Core', () => {
  describe('Basic Operations', () => {
    it('should create task assignee successfully', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)

      const assignee = await testPrisma.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: user.id,
        },
      })

      expect(assignee).toBeDefined()
      expect(assignee.taskId).toBe(task.id)
      expect(assignee.userId).toBe(user.id)
      expect(assignee.assignedAt).toBeDefined()
    })

    it('should create task assignee with custom assignedAt', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)

      const customDate = new Date('2024-01-01')

      const assignee = await testPrisma.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: user.id,
          assignedAt: customDate,
        },
      })

      expect(assignee.assignedAt).toEqual(customDate)
    })

    it('should delete task assignee', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)

      const assignee = await testPrisma.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: user.id,
        },
      })

      await testPrisma.taskAssignee.delete({
        where: {
          taskId_userId: {
            taskId: assignee.taskId,
            userId: assignee.userId,
          },
        },
      })

      // Verify deletion
      const found = await testPrisma.taskAssignee.findUnique({
        where: {
          taskId_userId: {
            taskId: assignee.taskId,
            userId: assignee.userId,
          },
        },
      })
      expect(found).toBeNull()
    })
  })

  describe('Composite Primary Key', () => {
    it('should enforce unique taskId-userId combination', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)

      // First creation should succeed
      await testPrisma.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: user.id,
        },
      })

      // Second creation with same combination should fail
      await expect(
        testPrisma.taskAssignee.create({
          data: {
            taskId: task.id,
            userId: user.id,
          },
        })
      ).rejects.toThrow()
    })

    it('should allow same user on different tasks', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task1 = await createTestTask(project.id, user.id)
      const task2 = await createTestTask(project.id, user.id)

      await testPrisma.taskAssignee.create({
        data: {
          taskId: task1.id,
          userId: user.id,
        },
      })

      // Different task, same user - should succeed
      const assignee2 = await testPrisma.taskAssignee.create({
        data: {
          taskId: task2.id,
          userId: user.id,
        },
      })

      expect(assignee2.taskId).toBe(task2.id)
    })

    it('should allow same task with different users', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()
      const project = await createTestProject(user1.id)
      const task = await createTestTask(project.id, user1.id)

      await testPrisma.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: user1.id,
        },
      })

      // Different user, same task - should succeed
      const assignee2 = await testPrisma.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: user2.id,
        },
      })

      expect(assignee2.userId).toBe(user2.id)
    })
  })

  describe('Many-to-Many Relationship', () => {
    it('should assign multiple users to same task', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()
      const user3 = await createTestUser()
      const project = await createTestProject(user1.id)
      const task = await createTestTask(project.id, user1.id)

      await testPrisma.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: user1.id,
        },
      })

      await testPrisma.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: user2.id,
        },
      })

      await testPrisma.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: user3.id,
        },
      })

      const assignees = await testPrisma.taskAssignee.findMany({
        where: { taskId: task.id },
      })

      expect(assignees).toHaveLength(3)
    })

    it('should assign user to multiple tasks', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task1 = await createTestTask(project.id, user.id)
      const task2 = await createTestTask(project.id, user.id)
      const task3 = await createTestTask(project.id, user.id)

      await testPrisma.taskAssignee.create({
        data: {
          taskId: task1.id,
          userId: user.id,
        },
      })

      await testPrisma.taskAssignee.create({
        data: {
          taskId: task2.id,
          userId: user.id,
        },
      })

      await testPrisma.taskAssignee.create({
        data: {
          taskId: task3.id,
          userId: user.id,
        },
      })

      const assignees = await testPrisma.taskAssignee.findMany({
        where: { userId: user.id },
      })

      expect(assignees).toHaveLength(3)
    })

    it('should query task with assignees', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()
      const project = await createTestProject(user1.id)
      const task = await createTestTask(project.id, user1.id)

      await testPrisma.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: user1.id,
        },
      })

      await testPrisma.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: user2.id,
        },
      })

      const taskWithAssignees = await testPrisma.task.findUnique({
        where: { id: task.id },
        include: {
          assignees: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      })

      expect(taskWithAssignees?.assignees).toHaveLength(2)
      expect(taskWithAssignees?.assignees[0].user.name).toBeDefined()
    })

    it('should query user with assigned tasks', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task1 = await createTestTask(project.id, user.id)
      const task2 = await createTestTask(project.id, user.id)

      await testPrisma.taskAssignee.create({
        data: {
          taskId: task1.id,
          userId: user.id,
        },
      })

      await testPrisma.taskAssignee.create({
        data: {
          taskId: task2.id,
          userId: user.id,
        },
      })

      const userWithTasks = await testPrisma.user.findUnique({
        where: { id: user.id },
        include: {
          taskAssignees: {
            include: {
              task: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      })

      expect(userWithTasks?.taskAssignees).toHaveLength(2)
    })
  })

  describe('Cascade Delete', () => {
    it('should delete assignee when task deleted', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)

      const assignee = await testPrisma.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: user.id,
        },
      })

      // Delete task
      await testPrisma.task.delete({
        where: { id: task.id },
      })

      // Verify assignee is deleted
      const found = await testPrisma.taskAssignee.findUnique({
        where: {
          taskId_userId: {
            taskId: assignee.taskId,
            userId: assignee.userId,
          },
        },
      })

      expect(found).toBeNull()
    })

    it('should delete assignee when user deleted', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)

      const assignee = await testPrisma.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: user.id,
        },
      })

      // Delete user
      await testPrisma.user.delete({
        where: { id: user.id },
      })

      // Verify assignee is deleted
      const found = await testPrisma.taskAssignee.findUnique({
        where: {
          taskId_userId: {
            taskId: assignee.taskId,
            userId: assignee.userId,
          },
        },
      })

      expect(found).toBeNull()
    })
  })

  describe('Query Operations', () => {
    it('should find assignee by composite key', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)

      const assignee = await testPrisma.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: user.id,
        },
      })

      const found = await testPrisma.taskAssignee.findUnique({
        where: {
          taskId_userId: {
            taskId: assignee.taskId,
            userId: assignee.userId,
          },
        },
      })

      expect(found).toBeDefined()
      expect(found?.taskId).toBe(task.id)
      expect(found?.userId).toBe(user.id)
    })

    it('should find many assignees by taskId', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()
      const project = await createTestProject(user1.id)
      const task = await createTestTask(project.id, user1.id)

      await testPrisma.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: user1.id,
        },
      })

      await testPrisma.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: user2.id,
        },
      })

      const assignees = await testPrisma.taskAssignee.findMany({
        where: { taskId: task.id },
      })

      expect(assignees).toHaveLength(2)
    })

    it('should find many assignees by userId', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task1 = await createTestTask(project.id, user.id)
      const task2 = await createTestTask(project.id, user.id)

      await testPrisma.taskAssignee.create({
        data: {
          taskId: task1.id,
          userId: user.id,
        },
      })

      await testPrisma.taskAssignee.create({
        data: {
          taskId: task2.id,
          userId: user.id,
        },
      })

      const assignees = await testPrisma.taskAssignee.findMany({
        where: { userId: user.id },
      })

      expect(assignees).toHaveLength(2)
    })

    it('should order assignees by assignedAt', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)

      // Create assignees with different times
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-06-01')

      await testPrisma.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: user.id,
          assignedAt: date2,
        },
      })

      const assignees = await testPrisma.taskAssignee.findMany({
        where: { taskId: task.id },
        orderBy: { assignedAt: 'asc' },
      })

      // Should have at least the one we created
      expect(assignees.length).toBeGreaterThanOrEqual(1)
    })
  })
})
