/**
 * 评审管理补充集成测试
 *
 * 测试覆盖：
 * - 评审参与者管理
 * - 评审材料管理
 * - 评审状态流转
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestDatabase, testPrisma } from '../../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestReview,
  createTestReviewTypeConfig,
  createTestProjectMember,
} from '../../helpers/test-data-factory'

// ============================================
// 测试套件
// ============================================

describe('评审管理补充集成测试', () => {
  setupTestDatabase()

  let testUser: { id: string }
  let testProject: { id: string }
  let testReviewType: { id: string }
  let testReview: { id: string }

  beforeEach(async () => {
    testUser = await createTestUser()
    testProject = await createTestProject(testUser.id)
    await createTestProjectMember(testProject.id, testUser.id, { role: 'OWNER' })
    testReviewType = await createTestReviewTypeConfig()
    testReview = await createTestReview(testProject.id, testReviewType.id)
  })

  // ============================================
  // 评审参与者管理测试
  // ============================================

  describe('评审参与者管理', () => {
    it('应该能添加评审参与者', async () => {
      const participant = await testPrisma.reviewParticipant.create({
        data: {
          reviewId: testReview.id,
          userId: testUser.id,
          role: 'REVIEWER',
        },
      })

      expect(participant).toBeDefined()
      expect(participant.role).toBe('REVIEWER')
    })

    it('应该支持不同参与者角色', async () => {
      const organizer = await testPrisma.reviewParticipant.create({
        data: { reviewId: testReview.id, userId: testUser.id, role: 'ORGANIZER' },
      })
      const reviewer = await testPrisma.reviewParticipant.create({
        data: {
          reviewId: testReview.id,
          userId: (await createTestUser({ email: 'reviewer@example.com' })).id,
          role: 'REVIEWER',
        },
      })

      expect(organizer.role).toBe('ORGANIZER')
      expect(reviewer.role).toBe('REVIEWER')
    })

    it('应该能查询评审的所有参与者', async () => {
      const user2 = await createTestUser({ email: 'participant2@example.com' })
      await testPrisma.reviewParticipant.create({
        data: { reviewId: testReview.id, userId: testUser.id, role: 'ORGANIZER' },
      })
      await testPrisma.reviewParticipant.create({
        data: { reviewId: testReview.id, userId: user2.id, role: 'REVIEWER' },
      })

      const participants = await testPrisma.reviewParticipant.findMany({
        where: { reviewId: testReview.id },
      })

      expect(participants.length).toBe(2)
    })
  })

  // ============================================
  // 评审材料管理测试
  // ============================================

  describe('评审材料管理', () => {
    it('应该能上传评审材料', async () => {
      const material = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: testReview.id,
          fileId: 'file-123',
          fileName: '设计文档.pdf',
          fileType: 'application/pdf',
          fileSize: 1024000,
        },
      })

      expect(material).toBeDefined()
      expect(material.fileName).toBe('设计文档.pdf')
    })

    it('应该能查询评审的所有材料', async () => {
      await testPrisma.reviewMaterial.create({
        data: {
          reviewId: testReview.id,
          fileId: 'file-1',
          fileName: '文档1.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
        },
      })
      await testPrisma.reviewMaterial.create({
        data: {
          reviewId: testReview.id,
          fileId: 'file-2',
          fileName: '文档2.docx',
          fileType: 'application/docx',
          fileSize: 2048,
        },
      })

      const materials = await testPrisma.reviewMaterial.findMany({
        where: { reviewId: testReview.id },
      })

      expect(materials.length).toBe(2)
    })

    it('应该能删除评审材料', async () => {
      const material = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: testReview.id,
          fileId: 'file-to-delete',
          fileName: '待删除.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
        },
      })

      await testPrisma.reviewMaterial.delete({
        where: { id: material.id },
      })

      const materials = await testPrisma.reviewMaterial.findMany({
        where: { reviewId: testReview.id },
      })

      expect(materials.length).toBe(0)
    })
  })

  // ============================================
  // 评审状态流转测试
  // ============================================

  describe('评审状态流转', () => {
    it('应该支持 PENDING 状态', async () => {
      const review = await createTestReview(testProject.id, testReviewType.id, {
        status: 'PENDING',
      })
      expect(review.status).toBe('PENDING')
    })

    it('应该支持 IN_PROGRESS 状态', async () => {
      const updated = await testPrisma.review.update({
        where: { id: testReview.id },
        data: { status: 'IN_PROGRESS' },
      })
      expect(updated.status).toBe('IN_PROGRESS')
    })

    it('应该支持 COMPLETED 状态', async () => {
      const updated = await testPrisma.review.update({
        where: { id: testReview.id },
        data: { status: 'COMPLETED' },
      })
      expect(updated.status).toBe('COMPLETED')
    })

    it('应该支持 CANCELLED 状态', async () => {
      const updated = await testPrisma.review.update({
        where: { id: testReview.id },
        data: { status: 'CANCELLED' },
      })
      expect(updated.status).toBe('CANCELLED')
    })

    it('应该能按状态筛选评审', async () => {
      await createTestReview(testProject.id, testReviewType.id, { status: 'COMPLETED' })
      await createTestReview(testProject.id, testReviewType.id, { status: 'CANCELLED' })

      const pendingReviews = await testPrisma.review.findMany({
        where: { projectId: testProject.id, status: 'PENDING' },
      })

      expect(pendingReviews.length).toBe(1)
    })
  })

  // ============================================
  // 评审检查项测试
  // ============================================

  describe('评审检查项', () => {
    it('应该能创建评审检查项', async () => {
      const item = await testPrisma.reviewItem.create({
        data: {
          reviewId: testReview.id,
          title: '功能完整性检查',
          description: '检查功能是否完整实现',
          isRequired: true,
          order: 1,
        },
      })

      expect(item).toBeDefined()
      expect(item.title).toBe('功能完整性检查')
    })

    it('应该能查询评审的所有检查项', async () => {
      await testPrisma.reviewItem.create({
        data: { reviewId: testReview.id, title: '检查项1', order: 1 },
      })
      await testPrisma.reviewItem.create({
        data: { reviewId: testReview.id, title: '检查项2', order: 2 },
      })

      const items = await testPrisma.reviewItem.findMany({
        where: { reviewId: testReview.id },
        orderBy: { order: 'asc' },
      })

      expect(items.length).toBe(2)
    })
  })

  // ============================================
  // 评审标准测试
  // ============================================

  describe('评审标准', () => {
    it('应该能创建评审标准', async () => {
      const criterion = await testPrisma.reviewCriterion.create({
        data: {
          reviewId: testReview.id,
          title: '代码质量',
          description: '代码规范和质量评估',
          weight: 1.5,
          maxScore: 10,
          order: 1,
        },
      })

      expect(criterion).toBeDefined()
      expect(criterion.weight).toBe(1.5)
      expect(criterion.maxScore).toBe(10)
    })
  })
})
