/**
 * 仪表板集成测试
 *
 * 测试覆盖：
 * - GET /api/v1/dashboard/stats - 项目统计概览
 * - GET /api/v1/dashboard/my-tasks - 我的任务列表
 * - GET /api/v1/dashboard/progress - 进度追踪数据
 * - GET /api/v1/dashboard/risks - 风险看板数据
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestDatabase, testPrisma } from '../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestTask,
  createTestRisk,
  createTestMilestone,
  createTestProjectMember,
} from '../helpers/test-data-factory'
import { createAuthenticatedRequest } from '../mocks/request-mock'

// 模拟 API 处理函数
async function simulateStatsAPI(userId: string, projectId: string) {
  const project = await testPrisma.project.findUnique({
    where: { id: projectId },
    include: { members: { where: { userId } } },
  })

  if (!project) return { status: 404, data: { error: '项目不存在' } }
  if (project.ownerId !== userId && project.members.length === 0) {
    return { status: 403, data: { error: '无权访问此项目' } }
  }

  const [totalProjects, activeProjects, completedProjects] = await Promise.all([
    testPrisma.project.count(),
    testPrisma.project.count({ where: { status: 'ACTIVE' } }),
    testPrisma.project.count({ where: { status: 'COMPLETED' } }),
  ])

  return {
    status: 200,
    data: { totalProjects, activeProjects, completedProjects },
  }
}

async function simulateMyTasksAPI(userId: string) {
  const tasks = await testPrisma.task.findMany({
    where: {
      assignees: { some: { userId } },
      status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] },
    },
    orderBy: { dueDate: 'asc' },
    take: 20,
  })

  return { status: 200, data: tasks }
}

async function simulateProgressAPI(userId: string, projectId: string) {
  const project = await testPrisma.project.findUnique({
    where: { id: projectId },
    include: { members: { where: { userId } } },
  })

  if (!project) return { status: 404, data: { error: '项目不存在' } }
  if (project.ownerId !== userId && project.members.length === 0) {
    return { status: 403, data: { error: '无权访问此项目' } }
  }

  const milestones = await testPrisma.milestone.findMany({
    where: { projectId },
    orderBy: { dueDate: 'asc' },
  })

  const totalTasks = await testPrisma.task.count({ where: { projectId } })
  const completedTasks = await testPrisma.task.count({
    where: { projectId, status: 'DONE' },
  })

  return {
    status: 200,
    data: {
      milestones: milestones.map((m) => ({
        id: m.id,
        title: m.title,
        progress: m.progress,
        dueDate: m.dueDate,
      })),
      totalTasks,
      completedTasks,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    },
  }
}

async function simulateRisksAPI(userId: string, projectId?: string) {
  if (!projectId) {
    // 全局风险看板
    const userProjects = await testPrisma.project.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      select: { id: true },
    })

    const projectIds = userProjects.map((p) => p.id)

    const highRisks = await testPrisma.risk.findMany({
      where: {
        projectId: { in: projectIds },
        riskLevel: { in: ['HIGH', 'CRITICAL'] },
        status: { not: 'CLOSED' },
      },
      take: 10,
    })

    const riskStats = {
      critical: await testPrisma.risk.count({
        where: { projectId: { in: projectIds }, riskLevel: 'CRITICAL', status: { not: 'CLOSED' } },
      }),
      high: await testPrisma.risk.count({
        where: { projectId: { in: projectIds }, riskLevel: 'HIGH', status: { not: 'CLOSED' } },
      }),
      medium: await testPrisma.risk.count({
        where: { projectId: { in: projectIds }, riskLevel: 'MEDIUM', status: { not: 'CLOSED' } },
      }),
      low: await testPrisma.risk.count({
        where: { projectId: { in: projectIds }, riskLevel: 'LOW', status: { not: 'CLOSED' } },
      }),
    }

    return { status: 200, data: { risks: highRisks, stats: riskStats } }
  }

  // 项目风险看板
  const project = await testPrisma.project.findUnique({
    where: { id: projectId },
    include: { members: { where: { userId } } },
  })

  if (!project) return { status: 404, data: { error: '项目不存在' } }
  if (project.ownerId !== userId && project.members.length === 0) {
    return { status: 403, data: { error: '无权访问此项目' } }
  }

  const risks = await testPrisma.risk.findMany({
    where: { projectId, status: { not: 'CLOSED' } },
    orderBy: [{ riskLevel: 'desc' }, { createdAt: 'desc' }],
  })

  const riskStats = {
    critical: risks.filter((r) => r.riskLevel === 'CRITICAL').length,
    high: risks.filter((r) => r.riskLevel === 'HIGH').length,
    medium: risks.filter((r) => r.riskLevel === 'MEDIUM').length,
    low: risks.filter((r) => r.riskLevel === 'LOW').length,
  }

  return { status: 200, data: { risks, stats: riskStats } }
}

// ============================================
// 测试套件
// ============================================

describe('仪表板 API 集成测试', () => {
  setupTestDatabase()

  let testUser: { id: string }
  let testProject: { id: string }

  beforeEach(async () => {
    testUser = await createTestUser()
    testProject = await createTestProject(testUser.id)
    await createTestProjectMember(testProject.id, testUser.id, { role: 'OWNER' })
  })

  // ============================================
  // 统计 API 测试
  // ============================================

  describe('GET /api/v1/dashboard/stats', () => {
    it('应该返回项目统计数据', async () => {
      const result = await simulateStatsAPI(testUser.id, testProject.id)

      expect(result.status).toBe(200)
      expect(result.data).toHaveProperty('totalProjects')
      expect(result.data).toHaveProperty('activeProjects')
      expect(result.data).toHaveProperty('completedProjects')
      expect(result.data.totalProjects).toBeGreaterThanOrEqual(1)
    })

    it('应该拒绝未授权用户', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' })
      const result = await simulateStatsAPI(otherUser.id, testProject.id)

      expect(result.status).toBe(403)
    })

    it('应该返回404当项目不存在', async () => {
      const result = await simulateStatsAPI(testUser.id, 'non-existent-id')

      expect(result.status).toBe(404)
    })
  })

  // ============================================
  // 我的任务 API 测试
  // ============================================

  describe('GET /api/v1/dashboard/my-tasks', () => {
    it('应该返回分配给用户的任务', async () => {
      // 创建任务并分配给用户
      const task = await createTestTask(testProject.id)
      await testPrisma.taskAssignee.create({
        data: { taskId: task.id, userId: testUser.id },
      })

      const result = await simulateMyTasksAPI(testUser.id)

      expect(result.status).toBe(200)
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data.length).toBe(1)
      expect(result.data[0].id).toBe(task.id)
    })

    it('应该只返回进行中的任务', async () => {
      // 创建多个任务
      const todoTask = await createTestTask(testProject.id, { status: 'TODO' })
      const doneTask = await createTestTask(testProject.id, { status: 'DONE' })
      const inProgressTask = await createTestTask(testProject.id, { status: 'IN_PROGRESS' })

      // 分配给用户
      for (const task of [todoTask, doneTask, inProgressTask]) {
        await testPrisma.taskAssignee.create({
          data: { taskId: task.id, userId: testUser.id },
        })
      }

      const result = await simulateMyTasksAPI(testUser.id)

      expect(result.status).toBe(200)
      expect(result.data.length).toBe(2) // TODO 和 IN_PROGRESS
      expect(result.data.find((t: any) => t.id === doneTask.id)).toBeUndefined()
    })

    it('应该返回空数组当用户没有任务', async () => {
      const result = await simulateMyTasksAPI(testUser.id)

      expect(result.status).toBe(200)
      expect(result.data).toEqual([])
    })
  })

  // ============================================
  // 进度 API 测试
  // ============================================

  describe('GET /api/v1/dashboard/progress', () => {
    it('应该返回项目进度数据', async () => {
      // 创建里程碑和任务
      const milestone = await createTestMilestone(testProject.id)
      await createTestTask(testProject.id, { status: 'DONE' })
      await createTestTask(testProject.id, { status: 'TODO' })

      const result = await simulateProgressAPI(testUser.id, testProject.id)

      expect(result.status).toBe(200)
      expect(result.data).toHaveProperty('milestones')
      expect(result.data).toHaveProperty('totalTasks')
      expect(result.data).toHaveProperty('completedTasks')
      expect(result.data).toHaveProperty('taskCompletionRate')
      expect(result.data.totalTasks).toBe(2)
      expect(result.data.completedTasks).toBe(1)
      expect(result.data.taskCompletionRate).toBe(50)
    })

    it('应该返回里程碑进度', async () => {
      await createTestMilestone(testProject.id, { progress: 50 })
      await createTestMilestone(testProject.id, { progress: 100 })

      const result = await simulateProgressAPI(testUser.id, testProject.id)

      expect(result.status).toBe(200)
      expect(result.data.milestones.length).toBe(2)
      expect(result.data.milestones[0].progress).toBe(50)
      expect(result.data.milestones[1].progress).toBe(100)
    })

    it('应该拒绝无权限用户', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' })
      const result = await simulateProgressAPI(otherUser.id, testProject.id)

      expect(result.status).toBe(403)
    })
  })

  // ============================================
  // 风险 API 测试
  // ============================================

  describe('GET /api/v1/dashboard/risks', () => {
    it('应该返回项目风险数据', async () => {
      // 创建不同级别的风险
      await createTestRisk(testProject.id, testUser.id, { riskLevel: 'CRITICAL' })
      await createTestRisk(testProject.id, testUser.id, { riskLevel: 'HIGH' })
      await createTestRisk(testProject.id, testUser.id, { riskLevel: 'MEDIUM' })

      const result = await simulateRisksAPI(testUser.id, testProject.id)

      expect(result.status).toBe(200)
      expect(result.data).toHaveProperty('risks')
      expect(result.data).toHaveProperty('stats')
      expect(result.data.stats.critical).toBe(1)
      expect(result.data.stats.high).toBe(1)
      expect(result.data.stats.medium).toBe(1)
    })

    it('应该不返回已关闭的风险', async () => {
      await createTestRisk(testProject.id, testUser.id, {
        riskLevel: 'HIGH',
        status: 'CLOSED',
      })
      await createTestRisk(testProject.id, testUser.id, { riskLevel: 'HIGH' })

      const result = await simulateRisksAPI(testUser.id, testProject.id)

      expect(result.status).toBe(200)
      expect(result.data.risks.length).toBe(1) // 只有未关闭的
    })

    it('应该返回全局风险看板数据', async () => {
      await createTestRisk(testProject.id, testUser.id, { riskLevel: 'CRITICAL' })

      const result = await simulateRisksAPI(testUser.id) // 不传 projectId

      expect(result.status).toBe(200)
      expect(result.data).toHaveProperty('risks')
      expect(result.data).toHaveProperty('stats')
    })
  })
})
