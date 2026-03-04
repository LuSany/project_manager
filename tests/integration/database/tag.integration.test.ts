/**
 * 标签管理集成测试
 *
 * 测试覆盖：
 * - 标签 CRUD 操作
 * - 标签颜色管理
 * - 标签与任务关联
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestDatabase, testPrisma } from '../../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestTag,
  createTestTask,
  createTestProjectMember,
} from '../../helpers/test-data-factory'

// ============================================
// 测试套件
// ============================================

describe('标签管理集成测试', () => {
  setupTestDatabase()

  let testUser: { id: string }
  let testProject: { id: string }

  beforeEach(async () => {
    testUser = await createTestUser()
    await testPrisma.tag.deleteMany({})
    testProject = await createTestProject(testUser.id)
    await createTestProjectMember(testProject.id, testUser.id, { role: 'PROJECT_OWNER' })
  })

  // ============================================
  // 标签 CRUD 测试
  // ============================================

  describe('标签 CRUD 操作', () => {
    it('应该能创建标签', async () => {
      const tag = await createTestTag({ name: 'bug', color: '#FF0000' })
      expect(tag.name).toBe('bug')
      expect(tag.color).toBe('#FF0000')
    })

    it('应该能获取所有标签', async () => {
      await createTestTag({ name: 'bug' })
      await createTestTag({ name: 'feature' })
      await createTestTag({ name: 'enhancement' })

      const tags = await testPrisma.tag.findMany()
      expect(tags.length).toBe(3)
    })

    it('应该能获取标签详情', async () => {
      const tag = await createTestTag({ name: 'urgent' })

      const found = await testPrisma.tag.findUnique({
        where: { id: tag.id },
      })

      expect(found?.name).toBe('urgent')
    })

    it('应该能更新标签', async () => {
      const tag = await createTestTag({ name: 'old-name' })

      const updated = await testPrisma.tag.update({
        where: { id: tag.id },
        data: { name: 'new-name', color: '#00FF00' },
      })

      expect(updated.name).toBe('new-name')
      expect(updated.color).toBe('#00FF00')
    })

    it('应该能删除标签', async () => {
      const tag = await createTestTag()

      await testPrisma.tag.delete({
        where: { id: tag.id },
      })

      const found = await testPrisma.tag.findUnique({
        where: { id: tag.id },
      })

      expect(found).toBeNull()
    })
  })

  // ============================================
  // 标签颜色测试
  // ============================================

  describe('标签颜色管理', () => {
    it('应该支持不同颜色', async () => {
      const red = await createTestTag({ name: 'critical', color: '#FF0000' })
      const green = await createTestTag({ name: 'success', color: '#00FF00' })
      const blue = await createTestTag({ name: 'info', color: '#0000FF' })

      expect(red.color).toBe('#FF0000')
      expect(green.color).toBe('#00FF00')
      expect(blue.color).toBe('#0000FF')
    })

    it('应该能更新标签颜色', async () => {
      const tag = await createTestTag({ color: '#000000' })

      const updated = await testPrisma.tag.update({
        where: { id: tag.id },
        data: { color: '#FFFFFF' },
      })

      expect(updated.color).toBe('#FFFFFF')
    })
  })

  // ============================================
  // 标签与任务关联测试
  // ============================================

  describe('标签与任务关联', () => {
    let testTask: { id: string }

    beforeEach(async () => {
      testTask = await createTestTask(testProject.id)
    })

    it('应该能为任务添加标签', async () => {
      const tag = await createTestTag()

      const taskTag = await testPrisma.taskTag.create({
        data: {
          taskId: testTask.id,
          tagId: tag.id,
        },
      })

      expect(taskTag).toBeDefined()
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

    it('应该能移除任务的标签', async () => {
      const tag = await createTestTag()
      const taskTag = await testPrisma.taskTag.create({
        data: { taskId: testTask.id, tagId: tag.id },
      })

      await testPrisma.taskTag.delete({
        where: { taskId_tagId: { taskId: testTask.id, tagId: tag.id } },
      })

      const remaining = await testPrisma.taskTag.findMany({
        where: { taskId: testTask.id },
      })

      expect(remaining.length).toBe(0)
    })
  })
})
