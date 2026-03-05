/**
 * RequirementAcceptance 模型测试 - P1 重要业务模型
 *
 * 测试覆盖:
 * - CRUD 操作
 * - 验收流程（PASSED/FAILED/CONDITIONAL）
 * - 与需求、验收人的关联
 * - 验收意见和备注
 * - 验收时间记录
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

describe('RequirementAcceptance Model - P1 Core', () => {
  describe('Basic CRUD', () => {
    it('should create requirement acceptance successfully', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const acceptance = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'PENDING',
          notes: 'Awaiting review',
        },
      })

      expect(acceptance).toBeDefined()
      expect(acceptance.requirementId).toBe(requirement.id)
      expect(acceptance.userId).toBe(user.id)
      expect(acceptance.result).toBe('PENDING')
    })

    it('should create acceptance with all result types', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const passed = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'PASSED',
        },
      })

      const failed = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'FAILED',
        },
      })

      const conditional = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'CONDITIONAL',
        },
      })

      expect(passed.result).toBe('PASSED')
      expect(failed.result).toBe('FAILED')
      expect(conditional.result).toBe('CONDITIONAL')
    })

    it('should update acceptance result', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const acceptance = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'PENDING',
          notes: 'Initial review',
        },
      })

      const updated = await testPrisma.requirementAcceptance.update({
        where: { id: acceptance.id },
        data: {
          result: 'PASSED',
          notes: 'All criteria met',
        },
      })

      expect(updated.result).toBe('PASSED')
      expect(updated.notes).toBe('All criteria met')
    })

    it('should delete acceptance', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const acceptance = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'PENDING',
        },
      })

      await testPrisma.requirementAcceptance.delete({
        where: { id: acceptance.id },
      })

      const found = await testPrisma.requirementAcceptance.findUnique({
        where: { id: acceptance.id },
      })
      expect(found).toBeNull()
    })
  })

  describe('Acceptance Results', () => {
    it('should create acceptance with PASSED result', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const acceptance = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'PASSED',
          notes: 'Requirement fully implemented',
        },
      })

      expect(acceptance.result).toBe('PASSED')
      expect(acceptance.notes).toBe('Requirement fully implemented')
    })

    it('should create acceptance with FAILED result', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const acceptance = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'FAILED',
          notes: 'Missing critical functionality',
        },
      })

      expect(acceptance.result).toBe('FAILED')
      expect(acceptance.notes).toBe('Missing critical functionality')
    })

    it('should create acceptance with CONDITIONAL result', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const acceptance = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'CONDITIONAL',
          notes: 'Accepted with minor issues to be fixed',
        },
      })

      expect(acceptance.result).toBe('CONDITIONAL')
    })

    it('should transition from PENDING to PASSED', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const acceptance = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'PENDING',
        },
      })

      const passed = await testPrisma.requirementAcceptance.update({
        where: { id: acceptance.id },
        data: { result: 'PASSED' },
      })

      expect(passed.result).toBe('PASSED')
    })

    it('should transition from PENDING to FAILED', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const acceptance = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'PENDING',
        },
      })

      const failed = await testPrisma.requirementAcceptance.update({
        where: { id: acceptance.id },
        data: { result: 'FAILED' },
      })

      expect(failed.result).toBe('FAILED')
    })
  })

  describe('Acceptance Notes', () => {
    it('should create acceptance with comments', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const acceptance = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'PASSED',
          notes: 'All acceptance criteria verified and met',
        },
      })

      expect(acceptance.notes).toBe('All acceptance criteria verified and met')
    })

    it('should update acceptance comments', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const acceptance = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'CONDITIONAL',
          notes: 'Initial review notes',
        },
      })

      const updated = await testPrisma.requirementAcceptance.update({
        where: { id: acceptance.id },
        data: {
          notes: 'Updated: Minor issues fixed, accepting with conditions',
        },
      })

      expect(updated.notes).toBe('Updated: Minor issues fixed, accepting with conditions')
    })

    it('should allow null comments', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const acceptance = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'PASSED',
          notes: null,
        },
      })

      expect(acceptance.notes).toBeNull()
    })
  })

  describe('RequirementAcceptance Relationships', () => {
    it('should associate acceptance with requirement', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const acceptance = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'PASSED',
        },
      })

      expect(acceptance.requirementId).toBe(requirement.id)

      // Verify from requirement side
      const requirementWithAcceptances = await testPrisma.requirement.findUnique({
        where: { id: requirement.id },
        include: { acceptances: true },
      })

      expect(requirementWithAcceptances?.acceptances).toHaveLength(1)
    })

    it('should associate acceptance with user (acceptor)', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const acceptance = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'PASSED',
        },
      })

      expect(acceptance.userId).toBe(user.id)

      // Verify from user side
      const userWithAcceptances = await testPrisma.user.findUnique({
        where: { id: user.id },
        include: { authoredAcceptances: true },
      })

      expect(userWithAcceptances?.authoredAcceptances).toHaveLength(1)
    })

    it('should allow multiple acceptances for same requirement', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()
      const project = await createTestProject(user1.id)
      const requirement = await createTestRequirement(project.id)

      await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user1.id,
          result: 'PASSED',
        },
      })

      await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user2.id,
          result: 'FAILED',
        },
      })

      const acceptances = await testPrisma.requirementAcceptance.findMany({
        where: { requirementId: requirement.id },
      })

      expect(acceptances).toHaveLength(2)
    })

    it('should cascade delete acceptance when requirement deleted', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const acceptance = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'PASSED',
        },
      })

      // Delete requirement
      await testPrisma.requirement.delete({
        where: { id: requirement.id },
      })

      // Verify acceptance is also deleted (CASCADE)
      const found = await testPrisma.requirementAcceptance.findUnique({
        where: { id: acceptance.id },
      })

      expect(found).toBeNull()
    })

    it('should cascade delete acceptance when user deleted', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const acceptance = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'PASSED',
        },
      })

      // Delete user
      await testPrisma.user.delete({
        where: { id: user.id },
      })

      // Verify acceptance is also deleted (CASCADE)
      const found = await testPrisma.requirementAcceptance.findUnique({
        where: { id: acceptance.id },
      })

      expect(found).toBeNull()
    })
  })

  describe('Acceptance Queries', () => {
    it('should find acceptances by requirementId', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'PASSED',
        },
      })

      await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'CONDITIONAL',
        },
      })

      const acceptances = await testPrisma.requirementAcceptance.findMany({
        where: { requirementId: requirement.id },
      })

      expect(acceptances).toHaveLength(2)
    })

    it('should find acceptances by userId', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const req1 = await createTestRequirement(project.id)
      const req2 = await createTestRequirement(project.id)

      await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: req1.id,
          userId: user.id,
          result: 'PASSED',
        },
      })

      await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: req2.id,
          userId: user.id,
          result: 'FAILED',
        },
      })

      const userAcceptances = await testPrisma.requirementAcceptance.findMany({
        where: { userId: user.id },
      })

      expect(userAcceptances).toHaveLength(2)
    })

    it('should find acceptances by result', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'PASSED',
        },
      })

      await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'PASSED',
        },
      })

      await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'FAILED',
        },
      })

      const passed = await testPrisma.requirementAcceptance.findMany({
        where: {
          requirementId: requirement.id,
          result: 'PASSED',
        },
      })

      expect(passed).toHaveLength(2)
    })

    it('should query acceptance with requirement and user', async () => {
      const user = await createTestUser({
        email: 'acceptor@example.com',
        name: 'Test Acceptor',
      })
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id, {
        title: 'Acceptance Test Requirement',
      })

      const acceptance = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'PASSED',
        },
      })

      const acceptanceWithRelations = await testPrisma.requirementAcceptance.findUnique({
        where: { id: acceptance.id },
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

      expect(acceptanceWithRelations?.requirement.title).toBe('Acceptance Test Requirement')
      expect(acceptanceWithRelations?.user.email).toBe('acceptor@example.com')
    })

    it('should order acceptances by acceptedAt', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const acceptance1 = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'PASSED',
        },
      })

      await new Promise((resolve) => setTimeout(resolve, 10))

      const acceptance2 = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'FAILED',
        },
      })

      const acceptances = await testPrisma.requirementAcceptance.findMany({
        where: { requirementId: requirement.id },
        orderBy: { acceptedAt: 'asc' },
      })

      expect(acceptances[0].id).toBe(acceptance1.id)
      expect(acceptances[1].id).toBe(acceptance2.id)
    })
  })

  describe('Acceptance Workflow', () => {
    it('should complete full acceptance workflow', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      // Step 1: Create acceptance (PENDING)
      const acceptance = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'PENDING',
          notes: 'Starting acceptance review',
        },
      })

      expect(acceptance.result).toBe('PENDING')

      // Step 2: Update to PASSED after review
      const passed = await testPrisma.requirementAcceptance.update({
        where: { id: acceptance.id },
        data: {
          result: 'PASSED',
          notes: 'All acceptance criteria met after thorough review',
        },
      })

      expect(passed.result).toBe('PASSED')
      expect(passed.notes).toContain('All acceptance criteria met')
    })

    it('should handle failed acceptance with rework', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      // Initial review - FAILED
      const failed = await testPrisma.requirementAcceptance.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          result: 'FAILED',
          notes: 'Critical issues found, requires rework',
        },
      })

      expect(failed.result).toBe('FAILED')

      // After rework - PASSED
      const passed = await testPrisma.requirementAcceptance.update({
        where: { id: failed.id },
        data: {
          result: 'PASSED',
          notes: 'Issues resolved, acceptance criteria now met',
        },
      })

      expect(passed.result).toBe('PASSED')
      expect(passed.notes).toContain('Issues resolved')
    })
  })
})
