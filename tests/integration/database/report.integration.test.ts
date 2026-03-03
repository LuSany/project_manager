/**
 * 报告生成集成测试
 *
 * 测试覆盖：
 * - 评审报告生成
 * - 报告服务
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

describe('报告生成集成测试', () => {
  setupTestDatabase()

  let testUser: { id: string }
  let testProject: { id: string }
  let testReviewType: { id: string }

  beforeEach(async () => {
    testUser = await createTestUser()
    testProject = await createTestProject(testUser.id)
    await createTestProjectMember(testProject.id, testUser.id, { role: 'PROJECT_OWNER' })
    testReviewType = await createTestReviewTypeConfig()
  })

  // ============================================
  // 评审报告测试
  // ============================================

  describe('评审报告生成', () => {
    it('应该能创建评审报告记录', async () => {
      const review = await createTestReview(testProject.id, testReviewType.id)

      const report = await testPrisma.reviewAiAnalysis.create({
        data: {
          reviewId: review.id,
          analysisType: 'SUMMARY',
          result: JSON.stringify({
            short: '评审总结',
            standard: '评审总结',
            detailed: '评审总结',
            keyPoints: ['要点1'],
            conclusion: '通过',
          }),
        },
      })

      expect(report).toBeDefined()
      expect(report.reviewId).toBe(review.id)

    it('应该能查询评审的报告', async () => {
      const review = await createTestReview(testProject.id, testReviewType.id)

      await testPrisma.reviewAiAnalysis.create({
        data: {
          reviewId: review.id,
          analysisType: 'SUMMARY',
          result: '{}',
        },
      })

      const analyses = await testPrisma.reviewAiAnalysis.findMany({
        where: { reviewId: review.id, analysisType: 'SUMMARY' },
      })

      expect(analyses.length).toBe(1)

    it('应该能更新报告内容', async () => {
      const review = await createTestReview(testProject.id, testReviewType.id)
      const report = await testPrisma.reviewAiAnalysis.create({
        data: {
          reviewId: review.id,
          analysisType: 'SUMMARY',
          result: '{}',
        },
      })

      const updated = await testPrisma.reviewAiAnalysis.update({
        where: { id: report.id },
        data: {
          result: JSON.stringify({ updated: true }),
        },
      })

      expect(updated.result).toContain('updated')
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

      const report = await testPrisma.reviewAiAnalysis.create({
        data: {
          reviewId: review.id,
          analysisType: 'SUMMARY',
          result: JSON.stringify(complexContent),
        },
      })

      const parsed = JSON.parse(report.result)
      expect(parsed.summary).toBe('本次评审通过')
      expect(parsed.items.length).toBe(2)
    })
  })
})
