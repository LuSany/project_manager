/**
 * 风险管理补充集成测试
 *
 * 测试覆盖：
 * - 风险详情查询
 * - 风险任务关联
 * - 风险类别/等级/状态
 * - 风险缓解措施
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestDatabase, testPrisma } from '../../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestRisk,
  createTestTask,
  createTestProjectMember,
} from '../../helpers/test-data-factory'

// ============================================
// 测试套件
// ============================================

describe('风险管理补充集成测试', () => {
  setupTestDatabase()

  let testUser: { id: string }
  let testProject: { id: string }
  let testRisk: { id: string }

  beforeEach(async () => {
    testUser = await createTestUser()
    testProject = await createTestProject(testUser.id)
    await createTestProjectMember(testProject.id, testUser.id, { role: 'OWNER' })
    testRisk = await createTestRisk(testProject.id, testUser.id)
  })

  // ============================================
  // 风险详情测试
  // ============================================

  describe('风险详情查询', () => {
    it('应该能获取风险详情', async () => {
      const risk = await testPrisma.risk.findUnique({
        where: { id: testRisk.id },
        include: { owner: true, project: true },
      })

      expect(risk).toBeDefined()
      expect(risk?.title).toBe(testRisk.title)
      expect(risk?.owner.id).toBe(testUser.id)
    })

    it('应该能获取风险的项目信息', async () => {
      const risk = await testPrisma.risk.findUnique({
        where: { id: testRisk.id },
        include: { project: true },
      })

      expect(risk?.project.id).toBe(testProject.id)
    })

    it('应该能获取风险的负责人信息', async () => {
      const risk = await testPrisma.risk.findUnique({
        where: { id: testRisk.id },
        include: { owner: { select: { id: true, name: true, email: true } } },
      })

      expect(risk?.owner.id).toBe(testUser.id)
    })
  })

  // ============================================
  // 风险类别测试
  // ============================================

  describe('风险类别', () => {
    it('应该支持 TECHNICAL 类别', async () => {
      const risk = await createTestRisk(testProject.id, testUser.id, { category: 'TECHNICAL' })
      expect(risk.category).toBe('TECHNICAL')
    })

    it('应该支持 SCHEDULE 类别', async () => {
      const risk = await createTestRisk(testProject.id, testUser.id, { category: 'SCHEDULE' })
      expect(risk.category).toBe('SCHEDULE')
    })

    it('应该支持 RESOURCE 类别', async () => {
      const risk = await createTestRisk(testProject.id, testUser.id, { category: 'RESOURCE' })
      expect(risk.category).toBe('RESOURCE')
    })

    it('应该支持 BUDGET 类别', async () => {
      const risk = await createTestRisk(testProject.id, testUser.id, { category: 'BUDGET' })
      expect(risk.category).toBe('BUDGET')
    })

    it('应该支持 EXTERNAL 类别', async () => {
      const risk = await createTestRisk(testProject.id, testUser.id, { category: 'EXTERNAL' })
      expect(risk.category).toBe('EXTERNAL')
    })

    it('应该支持 MANAGEMENT 类别', async () => {
      const risk = await createTestRisk(testProject.id, testUser.id, { category: 'MANAGEMENT' })
      expect(risk.category).toBe('MANAGEMENT')
    })

    it('应该能按类别筛选风险', async () => {
      await createTestRisk(testProject.id, testUser.id, { category: 'TECHNICAL' })
      await createTestRisk(testProject.id, testUser.id, { category: 'SCHEDULE' })

      const technicalRisks = await testPrisma.risk.findMany({
        where: { projectId: testProject.id, category: 'TECHNICAL' },
      })

      expect(technicalRisks.length).toBe(1)
    })
  })

  // ============================================
  // 风险等级测试
  // ============================================

  describe('风险等级', () => {
    it('应该支持 LOW 等级', async () => {
      const risk = await createTestRisk(testProject.id, testUser.id, { riskLevel: 'LOW' })
      expect(risk.riskLevel).toBe('LOW')
    })

    it('应该支持 MEDIUM 等级', async () => {
      const risk = await createTestRisk(testProject.id, testUser.id, { riskLevel: 'MEDIUM' })
      expect(risk.riskLevel).toBe('MEDIUM')
    })

    it('应该支持 HIGH 等级', async () => {
      const risk = await createTestRisk(testProject.id, testUser.id, { riskLevel: 'HIGH' })
      expect(risk.riskLevel).toBe('HIGH')
    })

    it('应该支持 CRITICAL 等级', async () => {
      const risk = await createTestRisk(testProject.id, testUser.id, { riskLevel: 'CRITICAL' })
      expect(risk.riskLevel).toBe('CRITICAL')
    })

    it('应该能按等级筛选风险', async () => {
      await createTestRisk(testProject.id, testUser.id, { riskLevel: 'CRITICAL' })
      await createTestRisk(testProject.id, testUser.id, { riskLevel: 'LOW' })

      const criticalRisks = await testPrisma.risk.findMany({
        where: { projectId: testProject.id, riskLevel: 'CRITICAL' },
      })

      expect(criticalRisks.length).toBe(1)
    })
  })

  // ============================================
  // 风险状态测试
  // ============================================

  describe('风险状态', () => {
    it('应该支持 IDENTIFIED 状态', async () => {
      const risk = await createTestRisk(testProject.id, testUser.id, { status: 'IDENTIFIED' })
      expect(risk.status).toBe('IDENTIFIED')
    })

    it('应该支持 ANALYZING 状态', async () => {
      const updated = await testPrisma.risk.update({
        where: { id: testRisk.id },
        data: { status: 'ANALYZING' },
      })
      expect(updated.status).toBe('ANALYZING')
    })

    it('应该支持 MITIGATING 状态', async () => {
      const updated = await testPrisma.risk.update({
        where: { id: testRisk.id },
        data: { status: 'MITIGATING' },
      })
      expect(updated.status).toBe('MITIGATING')
    })

    it('应该支持 MONITORING 状态', async () => {
      const updated = await testPrisma.risk.update({
        where: { id: testRisk.id },
        data: { status: 'MONITORING' },
      })
      expect(updated.status).toBe('MONITORING')
    })

    it('应该支持 RESOLVED 状态', async () => {
      const updated = await testPrisma.risk.update({
        where: { id: testRisk.id },
        data: { status: 'RESOLVED', resolvedDate: new Date() },
      })
      expect(updated.status).toBe('RESOLVED')
      expect(updated.resolvedDate).toBeDefined()
    })

    it('应该支持 CLOSED 状态', async () => {
      const updated = await testPrisma.risk.update({
        where: { id: testRisk.id },
        data: { status: 'CLOSED' },
      })
      expect(updated.status).toBe('CLOSED')
    })
  })

  // ============================================
  // 风险任务关联测试
  // ============================================

  describe('风险任务关联', () => {
    let testTask: { id: string }

    beforeEach(async () => {
      testTask = await createTestTask(testProject.id)
    })

    it('应该能关联任务到风险', async () => {
      const riskTask = await testPrisma.riskTask.create({
        data: {
          riskId: testRisk.id,
          taskId: testTask.id,
          relationType: 'RELATED',
        },
      })

      expect(riskTask).toBeDefined()
      expect(riskTask.relationType).toBe('RELATED')
    })

    it('应该支持不同的关联类型', async () => {
      const causesTask = await testPrisma.riskTask.create({
        data: {
          riskId: testRisk.id,
          taskId: testTask.id,
          relationType: 'CAUSES',
        },
      })

      const mitigatesTask = await testPrisma.riskTask.create({
        data: {
          riskId: testRisk.id,
          taskId: (await createTestTask(testProject.id)).id,
          relationType: 'MITIGATES',
        },
      })

      expect(causesTask.relationType).toBe('CAUSES')
      expect(mitigatesTask.relationType).toBe('MITIGATES')
    })

    it('应该能查询风险的所有关联任务', async () => {
      await testPrisma.riskTask.create({
        data: { riskId: testRisk.id, taskId: testTask.id },
      })

      const riskTasks = await testPrisma.riskTask.findMany({
        where: { riskId: testRisk.id },
        include: { task: true },
      })

      expect(riskTasks.length).toBe(1)
    })

    it('应该能删除风险任务关联', async () => {
      const riskTask = await testPrisma.riskTask.create({
        data: { riskId: testRisk.id, taskId: testTask.id },
      })

      await testPrisma.riskTask.delete({
        where: { id: riskTask.id },
      })

      const remaining = await testPrisma.riskTask.findMany({
        where: { riskId: testRisk.id },
      })
      expect(remaining.length).toBe(0)
    })
  })

  // ============================================
  // 风险缓解措施测试
  // ============================================

  describe('风险缓解措施', () => {
    it('应该能设置缓解措施', async () => {
      const updated = await testPrisma.risk.update({
        where: { id: testRisk.id },
        data: { mitigation: '增加代码审查频率' },
      })

      expect(updated.mitigation).toBe('增加代码审查频率')
    })

    it('应该能设置应急预案', async () => {
      const updated = await testPrisma.risk.update({
        where: { id: testRisk.id },
        data: { contingency: '准备备用服务器' },
      })

      expect(updated.contingency).toBe('准备备用服务器')
    })

    it('应该能设置进度', async () => {
      const updated = await testPrisma.risk.update({
        where: { id: testRisk.id },
        data: { progress: 50 },
      })

      expect(updated.progress).toBe(50)
    })
  })
})
