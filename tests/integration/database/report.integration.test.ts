/**
 * 报告生成集成测试
 *
 * 测试覆盖：
 * - 评审报告生成
 * - 报告服务
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestDatabase, testPrisma } from '../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestReview,
  createTestReviewTypeConfig,
  createTestProjectMember,
} from '../helpers/test-data-factory'

// ============================================
// 测试套件
// ============================================

describe('报告生成集成测试', () => {
  setupTestDatabase()

  let testUser: { id: string }
  let testProject: { id: string }
  let testReviewType: { id: string }

  beforeEach(async () => {
    testUser = await createTestUser()
    testProject = await createTestProject(testUser.id)
    await createTestProjectMember(testProject.id, testUser.id, { role: 'OWNER' })
    testReviewType = await createTestReviewTypeConfig()
  })

  // ============================================
  // 评审报告测试
  // ============================================

  describe('评审报告生成', () => {
    it('应该能创建评审报告记录', async () => {
      const review = await createTestReview(testProject.id, testReviewType.id)

      const report = await testPrisma.reviewReport.create({
        data: {
          reviewId: review.id,
          generatedBy: testUser.id,
          content: JSON.stringify({
            summary: '评审总结',
            conclusion: '通过',
          }),
        },
      })

      expect(report).toBeDefined()
      expect(report.reviewId).toBe(review.id)
    })

    it('应该能查询评审的报告', async () => {
      const review = await createTestReview(testProject.id, testReviewType.id)

      await testPrisma.reviewReport.create({
        data: {
          reviewId: review.id,
          generatedBy: testUser.id,
          content: '{}',
        },
      })

      const reports = await testPrisma.reviewReport.findMany({
        where: { reviewId: review.id },
      })

      expect(reports.length).toBe(1)
    })

    it('应该能更新报告内容', async () => {
      const review = await createTestReview(testProject.id, testReviewType.id)
      const report = await testPrisma.reviewReport.create({
        data: {
          reviewId: review.id,
          generatedBy: testUser.id,
          content: '{}',
        },
      })

      const updated = await testPrisma.reviewReport.update({
        where: { id: report.id },
        data: {
          content: JSON.stringify({ updated: true }),
        },
      })

      expect(updated.content).toContain('updated')
    })
  })

  // ============================================
  // 报告内容测试
  // ============================================

  describe('报告内容', () => {
    it('应该能存储复杂报告内容', async () => {
      const review = await createTestReview(testProject.id, testReviewType.id)

      const complexContent = {
        summary: '本次评审通过',
        items: [
          { title: '功能完整性', score: 90 },
          { title: '代码质量', score: 85 },
        ],
        risks: ['风险1', '风险2'],
        conclusion: '建议通过',
      }

      const report = await testPrisma.reviewReport.create({
        data: {
          reviewId: review.id,
          generatedBy: testUser.id,
          content: JSON.stringify(complexContent),
        },
      })

      const parsed = JSON.parse(report.content)
      expect(parsed.summary).toBe('本次评审通过')
      expect(parsed.items.length).toBe(2)
    })
  })
})
