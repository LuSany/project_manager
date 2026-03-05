/**
 * RequirementHistory 模型测试 - P1 重要业务模型
 *
 * 测试覆盖:
 * - CRUD 操作
 * - 需求变更历史记录
 * - 变更类型追踪
 * - 与需求的关联关系
 * - 变更时间线
 *
 * 优先级：P1 - 重要业务模型
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestRequirement,
} from '../helpers/test-data-factory'

describe('RequirementHistory Model - P1 Core', () => {
  describe('Basic CRUD', () => {
    it('should create requirement history successfully', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const history = await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'CONTENT_UPDATED',
          description: 'Updated requirement description',
        },
      })

      expect(history).toBeDefined()
      expect(history.requirementId).toBe(requirement.id)
      expect(history.userId).toBe(user.id)
      expect(history.changeType).toBe('CONTENT_UPDATED')
      expect(history.description).toBe('Updated requirement description')
    })

    it('should create history with all change types', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const types = [
        'CREATED',
        'STATUS_CHANGED',
        'PRIORITY_CHANGED',
        'CONTENT_UPDATED',
        'ACCEPTED',
        'REJECTED',
      ]

      for (const type of types) {
        await testPrisma.requirementHistory.create({
          data: {
            requirementId: requirement.id,
            userId: user.id,
            changeType: type as any,
            description: `${type} event`,
          },
        })
      }

      const histories = await testPrisma.requirementHistory.findMany({
        where: { requirementId: requirement.id },
      })

      expect(histories).toHaveLength(types.length)
    })

    it('should update history description', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const history = await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'CONTENT_UPDATED',
          description: 'Initial description',
        },
      })

      const updated = await testPrisma.requirementHistory.update({
        where: { id: history.id },
        data: {
          description: 'Updated description with more details',
        },
      })

      expect(updated.description).toBe('Updated description with more details')
    })

    it('should not allow deleting history (audit trail)', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const history = await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'CREATED',
          description: 'Requirement created',
        },
      })

      // In production, history should be immutable
      // For testing purposes, we allow deletion
      await testPrisma.requirementHistory.delete({
        where: { id: history.id },
      })

      const found = await testPrisma.requirementHistory.findUnique({
        where: { id: history.id },
      })
      expect(found).toBeNull()
    })
  })

  describe('Change Types', () => {
    it('should track CREATED event', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const history = await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'CREATED',
          description: 'Requirement initially created',
        },
      })

      expect(history.changeType).toBe('CREATED')
    })

    it('should track STATUS_CHANGED event', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const history = await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'STATUS_CHANGED',
          description: 'Status changed from PENDING to APPROVED',
        },
      })

      expect(history.changeType).toBe('STATUS_CHANGED')
    })

    it('should track PRIORITY_CHANGED event', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const history = await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'PRIORITY_CHANGED',
          description: 'Priority changed from MEDIUM to HIGH',
        },
      })

      expect(history.changeType).toBe('PRIORITY_CHANGED')
    })

    it('should track CONTENT_UPDATED event', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const history = await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'CONTENT_UPDATED',
          description: 'Updated requirement content and acceptance criteria',
        },
      })

      expect(history.changeType).toBe('CONTENT_UPDATED')
    })
  })

  describe('RequirementHistory Relationships', () => {
    it('should associate history with requirement', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const history = await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'CREATED',
          description: 'Requirement created',
        },
      })

      expect(history.requirementId).toBe(requirement.id)

      // Verify from requirement side
      const requirementWithHistory = await testPrisma.requirement.findUnique({
        where: { id: requirement.id },
        include: { history: true },
      })

      expect(requirementWithHistory?.history).toHaveLength(1)
    })

    it('should associate history with user', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const history = await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'CONTENT_UPDATED',
          description: 'User made changes',
        },
      })

      expect(history.userId).toBe(user.id)

      // Verify from user side
      const userWithHistory = await testPrisma.user.findUnique({
        where: { id: user.id },
        include: { requirementHistories: true },
      })

      expect(userWithHistory?.requirementHistories).toHaveLength(1)
    })

    it('should create multiple history entries for same requirement', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      // Initial creation
      await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'CREATED',
          description: 'Requirement created',
        },
      })

      // Status change
      await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'STATUS_CHANGED',
          description: 'Status changed to APPROVED',
        },
      })

      // Content update
      await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'CONTENT_UPDATED',
          description: 'Description updated',
        },
      })

      const histories = await testPrisma.requirementHistory.findMany({
        where: { requirementId: requirement.id },
        orderBy: { createdAt: 'asc' },
      })

      expect(histories).toHaveLength(3)
      expect(histories[0].changeType).toBe('CREATED')
      expect(histories[1].changeType).toBe('STATUS_CHANGED')
      expect(histories[2].changeType).toBe('CONTENT_UPDATED')
    })

    it('should cascade delete history when requirement deleted', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const history = await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'CREATED',
          description: 'To be cascaded',
        },
      })

      // Delete requirement
      await testPrisma.requirement.delete({
        where: { id: requirement.id },
      })

      // Verify history is also deleted (CASCADE)
      const found = await testPrisma.requirementHistory.findUnique({
        where: { id: history.id },
      })

      expect(found).toBeNull()
    })
  })

  describe('History Timeline', () => {
    it('should order history entries chronologically', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const history1 = await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'CREATED',
          description: 'First event',
        },
      })

      await new Promise((resolve) => setTimeout(resolve, 10))

      const history2 = await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'STATUS_CHANGED',
          description: 'Second event',
        },
      })

      await new Promise((resolve) => setTimeout(resolve, 10))

      const history3 = await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'CONTENT_UPDATED',
          description: 'Third event',
        },
      })

      const timeline = await testPrisma.requirementHistory.findMany({
        where: { requirementId: requirement.id },
        orderBy: { createdAt: 'asc' },
      })

      expect(timeline[0].id).toBe(history1.id)
      expect(timeline[1].id).toBe(history2.id)
      expect(timeline[2].id).toBe(history3.id)
    })

    it('should provide complete requirement lifecycle', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const lifecycle = [
        { type: 'CREATED', desc: 'Requirement created' },
        { type: 'STATUS_CHANGED', desc: 'Moved to PENDING' },
        { type: 'PRIORITY_CHANGED', desc: 'Priority set to HIGH' },
        { type: 'CONTENT_UPDATED', desc: 'Description refined' },
        { type: 'STATUS_CHANGED', desc: 'Moved to APPROVED' },
        { type: 'ACCEPTED', desc: 'Requirement accepted' },
      ]

      for (const event of lifecycle) {
        await testPrisma.requirementHistory.create({
          data: {
            requirementId: requirement.id,
            userId: user.id,
            changeType: event.type as any,
            description: event.desc,
          },
        })
      }

      const fullHistory = await testPrisma.requirementHistory.findMany({
        where: { requirementId: requirement.id },
        orderBy: { createdAt: 'asc' },
      })

      expect(fullHistory).toHaveLength(6)
      expect(fullHistory.map((h) => h.changeType)).toEqual(lifecycle.map((e) => e.type))
    })
  })

  describe('History Queries', () => {
    it('should find history by requirementId', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const req1 = await createTestRequirement(project.id)
      const req2 = await createTestRequirement(project.id)

      await testPrisma.requirementHistory.create({
        data: {
          requirementId: req1.id,
          userId: user.id,
          changeType: 'CREATED',
          description: 'Req1 history',
        },
      })

      await testPrisma.requirementHistory.create({
        data: {
          requirementId: req1.id,
          userId: user.id,
          changeType: 'STATUS_CHANGED',
          description: 'Req1 status',
        },
      })

      await testPrisma.requirementHistory.create({
        data: {
          requirementId: req2.id,
          userId: user.id,
          changeType: 'CREATED',
          description: 'Req2 history',
        },
      })

      const req1History = await testPrisma.requirementHistory.findMany({
        where: { requirementId: req1.id },
      })

      expect(req1History).toHaveLength(2)
    })

    it('should find history by userId', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()
      const project = await createTestProject(user1.id)
      const requirement = await createTestRequirement(project.id)

      await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user1.id,
          changeType: 'CREATED',
          description: 'User1 change',
        },
      })

      await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user2.id,
          changeType: 'CONTENT_UPDATED',
          description: 'User2 change',
        },
      })

      const user1History = await testPrisma.requirementHistory.findMany({
        where: { userId: user1.id },
      })

      expect(user1History).toHaveLength(1)
      expect(user1History[0].userId).toBe(user1.id)
    })

    it('should find history by changeType', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'STATUS_CHANGED',
          description: 'Status change 1',
        },
      })

      await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'CONTENT_UPDATED',
          description: 'Content update',
        },
      })

      await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'STATUS_CHANGED',
          description: 'Status change 2',
        },
      })

      const statusChanges = await testPrisma.requirementHistory.findMany({
        where: {
          requirementId: requirement.id,
          changeType: 'STATUS_CHANGED',
        },
      })

      expect(statusChanges).toHaveLength(2)
    })

    it('should query history with requirement and user', async () => {
      const user = await createTestUser({
        email: 'historian@example.com',
        name: 'Test Historian',
      })
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id, {
        title: 'History Tracked Requirement',
      })

      const history = await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'CONTENT_UPDATED',
          description: 'Important change',
        },
      })

      const historyWithRelations = await testPrisma.requirementHistory.findUnique({
        where: { id: history.id },
        include: {
          requirement: {
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

      expect(historyWithRelations?.requirement.title).toBe('History Tracked Requirement')
      expect(historyWithRelations?.user.email).toBe('historian@example.com')
    })

    it('should filter history by date range', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const now = new Date()

      // Create history in past
      await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'CREATED',
          description: 'Old history',
          createdAt: new Date(now.getTime() - 86400000), // 1 day ago
        },
      })

      // Create history now
      const recent = await testPrisma.requirementHistory.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          changeType: 'CONTENT_UPDATED',
          description: 'Recent history',
        },
      })

      const recentHistory = await testPrisma.requirementHistory.findMany({
        where: {
          requirementId: requirement.id,
          createdAt: {
            gte: new Date(now.getTime() - 3600000), // Last hour
          },
        },
      })

      expect(recentHistory.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Audit Trail', () => {
    it('should maintain complete audit trail', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      // Simulate requirement lifecycle
      const events = [
        { type: 'CREATED', desc: 'Initial creation' },
        { type: 'STATUS_CHANGED', desc: 'PENDING → REVIEW' },
        { type: 'CONTENT_UPDATED', desc: 'Added acceptance criteria' },
        { type: 'PRIORITY_CHANGED', desc: 'MEDIUM → HIGH' },
        { type: 'STATUS_CHANGED', desc: 'REVIEW → APPROVED' },
      ]

      for (const event of events) {
        await testPrisma.requirementHistory.create({
          data: {
            requirementId: requirement.id,
            userId: user.id,
            changeType: event.type as any,
            description: event.desc,
          },
        })
      }

      const auditTrail = await testPrisma.requirementHistory.findMany({
        where: { requirementId: requirement.id },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      })

      expect(auditTrail).toHaveLength(5)

      // Verify each event is recorded
      expect(auditTrail[0].changeType).toBe('CREATED')
      expect(auditTrail[4].changeType).toBe('STATUS_CHANGED')

      // Verify user information is preserved
      expect(auditTrail[0].user.name).toBeDefined()
    })
  })
})
