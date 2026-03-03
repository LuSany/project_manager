/**
 * 需求管理补充集成测试
 *
 * 测试覆盖：
 * - 需求审批流程
 * - 需求验收管理
 * - 需求方案评估
 * - 需求波及分析
 * - 需求讨论
 * - 变更历史
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestDatabase, testPrisma } from '../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestRequirement,
  createTestProjectMember,
} from '../helpers/test-data-factory'

// ============================================
// 测试套件
// ============================================

describe('需求管理补充集成测试', () => {
  setupTestDatabase()

  let testUser: { id: string }
  let testProject: { id: string }
  let testRequirement: { id: string }

  beforeEach(async () => {
    testUser = await createTestUser()
    testProject = await createTestProject(testUser.id)
    await createTestProjectMember(testProject.id, testUser.id, { role: 'OWNER' })
    testRequirement = await createTestRequirement(testProject.id)
  })

  // ============================================
  // 需求审批流程测试
  // ============================================

  describe('需求审批流程', () => {
    it('应该能审批需求', async () => {
      const updated = await testPrisma.requirement.update({
        where: { id: testRequirement.id },
        data: {
          status: 'APPROVED',
          reviewedBy: testUser.id,
          reviewedAt: new Date(),
        },
      })

      expect(updated.status).toBe('APPROVED')
      expect(updated.reviewedBy).toBe(testUser.id)
    })

    it('应该能拒绝需求', async () => {
      const updated = await testPrisma.requirement.update({
        where: { id: testRequirement.id },
        data: {
          status: 'REJECTED',
          reviewedBy: testUser.id,
          reviewedAt: new Date(),
          rejectReason: '需求不明确',
        },
      })

      expect(updated.status).toBe('REJECTED')
      expect(updated.rejectReason).toBe('需求不明确')
    })

    it('应该能按状态筛选需求', async () => {
      await createTestRequirement(testProject.id, { status: 'APPROVED' })
      await createTestRequirement(testProject.id, { status: 'REJECTED' })

      const approvedRequirements = await testPrisma.requirement.findMany({
        where: { projectId: testProject.id, status: 'APPROVED' },
      })

      expect(approvedRequirements.length).toBe(1)
    })
  })

  // ============================================
  // 需求验收管理测试
  // ============================================

  describe('需求验收管理', () => {
    it('应该能创建需求验收记录', async () => {
      const acceptance = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: testRequirement.id,
          userId: testUser.id,
          result: 'PASS',
          notes: '验收通过',
        },
      })

      expect(acceptance).toBeDefined()
      expect(acceptance.result).toBe('PASS')
    })

    it('应该能查询需求的所有验收记录', async () => {
      const user2 = await createTestUser({ email: 'acceptor2@example.com' })

      await testPrisma.requirementAcceptance.create({
        data: { requirementId: testRequirement.id, userId: testUser.id, result: 'PASS' },
      })
      await testPrisma.requirementAcceptance.create({
        data: { requirementId: testRequirement.id, userId: user2.id, result: 'FAIL' },
      })

      const acceptances = await testPrisma.requirementAcceptance.findMany({
        where: { requirementId: testRequirement.id },
      })

      expect(acceptances.length).toBe(2)
    })
  })

  // ============================================
  // 需求方案评估测试
  // ============================================

  describe('需求方案评估', () => {
    it('应该能创建需求方案', async () => {
      const proposal = await testPrisma.proposal.create({
        data: {
          requirementId: testRequirement.id,
          userId: testUser.id,
          content: '技术方案描述',
          estimatedHours: 40,
          estimatedCost: 5000,
          status: 'PENDING',
        },
      })

      expect(proposal).toBeDefined()
      expect(proposal.estimatedHours).toBe(40)
    })

    it('应该能查询需求的所有方案', async () => {
      await testPrisma.proposal.create({
        data: {
          requirementId: testRequirement.id,
          userId: testUser.id,
          content: '方案1',
          status: 'PENDING',
        },
      })

      const proposals = await testPrisma.proposal.findMany({
        where: { requirementId: testRequirement.id },
      })

      expect(proposals.length).toBe(1)
    })

    it('应该能更新方案状态', async () => {
      const proposal = await testPrisma.proposal.create({
        data: {
          requirementId: testRequirement.id,
          userId: testUser.id,
          content: '待审核方案',
          status: 'PENDING',
        },
      })

      const updated = await testPrisma.proposal.update({
        where: { id: proposal.id },
        data: { status: 'APPROVED' },
      })

      expect(updated.status).toBe('APPROVED')
    })
  })

  // ============================================
  // 需求波及分析测试
  // ============================================

  describe('需求波及分析', () => {
    it('应该能创建波及影响记录', async () => {
      const impact = await testPrisma.requirementImpact.create({
        data: {
          requirementId: testRequirement.id,
          description: '影响用户登录模块',
          severity: 'HIGH',
        },
      })

      expect(impact).toBeDefined()
      expect(impact.severity).toBe('HIGH')
    })

    it('应该能查询需求的所有波及影响', async () => {
      await testPrisma.requirementImpact.create({
        data: { requirementId: testRequirement.id, description: '影响1', severity: 'HIGH' },
      })
      await testPrisma.requirementImpact.create({
        data: { requirementId: testRequirement.id, description: '影响2', severity: 'LOW' },
      })

      const impacts = await testPrisma.requirementImpact.findMany({
        where: { requirementId: testRequirement.id },
      })

      expect(impacts.length).toBe(2)
    })
  })

  // ============================================
  // 需求讨论测试
  // ============================================

  describe('需求讨论', () => {
    it('应该能创建需求讨论', async () => {
      const discussion = await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: testRequirement.id,
          userId: testUser.id,
          content: '关于需求的讨论内容',
        },
      })

      expect(discussion).toBeDefined()
      expect(discussion.content).toBe('关于需求的讨论内容')
    })

    it('应该能查询需求的所有讨论', async () => {
      await testPrisma.requirementDiscussion.create({
        data: { requirementId: testRequirement.id, userId: testUser.id, content: '讨论1' },
      })
      await testPrisma.requirementDiscussion.create({
        data: { requirementId: testRequirement.id, userId: testUser.id, content: '讨论2' },
      })

      const discussions = await testPrisma.requirementDiscussion.findMany({
        where: { requirementId: testRequirement.id },
        orderBy: { createdAt: 'asc' },
      })

      expect(discussions.length).toBe(2)
    })
  })

  // ============================================
  // 变更历史测试
  // ============================================

  describe('需求变更历史', () => {
    it('应该能创建变更历史记录', async () => {
      const history = await testPrisma.requirementHistory.create({
        data: {
          requirementId: testRequirement.id,
          changeType: 'STATUS_CHANGE',
          oldValue: 'PENDING',
          newValue: 'APPROVED',
          changedBy: testUser.id,
          changeReason: '审批通过',
        },
      })

      expect(history).toBeDefined()
      expect(history.changeType).toBe('STATUS_CHANGE')
    })

    it('应该能查询需求的完整变更历史', async () => {
      await testPrisma.requirementHistory.create({
        data: {
          requirementId: testRequirement.id,
          changeType: 'CREATE',
          oldValue: null,
          newValue: '需求创建',
          changedBy: testUser.id,
        },
      })
      await testPrisma.requirementHistory.create({
        data: {
          requirementId: testRequirement.id,
          changeType: 'UPDATE',
          oldValue: '原标题',
          newValue: '新标题',
          changedBy: testUser.id,
        },
      })

      const history = await testPrisma.requirementHistory.findMany({
        where: { requirementId: testRequirement.id },
        orderBy: { createdAt: 'asc' },
      })

      expect(history.length).toBe(2)
    })
  })
})
