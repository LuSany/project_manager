// ============================================================================
// 任务状态系统测试
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('TaskStatus 任务状态系统', () => {
  beforeEach(async () => {
    // 清理测试数据
  })

  describe('状态枚举值', () => {
    it('应该支持 TODO 状态（未开始）', async () => {
      const owner = await createTestUser('todo-owner@test.com', 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'Test Task',
          projectId: project.id,
          status: 'TODO',
        },
      })

      expect(task.status).toBe('TODO')
    })

    it('应该支持 IN_PROGRESS 状态（进行中）', async () => {
      const owner = await createTestUser('inprogress-owner@test.com', 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'Test Task',
          projectId: project.id,
          status: 'IN_PROGRESS',
        },
      })

      expect(task.status).toBe('IN_PROGRESS')
    })

    it('应该支持 REVIEW 状态（待评审）', async () => {
      const owner = await createTestUser('review-owner@test.com', 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'Test Task',
          projectId: project.id,
          status: 'REVIEW',
        },
      })

      expect(task.status).toBe('REVIEW')
    })

    it('应该支持 TESTING 状态（测试中）', async () => {
      const owner = await createTestUser('testing-owner@test.com', 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'Test Task',
          projectId: project.id,
          status: 'TESTING',
        },
      })

      expect(task.status).toBe('TESTING')
    })

    it('应该支持 DONE 状态（已完成）', async () => {
      const owner = await createTestUser('done-owner@test.com', 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'Test Task',
          projectId: project.id,
          status: 'DONE',
        },
      })

      expect(task.status).toBe('DONE')
    })

    it('应该支持 CANCELLED 状态（已取消）', async () => {
      const owner = await createTestUser('cancelled-owner@test.com', 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'Test Task',
          projectId: project.id,
          status: 'CANCELLED',
        },
      })

      expect(task.status).toBe('CANCELLED')
    })

    it('应该支持 DELAYED 状态（延期）', async () => {
      const owner = await createTestUser('delayed-owner@test.com', 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'Test Task',
          projectId: project.id,
          status: 'DELAYED',
        },
      })

      expect(task.status).toBe('DELAYED')
    })

    it('应该支持 BLOCKED 状态（阻塞）', async () => {
      const owner = await createTestUser('blocked-owner@test.com', 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'Test Task',
          projectId: project.id,
          status: 'BLOCKED',
        },
      })

      expect(task.status).toBe('BLOCKED')
    })
  })

  describe('状态流转规则', () => {
    it('应该允许 TODO → IN_PROGRESS 流转', async () => {
      const owner = await createTestUser('flow1-owner@test.com', 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'Test Task',
          projectId: project.id,
          status: 'TODO',
        },
      })

      const updated = await prisma.task.update({
        where: { id: task.id },
        data: { status: 'IN_PROGRESS' },
      })

      expect(updated.status).toBe('IN_PROGRESS')
    })

    it('应该允许 IN_PROGRESS → REVIEW 流转', async () => {
      const owner = await createTestUser('flow2-owner@test.com', 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'Test Task',
          projectId: project.id,
          status: 'IN_PROGRESS',
        },
      })

      const updated = await prisma.task.update({
        where: { id: task.id },
        data: { status: 'REVIEW' },
      })

      expect(updated.status).toBe('REVIEW')
    })

    it('应该允许 REVIEW → TESTING 流转', async () => {
      const owner = await createTestUser('flow3-owner@test.com', 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'Test Task',
          projectId: project.id,
          status: 'REVIEW',
        },
      })

      const updated = await prisma.task.update({
        where: { id: task.id },
        data: { status: 'TESTING' },
      })

      expect(updated.status).toBe('TESTING')
    })

    it('应该允许 TESTING → DONE 流转', async () => {
      const owner = await createTestUser('flow4-owner@test.com', 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'Test Task',
          projectId: project.id,
          status: 'TESTING',
        },
      })

      const updated = await prisma.task.update({
        where: { id: task.id },
        data: { status: 'DONE' },
      })

      expect(updated.status).toBe('DONE')
    })

    it('应该允许任何状态 → CANCELLED 流转', async () => {
      const owner = await createTestUser('cancel-owner@test.com', 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'Test Task',
          projectId: project.id,
          status: 'IN_PROGRESS',
        },
      })

      const updated = await prisma.task.update({
        where: { id: task.id },
        data: { status: 'CANCELLED' },
      })

      expect(updated.status).toBe('CANCELLED')
    })

    it('应该允许 IN_PROGRESS → DELAYED 流转', async () => {
      const owner = await createTestUser('delay-owner@test.com', 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'Test Task',
          projectId: project.id,
          status: 'IN_PROGRESS',
        },
      })

      const updated = await prisma.task.update({
        where: { id: task.id },
        data: { status: 'DELAYED' },
      })

      expect(updated.status).toBe('DELAYED')
    })

    it('应该允许任何状态 → BLOCKED 流转', async () => {
      const owner = await createTestUser('block-owner@test.com', 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'Test Task',
          projectId: project.id,
          status: 'IN_PROGRESS',
        },
      })

      const updated = await prisma.task.update({
        where: { id: task.id },
        data: { status: 'BLOCKED' },
      })

      expect(updated.status).toBe('BLOCKED')
    })

    it('应该允许 DELAYED → IN_PROGRESS 恢复流转', async () => {
      const owner = await createTestUser('recover-owner@test.com', 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'Test Task',
          projectId: project.id,
          status: 'DELAYED',
        },
      })

      const updated = await prisma.task.update({
        where: { id: task.id },
        data: { status: 'IN_PROGRESS' },
      })

      expect(updated.status).toBe('IN_PROGRESS')
    })

    it('应该允许 BLOCKED → IN_PROGRESS 恢复流转', async () => {
      const owner = await createTestUser('unblock-owner@test.com', 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'Test Task',
          projectId: project.id,
          status: 'BLOCKED',
        },
      })

      const updated = await prisma.task.update({
        where: { id: task.id },
        data: { status: 'IN_PROGRESS' },
      })

      expect(updated.status).toBe('IN_PROGRESS')
    })
  })

  describe('状态统计', () => {
    it('应该正确统计各状态任务数量', async () => {
      const owner = await createTestUser('stats-owner@test.com', 'ADMIN')
      const project = await createTestProject(owner.id)

      await Promise.all([
        prisma.task.create({ data: { title: 'Task 1', projectId: project.id, status: 'TODO' } }),
        prisma.task.create({
          data: { title: 'Task 2', projectId: project.id, status: 'IN_PROGRESS' },
        }),
        prisma.task.create({
          data: { title: 'Task 3', projectId: project.id, status: 'IN_PROGRESS' },
        }),
        prisma.task.create({ data: { title: 'Task 4', projectId: project.id, status: 'DONE' } }),
        prisma.task.create({ data: { title: 'Task 5', projectId: project.id, status: 'BLOCKED' } }),
      ])

      const tasks = await prisma.task.findMany({
        where: { projectId: project.id },
      })

      const statusCount = tasks.reduce(
        (acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      expect(statusCount['TODO']).toBe(1)
      expect(statusCount['IN_PROGRESS']).toBe(2)
      expect(statusCount['DONE']).toBe(1)
      expect(statusCount['BLOCKED']).toBe(1)
    })
  })
})

// ============================================================================
// 辅助函数
// ============================================================================

async function createTestUser(email: string, role: 'ADMIN' | 'EMPLOYEE') {
  return await prisma.user.create({
    data: {
      email,
      passwordHash: 'hashed_password',
      name: 'Test User',
      role,
    },
  })
}

async function createTestProject(ownerId: string) {
  return await prisma.project.create({
    data: {
      name: 'Test Project',
      ownerId: ownerId,
    },
  })
}
