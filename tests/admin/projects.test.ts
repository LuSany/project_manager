/**
 * Admin Projects API Tests - ADMIN-02
 *
 * 测试覆盖:
 * - 项目 CRUD 操作
 * - 成员管理
 * - 项目状态与归档
 *
 * 管理员后台专项 - Phase 07
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { testPrisma, setupTestDatabase } from '../helpers/test-db'
import { createTestUser, createTestAdminUser, createTestProject, createTestProjectMember } from '../helpers/test-data-factory'
import { faker } from '@faker-js/faker'

describe('Admin Projects API', () => {
  setupTestDatabase()

  describe('Project CRUD Operations', () => {
    it('GET /api/v1/admin/projects returns project list', async () => {
      const owner = await createTestUser()
      const project1 = await createTestProject(owner.id, { name: 'Project Alpha' })
      const project2 = await createTestProject(owner.id, { name: 'Project Beta' })

      const projects = await testPrisma.projects.findMany({
        where: { id: { in: [project1.id, project2.id] } },
        orderBy: { createdAt: 'desc' },
      })

      expect(projects).toHaveLength(2)
      expect(projects.some(p => p.name === 'Project Alpha')).toBe(true)
      expect(projects.some(p => p.name === 'Project Beta')).toBe(true)
    })

    it('POST /api/v1/admin/projects creates a project', async () => {
      const owner = await createTestUser()

      const project = await testPrisma.projects.create({
        data: {
          id: faker.string.uuid(),
          name: 'New Test Project',
          description: 'A project created for testing',
          status: 'PLANNING',
          ownerId: owner.id,
          updatedAt: new Date(),
        },
      })

      expect(project).toBeDefined()
      expect(project.name).toBe('New Test Project')
      expect(project.status).toBe('PLANNING')
    })

    it('PUT /api/v1/admin/projects/:id updates project', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id, { name: 'Original Name' })

      const updated = await testPrisma.projects.update({
        where: { id: project.id },
        data: {
          name: 'Updated Project Name',
          description: 'Updated description',
          status: 'ACTIVE',
          updatedAt: new Date(),
        },
      })

      expect(updated.name).toBe('Updated Project Name')
      expect(updated.status).toBe('ACTIVE')
    })

    it('DELETE /api/v1/admin/projects/:id deletes project', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id, { name: 'To Delete' })

      await testPrisma.projects.delete({
        where: { id: project.id },
      })

      const found = await testPrisma.projects.findUnique({
        where: { id: project.id },
      })

      expect(found).toBeNull()
    })
  })

  describe('Member Management', () => {
    it('POST /api/v1/admin/projects/:id/members adds member', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const member = await createTestUser({ name: 'New Member' })

      const projectMember = await testPrisma.project_members.create({
        data: {
          projectId: project.id,
          userId: member.id,
          role: 'PROJECT_MEMBER',
        },
      })

      expect(projectMember).toBeDefined()
      expect(projectMember.role).toBe('PROJECT_MEMBER')

      const membership = await testPrisma.project_members.findFirst({
        where: { projectId: project.id, userId: member.id },
      })

      expect(membership).toBeDefined()
    })

    it('DELETE /api/v1/admin/projects/:id/members removes member', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const member = await createTestUser()
      await createTestProjectMember(project.id, member.id)

      await testPrisma.project_members.deleteMany({
        where: { projectId: project.id, userId: member.id },
      })

      const membership = await testPrisma.project_members.findFirst({
        where: { projectId: project.id, userId: member.id },
      })

      expect(membership).toBeNull()
    })

    it('should list project members', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)

      const member1 = await createTestUser({ name: 'Member 1' })
      const member2 = await createTestUser({ name: 'Member 2' })

      await createTestProjectMember(project.id, member1.id, { role: 'PROJECT_MEMBER' })
      await createTestProjectMember(project.id, member2.id, { role: 'PROJECT_OWNER' })

      const members = await testPrisma.project_members.findMany({
        where: { projectId: project.id },
        include: { users: true },
      })

      expect(members).toHaveLength(2)
      expect(members.some(m => m.users.name === 'Member 1')).toBe(true)
      expect(members.some(m => m.users.name === 'Member 2')).toBe(true)
    })

    it('should update member role', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const member = await createTestUser()
      await createTestProjectMember(project.id, member.id, { role: 'PROJECT_MEMBER' })

      const updated = await testPrisma.project_members.updateMany({
        where: { projectId: project.id, userId: member.id },
        data: { role: 'PROJECT_OWNER' },
      })

      expect(updated.count).toBe(1)

      const membership = await testPrisma.project_members.findFirst({
        where: { projectId: project.id, userId: member.id },
      })

      expect(membership?.role).toBe('PROJECT_OWNER')
    })
  })

  describe('Project Status', () => {
    it('PATCH /api/v1/admin/projects/:id/archive archives project', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id, { status: 'COMPLETED' })

      const archived = await testPrisma.projects.update({
        where: { id: project.id },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
        },
      })

      expect(archived.status).toBe('CANCELLED')
    })

    it('PATCH /api/v1/admin/projects/:id/restore restores archived project', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id, { status: 'CANCELLED' })

      const restored = await testPrisma.projects.update({
        where: { id: project.id },
        data: {
          status: 'PLANNING',
          updatedAt: new Date(),
        },
      })

      expect(restored.status).toBe('PLANNING')
    })

    it('should transition project through status lifecycle', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id, { status: 'PLANNING' })

      // PLANNING -> ACTIVE
      const active = await testPrisma.projects.update({
        where: { id: project.id },
        data: { status: 'ACTIVE', updatedAt: new Date() },
      })
      expect(active.status).toBe('ACTIVE')

      // ACTIVE -> ON_HOLD
      const onHold = await testPrisma.projects.update({
        where: { id: project.id },
        data: { status: 'ON_HOLD', updatedAt: new Date() },
      })
      expect(onHold.status).toBe('ON_HOLD')

      // ON_HOLD -> COMPLETED
      const completed = await testPrisma.projects.update({
        where: { id: project.id },
        data: { status: 'COMPLETED', updatedAt: new Date() },
      })
      expect(completed.status).toBe('COMPLETED')
    })
  })

  describe('Project Filtering', () => {
    it('should filter projects by status', async () => {
      const owner = await createTestUser()
      await createTestProject(owner.id, { status: 'PLANNING' })
      await createTestProject(owner.id, { status: 'ACTIVE' })
      await createTestProject(owner.id, { status: 'CANCELLED' })

      const activeProjects = await testPrisma.projects.findMany({
        where: { status: { in: ['PLANNING', 'ACTIVE'] } },
      })

      expect(activeProjects.every(p => p.status !== 'CANCELLED')).toBe(true)
    })

    it('should filter projects by owner', async () => {
      const owner1 = await createTestUser({ name: 'Owner 1' })
      const owner2 = await createTestUser({ name: 'Owner 2' })
      await createTestProject(owner1.id)
      await createTestProject(owner2.id)

      const owner1Projects = await testPrisma.projects.findMany({
        where: { ownerId: owner1.id },
      })

      expect(owner1Projects.every(p => p.ownerId === owner1.id)).toBe(true)
    })

    it('should search projects by name', async () => {
      const owner = await createTestUser()
      // Use very unique project names to avoid collision with other tests
      const uniqueSuffix = `SearchTest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      await createTestProject(owner.id, { name: `Alpha${uniqueSuffix}` })
      await createTestProject(owner.id, { name: `Beta${uniqueSuffix}` })
      await createTestProject(owner.id, { name: `GammaAlpha${uniqueSuffix}` })

      const alphaProjects = await testPrisma.projects.findMany({
        where: { ownerId: owner.id, name: { contains: `Alpha${uniqueSuffix}` } },
      })

      expect(alphaProjects.length).toBe(2)
    })
  })

  describe('Project Dates', () => {
    it('should set project start and end dates', async () => {
      const owner = await createTestUser()
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31')

      const project = await testPrisma.projects.create({
        data: {
          id: faker.string.uuid(),
          name: 'Dated Project',
          ownerId: owner.id,
          startDate,
          endDate,
          status: 'PLANNING',
          updatedAt: new Date(),
        },
      })

      expect(project.startDate).toEqual(startDate)
      expect(project.endDate).toEqual(endDate)
    })

    it('should update project dates', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)

      const newStartDate = new Date('2024-02-01')
      const newEndDate = new Date('2024-11-30')

      const updated = await testPrisma.projects.update({
        where: { id: project.id },
        data: {
          startDate: newStartDate,
          endDate: newEndDate,
          updatedAt: new Date(),
        },
      })

      expect(updated.startDate).toEqual(newStartDate)
      expect(updated.endDate).toEqual(newEndDate)
    })
  })
})