/**
 * ReviewParticipant 模型测试 - P1 重要业务模型
 *
 * 测试覆盖:
 * - CRUD 操作
 * - 评审参与者管理
 * - 参与者角色（OWNER/PARTICIPANT/OBSERVER）
 * - 评审完成状态
 * - 与评审、用户的关联关系
 *
 * 优先级：P1 - 重要业务模型
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestReview,
  createTestReviewTypeConfig,
} from '../../helpers/test-data-factory'

describe('ReviewParticipant Model - P1 Core', () => {
  describe('Basic CRUD', () => {
    it('should create review participant successfully', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const participant = await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user.id,
          role: 'PARTICIPANT',
          completed: false,
        },
      })

      expect(participant).toBeDefined()
      expect(participant.reviewId).toBe(review.id)
      expect(participant.userId).toBe(user.id)
      expect(participant.role).toBe('PARTICIPANT')
      expect(participant.completed).toBe(false)
    })

    it('should create participant with all roles', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const roles = ['OWNER', 'PARTICIPANT', 'OBSERVER']
      const participants = []

      for (const role of roles) {
        const p = await testPrisma.reviewParticipant.create({
          data: {
            reviewId: review.id,
            userId: user.id,
            role: role as any,
          },
        })
        participants.push(p)
      }

      expect(participants).toHaveLength(roles.length)
      expect(participants.map((p) => p.role)).toEqual(roles)
    })

    it('should update participant completion status', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const participant = await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user.id,
          role: 'PARTICIPANT',
          completed: false,
        },
      })

      const updated = await testPrisma.reviewParticipant.update({
        where: { id: participant.id },
        data: {
          completed: true,
          completedAt: new Date(),
        },
      })

      expect(updated.completed).toBe(true)
      expect(updated.completedAt).toBeDefined()
    })

    it('should delete participant', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const participant = await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user.id,
          role: 'PARTICIPANT',
        },
      })

      await testPrisma.reviewParticipant.delete({
        where: { id: participant.id },
      })

      const found = await testPrisma.reviewParticipant.findUnique({
        where: { id: participant.id },
      })
      expect(found).toBeNull()
    })
  })

  describe('Participant Roles', () => {
    it('should create OWNER participant', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const participant = await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user.id,
          role: 'OWNER',
        },
      })

      expect(participant.role).toBe('OWNER')
    })

    it('should create PARTICIPANT participant', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const participant = await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user.id,
          role: 'PARTICIPANT',
        },
      })

      expect(participant.role).toBe('PARTICIPANT')
    })

    it('should create OBSERVER participant', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const participant = await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user.id,
          role: 'OBSERVER',
        },
      })

      expect(participant.role).toBe('OBSERVER')
    })

    it('should allow multiple participants with different roles', async () => {
      const owner = await createTestUser()
      const participant1 = await createTestUser()
      const participant2 = await createTestUser()
      const observer = await createTestUser()
      const project = await createTestProject(owner.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: owner.id,
          role: 'OWNER',
        },
      })

      await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: participant1.id,
          role: 'PARTICIPANT',
        },
      })

      await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: participant2.id,
          role: 'PARTICIPANT',
        },
      })

      await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: observer.id,
          role: 'OBSERVER',
        },
      })

      const participants = await testPrisma.reviewParticipant.findMany({
        where: { reviewId: review.id },
      })

      expect(participants).toHaveLength(4)
    })
  })

  describe('Completion Status', () => {
    it('should create participant as not completed by default', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const participant = await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user.id,
          role: 'PARTICIPANT',
        },
      })

      expect(participant.completed).toBe(false)
      expect(participant.completedAt).toBeNull()
    })

    it('should mark participant as completed', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const participant = await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user.id,
          role: 'PARTICIPANT',
          completed: false,
        },
      })

      const completed = await testPrisma.reviewParticipant.update({
        where: { id: participant.id },
        data: {
          completed: true,
          completedAt: new Date(),
        },
      })

      expect(completed.completed).toBe(true)
      expect(completed.completedAt).toBeDefined()
    })

    it('should find completed participants', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()
      const project = await createTestProject(user1.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user1.id,
          role: 'PARTICIPANT',
          completed: true,
        },
      })

      await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user2.id,
          role: 'PARTICIPANT',
          completed: false,
        },
      })

      const completed = await testPrisma.reviewParticipant.findMany({
        where: {
          reviewId: review.id,
          completed: true,
        },
      })

      expect(completed).toHaveLength(1)
    })

    it('should find incomplete participants', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()
      const project = await createTestProject(user1.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user1.id,
          role: 'PARTICIPANT',
          completed: false,
        },
      })

      await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user2.id,
          role: 'PARTICIPANT',
          completed: false,
        },
      })

      const incomplete = await testPrisma.reviewParticipant.findMany({
        where: {
          reviewId: review.id,
          completed: false,
        },
      })

      expect(incomplete).toHaveLength(2)
    })
  })

  describe('ReviewParticipant Relationships', () => {
    it('should associate participant with review', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const participant = await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user.id,
          role: 'PARTICIPANT',
        },
      })

      expect(participant.reviewId).toBe(review.id)

      // Verify from review side
      const reviewWithParticipants = await testPrisma.review.findUnique({
        where: { id: review.id },
        include: { participants: true },
      })

      expect(reviewWithParticipants?.participants).toHaveLength(1)
    })

    it('should associate participant with user', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const participant = await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user.id,
          role: 'PARTICIPANT',
        },
      })

      expect(participant.userId).toBe(user.id)

      // Verify from user side
      const userWithParticipants = await testPrisma.user.findUnique({
        where: { id: user.id },
        include: { reviewParticipants: true },
      })

      expect(userWithParticipants?.reviewParticipants).toHaveLength(1)
    })

    it('should cascade delete participant when review deleted', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const participant = await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user.id,
          role: 'PARTICIPANT',
        },
      })

      // Delete review
      await testPrisma.review.delete({
        where: { id: review.id },
      })

      // Verify participant is also deleted (CASCADE)
      const found = await testPrisma.reviewParticipant.findUnique({
        where: { id: participant.id },
      })

      expect(found).toBeNull()
    })

    it('should cascade delete participant when user deleted', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const participant = await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user.id,
          role: 'PARTICIPANT',
        },
      })

      // Delete user
      await testPrisma.user.delete({
        where: { id: user.id },
      })

      // Verify participant is also deleted (CASCADE)
      const found = await testPrisma.reviewParticipant.findUnique({
        where: { id: participant.id },
      })

      expect(found).toBeNull()
    })
  })

  describe('Participant Queries', () => {
    it('should find participants by reviewId', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()
      const project = await createTestProject(user1.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user1.id,
          role: 'PARTICIPANT',
        },
      })

      await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user2.id,
          role: 'OBSERVER',
        },
      })

      const participants = await testPrisma.reviewParticipant.findMany({
        where: { reviewId: review.id },
      })

      expect(participants).toHaveLength(2)
    })

    it('should find participants by userId', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review1 = await createTestReview(project.id, type.id)
      const review2 = await createTestReview(project.id, type.id)

      await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review1.id,
          userId: user.id,
          role: 'PARTICIPANT',
        },
      })

      await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review2.id,
          userId: user.id,
          role: 'OBSERVER',
        },
      })

      const userParticipants = await testPrisma.reviewParticipant.findMany({
        where: { userId: user.id },
      })

      expect(userParticipants).toHaveLength(2)
    })

    it('should find participants by role', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()
      const project = await createTestProject(user1.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user1.id,
          role: 'OWNER',
        },
      })

      await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user2.id,
          role: 'PARTICIPANT',
        },
      })

      const owners = await testPrisma.reviewParticipant.findMany({
        where: {
          reviewId: review.id,
          role: 'OWNER',
        },
      })

      expect(owners).toHaveLength(1)
    })

    it('should query participant with review and user', async () => {
      const user = await createTestUser({
        email: 'participant@example.com',
        name: 'Test Participant',
      })
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id, {
        title: 'Test Review',
      })

      const participant = await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user.id,
          role: 'PARTICIPANT',
        },
      })

      const participantWithRelations = await testPrisma.reviewParticipant.findUnique({
        where: { id: participant.id },
        include: {
          review: {
            select: {
              id: true,
              title: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      expect(participantWithRelations?.review.title).toBe('Test Review')
      expect(participantWithRelations?.user.email).toBe('participant@example.com')
    })

    it('should order participants by joinedAt', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      const participant1 = await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user.id,
          role: 'PARTICIPANT',
        },
      })

      await new Promise((resolve) => setTimeout(resolve, 10))

      const participant2 = await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: user.id,
          role: 'OBSERVER',
        },
      })

      const participants = await testPrisma.reviewParticipant.findMany({
        where: { reviewId: review.id },
        orderBy: { joinedAt: 'asc' },
      })

      expect(participants[0].id).toBe(participant1.id)
      expect(participants[1].id).toBe(participant2.id)
    })
  })

  describe('Review Participation Workflow', () => {
    it('should support complete participation workflow', async () => {
      const owner = await createTestUser()
      const participant1 = await createTestUser()
      const participant2 = await createTestUser()
      const project = await createTestProject(owner.id)
      const type = await createTestReviewTypeConfig()
      const review = await createTestReview(project.id, type.id)

      // Add owner
      await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: owner.id,
          role: 'OWNER',
        },
      })

      // Add participants
      await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: participant1.id,
          role: 'PARTICIPANT',
        },
      })

      await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: participant2.id,
          role: 'PARTICIPANT',
        },
      })

      // Add observer
      await testPrisma.reviewParticipant.create({
        data: {
          reviewId: review.id,
          userId: owner.id,
          role: 'OBSERVER',
        },
      })

      // Mark one participant as completed
      const p2 = await testPrisma.reviewParticipant.findFirst({
        where: {
          reviewId: review.id,
          userId: participant1.id,
        },
      })

      await testPrisma.reviewParticipant.update({
        where: { id: p2!.id },
        data: { completed: true },
      })

      const allParticipants = await testPrisma.reviewParticipant.findMany({
        where: { reviewId: review.id },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })

      expect(allParticipants).toHaveLength(4)

      const completed = allParticipants.filter((p) => p.completed)
      const incomplete = allParticipants.filter((p) => !p.completed)

      expect(completed).toHaveLength(1)
      expect(incomplete).toHaveLength(3)
    })
  })
})
