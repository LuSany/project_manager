// 临时跳过以修复 email 冲突问题
// ============================================================================
// 任务优先级系统测试
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('TaskPriority 任务优先级系统', () => {
  beforeEach(async () => {
    // 清理测试数据
  })

  describe('优先级枚举值', () => {
    it('应该支持 LOW 优先级（低）', async () => {
      const owner = await createTestUser(`test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`, 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'Low Priority Task',
          projectId: project.id,
          priority: 'LOW',
        },
      })

      expect(task.priority).toBe('LOW')
    })

    it('应该支持 MEDIUM 优先级（中）', async () => {
      const owner = await createTestUser(`test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`, 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'Medium Priority Task',
          projectId: project.id,
          priority: 'MEDIUM',
        },
      })

      expect(task.priority).toBe('MEDIUM')
    })

    it('应该支持 HIGH 优先级（高）', async () => {
      const owner = await createTestUser(`test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`, 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'High Priority Task',
          projectId: project.id,
          priority: 'HIGH',
        },
      })

      expect(task.priority).toBe('HIGH')
    })

    it('应该支持 CRITICAL 优先级（紧急/关键）', async () => {
      const owner = await createTestUser(`test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`, 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'Critical Priority Task',
          projectId: project.id,
          priority: 'CRITICAL',
        },
      })

      expect(task.priority).toBe('CRITICAL')
    })

    it('不应该支持 URGENT 优先级（已废弃，应使用 CRITICAL）', async () => {
      const owner = await createTestUser(`test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`, 'ADMIN')
      const project = await createTestProject(owner.id)

      // 尝试创建 URGENT 优先级任务应该失败
      await expect(
        prisma.task.create({
          data: {
            title: 'Urgent Priority Task',
            projectId: project.id,
            // @ts-expect-error - URGENT 应该不存在
            priority: 'URGENT',
          },
        })
      ).rejects.toThrow()
    })
  })

  describe('优先级默认值', () => {
    it('应该默认使用 MEDIUM 优先级', async () => {
      const owner = await createTestUser(`test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`, 'ADMIN')
      const project = await createTestProject(owner.id)

      const task = await prisma.task.create({
        data: {
          title: 'Default Priority Task',
          projectId: project.id,
        },
      })

      expect(task.priority).toBe('MEDIUM')
    })
  })

  describe('优先级筛选', () => {
    it('应该能够按 CRITICAL 优先级筛选任务', async () => {
      const owner = await createTestUser(`test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`, 'ADMIN')
      const project = await createTestProject(owner.id)

      await Promise.all([
        prisma.task.create({
          data: { title: 'Task 1', projectId: project.id, priority: 'CRITICAL' },
        }),
        prisma.task.create({ data: { title: 'Task 2', projectId: project.id, priority: 'HIGH' } }),
        prisma.task.create({
          data: { title: 'Task 3', projectId: project.id, priority: 'CRITICAL' },
        }),
        prisma.task.create({
          data: { title: 'Task 4', projectId: project.id, priority: 'MEDIUM' },
        }),
      ])

      const criticalTasks = await prisma.task.findMany({
        where: {
          projectId: project.id,
          priority: 'CRITICAL',
        },
      })

      expect(criticalTasks).toHaveLength(2)
      expect(criticalTasks.every((t) => t.priority === 'CRITICAL')).toBe(true)
    })

    it('应该能够按多个优先级筛选任务', async () => {
      const owner = await createTestUser(`test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`, 'ADMIN')
      const project = await createTestProject(owner.id)

      await Promise.all([
        prisma.task.create({
          data: { title: 'Task 1', projectId: project.id, priority: 'CRITICAL' },
        }),
        prisma.task.create({ data: { title: 'Task 2', projectId: project.id, priority: 'HIGH' } }),
        prisma.task.create({
          data: { title: 'Task 3', projectId: project.id, priority: 'MEDIUM' },
        }),
        prisma.task.create({ data: { title: 'Task 4', projectId: project.id, priority: 'LOW' } }),
      ])

      const highPriorityTasks = await prisma.task.findMany({
        where: {
          projectId: project.id,
          priority: {
            in: ['CRITICAL', 'HIGH'],
          },
        },
      })

      expect(highPriorityTasks).toHaveLength(2)
      expect(highPriorityTasks.map((t) => t.priority).sort()).toEqual(['CRITICAL', 'HIGH'])
    })
  })

  describe('优先级排序', () => {
    it('应该能够查询所有优先级任务', async () => {
      const owner = await createTestUser(`test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`, 'ADMIN')
      const project = await createTestProject(owner.id)

      const _created = await Promise.all([
        prisma.task.create({ data: { title: 'Low Task', projectId: project.id, priority: 'LOW' } }),
        prisma.task.create({
          data: { title: 'Critical Task', projectId: project.id, priority: 'CRITICAL' },
        }),
        prisma.task.create({
          data: { title: 'High Task', projectId: project.id, priority: 'HIGH' },
        }),
        prisma.task.create({
          data: { title: 'Medium Task', projectId: project.id, priority: 'MEDIUM' },
        }),
      ])

      const allTasks = await prisma.task.findMany({
        where: { projectId: project.id },
      })

      // 验证所有优先级的任务都存在
      expect(allTasks).toHaveLength(4)
      const priorities = allTasks.map((t) => t.priority).sort()
      expect(priorities).toEqual(['CRITICAL', 'HIGH', 'LOW', 'MEDIUM'])

      // 验证 CRITICAL 优先级的任务可以正确查询
      const criticalTask = allTasks.find((t) => t.priority === 'CRITICAL')
      expect(criticalTask?.title).toBe('Critical Task')
    })
  })

  describe('优先级统计', () => {
    it('应该正确统计各优先级任务数量', async () => {
      const owner = await createTestUser(`test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`, 'ADMIN')
      const project = await createTestProject(owner.id)

      await Promise.all([
        prisma.task.create({
          data: { title: 'Task 1', projectId: project.id, priority: 'CRITICAL' },
        }),
        prisma.task.create({
          data: { title: 'Task 2', projectId: project.id, priority: 'CRITICAL' },
        }),
        prisma.task.create({ data: { title: 'Task 3', projectId: project.id, priority: 'HIGH' } }),
        prisma.task.create({ data: { title: 'Task 4', projectId: project.id, priority: 'HIGH' } }),
        prisma.task.create({ data: { title: 'Task 5', projectId: project.id, priority: 'HIGH' } }),
        prisma.task.create({
          data: { title: 'Task 6', projectId: project.id, priority: 'MEDIUM' },
        }),
        prisma.task.create({ data: { title: 'Task 7', projectId: project.id, priority: 'LOW' } }),
      ])

      const tasks = await prisma.task.findMany({
        where: { projectId: project.id },
      })

      const priorityCount = tasks.reduce(
        (acc, task) => {
          acc[task.priority] = (acc[task.priority] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      expect(priorityCount['CRITICAL']).toBe(2)
      expect(priorityCount['HIGH']).toBe(3)
      expect(priorityCount['MEDIUM']).toBe(1)
      expect(priorityCount['LOW']).toBe(1)
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
