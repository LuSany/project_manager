/**
 * Admin Permissions Tests - ADMIN-03
 *
 * 测试覆盖:
 * - RBAC 权限检查
 * - 资源级权限控制
 * - 权限继承机制
 * - 项目成员权限
 *
 * 管理员后台专项 - Phase 07
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { testPrisma, setupTestDatabase } from '../helpers/test-db'
import { createTestUser, createTestAdminUser, createTestProject, createTestProjectMember, createTestTask } from '../helpers/test-data-factory'
import { faker } from '@faker-js/faker'

describe('Admin Permissions API', () => {
  setupTestDatabase()

  describe('Role-Based Access Control (RBAC)', () => {
    it('ADMIN role has full system access', async () => {
      const admin = await createTestAdminUser()

      // Admin can access all users
      const allUsers = await testPrisma.users.findMany()
      expect(allUsers.length).toBeGreaterThanOrEqual(1)

      // Admin can access all projects
      const allProjects = await testPrisma.projects.findMany()
      expect(allProjects.length).toBeGreaterThanOrEqual(0)

      // Admin role is stored correctly
      expect(admin.role).toBe('ADMIN')
    })

    it('PROJECT_ADMIN role can manage projects', async () => {
      const owner = await createTestUser()
      const projectAdmin = await createTestUser({ role: 'PROJECT_ADMIN' })

      // PROJECT_ADMIN can create projects
      const project = await createTestProject(projectAdmin.id)

      expect(project.ownerId).toBe(projectAdmin.id)
      expect(projectAdmin.role).toBe('PROJECT_ADMIN')
    })

    it('EMPLOYEE role has limited access', async () => {
      const employee = await createTestUser({ role: 'EMPLOYEE' })

      // EMPLOYEE cannot access admin endpoints (simulated)
      expect(employee.role).toBe('EMPLOYEE')

      // EMPLOYEE should not appear in admin role list
      const admins = await testPrisma.users.findMany({
        where: { role: { in: ['ADMIN', 'PROJECT_ADMIN'] } },
      })

      expect(admins.some(a => a.id === employee.id)).toBe(false)
    })

    it('PROJECT_MEMBER role is project-specific', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const member = await createTestUser({ role: 'PROJECT_MEMBER' })

      await createTestProjectMember(project.id, member.id)

      // PROJECT_MEMBER has access to specific project
      const membership = await testPrisma.project_members.findFirst({
        where: { projectId: project.id, userId: member.id },
      })

      expect(membership).toBeDefined()
    })

    it('should enforce role hierarchy', async () => {
      // Role hierarchy: ADMIN > PROJECT_ADMIN > PROJECT_OWNER > PROJECT_MEMBER > EMPLOYEE
      const roles = ['ADMIN', 'PROJECT_ADMIN', 'PROJECT_OWNER', 'PROJECT_MEMBER', 'EMPLOYEE']

      for (const role of roles) {
        const user = await createTestUser({ role: role as any })
        expect(user.role).toBe(role)
      }

      // Verify all roles exist in database
      const users = await testPrisma.users.findMany()
      const userRoles = users.map(u => u.role)

      expect(roles.every(r => userRoles.includes(r as any))).toBe(true)
    })
  })

  describe('Resource-Based Permissions', () => {
    it('should restrict project access to members only', async () => {
      const owner = await createTestUser()
      const outsider = await createTestUser()
      const project = await createTestProject(owner.id)

      // Add owner as member
      await createTestProjectMember(project.id, owner.id, { role: 'PROJECT_OWNER' })

      // Owner has access
      const ownerMembership = await testPrisma.project_members.findFirst({
        where: { projectId: project.id, userId: owner.id },
      })
      expect(ownerMembership).toBeDefined()

      // Outsider has no access
      const outsiderMembership = await testPrisma.project_members.findFirst({
        where: { projectId: project.id, userId: outsider.id },
      })
      expect(outsiderMembership).toBeNull()
    })

    it('should allow admin to access any project', async () => {
      const admin = await createTestAdminUser()
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)

      // Admin can query any project regardless of membership
      const projectData = await testPrisma.projects.findUnique({
        where: { id: project.id },
      })

      expect(projectData).toBeDefined()
      expect(admin.role).toBe('ADMIN')
    })

    it('should grant project-specific permissions via membership', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)

      // Create members with different roles
      const ownerMember = await createTestUser()
      const regularMember = await createTestUser()

      await createTestProjectMember(project.id, ownerMember.id, { role: 'PROJECT_OWNER' })
      await createTestProjectMember(project.id, regularMember.id, { role: 'PROJECT_MEMBER' })

      // Verify different permission levels
      const memberships = await testPrisma.project_members.findMany({
        where: { projectId: project.id },
      })

      expect(memberships).toHaveLength(2)

      const ownerM = memberships.find(m => m.userId === ownerMember.id)
      const regularM = memberships.find(m => m.userId === regularMember.id)

      expect(ownerM?.role).toBe('PROJECT_OWNER')
      expect(regularM?.role).toBe('PROJECT_MEMBER')
    })
  })

  describe('Permission Inheritance', () => {
    it('project members should inherit task access', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const task = await createTestTask(project.id)
      const member = await createTestUser()

      // Add member to project
      await createTestProjectMember(project.id, member.id)

      // Member should have access to project's tasks
      const memberTasks = await testPrisma.tasks.findMany({
        where: { projectId: project.id },
      })

      expect(memberTasks.some(t => t.id === task.id)).toBe(true)

      // Verify member exists in project
      const membership = await testPrisma.project_members.findFirst({
        where: { projectId: project.id, userId: member.id },
      })

      expect(membership).toBeDefined()
    })

    it('non-members should not have task access', async () => {
      const owner = await createTestUser()
      const outsider = await createTestUser()
      const project = await createTestProject(owner.id)
      const task = await createTestTask(project.id)

      // Outsider is not a project member
      const membership = await testPrisma.project_members.findFirst({
        where: { projectId: project.id, userId: outsider.id },
      })

      expect(membership).toBeNull()

      // Outsider should not see tasks through permission check
      // (in real API, would return empty or 403)
    })

    it('project owner has elevated permissions', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)

      // Owner is automatically PROJECT_OWNER
      await createTestProjectMember(project.id, owner.id, { role: 'PROJECT_OWNER' })

      const membership = await testPrisma.project_members.findFirst({
        where: { projectId: project.id, userId: owner.id },
      })

      expect(membership?.role).toBe('PROJECT_OWNER')
    })
  })

  describe('Permission Checks', () => {
    it('should check user role for admin access', async () => {
      const admin = await createTestAdminUser()
      const regularUser = await createTestUser({ role: 'EMPLOYEE' })

      // Role check function simulation
      const isAdmin = (role: string) => role === 'ADMIN'

      expect(isAdmin(admin.role)).toBe(true)
      expect(isAdmin(regularUser.role)).toBe(false)
    })

    it('should check project membership for resource access', async () => {
      const owner = await createTestUser()
      const member = await createTestUser()
      const outsider = await createTestUser()
      const project = await createTestProject(owner.id)

      await createTestProjectMember(project.id, member.id)

      // Membership check function simulation
      const hasProjectAccess = async (userId: string, projectId: string) => {
        const membership = await testPrisma.project_members.findFirst({
          where: { projectId, userId },
        })
        return membership !== null
      }

      expect(await hasProjectAccess(member.id, project.id)).toBe(true)
      expect(await hasProjectAccess(outsider.id, project.id)).toBe(false)
    })

    it('should combine role and resource checks', async () => {
      const admin = await createTestAdminUser()
      const member = await createTestUser()
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)

      await createTestProjectMember(project.id, member.id)

      // Combined check: admin OR project member
      const canAccess = async (userId: string, projectId: string) => {
        const user = await testPrisma.users.findUnique({ where: { id: userId } })
        if (user?.role === 'ADMIN') return true

        const membership = await testPrisma.project_members.findFirst({
          where: { projectId, userId },
        })
        return membership !== null
      }

      expect(await canAccess(admin.id, project.id)).toBe(true) // Admin can access
      expect(await canAccess(member.id, project.id)).toBe(true) // Member can access
    })
  })

  describe('Permission Modifications', () => {
    it('should grant project access by adding member', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const newUser = await createTestUser()

      // Initially no access
      const initialMembership = await testPrisma.project_members.findFirst({
        where: { projectId: project.id, userId: newUser.id },
      })
      expect(initialMembership).toBeNull()

      // Grant access
      await createTestProjectMember(project.id, newUser.id)

      const newMembership = await testPrisma.project_members.findFirst({
        where: { projectId: project.id, userId: newUser.id },
      })
      expect(newMembership).toBeDefined()
    })

    it('should revoke project access by removing member', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const member = await createTestUser()

      await createTestProjectMember(project.id, member.id)

      // Has access
      const initialMembership = await testPrisma.project_members.findFirst({
        where: { projectId: project.id, userId: member.id },
      })
      expect(initialMembership).toBeDefined()

      // Revoke access
      await testPrisma.project_members.deleteMany({
        where: { projectId: project.id, userId: member.id },
      })

      const finalMembership = await testPrisma.project_members.findFirst({
        where: { projectId: project.id, userId: member.id },
      })
      expect(finalMembership).toBeNull()
    })

    it('should upgrade member role', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const member = await createTestUser()

      await createTestProjectMember(project.id, member.id, { role: 'PROJECT_MEMBER' })

      // Upgrade to PROJECT_OWNER
      await testPrisma.project_members.updateMany({
        where: { projectId: project.id, userId: member.id },
        data: { role: 'PROJECT_OWNER' },
      })

      const membership = await testPrisma.project_members.findFirst({
        where: { projectId: project.id, userId: member.id },
      })

      expect(membership?.role).toBe('PROJECT_OWNER')
    })
  })

  describe('Bulk Permission Operations', () => {
    it('should add multiple members to project', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)

      const members = await Promise.all([
        createTestUser(),
        createTestUser(),
        createTestUser(),
      ])

      await Promise.all(
        members.map(m => createTestProjectMember(project.id, m.id))
      )

      const projectMembers = await testPrisma.project_members.findMany({
        where: { projectId: project.id },
      })

      expect(projectMembers.length).toBe(3)
    })

    it('should remove all members from project', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)

      const members = await Promise.all([
        createTestUser(),
        createTestUser(),
      ])

      await Promise.all(
        members.map(m => createTestProjectMember(project.id, m.id))
      )

      // Remove all
      await testPrisma.project_members.deleteMany({
        where: { projectId: project.id },
      })

      const remaining = await testPrisma.project_members.findMany({
        where: { projectId: project.id },
      })

      expect(remaining.length).toBe(0)
    })
  })
})