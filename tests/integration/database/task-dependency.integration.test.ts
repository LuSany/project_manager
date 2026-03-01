// ============================================================================
// 任务依赖系统测试
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('TaskDependency 任务依赖系统', () => {
  beforeEach(async () => {
    // 清理测试数据
  })

  describe('依赖类型枚举', () => {
    it('应该支持 FINISH_TO_START 依赖类型', async () => {
      const { task1, task2 } = await createDependencyTestSetup()

      const dependency = await prisma.taskDependency.create({
        data: {
          taskId: task2.id,
          dependsOnId: task1.id,
          dependencyType: 'FINISH_TO_START',
        },
      })

      expect(dependency.dependencyType).toBe('FINISH_TO_START')
    })

    it('应该支持 START_TO_START 依赖类型', async () => {
      const { task1, task2 } = await createDependencyTestSetup()

      const dependency = await prisma.taskDependency.create({
        data: {
          taskId: task2.id,
          dependsOnId: task1.id,
          dependencyType: 'START_TO_START',
        },
      })

      expect(dependency.dependencyType).toBe('START_TO_START')
    })

    it('应该支持 FINISH_TO_FINISH 依赖类型', async () => {
      const { task1, task2 } = await createDependencyTestSetup()

      const dependency = await prisma.taskDependency.create({
        data: {
          taskId: task2.id,
          dependsOnId: task1.id,
          dependencyType: 'FINISH_TO_FINISH',
        },
      })

      expect(dependency.dependencyType).toBe('FINISH_TO_FINISH')
    })

    it('应该支持 START_TO_FINISH 依赖类型', async () => {
      const { task1, task2 } = await createDependencyTestSetup()

      const dependency = await prisma.taskDependency.create({
        data: {
          taskId: task2.id,
          dependsOnId: task1.id,
          dependencyType: 'START_TO_FINISH',
        },
      })

      expect(dependency.dependencyType).toBe('START_TO_FINISH')
    })

    it('应该默认使用 FINISH_TO_START 依赖类型', async () => {
      const { task1, task2 } = await createDependencyTestSetup()

      const dependency = await prisma.taskDependency.create({
        data: {
          taskId: task2.id,
          dependsOnId: task1.id,
        },
      })

      expect(dependency.dependencyType).toBe('FINISH_TO_START')
    })
  })

  describe('依赖关系创建', () => {
    it('应该能够创建任务依赖关系', async () => {
      const { task1, task2 } = await createDependencyTestSetup()

      const dependency = await prisma.taskDependency.create({
        data: {
          taskId: task2.id,
          dependsOnId: task1.id,
        },
      })

      expect(dependency).toBeDefined()
      expect(dependency.taskId).toBe(task2.id)
      expect(dependency.dependsOnId).toBe(task1.id)
    })

    it('应该能够查询依赖任务详情', async () => {
      const { task1, task2 } = await createDependencyTestSetup()

      await prisma.taskDependency.create({
        data: {
          taskId: task2.id,
          dependsOnId: task1.id,
        },
      })

      const dependency = await prisma.taskDependency.findFirst({
        where: { taskId: task2.id },
        include: {
          task: {
            select: { id: true, title: true, status: true },
          },
          dependsOn: {
            select: { id: true, title: true, status: true },
          },
        },
      })

      expect(dependency).toBeDefined()
      expect(dependency?.task.title).toBe('Task 2')
      expect(dependency?.dependsOn.title).toBe('Task 1')
    })
  })

  describe('依赖关系约束', () => {
    it('不应该允许重复的依赖关系', async () => {
      const { task1, task2 } = await createDependencyTestSetup()

      await prisma.taskDependency.create({
        data: {
          taskId: task2.id,
          dependsOnId: task1.id,
        },
      })

      // 尝试创建相同的依赖关系应该失败
      await expect(
        prisma.taskDependency.create({
          data: {
            taskId: task2.id,
            dependsOnId: task1.id,
          },
        })
      ).rejects.toThrow()
    })

    it('应该允许一个任务依赖多个任务', async () => {
      const owner = await createTestUser(`test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`, 'ADMIN')
      const project = await createTestProject(owner.id)

      const task1 = await createTestTask(project.id, 'Task 1')
      const task2 = await createTestTask(project.id, 'Task 2')
      const task3 = await createTestTask(project.id, 'Task 3')

      // task3 依赖 task1 和 task2
      await prisma.taskDependency.create({
        data: {
          taskId: task3.id,
          dependsOnId: task1.id,
        },
      })

      await prisma.taskDependency.create({
        data: {
          taskId: task3.id,
          dependsOnId: task2.id,
        },
      })

      const dependencies = await prisma.taskDependency.findMany({
        where: { taskId: task3.id },
      })

      expect(dependencies).toHaveLength(2)
    })

    it('应该允许一个任务被多个任务依赖', async () => {
      const owner = await createTestUser(`test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`, 'ADMIN')
      const project = await createTestProject(owner.id)

      const task1 = await createTestTask(project.id, 'Task 1')
      const task2 = await createTestTask(project.id, 'Task 2')
      const task3 = await createTestTask(project.id, 'Task 3')

      // task2 和 task3 都依赖 task1
      await prisma.taskDependency.create({
        data: {
          taskId: task2.id,
          dependsOnId: task1.id,
        },
      })

      await prisma.taskDependency.create({
        data: {
          taskId: task3.id,
          dependsOnId: task1.id,
        },
      })

      const dependents = await prisma.taskDependency.findMany({
        where: { dependsOnId: task1.id },
      })

      expect(dependents).toHaveLength(2)
    })
  })

  describe('依赖关系统计', () => {
    it('应该能够统计任务的依赖数量', async () => {
      const owner = await createTestUser(`test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`, 'ADMIN')
      const project = await createTestProject(owner.id)

      const task1 = await createTestTask(project.id, 'Task 1')
      const task2 = await createTestTask(project.id, 'Task 2')
      const task3 = await createTestTask(project.id, 'Task 3')

      await Promise.all([
        prisma.taskDependency.create({ data: { taskId: task2.id, dependsOnId: task1.id } }),
        prisma.taskDependency.create({ data: { taskId: task3.id, dependsOnId: task1.id } }),
        prisma.taskDependency.create({ data: { taskId: task3.id, dependsOnId: task2.id } }),
      ])

      // task3 有 2 个依赖
      const task3Dependencies = await prisma.taskDependency.count({
        where: { taskId: task3.id },
      })
      expect(task3Dependencies).toBe(2)

      // task1 被 2 个任务依赖
      const task1Dependents = await prisma.taskDependency.count({
        where: { dependsOnId: task1.id },
      })
      expect(task1Dependents).toBe(2)
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

async function createTestTask(projectId: string, title: string) {
  return await prisma.task.create({
    data: {
      title,
      projectId,
      status: 'TODO',
      priority: 'MEDIUM',
    },
  })
}

async function createDependencyTestSetup() {
  const owner = await createTestUser(`test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`, 'ADMIN')
  const project = await createTestProject(owner.id)
  const task1 = await createTestTask(project.id, 'Task 1')
  const task2 = await createTestTask(project.id, 'Task 2')
  return { owner, project, task1, task2 }
}
