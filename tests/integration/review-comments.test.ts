/**
 * Review Comments API 集成测试
 *
 * 测试覆盖:
 * - GET /api/v1/reviews/[id]/comments - 获取评论列表
 * - POST /api/v1/reviews/[id]/comments - 创建评论
 * - PUT /api/v1/reviews/[id]/comments/[commentId] - 编辑评论
 * - DELETE /api/v1/reviews/[id]/comments/[commentId] - 删除评论
 * - POST /api/v1/reviews/[id]/comments/[commentId]/resolve - 标记已解决
 * - POST /api/v1/reviews/[id]/comments/[commentId]/reopen - 重新打开
 * - 权限验证
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { testPrisma } from '../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestReview,
  createTestReviewTypeConfig,
  createTestReviewComment,
} from '../helpers/test-data-factory'

// Mock authentication helper
const mockAuthHeader = (userId: string) => ({
  headers: {
    'x-user-id': userId,
    'x-user-email': `test-${userId}@example.com`,
  },
})

describe('Review Comments API - Integration', () => {
  let user: { id: string; email: string }
  let user2: { id: string; email: string }
  let project: { id: string }
  let review: { id: string }
  let type: { id: string }

  beforeEach(async () => {
    type = await createTestReviewTypeConfig()
    user = await createTestUser()
    user2 = await createTestUser()
    project = await createTestProject(user.id)
    review = await createTestReview(project.id, type.id, user.id)
  })

  afterEach(async () => {
    // Clean up
    await testPrisma.reviewComment.deleteMany({ where: { reviewId: review.id } })
    await testPrisma.review.delete({ where: { id: review.id } })
    await testPrisma.project.delete({ where: { id: project.id } })
    await testPrisma.user.delete({ where: { id: user.id } })
    await testPrisma.user.delete({ where: { id: user2.id } })
    await testPrisma.reviewTypeConfig.delete({ where: { id: type.id } })
  })

  describe('GET /api/v1/reviews/[id]/comments', () => {
    it('should return comments list', async () => {
      await createTestReviewComment(review.id, user.id, {
        content: 'Test comment 1',
      })
      await createTestReviewComment(review.id, user2.id, {
        content: 'Test comment 2',
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/reviews/${review.id}/comments`,
        mockAuthHeader(user.id)
      )

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
    })

    it('should filter by status OPEN', async () => {
      await createTestReviewComment(review.id, user.id, {
        content: 'Open comment',
        status: 'OPEN',
      })
      await createTestReviewComment(review.id, user.id, {
        content: 'Resolved comment',
        status: 'RESOLVED',
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/reviews/${review.id}/comments?status=OPEN`,
        mockAuthHeader(user.id)
      )

      const data = await response.json()

      expect(data.data).toHaveLength(1)
      expect(data.data[0].status).toBe('OPEN')
    })

    it('should filter by status RESOLVED', async () => {
      await createTestReviewComment(review.id, user.id, {
        content: 'Open comment',
        status: 'OPEN',
      })
      await createTestReviewComment(review.id, user.id, {
        content: 'Resolved comment',
        status: 'RESOLVED',
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/reviews/${review.id}/comments?status=RESOLVED`,
        mockAuthHeader(user.id)
      )

      const data = await response.json()

      expect(data.data).toHaveLength(1)
      expect(data.data[0].status).toBe('RESOLVED')
    })

    it('should return 401 without authentication', async () => {
      const response = await fetch(
        `http://localhost:3000/api/v1/reviews/${review.id}/comments`
      )

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/v1/reviews/[id]/comments', () => {
    it('should create comment successfully', async () => {
      const response = await fetch(
        `http://localhost:3000/api/v1/reviews/${review.id}/comments`,
        {
          ...mockAuthHeader(user.id),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...mockAuthHeader(user.id).headers,
          },
          body: JSON.stringify({
            content: 'New test comment',
          }),
        }
      )

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.content).toBe('New test comment')
      expect(data.data.authorId).toBe(user.id)
    })

    it('should create reply to comment', async () => {
      const parentComment = await createTestReviewComment(review.id, user.id, {
        content: 'Parent comment',
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/reviews/${review.id}/comments`,
        {
          ...mockAuthHeader(user2.id),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...mockAuthHeader(user2.id).headers,
          },
          body: JSON.stringify({
            content: 'Reply to parent',
            parentId: parentComment.id,
          }),
        }
      )

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.parentId).toBe(parentComment.id)
    })

    it('should reject multi-level replies', async () => {
      const parentComment = await createTestReviewComment(review.id, user.id, {
        content: 'Parent comment',
      })
      const reply = await createTestReviewComment(review.id, user2.id, {
        content: 'Reply',
        parentId: parentComment.id,
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/reviews/${review.id}/comments`,
        {
          ...mockAuthHeader(user.id),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...mockAuthHeader(user.id).headers,
          },
          body: JSON.stringify({
            content: 'Nested reply',
            parentId: reply.id,
          }),
        }
      )

      expect(response.status).toBe(400)
    })

    it('should validate content is not empty', async () => {
      const response = await fetch(
        `http://localhost:3000/api/v1/reviews/${review.id}/comments`,
        {
          ...mockAuthHeader(user.id),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...mockAuthHeader(user.id).headers,
          },
          body: JSON.stringify({
            content: '',
          }),
        }
      )

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/v1/reviews/[id]/comments/[commentId]', () => {
    it('should update comment (author only)', async () => {
      const comment = await createTestReviewComment(review.id, user.id, {
        content: 'Original content',
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/reviews/${review.id}/comments/${comment.id}`,
        {
          ...mockAuthHeader(user.id),
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...mockAuthHeader(user.id).headers,
          },
          body: JSON.stringify({
            content: 'Updated content',
          }),
        }
      )

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.content).toBe('Updated content')
    })

    it('should reject update by non-author', async () => {
      const comment = await createTestReviewComment(review.id, user.id, {
        content: 'Original content',
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/reviews/${review.id}/comments/${comment.id}`,
        {
          ...mockAuthHeader(user2.id),
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...mockAuthHeader(user2.id).headers,
          },
          body: JSON.stringify({
            content: 'Unauthorized update',
          }),
        }
      )

      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /api/v1/reviews/[id]/comments/[commentId]', () => {
    it('should delete comment (author only)', async () => {
      const comment = await createTestReviewComment(review.id, user.id, {
        content: 'To be deleted',
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/reviews/${review.id}/comments/${comment.id}`,
        {
          ...mockAuthHeader(user.id),
          method: 'DELETE',
          headers: mockAuthHeader(user.id).headers,
        }
      )

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.id).toBe(comment.id)

      // Verify deleted
      const deleted = await testPrisma.reviewComment.findUnique({
        where: { id: comment.id },
      })
      expect(deleted).toBeNull()
    })

    it('should reject delete by non-author', async () => {
      const comment = await createTestReviewComment(review.id, user.id, {
        content: 'Cannot delete',
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/reviews/${review.id}/comments/${comment.id}`,
        {
          ...mockAuthHeader(user2.id),
          method: 'DELETE',
          headers: mockAuthHeader(user2.id).headers,
        }
      )

      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/v1/reviews/[id]/comments/[commentId]/resolve', () => {
    it('should mark comment as resolved', async () => {
      const comment = await createTestReviewComment(review.id, user.id, {
        content: 'To resolve',
        status: 'OPEN',
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/reviews/${review.id}/comments/${comment.id}/resolve`,
        {
          ...mockAuthHeader(user.id),
          method: 'POST',
          headers: mockAuthHeader(user.id).headers,
        }
      )

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.status).toBe('RESOLVED')
    })

    it('should reject resolve by non-author', async () => {
      const comment = await createTestReviewComment(review.id, user.id, {
        content: 'Cannot resolve',
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/reviews/${review.id}/comments/${comment.id}/resolve`,
        {
          ...mockAuthHeader(user2.id),
          method: 'POST',
          headers: mockAuthHeader(user2.id).headers,
        }
      )

      expect(response.status).toBe(403)
    })

    it('should reject resolve already resolved comment', async () => {
      const comment = await createTestReviewComment(review.id, user.id, {
        content: 'Already resolved',
        status: 'RESOLVED',
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/reviews/${review.id}/comments/${comment.id}/resolve`,
        {
          ...mockAuthHeader(user.id),
          method: 'POST',
          headers: mockAuthHeader(user.id).headers,
        }
      )

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/v1/reviews/[id]/comments/[commentId]/reopen', () => {
    it('should reopen resolved comment', async () => {
      const comment = await createTestReviewComment(review.id, user.id, {
        content: 'To reopen',
        status: 'RESOLVED',
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/reviews/${review.id}/comments/${comment.id}/reopen`,
        {
          ...mockAuthHeader(user.id),
          method: 'POST',
          headers: mockAuthHeader(user.id).headers,
        }
      )

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.status).toBe('OPEN')
    })

    it('should reject reopen by non-author', async () => {
      const comment = await createTestReviewComment(review.id, user.id, {
        content: 'Cannot reopen',
        status: 'RESOLVED',
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/reviews/${review.id}/comments/${comment.id}/reopen`,
        {
          ...mockAuthHeader(user2.id),
          method: 'POST',
          headers: mockAuthHeader(user2.id).headers,
        }
      )

      expect(response.status).toBe(403)
    })

    it('should reject reopen already open comment', async () => {
      const comment = await createTestReviewComment(review.id, user.id, {
        content: 'Already open',
        status: 'OPEN',
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/reviews/${review.id}/comments/${comment.id}/reopen`,
        {
          ...mockAuthHeader(user.id),
          method: 'POST',
          headers: mockAuthHeader(user.id).headers,
        }
      )

      expect(response.status).toBe(400)
    })
  })
})
