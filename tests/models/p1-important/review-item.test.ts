/**
 * ReviewItem 模型测试 - P1 重要业务模型
 *
 * 测试覆盖:
 * - CRUD 操作
 * - 评审项管理
 * - 评审项完成状态
 * - 与评审的关联关系
 * - 评审项顺序和权重
 *
 * 优先级：P1 - 重要业务模型
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestReview,
  createTestReviewTypeConfig,
} from '../helpers/test-data-factory'

describe('ReviewItem Model - P1 Core', () => {
  describe('Basic CRUD', () => {
    it('should create review item successfully', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const item = await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Design Quality Check',
          description: 'Verify design meets standards',
          status: 'PENDING',
          order: 1,
        },
      })

      expect(item).toBeDefined()
      expect(item.reviewId).toBe(review.id)
      expect(item.title).toBe('Design Quality Check')
      expect(item.status).toBe('PENDING')
      expect(item.order).toBe(1)
    })

    it('should create item with all status types', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']
      const items = []

      for (const status of statuses) {
        const item = await testPrisma.reviewItem.create({
          data: {
            reviewId: review.id,
            title: `${status} Item`,
            status: status as any,
            order: items.length + 1,
          },
        })
        items.push(item)
      }

      expect(items).toHaveLength(statuses.length)
    })

    it('should update review item status', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const item = await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Status Update Test',
          status: 'PENDING',
          order: 1,
        },
      })

      const updated = await testPrisma.reviewItem.update({
        where: { id: item.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })

      expect(updated.status).toBe('COMPLETED')
      expect(updated.completedAt).toBeDefined()
    })

    it('should delete review item', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const item = await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'To Delete',
          status: 'PENDING',
          order: 1,
        },
      })

      await testPrisma.reviewItem.delete({
        where: { id: item.id },
      })

      const found = await testPrisma.reviewItem.findUnique({
        where: { id: item.id },
      })
      expect(found).toBeNull()
    })
  })

  describe('Item Status Flow', () => {
    it('should create item with PENDING status (default)', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const item = await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Default Status Item',
          order: 1,
        },
      })

      expect(item.status).toBe('PENDING')
    })

    it('should transition from PENDING to IN_PROGRESS', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const item = await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'In Progress Item',
          status: 'PENDING',
          order: 1,
        },
      })

      const updated = await testPrisma.reviewItem.update({
        where: { id: item.id },
        data: { status: 'IN_PROGRESS' },
      })

      expect(updated.status).toBe('IN_PROGRESS')
    })

    it('should transition from IN_PROGRESS to COMPLETED', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const item = await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Completable Item',
          status: 'IN_PROGRESS',
          order: 1,
        },
      })

      const completed = await testPrisma.reviewItem.update({
        where: { id: item.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })

      expect(completed.status).toBe('COMPLETED')
      expect(completed.completedAt).toBeDefined()
    })

    it('should transition to BLOCKED status', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const item = await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Blocked Item',
          status: 'IN_PROGRESS',
          order: 1,
        },
      })

      const blocked = await testPrisma.reviewItem.update({
        where: { id: item.id },
        data: {
          status: 'BLOCKED',
          comment: 'Blocked by missing information',
        },
      })

      expect(blocked.status).toBe('BLOCKED')
      expect(blocked.comment).toBe('Blocked by missing information')
    })
  })

  describe('Item Ordering', () => {
    it('should create items with specific order', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'First Item',
          order: 1,
          status: 'PENDING',
        },
      })

      await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Second Item',
          order: 2,
          status: 'PENDING',
        },
      })

      await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Third Item',
          order: 3,
          status: 'PENDING',
        },
      })

      const items = await testPrisma.reviewItem.findMany({
        where: { reviewId: review.id },
        orderBy: { order: 'asc' },
      })

      expect(items[0].order).toBe(1)
      expect(items[1].order).toBe(2)
      expect(items[2].order).toBe(3)
    })

    it('should update item order', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const item1 = await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Item 1',
          order: 1,
          status: 'PENDING',
        },
      })

      const item2 = await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Item 2',
          order: 2,
          status: 'PENDING',
        },
      })

      // Swap order
      await testPrisma.reviewItem.update({
        where: { id: item1.id },
        data: { order: 2 },
      })

      await testPrisma.reviewItem.update({
        where: { id: item2.id },
        data: { order: 1 },
      })

      const items = await testPrisma.reviewItem.findMany({
        where: { reviewId: review.id },
        orderBy: { order: 'asc' },
      })

      expect(items[0].id).toBe(item2.id)
      expect(items[1].id).toBe(item1.id)
    })
  })

  describe('ReviewItem Relationships', () => {
    it('should associate item with review', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const item = await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Related Item',
          status: 'PENDING',
          order: 1,
        },
      })

      expect(item.reviewId).toBe(review.id)

      // Verify from review side
      const reviewWithItems = await testPrisma.review.findUnique({
        where: { id: review.id },
        include: { items: true },
      })

      expect(reviewWithItems?.items).toHaveLength(1)
    })

    it('should allow multiple items for same review', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      for (let i = 1; i <= 5; i++) {
        await testPrisma.reviewItem.create({
          data: {
            reviewId: review.id,
            title: `Item ${i}`,
            status: 'PENDING',
            order: i,
          },
        })
      }

      const items = await testPrisma.reviewItem.findMany({
        where: { reviewId: review.id },
      })

      expect(items).toHaveLength(5)
    })

    it('should cascade delete item when review deleted', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const item = await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Cascade Test',
          status: 'PENDING',
          order: 1,
        },
      })

      // Delete review
      await testPrisma.review.delete({
        where: { id: review.id },
      })

      // Verify item is also deleted (CASCADE)
      const found = await testPrisma.reviewItem.findUnique({
        where: { id: item.id },
      })

      expect(found).toBeNull()
    })
  })

  describe('Item Comments', () => {
    it('should create item with comment', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const item = await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Commented Item',
          status: 'BLOCKED',
          order: 1,
          comment: 'Waiting for additional information',
        },
      })

      expect(item.comment).toBe('Waiting for additional information')
    })

    it('should update item comment', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const item = await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Comment Update Test',
          status: 'IN_PROGRESS',
          order: 1,
          comment: 'Initial comment',
        },
      })

      const updated = await testPrisma.reviewItem.update({
        where: { id: item.id },
        data: {
          comment: 'Updated comment with more details',
        },
      })

      expect(updated.comment).toBe('Updated comment with more details')
    })

    it('should allow null comments', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const item = await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'No Comment Item',
          status: 'PENDING',
          order: 1,
          comment: null,
        },
      })

      expect(item.comment).toBeNull()
    })
  })

  describe('ReviewItem Queries', () => {
    it('should find items by reviewId', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review1 = await createTestReview(project.id, type.id)
      const review2 = await createTestReview(project.id, type.id)

      await testPrisma.reviewItem.create({
        data: {
          reviewId: review1.id,
          title: 'Item 1',
          status: 'PENDING',
          order: 1,
        },
      })

      await testPrisma.reviewItem.create({
        data: {
          reviewId: review1.id,
          title: 'Item 2',
          status: 'COMPLETED',
          order: 2,
        },
      })

      await testPrisma.reviewItem.create({
        data: {
          reviewId: review2.id,
          title: 'Item 3',
          status: 'PENDING',
          order: 1,
        },
      })

      const review1Items = await testPrisma.reviewItem.findMany({
        where: { reviewId: review1.id },
      })

      expect(review1Items).toHaveLength(2)
    })

    it('should find items by status', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Completed Item',
          status: 'COMPLETED',
          order: 1,
        },
      })

      await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Pending Item',
          status: 'PENDING',
          order: 2,
        },
      })

      const completed = await testPrisma.reviewItem.findMany({
        where: {
          reviewId: review.id,
          status: 'COMPLETED',
        },
      })

      expect(completed).toHaveLength(1)
    })

    it('should query item with review', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id, {
        title: 'Review with Items',
      })

      const item = await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Important Item',
          status: 'PENDING',
          order: 1,
        },
      })

      const itemWithReview = await testPrisma.reviewItem.findUnique({
        where: { id: item.id },
        include: {
          review: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      })

      expect(itemWithReview?.review.title).toBe('Review with Items')
    })

    it('should calculate completion percentage', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      // Create 4 items: 2 completed, 2 pending
      await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Completed 1',
          status: 'COMPLETED',
          order: 1,
        },
      })

      await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Completed 2',
          status: 'COMPLETED',
          order: 2,
        },
      })

      await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Pending 1',
          status: 'PENDING',
          order: 3,
        },
      })

      await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Pending 2',
          status: 'IN_PROGRESS',
          order: 4,
        },
      })

      const items = await testPrisma.reviewItem.findMany({
        where: { reviewId: review.id },
      })

      const completed = items.filter((i) => i.status === 'COMPLETED').length
      const percentage = (completed / items.length) * 100

      expect(items).toHaveLength(4)
      expect(completed).toBe(2)
      expect(percentage).toBe(50)
    })
  })

  describe('Review Checklist Workflow', () => {
    it('should support complete checklist workflow', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      // Create checklist items
      const checklist = [
        { title: 'Code Style Check', order: 1 },
        { title: 'Unit Tests Coverage', order: 2 },
        { title: 'Documentation Review', order: 3 },
        { title: 'Security Scan', order: 4 },
        { title: 'Performance Test', order: 5 },
      ]

      for (const item of checklist) {
        await testPrisma.reviewItem.create({
          data: {
            reviewId: review.id,
            title: item.title,
            status: 'PENDING',
            order: item.order,
          },
        })
      }

      // Mark items as completed progressively
      const items = await testPrisma.reviewItem.findMany({
        where: { reviewId: review.id },
        orderBy: { order: 'asc' },
      })

      // Complete first 3 items
      for (let i = 0; i < 3; i++) {
        await testPrisma.reviewItem.update({
          where: { id: items[i].id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        })
      }

      const updated = await testPrisma.reviewItem.findMany({
        where: { reviewId: review.id },
      })

      const completed = updated.filter((i) => i.status === 'COMPLETED')
      const pending = updated.filter((i) => i.status === 'PENDING')

      expect(updated).toHaveLength(5)
      expect(completed).toHaveLength(3)
      expect(pending).toHaveLength(2)
    })
  })
})
