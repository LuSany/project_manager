/**
 * ReviewComment 模型测试 - P1 重要业务模型
 *
 * 测试覆盖:
 * - CRUD 操作
 * - 评论状态管理 (OPEN/RESOLVED)
 * - 评论回复功能 (parentId)
 * - 针对材料/评审项的评论
 * - 与评审的关联关系
 *
 * 优先级：P1 - 重要业务模型
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { testPrisma } from '../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestReview,
  createTestReviewTypeConfig,
  createTestReviewComment,
} from '../helpers/test-data-factory'

describe('ReviewComment Model - P1 Core', () => {
  let user: { id: string }
  let project: { id: string }
  let review: { id: string }

  beforeEach(async () => {
    user = await createTestUser()
    const type = await createTestReviewTypeConfig()
    project = await createTestProject(user.id)
    review = await createTestReview(project.id, type.id, user.id)
  })

  describe('Basic CRUD', () => {
    it('should create review comment successfully', async () => {
      const comment = await createTestReviewComment(review.id, user.id, {
        content: 'This is a test comment',
      })

      expect(comment).toBeDefined()
      expect(comment.reviewId).toBe(review.id)
      expect(comment.authorId).toBe(user.id)
      expect(comment.content).toBe('This is a test comment')
      expect(comment.status).toBe('OPEN')
    })

    it('should create comment with all statuses', async () => {
      const statuses = ['OPEN', 'RESOLVED']

      for (const status of statuses) {
        const comment = await testPrisma.reviewComment.create({
          data: {
            reviewId: review.id,
            authorId: user.id,
            content: `Comment with ${status} status`,
            status: status as any,
          },
        })
        expect(comment.status).toBe(status)
      }
    })

    it('should update comment content', async () => {
      const comment = await createTestReviewComment(review.id, user.id)

      const updated = await testPrisma.reviewComment.update({
        where: { id: comment.id },
        data: { content: 'Updated content' },
      })

      expect(updated.content).toBe('Updated content')
    })

    it('should update comment status to RESOLVED', async () => {
      const comment = await createTestReviewComment(review.id, user.id)

      const updated = await testPrisma.reviewComment.update({
        where: { id: comment.id },
        data: { status: 'RESOLVED' },
      })

      expect(updated.status).toBe('RESOLVED')
    })

    it('should reopen resolved comment', async () => {
      const comment = await createTestReviewComment(review.id, user.id, {
        status: 'RESOLVED',
      })

      const reopened = await testPrisma.reviewComment.update({
        where: { id: comment.id },
        data: { status: 'OPEN' },
      })

      expect(reopened.status).toBe('OPEN')
    })

    it('should delete comment', async () => {
      const comment = await createTestReviewComment(review.id, user.id)

      await testPrisma.reviewComment.delete({
        where: { id: comment.id },
      })

      const deleted = await testPrisma.reviewComment.findUnique({
        where: { id: comment.id },
      })

      expect(deleted).toBeNull()
    })
  })

  describe('Comment Reply (Thread)', () => {
    it('should create reply to comment', async () => {
      const parentComment = await createTestReviewComment(review.id, user.id, {
        content: 'Parent comment',
      })

      const reply = await testPrisma.reviewComment.create({
        data: {
          reviewId: review.id,
          authorId: user.id,
          content: 'Reply to parent',
          parentId: parentComment.id,
        },
      })

      expect(reply.parentId).toBe(parentComment.id)
    })

    it('should find parent comment with replies', async () => {
      const parentComment = await createTestReviewComment(review.id, user.id, {
        content: 'Parent comment',
      })

      await createTestReviewComment(review.id, user.id, {
        content: 'Reply 1',
        parentId: parentComment.id,
      })

      await createTestReviewComment(review.id, user.id, {
        content: 'Reply 2',
        parentId: parentComment.id,
      })

      const parentWithReplies = await testPrisma.reviewComment.findUnique({
        where: { id: parentComment.id },
        include: {
          replies: {
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      expect(parentWithReplies?.replies).toHaveLength(2)
      expect(parentWithReplies?.replies[0].content).toBe('Reply 1')
      expect(parentWithReplies?.replies[1].content).toBe('Reply 2')
    })

    it('should cascade delete replies when parent deleted', async () => {
      const parentComment = await createTestReviewComment(review.id, user.id, {
        content: 'Parent comment',
      })

      const reply = await createTestReviewComment(review.id, user.id, {
        content: 'Reply',
        parentId: parentComment.id,
      })

      await testPrisma.reviewComment.delete({
        where: { id: parentComment.id },
      })

      const deletedReply = await testPrisma.reviewComment.findUnique({
        where: { id: reply.id },
      })

      expect(deletedReply).toBeNull()
    })
  })

  describe('Comment Scope (Material/Item)', () => {
    it('should create comment for review material', async () => {
      const material = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          fileId: 'test-file-123',
          fileName: 'test.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
        },
      })

      const comment = await testPrisma.reviewComment.create({
        data: {
          reviewId: review.id,
          authorId: user.id,
          content: 'Comment on material',
          materialId: material.id,
        },
      })

      expect(comment.materialId).toBe(material.id)
    })

    it('should create comment for review item', async () => {
      const item = await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Test Item',
          order: 1,
        },
      })

      const comment = await testPrisma.reviewComment.create({
        data: {
          reviewId: review.id,
          authorId: user.id,
          content: 'Comment on item',
          itemId: item.id,
        },
      })

      expect(comment.itemId).toBe(item.id)
    })

    it('should find comments by materialId', async () => {
      const material = await testPrisma.reviewMaterial.create({
        data: {
          reviewId: review.id,
          fileId: 'test-file-456',
          fileName: 'test.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
        },
      })

      await testPrisma.reviewComment.create({
        data: {
          reviewId: review.id,
          authorId: user.id,
          content: 'Comment 1',
          materialId: material.id,
        },
      })

      await testPrisma.reviewComment.create({
        data: {
          reviewId: review.id,
          authorId: user.id,
          content: 'Comment 2',
        },
      })

      const comments = await testPrisma.reviewComment.findMany({
        where: { materialId: material.id },
      })

      expect(comments).toHaveLength(1)
      expect(comments[0].materialId).toBe(material.id)
    })

    it('should find comments by itemId', async () => {
      const item = await testPrisma.reviewItem.create({
        data: {
          reviewId: review.id,
          title: 'Test Item',
          order: 1,
        },
      })

      await testPrisma.reviewComment.create({
        data: {
          reviewId: review.id,
          authorId: user.id,
          content: 'Comment 1',
          itemId: item.id,
        },
      })

      await testPrisma.reviewComment.create({
        data: {
          reviewId: review.id,
          authorId: user.id,
          content: 'Comment 2',
        },
      })

      const comments = await testPrisma.reviewComment.findMany({
        where: { itemId: item.id },
      })

      expect(comments).toHaveLength(1)
    })
  })

  describe('Comment Relationships', () => {
    it('should include author information', async () => {
      const comment = await createTestReviewComment(review.id, user.id)

      const commentWithAuthor = await testPrisma.reviewComment.findUnique({
        where: { id: comment.id },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      expect(commentWithAuthor?.author).toBeDefined()
      expect(commentWithAuthor?.author.id).toBe(user.id)
    })

    it('should include review information', async () => {
      const comment = await createTestReviewComment(review.id, user.id)

      const commentWithReview = await testPrisma.reviewComment.findUnique({
        where: { id: comment.id },
        include: {
          review: {
            select: { id: true, title: true },
          },
        },
      })

      expect(commentWithReview?.review).toBeDefined()
      expect(commentWithReview?.review.id).toBe(review.id)
    })

    it('should cascade delete when review deleted', async () => {
      const comment = await createTestReviewComment(review.id, user.id)

      await testPrisma.review.delete({
        where: { id: review.id },
      })

      const deletedComment = await testPrisma.reviewComment.findUnique({
        where: { id: comment.id },
      })

      expect(deletedComment).toBeNull()
    })
  })

  describe('Comment Filtering', () => {
    it('should filter comments by status OPEN', async () => {
      await createTestReviewComment(review.id, user.id, {
        content: 'Open comment',
        status: 'OPEN',
      })

      await createTestReviewComment(review.id, user.id, {
        content: 'Resolved comment',
        status: 'RESOLVED',
      })

      const openComments = await testPrisma.reviewComment.findMany({
        where: {
          reviewId: review.id,
          status: 'OPEN',
        },
      })

      expect(openComments).toHaveLength(1)
      expect(openComments[0].status).toBe('OPEN')
    })

    it('should filter comments by status RESOLVED', async () => {
      await createTestReviewComment(review.id, user.id, {
        content: 'Open comment',
        status: 'OPEN',
      })

      const resolvedComment = await createTestReviewComment(review.id, user.id, {
        content: 'Resolved comment',
        status: 'RESOLVED',
      })

      const resolvedComments = await testPrisma.reviewComment.findMany({
        where: {
          reviewId: review.id,
          status: 'RESOLVED',
        },
      })

      expect(resolvedComments).toHaveLength(1)
      expect(resolvedComments[0].id).toBe(resolvedComment.id)
    })

    it('should get all comments for a review', async () => {
      await createTestReviewComment(review.id, user.id, { content: 'Comment 1' })
      await createTestReviewComment(review.id, user.id, { content: 'Comment 2' })
      await createTestReviewComment(review.id, user.id, { content: 'Comment 3' })

      const comments = await testPrisma.reviewComment.findMany({
        where: { reviewId: review.id },
        orderBy: { createdAt: 'asc' },
      })

      expect(comments).toHaveLength(3)
    })
  })
})
