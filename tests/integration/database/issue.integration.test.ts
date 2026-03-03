/**
 * 问题管理集成测试
 *
 * 测试覆盖：
 * - 问题 CRUD 操作
 * - 问题解决流程
 * - 问题关联需求
 * - 问题状态管理
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestDatabase, testPrisma } from '../../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestIssue,
  createTestRequirement,
  createTestProjectMember,
} from '../../helpers/test-data-factory'

// ============================================
// 测试套件
// ============================================

describe('问题管理集成测试', () => {
  setupTestDatabase()

  let testUser: { id: string }
  let testProject: { id: string }
  let testIssue: { id: string }

  beforeEach(async () => {
    testUser = await createTestUser()
    testProject = await createTestProject(testUser.id)
    await createTestProjectMember(testProject.id, testUser.id, { role: 'OWNER' })
    testIssue = await createTestIssue(testProject.id)
  })

  // ============================================
  // 问题 CRUD 测试
  // ============================================

  describe('问题 CRUD 操作', () => {
    it('应该能创建问题', async () => {
      expect(testIssue).toBeDefined()
      expect(testIssue.status).toBe('OPEN')
    })

    it('应该能获取项目的问题列表', async () => {
      await createTestIssue(testProject.id)
      await createTestIssue(testProject.id)

      const issues = await testPrisma.issue.findMany({
        where: { projectId: testProject.id },
      })

      expect(issues.length).toBe(3)
    })

    it('应该能更新问题', async () => {
      const updated = await testPrisma.issue.update({
        where: { id: testIssue.id },
        data: { title: '更新后的问题标题' },
      })

      expect(updated.title).toBe('更新后的问题标题')
    })

    it('应该能删除问题', async () => {
      await testPrisma.issue.delete({
        where: { id: testIssue.id },
      })

      const found = await testPrisma.issue.findUnique({
        where: { id: testIssue.id },
      })

      expect(found).toBeNull()
    })
  })

  // ============================================
  // 问题状态管理测试
  // ============================================

  describe('问题状态管理', () => {
    it('应该支持 IN_PROGRESS 状态', async () => {
      const updated = await testPrisma.issue.update({
        where: { id: testIssue.id },
        data: { status: 'IN_PROGRESS' },
      })
      expect(updated.status).toBe('IN_PROGRESS')
    })

    it('应该支持 RESOLVED 状态', async () => {
      const updated = await testPrisma.issue.update({
        where: { id: testIssue.id },
        data: { status: 'RESOLVED', resolvedAt: new Date() },
      })
      expect(updated.status).toBe('RESOLVED')
    })

    it('应该支持 CLOSED 状态', async () => {
      const updated = await testPrisma.issue.update({
        where: { id: testIssue.id },
        data: { status: 'CLOSED' },
      })
      expect(updated.status).toBe('CLOSED')
    })

    it('应该能按状态筛选问题', async () => {
      await createTestIssue(testProject.id, { status: 'RESOLVED' })

      const openIssues = await testPrisma.issue.findMany({
        where: { projectId: testProject.id, status: 'OPEN' },
      })

      expect(openIssues.length).toBe(1)
    })
  })

  // ============================================
  // 问题解决流程测试
  // ============================================

  describe('问题解决流程', () => {
    it('应该能标记问题为已解决', async () => {
      const updated = await testPrisma.issue.update({
        where: { id: testIssue.id },
        data: { status: 'RESOLVED', resolvedAt: new Date() },
      })

      expect(updated.status).toBe('RESOLVED')
      expect(updated.resolvedAt).toBeDefined()
    })
  })

  // ============================================
  // 问题关联需求测试
  // ============================================

  describe('问题关联需求', () => {
    it('应该能关联问题到需求', async () => {
      const requirement = await createTestRequirement(testProject.id)

      const updated = await testPrisma.issue.update({
        where: { id: testIssue.id },
        data: { requirementId: requirement.id },
      })

      expect(updated.requirementId).toBe(requirement.id)
    })

    it('应该能查询需求关联的所有问题', async () => {
      const requirement = await createTestRequirement(testProject.id)

      await testPrisma.issue.update({
        where: { id: testIssue.id },
        data: { requirementId: requirement.id },
      })

      const linkedIssues = await testPrisma.issue.findMany({
        where: { requirementId: requirement.id },
      })

      expect(linkedIssues.length).toBe(1)
    })
  })

  // ============================================
  // 问题优先级测试
  // ============================================

  describe('问题优先级', () => {
    it('应该支持不同优先级', async () => {
      const critical = await createTestIssue(testProject.id, { priority: 'CRITICAL' })
      const high = await createTestIssue(testProject.id, { priority: 'HIGH' })
      const low = await createTestIssue(testProject.id, { priority: 'LOW' })

      expect(critical.priority).toBe('CRITICAL')
      expect(high.priority).toBe('HIGH')
      expect(low.priority).toBe('LOW')
    })
  })
})
