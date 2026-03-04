/**
 * 里程碑补充集成测试
 *
 * 测试覆盖：
 * - 里程碑任务关联
 * - 里程碑进度统计
 * - 里程碑状态管理
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestDatabase, testPrisma } from '../../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestMilestone,
  createTestTask,
  createTestProjectMember,
} from '../../helpers/test-data-factory'

// ============================================
// 测试套件
// ============================================

describe('里程碑补充集成测试', () => {
  setupTestDatabase()

  let testUser: { id: string }
  let testProject: { id: string }
  let testMilestone: { id: string }

  beforeEach(async () => {
    testUser = await createTestUser()
    testProject = await createTestProject(testUser.id)
    await createTestProjectMember(testProject.id, testUser.id, { role: 'PROJECT_OWNER' })
    testMilestone = await createTestMilestone(testProject.id)
  })

  // ============================================
  // 里程碑任务关联测试
  // ============================================

  describe('里程碑任务关联', () => {
    it('应该能创建关联到里程碑的任务', async () => {
      const task = await testPrisma.task.create({
        data: {
          title: 'Milestone Task',
          projectId: testProject.id,
          milestoneId: testMilestone.id,
          status: 'TODO',
        },
      })

      expect(task.milestoneId).toBe(testMilestone.id)
    })

    it('应该能查询里程碑的所有任务', async () => {
      await testPrisma.task.create({
        data: { title: 'Task 1', status: 'DONE', progress: 100, priority: 'MEDIUM', projectId: testProject.id, milestoneId: testMilestone.id },
      })
      await testPrisma.task.create({
        data: { title: 'Task 2', status: 'DONE', progress: 100, priority: 'MEDIUM', projectId: testProject.id, milestoneId: testMilestone.id },
      })

      const tasks = await testPrisma.task.findMany({
        where: { milestoneId: testMilestone.id },
      })

      expect(tasks.length).toBe(2)
    })

    it('应该能取消任务与里程碑的关联', async () => {
      const task = await testPrisma.task.create({
        data: { title: 'Task', projectId: testProject.id, milestoneId: testMilestone.id },
      })

      const updated = await testPrisma.task.update({
        where: { id: task.id },
        data: { milestoneId: null },
      })

      expect(updated.milestoneId).toBeNull()
    })
  })

  // ============================================
  // 里程碑进度统计测试
  // ============================================

  describe('里程碑进度统计', () => {
    it('应该能计算里程碑任务完成率', async () => {
      await testPrisma.task.create({
        data: {
          title: 'Task 1', status: 'DONE', progress: 100, priority: 'MEDIUM',
          projectId: testProject.id,
          milestoneId: testMilestone.id,
        },
      })
      await testPrisma.task.create({
        data: {
          title: 'Task 2', status: 'DONE', progress: 100, priority: 'MEDIUM',
          projectId: testProject.id,
        },
      })
      await testPrisma.task.create({
        data: {
          title: 'Task 3',
          projectId: testProject.id,
          milestoneId: testMilestone.id,
          status: 'TODO',
        },
      })

      const total = await testPrisma.task.count({ where: { milestoneId: testMilestone.id } })
      const completed = await testPrisma.task.count({
        where: { milestoneId: testMilestone.id, status: 'COMPLETED' },
      })
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

      expect(total).toBe(3)
      expect(completed).toBe(2)
      expect(completionRate).toBe(67)
    })

    it('应该能更新里程碑进度', async () => {
      const updated = await testPrisma.milestone.update({
        where: { id: testMilestone.id },
        data: { progress: 50 },
      })

      expect(updated.progress).toBe(50)
    })
  })

  // ============================================
  // 里程碑状态管理测试
  // ============================================

  describe('里程碑状态管理', () => {
    it('应该支持 NOT_STARTED 状态', async () => {
      const milestone = await createTestMilestone(testProject.id, { status: 'NOT_STARTED' })
      expect(milestone.status).toBe('NOT_STARTED')
    })

    it('应该支持 IN_PROGRESS 状态', async () => {
      const updated = await testPrisma.milestone.update({
        where: { id: testMilestone.id },
        data: { status: 'IN_PROGRESS' },
      })
      expect(updated.status).toBe('IN_PROGRESS')
    })

    it('应该支持 DONE 状态', async () => {
      const updated = await testPrisma.milestone.update({
        where: { id: testMilestone.id },
        data: { status: 'COMPLETED', progress: 100 },
      })
      expect(updated.status).toBe('COMPLETED')
      expect(updated.progress).toBe(100)
    })

    it('应该能按状态筛选里程碑', async () => {
      await createTestMilestone(testProject.id, { status: 'COMPLETED' })

      const activeMilestones = await testPrisma.milestone.findMany({
        where: { projectId: testProject.id, status: { not: 'COMPLETED' } },
      })

      expect(activeMilestones.length).toBe(1)
    })
  })

  // ============================================
  // 里程碑时间管理测试
  // ============================================

  describe('里程碑时间管理', () => {
    it('应该能设置里程碑截止日期', async () => {
      const dueDate = new Date('2026-12-31')
      const updated = await testPrisma.milestone.update({
        where: { id: testMilestone.id },
        data: { dueDate },
      })

      expect(updated.dueDate).toBeDefined()
    })

    it('应该能查询即将到期的里程碑', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      await testPrisma.milestone.update({
        where: { id: testMilestone.id },
        data: { dueDate: tomorrow },
      })

      const upcomingMilestones = await testPrisma.milestone.findMany({
        where: {
          projectId: testProject.id,
          dueDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
          status: { not: 'COMPLETED' },
        },
      })

      expect(upcomingMilestones.length).toBe(1)
    })
  })
})
