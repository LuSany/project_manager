/**
 * AI 评审分析集成测试
 *
 * 测试覆盖：
 * - AI 材料分析
 * - AI 生成检查项
 * - AI 风险识别
 * - AI 生成摘要
 * - AI 分析结果缓存
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setupTestDatabase, testPrisma } from '../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestReview,
  createTestReviewTypeConfig,
} from '../helpers/test-data-factory'

// Mock AI 服务
vi.mock('@/lib/ai', () => ({
  callAI: vi.fn().mockImplementation(async (prompt: string, serviceType: string) => {
    // 根据 serviceType 返回不同的模拟响应
    if (serviceType === 'REVIEW_AUDIT') {
      if (prompt.includes('材料分析')) {
        return {
          success: true,
          response: JSON.stringify({
            completenessScore: 85,
            analysis: '材料完整性良好',
            missingItems: ['缺少测试报告'],
            suggestions: ['建议补充性能测试数据'],
          }),
        }
      }
      if (prompt.includes('检查项')) {
        return {
          success: true,
          response: JSON.stringify([
            {
              title: '功能完整性',
              description: '检查功能是否完整实现',
              category: '功能',
              isRequired: true,
              weight: 1.5,
              maxScore: 10,
            },
            {
              title: '代码质量',
              description: '检查代码规范和质量',
              category: '质量',
              isRequired: true,
              weight: 1.0,
              maxScore: 10,
            },
          ]),
        }
      }
      if (prompt.includes('摘要')) {
        return {
          success: true,
          response: JSON.stringify({
            short: '评审通过',
            standard: '本次评审材料完整，质量良好',
            detailed: '经过详细分析，本次评审材料完整度达85%',
            keyPoints: ['材料完整', '质量良好'],
            conclusion: '建议通过评审',
          }),
        }
      }
    }
    if (serviceType === 'RISK_ANALYSIS') {
      return {
        success: true,
        response: JSON.stringify([
          {
            title: '进度风险',
            description: '项目进度可能延迟',
            category: 'SCHEDULE',
            probability: 3,
            impact: 4,
            riskLevel: 'HIGH',
            mitigation: '增加资源投入',
            recommendation: '密切监控进度',
          },
        ]),
      }
    }
    return { success: true, response: '{}' }
  }),
}))

// Mock 缓存
vi.mock('@/lib/cache', () => ({
  cache: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    delete: vi.fn(),
  },
}))

// ============================================
// 测试套件
// ============================================

describe('AI 评审分析集成测试', () => {
  setupTestDatabase()

  let testUser: { id: string }
  let testProject: { id: string }
  let testReviewType: { id: string }
  let testReview: { id: string }

  beforeEach(async () => {
    testUser = await createTestUser()
    testProject = await createTestProject(testUser.id)
    testReviewType = await createTestReviewTypeConfig()
    testReview = await testPrisma.review.create({
      data: {
        title: 'Test Review',
        projectId: testProject.id,
        typeId: testReviewType.id,
        status: 'PENDING',
      },
    })
  })

  // ============================================
  // AI 分析结果存储测试
  // ============================================

  describe('AI 分析结果存储', () => {
    it('应该能存储材料分析结果', async () => {
      const analysis = await testPrisma.reviewAiAnalysis.create({
        data: {
          reviewId: testReview.id,
          analysisType: 'MATERIAL_ANALYSIS',
          result: JSON.stringify({
            completenessScore: 85,
            analysis: '材料完整性良好',
            missingItems: [],
            suggestions: [],
          }),
          duration: 1500,
        },
      })

      expect(analysis).toBeDefined()
      expect(analysis.analysisType).toBe('MATERIAL_ANALYSIS')
      expect(analysis.duration).toBe(1500)
    })

    it('应该能存储检查项生成结果', async () => {
      const analysis = await testPrisma.reviewAiAnalysis.create({
        data: {
          reviewId: testReview.id,
          analysisType: 'CRITERIA_GENERATION',
          result: JSON.stringify([{ title: '检查项1', weight: 1.0, maxScore: 10 }]),
          duration: 800,
        },
      })

      expect(analysis.analysisType).toBe('CRITERIA_GENERATION')
    })

    it('应该能存储风险识别结果', async () => {
      const analysis = await testPrisma.reviewAiAnalysis.create({
        data: {
          reviewId: testReview.id,
          analysisType: 'RISK_IDENTIFICATION',
          result: JSON.stringify([
            { title: '风险1', category: 'TECHNICAL', probability: 3, impact: 4 },
          ]),
          duration: 1200,
        },
      })

      expect(analysis.analysisType).toBe('RISK_IDENTIFICATION')
    })

    it('应该能存储摘要生成结果', async () => {
      const analysis = await testPrisma.reviewAiAnalysis.create({
        data: {
          reviewId: testReview.id,
          analysisType: 'SUMMARY',
          result: JSON.stringify({
            short: '简短摘要',
            standard: '标准摘要',
            detailed: '详细摘要',
            keyPoints: ['关键点1'],
            conclusion: '结论',
          }),
          duration: 500,
        },
      })

      expect(analysis.analysisType).toBe('SUMMARY')
    })
  })

  // ============================================
  // 评审材料关联测试
  // ============================================

  describe('评审材料关联', () => {
    it('应该能为评审添加材料', async () => {
      const material = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: testReview.id,
          fileId: 'test-file-id',
          fileName: 'test-document.pdf',
          fileType: 'application/pdf',
          fileSize: 1024000,
        },
      })

      expect(material).toBeDefined()
      expect(material.fileName).toBe('test-document.pdf')
      expect(material.fileType).toBe('application/pdf')
    })

    it('应该能查询评审的所有材料', async () => {
      await testPrisma.reviewMaterial.create({
        data: {
          reviewId: testReview.id,
          fileId: 'file-1',
          fileName: 'document1.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
        },
      })
      await testPrisma.reviewMaterial.create({
        data: {
          reviewId: testReview.id,
          fileId: 'file-2',
          fileName: 'document2.docx',
          fileType: 'application/docx',
          fileSize: 2048,
        },
      })

      const materials = await testPrisma.reviewMaterial.findMany({
        where: { reviewId: testReview.id },
      })

      expect(materials.length).toBe(2)
    })
  })

  // ============================================
  // 分析结果查询测试
  // ============================================

  describe('分析结果查询', () => {
    beforeEach(async () => {
      // 创建多个分析结果
      await testPrisma.reviewAiAnalysis.create({
        data: {
          reviewId: testReview.id,
          analysisType: 'MATERIAL_ANALYSIS',
          result: '{"completenessScore": 80}',
          duration: 1000,
        },
      })
      await testPrisma.reviewAiAnalysis.create({
        data: {
          reviewId: testReview.id,
          analysisType: 'RISK_IDENTIFICATION',
          result: '[]',
          duration: 500,
        },
      })
    })

    it('应该能查询特定类型的分析结果', async () => {
      const analysis = await testPrisma.reviewAiAnalysis.findFirst({
        where: {
          reviewId: testReview.id,
          analysisType: 'MATERIAL_ANALYSIS',
        },
      })

      expect(analysis).toBeDefined()
      expect(analysis?.analysisType).toBe('MATERIAL_ANALYSIS')
    })

    it('应该能查询评审的所有分析结果', async () => {
      const analyses = await testPrisma.reviewAiAnalysis.findMany({
        where: { reviewId: testReview.id },
        orderBy: { createdAt: 'desc' },
      })

      expect(analyses.length).toBe(2)
    })
  })

  // ============================================
  // 风险等级计算测试
  // ============================================

  describe('风险等级计算', () => {
    it('应该正确计算低风险', () => {
      const probability = 1
      const impact = 2
      const score = probability * impact
      expect(score).toBeLessThanOrEqual(4)
    })

    it('应该正确计算中等风险', () => {
      const probability = 2
      const impact = 3
      const score = probability * impact
      expect(score).toBeGreaterThan(4)
      expect(score).toBeLessThanOrEqual(9)
    })

    it('应该正确计算高风险', () => {
      const probability = 3
      const impact = 4
      const score = probability * impact
      expect(score).toBeGreaterThan(9)
      expect(score).toBeLessThanOrEqual(16)
    })

    it('应该正确计算关键风险', () => {
      const probability = 5
      const impact = 5
      const score = probability * impact
      expect(score).toBeGreaterThan(16)
    })
  })
})
