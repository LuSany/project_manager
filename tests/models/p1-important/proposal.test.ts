/**
 * Proposal 模型测试 - P1 重要业务模型
 *
 * 测试覆盖:
 * - CRUD 操作
 * - 方案评估流程
 * - 状态流转（PENDING → ACCEPTED/REJECTED）
 * - 与需求的关联关系
 * - 资源/成本/风险评估
 *
 * 优先级：P1 - 重要业务模型
 * 目标覆盖率：98%
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestRequirement,
} from '../../helpers/test-data-factory'
import { faker } from '@faker-js/faker'

describe('Proposal Model - P1 Core', () => {
  describe('Basic CRUD', () => {
    it('should create proposal successfully', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const proposal = await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Proposal content for requirement',
          estimatedHours: 40,
          estimatedCost: 10000,
          status: 'PENDING',
        },
      })

      expect(proposal).toBeDefined()
      expect(proposal.requirementId).toBe(requirement.id)
      expect(proposal.userId).toBe(user.id)
      expect(proposal.content).toBe('Proposal content for requirement')
      expect(proposal.estimatedHours).toBe(40)
      expect(proposal.estimatedCost).toBe(10000)
      expect(proposal.status).toBe('PENDING')
    })

    it('should create proposal with all optional fields', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const proposal = await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Detailed proposal',
          estimatedHours: 80,
          estimatedCost: 20000,
          resources: JSON.stringify(['Developer', 'Designer', 'QA']),
          plannedStart: new Date('2024-06-01'),
          plannedEnd: new Date('2024-08-01'),
          risks: 'Technical complexity may cause delays',
          status: 'PENDING',
        },
      })

      expect(proposal.resources).toBe('["Developer","Designer","QA"]')
      expect(proposal.plannedStart).toEqual(new Date('2024-06-01'))
      expect(proposal.plannedEnd).toEqual(new Date('2024-08-01'))
      expect(proposal.risks).toBe('Technical complexity may cause delays')
    })

    it('should update proposal', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const proposal = await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Initial proposal',
          status: 'PENDING',
        },
      })

      const updated = await testPrisma.proposal.update({
        where: { id: proposal.id },
        data: {
          content: 'Updated proposal',
          estimatedHours: 60,
          status: 'ACCEPTED',
        },
      })

      expect(updated.content).toBe('Updated proposal')
      expect(updated.estimatedHours).toBe(60)
      expect(updated.status).toBe('ACCEPTED')
    })

    it('should delete proposal', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const proposal = await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'To be deleted',
          status: 'PENDING',
        },
      })

      await testPrisma.proposal.delete({
        where: { id: proposal.id },
      })

      const found = await testPrisma.proposal.findUnique({
        where: { id: proposal.id },
      })
      expect(found).toBeNull()
    })
  })

  describe('Proposal Status Flow', () => {
    it('should create proposal with PENDING status (default)', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const proposal = await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'New proposal',
        },
      })

      expect(proposal.status).toBe('PENDING')
    })

    it('should transition from PENDING to ACCEPTED', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const proposal = await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Proposal to accept',
          status: 'PENDING',
        },
      })

      const accepted = await testPrisma.proposal.update({
        where: { id: proposal.id },
        data: { status: 'ACCEPTED' },
      })

      expect(accepted.status).toBe('ACCEPTED')
    })

    it('should transition from PENDING to REJECTED', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const proposal = await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Proposal to reject',
          status: 'PENDING',
        },
      })

      const rejected = await testPrisma.proposal.update({
        where: { id: proposal.id },
        data: { status: 'REJECTED' },
      })

      expect(rejected.status).toBe('REJECTED')
    })
  })

  describe('Proposal Estimation', () => {
    it('should create proposal with estimated hours', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const proposal = await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Estimated proposal',
          estimatedHours: 100,
        },
      })

      expect(proposal.estimatedHours).toBe(100)
    })

    it('should create proposal with estimated cost', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const proposal = await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Cost proposal',
          estimatedCost: 50000,
        },
      })

      expect(proposal.estimatedCost).toBe(50000)
    })

    it('should create proposal with both hours and cost', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const proposal = await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Full estimation',
          estimatedHours: 80,
          estimatedCost: 25000,
        },
      })

      expect(proposal.estimatedHours).toBe(80)
      expect(proposal.estimatedCost).toBe(25000)
    })

    it('should update estimation', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const proposal = await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Initial estimate',
          estimatedHours: 50,
          estimatedCost: 15000,
        },
      })

      const updated = await testPrisma.proposal.update({
        where: { id: proposal.id },
        data: {
          estimatedHours: 75,
          estimatedCost: 22000,
        },
      })

      expect(updated.estimatedHours).toBe(75)
      expect(updated.estimatedCost).toBe(22000)
    })
  })

  describe('Proposal Relationships', () => {
    it('should associate proposal with requirement', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const proposal = await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Related proposal',
        },
      })

      expect(proposal.requirementId).toBe(requirement.id)

      // Verify from requirement side
      const requirementWithProposals = await testPrisma.requirement.findUnique({
        where: { id: requirement.id },
        include: { proposals: true },
      })

      expect(requirementWithProposals?.proposals).toHaveLength(1)
    })

    it('should associate proposal with user (evaluator)', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const proposal = await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'User proposal',
        },
      })

      expect(proposal.userId).toBe(user.id)

      // Verify from user side
      const userWithProposals = await testPrisma.user.findUnique({
        where: { id: user.id },
        include: { authoredProposals: true },
      })

      expect(userWithProposals?.authoredProposals).toHaveLength(1)
    })

    it('should allow multiple proposals for same requirement', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()
      const project = await createTestProject(user1.id)
      const requirement = await createTestRequirement(project.id)

      await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user1.id,
          content: 'Proposal 1',
        },
      })

      await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user2.id,
          content: 'Proposal 2',
        },
      })

      const proposals = await testPrisma.proposal.findMany({
        where: { requirementId: requirement.id },
      })

      expect(proposals).toHaveLength(2)
    })

    it('should allow same user to create multiple proposals for different requirements', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const req1 = await createTestRequirement(project.id)
      const req2 = await createTestRequirement(project.id)

      await testPrisma.proposal.create({
        data: {
          requirementId: req1.id,
          userId: user.id,
          content: 'Proposal for req1',
        },
      })

      await testPrisma.proposal.create({
        data: {
          requirementId: req2.id,
          userId: user.id,
          content: 'Proposal for req2',
        },
      })

      const proposals = await testPrisma.proposal.findMany({
        where: { userId: user.id },
      })

      expect(proposals).toHaveLength(2)
    })

    it('should cascade delete proposal when requirement deleted', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const proposal = await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'To be cascaded',
        },
      })

      // Delete requirement
      await testPrisma.requirement.delete({
        where: { id: requirement.id },
      })

      // Verify proposal is also deleted (CASCADE)
      const found = await testPrisma.proposal.findUnique({
        where: { id: proposal.id },
      })

      expect(found).toBeNull()
    })

    it('should cascade delete proposal when user deleted', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const proposal = await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'User cascade test',
        },
      })

      // Delete user
      await testPrisma.user.delete({
        where: { id: user.id },
      })

      // Verify proposal is also deleted (CASCADE)
      const found = await testPrisma.proposal.findUnique({
        where: { id: proposal.id },
      })

      expect(found).toBeNull()
    })
  })

  describe('Proposal Queries', () => {
    it('should find proposals by requirementId', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Proposal 1',
        },
      })

      await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Proposal 2',
        },
      })

      const proposals = await testPrisma.proposal.findMany({
        where: { requirementId: requirement.id },
      })

      expect(proposals).toHaveLength(2)
    })

    it('should find proposals by userId', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const req1 = await createTestRequirement(project.id)
      const req2 = await createTestRequirement(project.id)

      await testPrisma.proposal.create({
        data: {
          requirementId: req1.id,
          userId: user.id,
          content: 'Proposal 1',
        },
      })

      await testPrisma.proposal.create({
        data: {
          requirementId: req2.id,
          userId: user.id,
          content: 'Proposal 2',
        },
      })

      const proposals = await testPrisma.proposal.findMany({
        where: { userId: user.id },
      })

      expect(proposals).toHaveLength(2)
    })

    it('should find proposals by status', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Pending proposal',
          status: 'PENDING',
        },
      })

      await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Accepted proposal',
          status: 'ACCEPTED',
        },
      })

      const pending = await testPrisma.proposal.findMany({
        where: {
          requirementId: requirement.id,
          status: 'PENDING',
        },
      })

      expect(pending).toHaveLength(1)
    })

    it('should query proposal with requirement and user', async () => {
      const user = await createTestUser({
        email: 'evaluator@example.com',
        name: 'Test Evaluator',
      })
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const proposal = await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Full query test',
        },
      })

      const proposalWithRelations = await testPrisma.proposal.findUnique({
        where: { id: proposal.id },
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

      expect(proposalWithRelations?.requirement.title).toBeDefined()
      expect(proposalWithRelations?.user.email).toBe('evaluator@example.com')
    })

    it('should order proposals by createdAt', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const proposal1 = await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'First proposal',
        },
      })

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10))

      const proposal2 = await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Second proposal',
        },
      })

      const proposals = await testPrisma.proposal.findMany({
        where: { requirementId: requirement.id },
        orderBy: { createdAt: 'asc' },
      })

      expect(proposals[0].id).toBe(proposal1.id)
      expect(proposals[1].id).toBe(proposal2.id)
    })
  })

  describe('Proposal Resources and Risks', () => {
    it('should store resources as JSON string', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const resources = ['Developer', 'Designer', 'QA Engineer', 'Project Manager']

      const proposal = await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Resource heavy proposal',
          resources: JSON.stringify(resources),
        },
      })

      expect(proposal.resources).toBe(JSON.stringify(resources))

      // Parse and verify
      const parsed = JSON.parse(proposal.resources || '[]')
      expect(parsed).toHaveLength(4)
    })

    it('should store risks as text', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const risks = 'High technical complexity, tight deadline, resource constraints'

      const proposal = await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Risky proposal',
          risks,
        },
      })

      expect(proposal.risks).toBe(risks)
    })

    it('should create proposal with planned timeline', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const plannedStart = new Date('2024-07-01')
      const plannedEnd = new Date('2024-09-30')

      const proposal = await testPrisma.proposal.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Timeline proposal',
          plannedStart,
          plannedEnd,
        },
      })

      expect(proposal.plannedStart).toEqual(plannedStart)
      expect(proposal.plannedEnd).toEqual(plannedEnd)
    })
  })
})
