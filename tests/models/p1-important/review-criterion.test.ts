/**
 * ReviewCriterion 模型测试 - P1 重要业务模型
 *
 * 测试覆盖:
 * - CRUD 操作
 * - 评审标准管理
 * - 标准权重和评分
 * - 与评审类型的关联
 * - 标准启用/禁用状态
 *
 * 优先级：P1 - 重要业务模型
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestReviewTypeConfig,
  createTestReview,
} from '../helpers/test-data-factory'

describe('ReviewCriterion Model - P1 Core', () => {
  describe('Basic CRUD', () => {
    it('should create review criterion successfully', async () => {
      const type = await createTestReviewTypeConfig()

      const criterion = await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Code Quality',
          description: 'Evaluate code quality and standards',
          weight: 30,
          maxScore: 10,
          isActive: true,
        },
      })

      expect(criterion).toBeDefined()
      expect(criterion.typeId).toBe(type.id)
      expect(criterion.name).toBe('Code Quality')
      expect(criterion.weight).toBe(30)
      expect(criterion.maxScore).toBe(10)
      expect(criterion.isActive).toBe(true)
    })

    it('should create criterion with all fields', async () => {
      const type = await createTestReviewTypeConfig()

      const criterion = await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Comprehensive Criterion',
          description: 'Full featured criterion',
          weight: 25,
          maxScore: 100,
          isActive: true,
          order: 1,
          comment: 'Important criterion',
        },
      })

      expect(criterion.description).toBe('Full featured criterion')
      expect(criterion.weight).toBe(25)
      expect(criterion.maxScore).toBe(100)
      expect(criterion.order).toBe(1)
      expect(criterion.comment).toBe('Important criterion')
    })

    it('should update criterion', async () => {
      const type = await createTestReviewTypeConfig()

      const criterion = await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Original Name',
          weight: 20,
          maxScore: 10,
        },
      })

      const updated = await testPrisma.reviewCriterion.update({
        where: { id: criterion.id },
        data: {
          name: 'Updated Name',
          weight: 40,
          maxScore: 20,
        },
      })

      expect(updated.name).toBe('Updated Name')
      expect(updated.weight).toBe(40)
      expect(updated.maxScore).toBe(20)
    })

    it('should delete criterion', async () => {
      const type = await createTestReviewTypeConfig()

      const criterion = await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'To Delete',
          weight: 10,
        },
      })

      await testPrisma.reviewCriterion.delete({
        where: { id: criterion.id },
      })

      const found = await testPrisma.reviewCriterion.findUnique({
        where: { id: criterion.id },
      })
      expect(found).toBeNull()
    })
  })

  describe('Criterion Weight and Scoring', () => {
    it('should create criterion with weight percentage', async () => {
      const type = await createTestReviewTypeConfig()

      const criterion = await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Weighted Criterion',
          weight: 25,
          maxScore: 10,
        },
      })

      expect(criterion.weight).toBe(25)
    })

    it('should create criterion with max score', async () => {
      const type = await createTestReviewTypeConfig()

      const criterion = await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Scored Criterion',
          weight: 30,
          maxScore: 100,
        },
      })

      expect(criterion.maxScore).toBe(100)
    })

    it('should create multiple criteria with total weight 100%', async () => {
      const type = await createTestReviewTypeConfig()

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Criterion 1',
          weight: 30,
          maxScore: 10,
          order: 1,
        },
      })

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Criterion 2',
          weight: 40,
          maxScore: 10,
          order: 2,
        },
      })

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Criterion 3',
          weight: 30,
          maxScore: 10,
          order: 3,
        },
      })

      const criteria = await testPrisma.reviewCriterion.findMany({
        where: { typeId: type.id },
      })

      const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0)

      expect(criteria).toHaveLength(3)
      expect(totalWeight).toBe(100)
    })

    it('should allow different max scores for different criteria', async () => {
      const type = await createTestReviewTypeConfig()

      const c1 = await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: '10-point scale',
          weight: 50,
          maxScore: 10,
        },
      })

      const c2 = await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: '100-point scale',
          weight: 50,
          maxScore: 100,
        },
      })

      expect(c1.maxScore).toBe(10)
      expect(c2.maxScore).toBe(100)
    })
  })

  describe('Active/Inactive Status', () => {
    it('should create active criterion by default', async () => {
      const type = await createTestReviewTypeConfig()

      const criterion = await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Active Criterion',
          weight: 20,
        },
      })

      expect(criterion.isActive).toBe(true)
    })

    it('should create inactive criterion', async () => {
      const type = await createTestReviewTypeConfig()

      const criterion = await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Inactive Criterion',
          weight: 20,
          isActive: false,
        },
      })

      expect(criterion.isActive).toBe(false)
    })

    it('should toggle criterion active status', async () => {
      const type = await createTestReviewTypeConfig()

      const criterion = await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Toggle Test',
          weight: 20,
          isActive: true,
        },
      })

      const deactivated = await testPrisma.reviewCriterion.update({
        where: { id: criterion.id },
        data: { isActive: false },
      })

      expect(deactivated.isActive).toBe(false)

      const reactivated = await testPrisma.reviewCriterion.update({
        where: { id: criterion.id },
        data: { isActive: true },
      })

      expect(reactivated.isActive).toBe(true)
    })

    it('should find only active criteria', async () => {
      const type = await createTestReviewTypeConfig()

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Active 1',
          weight: 20,
          isActive: true,
        },
      })

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Inactive',
          weight: 20,
          isActive: false,
        },
      })

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Active 2',
          weight: 20,
          isActive: true,
        },
      })

      const active = await testPrisma.reviewCriterion.findMany({
        where: {
          typeId: type.id,
          isActive: true,
        },
      })

      expect(active).toHaveLength(2)
    })
  })

  describe('Criterion Ordering', () => {
    it('should create criteria with specific order', async () => {
      const type = await createTestReviewTypeConfig()

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'First',
          weight: 25,
          order: 1,
        },
      })

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Second',
          weight: 25,
          order: 2,
        },
      })

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Third',
          weight: 25,
          order: 3,
        },
      })

      const criteria = await testPrisma.reviewCriterion.findMany({
        where: { typeId: type.id },
        orderBy: { order: 'asc' },
      })

      expect(criteria[0].order).toBe(1)
      expect(criteria[1].order).toBe(2)
      expect(criteria[2].order).toBe(3)
    })

    it('should reorder criteria', async () => {
      const type = await createTestReviewTypeConfig()

      const c1 = await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Criterion 1',
          weight: 25,
          order: 1,
        },
      })

      const c2 = await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Criterion 2',
          weight: 25,
          order: 2,
        },
      })

      // Swap order
      await testPrisma.reviewCriterion.update({
        where: { id: c1.id },
        data: { order: 2 },
      })

      await testPrisma.reviewCriterion.update({
        where: { id: c2.id },
        data: { order: 1 },
      })

      const criteria = await testPrisma.reviewCriterion.findMany({
        where: { typeId: type.id },
        orderBy: { order: 'asc' },
      })

      expect(criteria[0].id).toBe(c2.id)
      expect(criteria[1].id).toBe(c1.id)
    })
  })

  describe('ReviewCriterion Relationships', () => {
    it('should associate criterion with review type', async () => {
      const type = await createTestReviewTypeConfig({
        name: 'Type With Criteria',
      })

      const criterion = await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Related Criterion',
          weight: 30,
        },
      })

      expect(criterion.typeId).toBe(type.id)

      // Verify from type side
      const typeWithCriteria = await testPrisma.reviewTypeConfig.findUnique({
        where: { id: type.id },
        include: { criteria: true },
      })

      expect(typeWithCriteria?.criteria).toHaveLength(1)
    })

    it('should allow multiple criteria for same review type', async () => {
      const type = await createTestReviewTypeConfig()

      for (let i = 1; i <= 5; i++) {
        await testPrisma.reviewCriterion.create({
          data: {
            typeId: type.id,
            name: `Criterion ${i}`,
            weight: 20,
            order: i,
          },
        })
      }

      const criteria = await testPrisma.reviewCriterion.findMany({
        where: { typeId: type.id },
      })

      expect(criteria).toHaveLength(5)
    })

    it('should cascade delete criteria when type deleted', async () => {
      const type = await createTestReviewTypeConfig()

      const criterion = await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Cascade Test',
          weight: 20,
        },
      })

      // Delete type
      await testPrisma.reviewTypeConfig.delete({
        where: { id: type.id },
      })

      // Verify criterion is also deleted (CASCADE)
      const found = await testPrisma.reviewCriterion.findUnique({
        where: { id: criterion.id },
      })

      expect(found).toBeNull()
    })
  })

  describe('Criterion Queries', () => {
    it('should find criteria by typeId', async () => {
      const type1 = await createTestReviewTypeConfig()
      const type2 = await createTestReviewTypeConfig()

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type1.id,
          name: 'Type 1 Criterion 1',
          weight: 20,
        },
      })

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type1.id,
          name: 'Type 1 Criterion 2',
          weight: 20,
        },
      })

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type2.id,
          name: 'Type 2 Criterion',
          weight: 20,
        },
      })

      const type1Criteria = await testPrisma.reviewCriterion.findMany({
        where: { typeId: type1.id },
      })

      expect(type1Criteria).toHaveLength(2)
    })

    it('should find active criteria', async () => {
      const type = await createTestReviewTypeConfig()

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Active Criterion',
          weight: 20,
          isActive: true,
        },
      })

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Inactive Criterion',
          weight: 20,
          isActive: false,
        },
      })

      const active = await testPrisma.reviewCriterion.findMany({
        where: {
          typeId: type.id,
          isActive: true,
        },
      })

      expect(active).toHaveLength(1)
    })

    it('should order criteria by weight', async () => {
      const type = await createTestReviewTypeConfig()

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Low Weight',
          weight: 10,
        },
      })

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'High Weight',
          weight: 50,
        },
      })

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Medium Weight',
          weight: 30,
        },
      })

      const byWeight = await testPrisma.reviewCriterion.findMany({
        where: { typeId: type.id },
        orderBy: { weight: 'asc' },
      })

      expect(byWeight[0].weight).toBe(10)
      expect(byWeight[1].weight).toBe(30)
      expect(byWeight[2].weight).toBe(50)
    })

    it('should query criterion with type', async () => {
      const type = await createTestReviewTypeConfig({
        name: 'Type With Criterion',
        displayName: 'Display Name',
      })

      const criterion = await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Criterion to Query',
          weight: 30,
        },
      })

      const criterionWithType = await testPrisma.reviewCriterion.findUnique({
        where: { id: criterion.id },
        include: {
          type: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
      })

      expect(criterionWithType?.type.name).toBe('Type With Criterion')
      expect(criterionWithType?.type.displayName).toBe('Display Name')
    })

    it('should calculate total weight for type', async () => {
      const type = await createTestReviewTypeConfig()

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Criterion 1',
          weight: 30,
        },
      })

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Criterion 2',
          weight: 40,
        },
      })

      await testPrisma.reviewCriterion.create({
        data: {
          typeId: type.id,
          name: 'Criterion 3',
          weight: 30,
        },
      })

      const criteria = await testPrisma.reviewCriterion.findMany({
        where: { typeId: type.id },
      })

      const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0)

      expect(criteria).toHaveLength(3)
      expect(totalWeight).toBe(100)
    })
  })

  describe('Review Criteria Configuration', () => {
    it('should create complete criteria set for review type', async () => {
      const type = await createTestReviewTypeConfig({
        name: 'Code Review Type',
      })

      const criteriaSet = [
        { name: 'Code Quality', weight: 30, maxScore: 10 },
        { name: 'Test Coverage', weight: 25, maxScore: 10 },
        { name: 'Documentation', weight: 20, maxScore: 10 },
        { name: 'Performance', weight: 15, maxScore: 10 },
        { name: 'Security', weight: 10, maxScore: 10 },
      ]

      for (const [index, criterion] of criteriaSet.entries()) {
        await testPrisma.reviewCriterion.create({
          data: {
            typeId: type.id,
            name: criterion.name,
            weight: criterion.weight,
            maxScore: criterion.maxScore,
            order: index + 1,
          },
        })
      }

      const criteria = await testPrisma.reviewCriterion.findMany({
        where: { typeId: type.id },
        orderBy: { order: 'asc' },
      })

      const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0)

      expect(criteria).toHaveLength(5)
      expect(totalWeight).toBe(100)
      expect(criteria.map((c) => c.name)).toEqual(criteriaSet.map((c) => c.name))
    })
  })
})
