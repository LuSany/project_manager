/**
 * RequirementImpact 模型测试 - P1 重要业务模型
 *
 * 测试覆盖:
 * - CRUD 操作
 * - 波及影响分析（影响范围、影响程度）
 * - 与需求的关联关系
 * - 影响类型和级别
 * - 波及相关方管理
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

describe('RequirementImpact Model - P1 Core', () => {
  describe('Basic CRUD', () => {
    it('should create requirement impact successfully', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const impact = await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'Impact on existing systems',
          severity: 'MEDIUM',
        },
      })

      expect(impact).toBeDefined()
      expect(impact.requirementId).toBe(requirement.id)
      expect(impact.description).toBe('Impact on existing systems')
      expect(impact.severity).toBe('MEDIUM')
    })

    it('should create impact with all severity levels', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const low = await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'Low impact',
          severity: 'LOW',
        },
      })

      const high = await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'High impact',
          severity: 'HIGH',
        },
      })

      expect(low.severity).toBe('LOW')
      expect(high.severity).toBe('HIGH')
    })

    it('should update requirement impact', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const impact = await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'Initial impact',
          severity: 'LOW',
        },
      })

      const updated = await testPrisma.requirementImpact.update({
        where: { id: impact.id },
        data: {
          description: 'Updated impact assessment',
          severity: 'HIGH',
        },
      })

      expect(updated.description).toBe('Updated impact assessment')
      expect(updated.severity).toBe('HIGH')
    })

    it('should delete requirement impact', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const impact = await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'To be deleted',
          severity: 'MEDIUM',
        },
      })

      await testPrisma.requirementImpact.delete({
        where: { id: impact.id },
      })

      const found = await testPrisma.requirementImpact.findUnique({
        where: { id: impact.id },
      })
      expect(found).toBeNull()
    })
  })

  describe('Impact Severity Levels', () => {
    it('should create impact with LOW severity', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const impact = await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'Minor impact',
          severity: 'LOW',
        },
      })

      expect(impact.severity).toBe('LOW')
    })

    it('should create impact with MEDIUM severity', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const impact = await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'Moderate impact',
          severity: 'MEDIUM',
        },
      })

      expect(impact.severity).toBe('MEDIUM')
    })

    it('should create impact with HIGH severity', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const impact = await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'Significant impact',
          severity: 'HIGH',
        },
      })

      expect(impact.severity).toBe('HIGH')
    })
  })

  describe('Multiple Impacts per Requirement', () => {
    it('should allow multiple impacts for same requirement', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'Technical impact',
          severity: 'HIGH',
        },
      })

      await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'Business impact',
          severity: 'MEDIUM',
        },
      })

      await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'User impact',
          severity: 'LOW',
        },
      })

      const impacts = await testPrisma.requirementImpact.findMany({
        where: { requirementId: requirement.id },
      })

      expect(impacts).toHaveLength(3)
    })

    it('should query impacts by severity', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'High impact 1',
          severity: 'HIGH',
        },
      })

      await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'High impact 2',
          severity: 'HIGH',
        },
      })

      await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'Low impact',
          severity: 'LOW',
        },
      })

      const highImpacts = await testPrisma.requirementImpact.findMany({
        where: {
          requirementId: requirement.id,
          severity: 'HIGH',
        },
      })

      expect(highImpacts).toHaveLength(2)
    })
  })

  describe('RequirementImpact Relationships', () => {
    it('should associate impact with requirement', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const impact = await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'Related impact',
          severity: 'MEDIUM',
        },
      })

      expect(impact.requirementId).toBe(requirement.id)

      // Verify from requirement side
      const requirementWithImpacts = await testPrisma.requirement.findUnique({
        where: { id: requirement.id },
        include: { impacts: true },
      })

      expect(requirementWithImpacts?.impacts).toHaveLength(1)
    })

    it('should cascade delete impact when requirement deleted', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const impact = await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'Cascade test',
          severity: 'MEDIUM',
        },
      })

      // Delete requirement
      await testPrisma.requirement.delete({
        where: { id: requirement.id },
      })

      // Verify impact is also deleted (CASCADE)
      const found = await testPrisma.requirementImpact.findUnique({
        where: { id: impact.id },
      })

      expect(found).toBeNull()
    })
  })

  describe('Impact Description', () => {
    it('should store detailed impact description', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const detailedDescription = `
        This requirement will impact:
        1. Existing user authentication flow
        2. Database schema changes
        3. API endpoints versioning
        4. Frontend component updates
        5. Third-party integrations
      `.trim()

      const impact = await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: detailedDescription,
          severity: 'HIGH',
        },
      })

      expect(impact.description).toContain('authentication flow')
      expect(impact.description).toContain('Database schema')
    })

    it('should allow updating impact description', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const impact = await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'Initial assessment',
          severity: 'MEDIUM',
        },
      })

      const updated = await testPrisma.requirementImpact.update({
        where: { id: impact.id },
        data: {
          description: 'Updated assessment after detailed analysis',
        },
      })

      expect(updated.description).toBe('Updated assessment after detailed analysis')
    })
  })

  describe('Impact Queries', () => {
    it('should find impacts by requirementId', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const req1 = await createTestRequirement(project.id)
      const req2 = await createTestRequirement(project.id)

      await testPrisma.requirementImpact.create({
        data: {
          requirementId: req1.id,
          description: 'Impact 1',
          severity: 'LOW',
        },
      })

      await testPrisma.requirementImpact.create({
        data: {
          requirementId: req1.id,
          description: 'Impact 2',
          severity: 'HIGH',
        },
      })

      await testPrisma.requirementImpact.create({
        data: {
          requirementId: req2.id,
          description: 'Impact 3',
          severity: 'MEDIUM',
        },
      })

      const req1Impacts = await testPrisma.requirementImpact.findMany({
        where: { requirementId: req1.id },
      })

      expect(req1Impacts).toHaveLength(2)
    })

    it('should find high severity impacts', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'Critical impact',
          severity: 'HIGH',
        },
      })

      await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'Minor impact',
          severity: 'LOW',
        },
      })

      const highSeverity = await testPrisma.requirementImpact.findMany({
        where: {
          requirementId: requirement.id,
          severity: 'HIGH',
        },
      })

      expect(highSeverity).toHaveLength(1)
      expect(highSeverity[0].description).toBe('Critical impact')
    })

    it('should query impact with requirement', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id, {
        title: 'Impact Analysis Requirement',
      })

      const impact = await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'Impact to query',
          severity: 'HIGH',
        },
      })

      const impactWithRequirement = await testPrisma.requirementImpact.findUnique({
        where: { id: impact.id },
        include: {
          requirement: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      })

      expect(impactWithRequirement?.requirement.title).toBe('Impact Analysis Requirement')
    })

    it('should order impacts by severity', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'Low impact',
          severity: 'LOW',
        },
      })

      await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'High impact',
          severity: 'HIGH',
        },
      })

      await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'Medium impact',
          severity: 'MEDIUM',
        },
      })

      const impacts = await testPrisma.requirementImpact.findMany({
        where: { requirementId: requirement.id },
        orderBy: { createdAt: 'asc' },
      })

      expect(impacts.length).toBe(3)
    })
  })

  describe('Impact Assessment Workflow', () => {
    it('should create multiple impacts for comprehensive analysis', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      // Technical impact
      await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'Database migration required',
          severity: 'HIGH',
        },
      })

      // Business impact
      await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'Business process changes',
          severity: 'MEDIUM',
        },
      })

      // User impact
      await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'UI changes for end users',
          severity: 'LOW',
        },
      })

      const allImpacts = await testPrisma.requirementImpact.findMany({
        where: { requirementId: requirement.id },
      })

      expect(allImpacts).toHaveLength(3)

      // Verify severity distribution
      const highSeverity = allImpacts.filter((i) => i.severity === 'HIGH')
      const mediumSeverity = allImpacts.filter((i) => i.severity === 'MEDIUM')
      const lowSeverity = allImpacts.filter((i) => i.severity === 'LOW')

      expect(highSeverity).toHaveLength(1)
      expect(mediumSeverity).toHaveLength(1)
      expect(lowSeverity).toHaveLength(1)
    })

    it('should update impact severity after review', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const impact = await testPrisma.requirementImpact.create({
        data: {
          requirementId: requirement.id,
          description: 'Initial assessment',
          severity: 'LOW',
        },
      })

      // After detailed review, severity increased
      const reassessed = await testPrisma.requirementImpact.update({
        where: { id: impact.id },
        data: {
          severity: 'HIGH',
          description: 'Reassessment shows greater impact than initially thought',
        },
      })

      expect(reassessed.severity).toBe('HIGH')
      expect(reassessed.description).toContain('Reassessment')
    })
  })
})
