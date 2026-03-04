/**
 * TaskTag 模型测试 - P0 核心业务模型
 *
 * 测试覆盖:
 * - 任务 - 标签多对多关系
 * - 复合主键约束
 * - 批量标签操作
 * - 级联删除
 *
 * 优先级：P0 - 核心业务模型
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestTask,
  createTestTag,
} from '../../helpers/test-data-factory'

describe('TaskTag Model - P0 Core', () => {
  describe('Basic Operations', () => {
    it('should create task-tag relationship', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)
      const tag = await createTestTag()

      const taskTag = await testPrisma.taskTag.create({
        data: {
          taskId: task.id,
          tagId: tag.id,
        },
      })

      expect(taskTag).toBeDefined()
      expect(taskTag.taskId).toBe(task.id)
      expect(taskTag.tagId).toBe(tag.id)
    })

    it('should delete task-tag relationship', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)
      const tag = await createTestTag()

      const taskTag = await testPrisma.taskTag.create({
        data: {
          taskId: task.id,
          tagId: tag.id,
        },
      })

      await testPrisma.taskTag.delete({
        where: {
          taskId_tagId: {
            taskId: taskTag.taskId,
            tagId: taskTag.tagId,
          },
        },
      })

      const found = await testPrisma.taskTag.findUnique({
        where: {
          taskId_tagId: {
            taskId: taskTag.taskId,
            tagId: taskTag.tagId,
          },
        },
      })
      expect(found).toBeNull()
    })
  })

  describe('Composite Primary Key', () => {
    it('should enforce unique taskId-tagId combination', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)
      const tag = await createTestTag()

      await testPrisma.taskTag.create({
        data: {
          taskId: task.id,
          tagId: tag.id,
        },
      })

      await expect(
        testPrisma.taskTag.create({
          data: {
            taskId: task.id,
            tagId: tag.id,
          },
        })
      ).rejects.toThrow()
    })

    it('should allow same tag on different tasks', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task1 = await createTestTask(project.id, user.id)
      const task2 = await createTestTask(project.id, user.id)
      const tag = await createTestTag()

      await testPrisma.taskTag.create({
        data: {
          taskId: task1.id,
          tagId: tag.id,
        },
      })

      const taskTag2 = await testPrisma.taskTag.create({
        data: {
          taskId: task2.id,
          tagId: tag.id,
        },
      })

      expect(taskTag2.tagId).toBe(tag.id)
    })

    it('should allow same task with different tags', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)
      const tag1 = await createTestTag({ name: 'Tag1' })
      const tag2 = await createTestTag({ name: 'Tag2' })

      await testPrisma.taskTag.create({
        data: {
          taskId: task.id,
          tagId: tag1.id,
        },
      })

      const taskTag2 = await testPrisma.taskTag.create({
        data: {
          taskId: task.id,
          tagId: tag2.id,
        },
      })

      expect(taskTag2.tagId).toBe(tag2.id)
    })
  })

  describe('Many-to-Many Relationship', () => {
    it('should assign multiple tags to same task', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)

      const tag1 = await createTestTag({ name: 'Urgent' })
      const tag2 = await createTestTag({ name: 'Frontend' })
      const tag3 = await createTestTag({ name: 'Bug' })

      await testPrisma.taskTag.create({
        data: {
          taskId: task.id,
          tagId: tag1.id,
        },
      })

      await testPrisma.taskTag.create({
        data: {
          taskId: task.id,
          tagId: tag2.id,
        },
      })

      await testPrisma.taskTag.create({
        data: {
          taskId: task.id,
          tagId: tag3.id,
        },
      })

      const taskTags = await testPrisma.taskTag.findMany({
        where: { taskId: task.id },
      })

      expect(taskTags).toHaveLength(3)
    })

    it('should query task with tags', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)

      const tag1 = await createTestTag({ name: 'Important' })
      const tag2 = await createTestTag({ name: 'Feature' })

      await testPrisma.taskTag.create({
        data: {
          taskId: task.id,
          tagId: tag1.id,
        },
      })

      await testPrisma.taskTag.create({
        data: {
          taskId: task.id,
          tagId: tag2.id,
        },
      })

      const taskWithTags = await testPrisma.task.findUnique({
        where: { id: task.id },
        include: {
          taskTags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
        },
      })

      expect(taskWithTags?.taskTags).toHaveLength(2)
      expect(taskWithTags?.taskTags[0].tag.name).toBeDefined()
    })

    it('should query tag with tasks', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task1 = await createTestTask(project.id, user.id)
      const task2 = await createTestTask(project.id, user.id)

      const tag = await createTestTag({ name: 'Shared' })

      await testPrisma.taskTag.create({
        data: {
          taskId: task1.id,
          tagId: tag.id,
        },
      })

      await testPrisma.taskTag.create({
        data: {
          taskId: task2.id,
          tagId: tag.id,
        },
      })

      const tagWithTasks = await testPrisma.tag.findUnique({
        where: { id: tag.id },
        include: {
          taskTags: {
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

      expect(tagWithTasks?.taskTags).toHaveLength(2)
    })
  })

  describe('Bulk Operations', () => {
    it('should create multiple tags for task at once', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)

      const tag1 = await createTestTag({ name: 'Tag1' })
      const tag2 = await createTestTag({ name: 'Tag2' })
      const tag3 = await createTestTag({ name: 'Tag3' })

      await testPrisma.taskTag.createMany({
        data: [
          { taskId: task.id, tagId: tag1.id },
          { taskId: task.id, tagId: tag2.id },
          { taskId: task.id, tagId: tag3.id },
        ],
      })

      const taskTags = await testPrisma.taskTag.findMany({
        where: { taskId: task.id },
      })

      expect(taskTags).toHaveLength(3)
    })

    it('should delete all tags for task', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)

      const tag1 = await createTestTag()
      const tag2 = await createTestTag()

      await testPrisma.taskTag.createMany({
        data: [
          { taskId: task.id, tagId: tag1.id },
          { taskId: task.id, tagId: tag2.id },
        ],
      })

      await testPrisma.taskTag.deleteMany({
        where: { taskId: task.id },
      })

      const taskTags = await testPrisma.taskTag.findMany({
        where: { taskId: task.id },
      })

      expect(taskTags).toHaveLength(0)
    })
  })

  describe('Cascade Delete', () => {
    it('should delete task-tag when task deleted', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)
      const tag = await createTestTag()

      await testPrisma.taskTag.create({
        data: {
          taskId: task.id,
          tagId: tag.id,
        },
      })

      await testPrisma.task.delete({
        where: { id: task.id },
      })

      const taskTags = await testPrisma.taskTag.findMany({
        where: { taskId: task.id },
      })

      expect(taskTags).toHaveLength(0)
    })

    it('should delete task-tag when tag deleted', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)
      const tag = await createTestTag()

      await testPrisma.taskTag.create({
        data: {
          taskId: task.id,
          tagId: tag.id,
        },
      })

      await testPrisma.tag.delete({
        where: { id: tag.id },
      })

      const taskTags = await testPrisma.taskTag.findMany({
        where: { tagId: tag.id },
      })

      expect(taskTags).toHaveLength(0)
    })
  })

  describe('Query Operations', () => {
    it('should find task-tags by taskId', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)

      const tag1 = await createTestTag()
      const tag2 = await createTestTag()

      await testPrisma.taskTag.create({
        data: {
          taskId: task.id,
          tagId: tag1.id,
        },
      })

      await testPrisma.taskTag.create({
        data: {
          taskId: task.id,
          tagId: tag2.id,
        },
      })

      const taskTags = await testPrisma.taskTag.findMany({
        where: { taskId: task.id },
      })

      expect(taskTags).toHaveLength(2)
    })

    it('should find task-tags by tagId', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task1 = await createTestTask(project.id, user.id)
      const task2 = await createTestTask(project.id, user.id)
      const tag = await createTestTag()

      await testPrisma.taskTag.create({
        data: {
          taskId: task1.id,
          tagId: tag.id,
        },
      })

      await testPrisma.taskTag.create({
        data: {
          taskId: task2.id,
          tagId: tag.id,
        },
      })

      const taskTags = await testPrisma.taskTag.findMany({
        where: { tagId: tag.id },
      })

      expect(taskTags).toHaveLength(2)
    })

    it('should find tasks with specific tag', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task1 = await createTestTask(project.id, user.id)
      const task2 = await createTestTask(project.id, user.id)
      const tag = await createTestTag({ name: 'Urgent' })

      await testPrisma.taskTag.create({
        data: {
          taskId: task1.id,
          tagId: tag.id,
        },
      })

      await testPrisma.taskTag.create({
        data: {
          taskId: task2.id,
          tagId: tag.id,
        },
      })

      const urgentTasks = await testPrisma.task.findMany({
        where: {
          taskTags: {
            some: {
              tagId: tag.id,
            },
          },
        },
      })

      expect(urgentTasks).toHaveLength(2)
    })
  })
})
