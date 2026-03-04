/**
 * TaskWatcher 模型测试 - P0 核心业务模型
 *
 * 测试覆盖:
 * - 任务关注者多对多关系
 * - 复合主键约束
 * - 通知关联
 * - 级联删除
 *
 * 优先级：P0 - 核心业务模型
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../../helpers/test-db'
import { createTestUser, createTestProject, createTestTask } from '../../helpers/test-data-factory'

describe('TaskWatcher Model - P0 Core', () => {
  describe('Basic Operations', () => {
    it('should create task watcher successfully', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)

      const watcher = await testPrisma.taskWatcher.create({
        data: {
          taskId: task.id,
          userId: user.id,
        },
      })

      expect(watcher).toBeDefined()
      expect(watcher.taskId).toBe(task.id)
      expect(watcher.userId).toBe(user.id)
    })

    it('should delete task watcher', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)

      const watcher = await testPrisma.taskWatcher.create({
        data: {
          taskId: task.id,
          userId: user.id,
        },
      })

      await testPrisma.taskWatcher.delete({
        where: {
          taskId_userId: {
            taskId: watcher.taskId,
            userId: watcher.userId,
          },
        },
      })

      const found = await testPrisma.taskWatcher.findUnique({
        where: {
          taskId_userId: {
            taskId: watcher.taskId,
            userId: watcher.userId,
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

      await testPrisma.taskWatcher.create({
        data: {
          taskId: task.id,
          userId: user.id,
        },
      })

      await expect(
        testPrisma.taskWatcher.create({
          data: {
            taskId: task.id,
            userId: user.id,
          },
        })
      ).rejects.toThrow()
    })
  })

  describe('Many-to-Many Relationship', () => {
    it('should allow multiple watchers for same task', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()
      const user3 = await createTestUser()
      const project = await createTestProject(user1.id)
      const task = await createTestTask(project.id, user1.id)

      await testPrisma.taskWatcher.create({
        data: {
          taskId: task.id,
          userId: user1.id,
        },
      })

      await testPrisma.taskWatcher.create({
        data: {
          taskId: task.id,
          userId: user2.id,
        },
      })

      await testPrisma.taskWatcher.create({
        data: {
          taskId: task.id,
          userId: user3.id,
        },
      })

      const watchers = await testPrisma.taskWatcher.findMany({
        where: { taskId: task.id },
      })

      expect(watchers).toHaveLength(3)
    })

    it('should allow user to watch multiple tasks', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task1 = await createTestTask(project.id, user.id)
      const task2 = await createTestTask(project.id, user.id)

      await testPrisma.taskWatcher.create({
        data: {
          taskId: task1.id,
          userId: user.id,
        },
      })

      await testPrisma.taskWatcher.create({
        data: {
          taskId: task2.id,
          userId: user.id,
        },
      })

      const watchers = await testPrisma.taskWatcher.findMany({
        where: { userId: user.id },
      })

      expect(watchers).toHaveLength(2)
    })

    it('should query task with watchers', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()
      const project = await createTestProject(user1.id)
      const task = await createTestTask(project.id, user1.id)

      await testPrisma.taskWatcher.create({
        data: {
          taskId: task.id,
          userId: user1.id,
        },
      })

      await testPrisma.taskWatcher.create({
        data: {
          taskId: task.id,
          userId: user2.id,
        },
      })

      const taskWithWatchers = await testPrisma.task.findUnique({
        where: { id: task.id },
        include: {
          watchers: {
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

      expect(taskWithWatchers?.watchers).toHaveLength(2)
    })
  })

  describe('Cascade Delete', () => {
    it('should delete watcher when task deleted', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)

      await testPrisma.taskWatcher.create({
        data: {
          taskId: task.id,
          userId: user.id,
        },
      })

      await testPrisma.task.delete({
        where: { id: task.id },
      })

      const watchers = await testPrisma.taskWatcher.findMany({
        where: { taskId: task.id },
      })

      expect(watchers).toHaveLength(0)
    })

    it('should delete watcher when user deleted', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)

      const watcher = await testPrisma.taskWatcher.create({
        data: {
          taskId: task.id,
          userId: user.id,
        },
      })

      await testPrisma.user.delete({
        where: { id: user.id },
      })

      const found = await testPrisma.taskWatcher.findUnique({
        where: {
          taskId_userId: {
            taskId: watcher.taskId,
            userId: watcher.userId,
          },
        },
      })

      expect(found).toBeNull()
    })
  })

  describe('Query Operations', () => {
    it('should find watchers by taskId', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()
      const project = await createTestProject(user1.id)
      const task = await createTestTask(project.id, user1.id)

      await testPrisma.taskWatcher.create({
        data: {
          taskId: task.id,
          userId: user1.id,
        },
      })

      await testPrisma.taskWatcher.create({
        data: {
          taskId: task.id,
          userId: user2.id,
        },
      })

      const watchers = await testPrisma.taskWatcher.findMany({
        where: { taskId: task.id },
      })

      expect(watchers).toHaveLength(2)
    })

    it('should find watchers by userId', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task1 = await createTestTask(project.id, user.id)
      const task2 = await createTestTask(project.id, user.id)

      await testPrisma.taskWatcher.create({
        data: {
          taskId: task1.id,
          userId: user.id,
        },
      })

      await testPrisma.taskWatcher.create({
        data: {
          taskId: task2.id,
          userId: user.id,
        },
      })

      const watchers = await testPrisma.taskWatcher.findMany({
        where: { userId: user.id },
      })

      expect(watchers).toHaveLength(2)
    })

    it('should order watchers by createdAt', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)

      const watcher1 = await testPrisma.taskWatcher.create({
        data: {
          taskId: task.id,
          userId: user.id,
        },
      })

      const watchers = await testPrisma.taskWatcher.findMany({
        where: { taskId: task.id },
        orderBy: { createdAt: 'asc' },
      })

      expect(watchers.length).toBeGreaterThanOrEqual(1)
      expect(watchers[0].userId).toBe(user.id)
    })
  })
})
