/**
 * 任务管理补充集成测试
 *
 * 测试覆盖：
 * - 任务关注者管理
 * - 子任务管理
 * - 任务标签管理
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestDatabase, testPrisma } from '../../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestTask,
  createTestTag,
  createTestProjectMember,
} from '../../helpers/test-data-factory'

// ============================================
// 测试套件
// ============================================

describe('任务管理补充集成测试', () => {
  setupTestDatabase()

  let testUser: { id: string }
  let testProject: { id: string }
  let testTask: { id: string }

  beforeEach(async () => {
    testUser = await createTestUser()
    testProject = await createTestProject(testUser.id)
    await createTestProjectMember(testProject.id, testUser.id, { role: 'PROJECT_OWNER' })
    testTask = await createTestTask(testProject.id)
  })

  // ============================================
  // 任务关注者测试
  // ============================================

  describe('任务关注者管理', () => {
    it('应该能添加任务关注者', async () => {
      const watcher = await testPrisma.taskWatcher.create({
        data: {
          taskId: testTask.id,
          userId: testUser.id,
        },
      })

      expect(watcher).toBeDefined()
      expect(watcher.taskId).toBe(testTask.id)
      expect(watcher.userId).toBe(testUser.id)
    })

    it('应该能查询任务的所有关注者', async () => {
      const user2 = await createTestUser({ email: 'watcher2@example.com' })
      await testPrisma.taskWatcher.create({
        data: { taskId: testTask.id, userId: testUser.id },
      })
      await testPrisma.taskWatcher.create({
        data: { taskId: testTask.id, userId: user2.id },
      })

      const watchers = await testPrisma.taskWatcher.findMany({
        where: { taskId: testTask.id },
        include: { user: true },
      })

      expect(watchers.length).toBe(2)
    })

    it('应该能删除任务关注者', async () => {
      await testPrisma.taskWatcher.create({
        data: { taskId: testTask.id, userId: testUser.id },
      })

      await testPrisma.taskWatcher.delete({
        where: {
          taskId_userId: {
            taskId: testTask.id,
            userId: testUser.id,
          },
        },
      })

      const watchers = await testPrisma.taskWatcher.findMany({
        where: { taskId: testTask.id },
      })
      expect(watchers.length).toBe(0)
    })

    it('删除任务应该级联删除关注者', async () => {
      await testPrisma.taskWatcher.create({
        data: { taskId: testTask.id, userId: testUser.id },
      })

      await testPrisma.task.delete({
        where: { id: testTask.id },
      })

      const watchers = await testPrisma.taskWatcher.findMany({
        where: { taskId: testTask.id },
      })
      expect(watchers.length).toBe(0)
    })
  })

  // ============================================
  // 子任务管理测试
  // ============================================

  describe('子任务管理', () => {
    it('应该能创建子任务', async () => {
      const subTask = await testPrisma.subTask.create({
        data: {
          title: '子任务1',
          taskId: testTask.id,
          completed: false,
        },
      })

      expect(subTask).toBeDefined()
      expect(subTask.title).toBe('子任务1')
      expect(subTask.completed).toBe(false)
    })

    it('应该能创建嵌套子任务', async () => {
      const parentSubTask = await testPrisma.subTask.create({
        data: {
          title: '父级子任务',
          taskId: testTask.id,
          completed: false,
        },
      })

      const childSubTask = await testPrisma.subTask.create({
        data: {
          title: '子级子任务',
          taskId: testTask.id,
          parentId: parentSubTask.id,
          completed: false,
        },
      })

      expect(childSubTask.parentId).toBe(parentSubTask.id)
    })

    it('应该能更新子任务完成状态', async () => {
      const subTask = await testPrisma.subTask.create({
        data: {
          title: '待完成子任务',
          taskId: testTask.id,
          completed: false,
        },
      })

      const updated = await testPrisma.subTask.update({
        where: { id: subTask.id },
        data: { completed: true },
      })

      expect(updated.completed).toBe(true)
    })

    it('应该能查询任务的所有子任务', async () => {
      await testPrisma.subTask.create({
        data: { title: '子任务1', taskId: testTask.id, completed: false },
      })
      await testPrisma.subTask.create({
        data: { title: '子任务2', taskId: testTask.id, completed: true },
      })

      const subTasks = await testPrisma.subTask.findMany({
        where: { taskId: testTask.id },
      })

      expect(subTasks.length).toBe(2)
    })

    it('应该能删除子任务', async () => {
      const subTask = await testPrisma.subTask.create({
        data: { title: '待删除子任务', taskId: testTask.id, completed: false },
      })

      await testPrisma.subTask.delete({
        where: { id: subTask.id },
      })

      const subTasks = await testPrisma.subTask.findMany({
        where: { taskId: testTask.id },
      })
      expect(subTasks.length).toBe(0)
    })
  })

  // ============================================
  // 任务标签管理测试
  // ============================================

  describe('任务标签管理', () => {
    it('应该能为任务添加标签', async () => {
      const tag = await createTestTag()

      const taskTag = await testPrisma.taskTag.create({
        data: {
          taskId: testTask.id,
          tagId: tag.id,
        },
      })

      expect(taskTag).toBeDefined()
      expect(taskTag.taskId).toBe(testTask.id)
      expect(taskTag.tagId).toBe(tag.id)
    })

    it('应该能查询任务的所有标签', async () => {
      const tag1 = await createTestTag({ name: 'bug' })
      const tag2 = await createTestTag({ name: 'urgent' })

      await testPrisma.taskTag.create({
        data: { taskId: testTask.id, tagId: tag1.id },
      })
      await testPrisma.taskTag.create({
        data: { taskId: testTask.id, tagId: tag2.id },
      })

      const taskTags = await testPrisma.taskTag.findMany({
        where: { taskId: testTask.id },
        include: { tag: true },
      })

      expect(taskTags.length).toBe(2)
    })

    it('应该能移除任务标签', async () => {
      const tag = await createTestTag()
      await testPrisma.taskTag.create({
        data: { taskId: testTask.id, tagId: tag.id },
      })

      await testPrisma.taskTag.delete({
        where: {
          taskId_tagId: {
            taskId: testTask.id,
            tagId: tag.id,
          },
        },
      })

      const taskTags = await testPrisma.taskTag.findMany({
        where: { taskId: testTask.id },
      })
      expect(taskTags.length).toBe(0)
    })

    it('应该能查询标签关联的所有任务', async () => {
      const tag = await createTestTag()
      const task2 = await createTestTask(testProject.id)

      await testPrisma.taskTag.create({
        data: { taskId: testTask.id, tagId: tag.id },
      })
      await testPrisma.taskTag.create({
        data: { taskId: task2.id, tagId: tag.id },
      })

      const taggedTasks = await testPrisma.taskTag.findMany({
        where: { tagId: tag.id },
        include: { task: true },
      })

      expect(taggedTasks.length).toBe(2)
    })
  })

  // ============================================
  // 任务执行人管理测试
  // ============================================

  describe('任务执行人管理', () => {
    it('应该能为任务分配执行人', async () => {
      const assignee = await testPrisma.taskAssignee.create({
        data: {
          taskId: testTask.id,
          userId: testUser.id,
        },
      })

      expect(assignee).toBeDefined()
      expect(assignee.taskId).toBe(testTask.id)
    })

    it('应该能查询任务的所有执行人', async () => {
      const user2 = await createTestUser({ email: 'assignee2@example.com' })

      await testPrisma.taskAssignee.create({
        data: { taskId: testTask.id, userId: testUser.id },
      })
      await testPrisma.taskAssignee.create({
        data: { taskId: testTask.id, userId: user2.id },
      })

      const assignees = await testPrisma.taskAssignee.findMany({
        where: { taskId: testTask.id },
        include: { user: true },
      })

      expect(assignees.length).toBe(2)
    })

    it('应该能移除任务执行人', async () => {
      await testPrisma.taskAssignee.create({
        data: { taskId: testTask.id, userId: testUser.id },
      })

      await testPrisma.taskAssignee.delete({
        where: {
          taskId_userId: {
            taskId: testTask.id,
            userId: testUser.id,
          },
        },
      })

      const assignees = await testPrisma.taskAssignee.findMany({
        where: { taskId: testTask.id },
      })
      expect(assignees.length).toBe(0)
    })
  })
})
