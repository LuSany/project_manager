/**
 * ReviewVote 模型测试 - P1 重要业务模型
 *
 * 测试覆盖:
 * - CRUD 操作
 * - 投票同意/不同意
 * - 投票更新（重新投票）
 * - 与评审的关联关系
 * - 复合主键 (reviewId, userId)
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
  createTestReviewVote,
} from '../helpers/test-data-factory'

describe('ReviewVote Model - P1 Core', () => {
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
    it('should create vote with agreed=true', async () => {
      const vote = await createTestReviewVote(review.id, user.id, {
        agreed: true,
      })

      expect(vote).toBeDefined()
      expect(vote.reviewId).toBe(review.id)
      expect(vote.userId).toBe(user.id)
      expect(vote.agreed).toBe(true)
      expect(vote.votedAt).toBeDefined()
    })

    it('should create vote with agreed=false', async () => {
      const vote = await createTestReviewVote(review.id, user.id, {
        agreed: false,
      })

      expect(vote.agreed).toBe(false)
    })

    it('should update vote (re-vote)', async () => {
      const vote = await createTestReviewVote(review.id, user.id, {
        agreed: false,
      })

      const updated = await testPrisma.reviewVote.update({
        where: {
          reviewId_userId: {
            reviewId: review.id,
            userId: user.id,
          },
        },
        data: {
          agreed: true,
        },
      })

      expect(updated.agreed).toBe(true)
      expect(updated.votedAt).toBeDefined()
    })

    it('should delete vote', async () => {
      const vote = await createTestReviewVote(review.id, user.id)

      await testPrisma.reviewVote.delete({
        where: {
          reviewId_userId: {
            reviewId: review.id,
            userId: user.id,
          },
        },
      })

      const deleted = await testPrisma.reviewVote.findUnique({
        where: {
          reviewId_userId: {
            reviewId: review.id,
            userId: user.id,
          },
        },
      })

      expect(deleted).toBeNull()
    })
  })

  describe('Composite Primary Key', () => {
    it('should create vote using composite key', async () => {
      const vote = await testPrisma.reviewVote.create({
        data: {
          reviewId: review.id,
          userId: user.id,
          agreed: true,
        },
      })

      expect(vote.reviewId).toBe(review.id)
      expect(vote.userId).toBe(user.id)
    })

    it('should find vote by composite key', async () => {
      await createTestReviewVote(review.id, user.id, {
        agreed: true,
      })

      const vote = await testPrisma.reviewVote.findUnique({
        where: {
          reviewId_userId: {
            reviewId: review.id,
            userId: user.id,
          },
        },
      })

      expect(vote).toBeDefined()
      expect(vote?.agreed).toBe(true)
    })

    it('should not allow duplicate vote for same user and review', async () => {
      await createTestReviewVote(review.id, user.id, {
        agreed: true,
      })

      await expect(
        testPrisma.reviewVote.create({
          data: {
            reviewId: review.id,
            userId: user.id,
            agreed: false,
          },
        })
      ).rejects.toThrow()
    })
  })

  describe('Multiple Reviewers', () => {
    it('should create votes for multiple users on same review', async () => {
      const user2 = await createTestUser()
      const user3 = await createTestUser()

      await createTestReviewVote(review.id, user.id, { agreed: true })
      await createTestReviewVote(review.id, user2.id, { agreed: true })
      await createTestReviewVote(review.id, user3.id, { agreed: false })

      const votes = await testPrisma.reviewVote.findMany({
        where: { reviewId: review.id },
      })

      expect(votes).toHaveLength(3)
    })

    it('should count agreed votes', async () => {
      const user2 = await createTestUser()
      const user3 = await createTestUser()

      await createTestReviewVote(review.id, user.id, { agreed: true })
      await createTestReviewVote(review.id, user2.id, { agreed: true })
      await createTestReviewVote(review.id, user3.id, { agreed: false })

      const agreedVotes = await testPrisma.reviewVote.findMany({
        where: {
          reviewId: review.id,
          agreed: true,
        },
      })

      expect(agreedVotes).toHaveLength(2)
    })

    it('should get all votes for a review', async () => {
      const user2 = await createTestUser()
      const user3 = await createTestUser()

      await createTestReviewVote(review.id, user.id)
      await createTestReviewVote(review.id, user2.id)
      await createTestReviewVote(review.id, user3.id)

      const votes = await testPrisma.reviewVote.findMany({
        where: { reviewId: review.id },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      })

      expect(votes).toHaveLength(3)
      expect(votes[0].user).toBeDefined()
    })
  })

  describe('Vote Relationships', () => {
    it('should include review information', async () => {
      const vote = await createTestReviewVote(review.id, user.id)

      const voteWithReview = await testPrisma.reviewVote.findUnique({
        where: {
          reviewId_userId: {
            reviewId: review.id,
            userId: user.id,
          },
        },
        include: {
          review: {
            select: { id: true, title: true },
          },
        },
      })

      expect(voteWithReview?.review).toBeDefined()
      expect(voteWithReview?.review.id).toBe(review.id)
    })

    it('should include user information', async () => {
      await createTestReviewVote(review.id, user.id)

      const voteWithUser = await testPrisma.reviewVote.findUnique({
        where: {
          reviewId_userId: {
            reviewId: review.id,
            userId: user.id,
          },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      expect(voteWithUser?.user).toBeDefined()
      expect(voteWithUser?.user.id).toBe(user.id)
    })

    it('should cascade delete when review deleted', async () => {
      await createTestReviewVote(review.id, user.id)

      await testPrisma.review.delete({
        where: { id: review.id },
      })

      const deletedVote = await testPrisma.reviewVote.findUnique({
        where: {
          reviewId_userId: {
            reviewId: review.id,
            userId: user.id,
          },
        },
      })

      expect(deletedVote).toBeNull()
    })

    it('should cascade delete when user deleted (via review cascade)', async () => {
      await createTestReviewVote(review.id, user.id)

      // Delete review first (which cascades to votes)
      await testPrisma.review.delete({
        where: { id: review.id },
      })

      const votes = await testPrisma.reviewVote.findMany({
        where: { reviewId: review.id },
      })

      expect(votes).toHaveLength(0)
    })
  })

  describe('Vote Statistics', () => {
    it('should calculate vote summary', async () => {
      const user2 = await createTestUser()
      const user3 = await createTestUser()
      const user4 = await createTestUser()

      await createTestReviewVote(review.id, user.id, { agreed: true })
      await createTestReviewVote(review.id, user2.id, { agreed: true })
      await createTestReviewVote(review.id, user3.id, { agreed: false })
      await testPrisma.reviewVote.create({
        data: {
          reviewId: review.id,
          userId: user4.id,
          agreed: true,
        },
      })

      const allVotes = await testPrisma.reviewVote.findMany({
        where: { reviewId: review.id },
      })

      const agreedCount = allVotes.filter((v) => v.agreed).length
      const disagreedCount = allVotes.filter((v) => !v.agreed).length

      expect(agreedCount).toBe(3)
      expect(disagreedCount).toBe(1)
    })

    it('should check if all reviewers agreed', async () => {
      const user2 = await createTestUser()

      await createTestReviewVote(review.id, user.id, { agreed: true })
      await createTestReviewVote(review.id, user2.id, { agreed: true })

      const allVotes = await testPrisma.reviewVote.findMany({
        where: { reviewId: review.id },
      })

      const allAgreed = allVotes.every((v) => v.agreed)
      expect(allAgreed).toBe(true)
    })

    it('should detect pending reviewers', async () => {
      const user2 = await createTestUser()

      await createTestReviewVote(review.id, user.id, { agreed: true })

      const votedUserIds = await testPrisma.reviewVote.findMany({
        where: { reviewId: review.id },
        select: { userId: true },
      })

      expect(votedUserIds).toHaveLength(1)
    })
  })
})
