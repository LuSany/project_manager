/**
 * ProjectMember 模型测试 - P0 核心业务模型
 *
 * 测试覆盖:
 * - 项目成员多对多关系
 * - 成员角色管理
 * - 复合主键约束
 * - 级联删除
 *
 * 优先级：P0 - 核心业务模型
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../helpers/test-db'
import { createTestUser, createTestProject } from '../helpers/test-data-factory'

describe('ProjectMember Model - P0 Core', () => {
  describe('Basic Operations', () => {
    it('should create project member successfully', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const member = await createTestUser()

      const projectMember = await testPrisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: member.id,
          role: 'PROJECT_MEMBER',
        },
      })

      expect(projectMember).toBeDefined()
      expect(projectMember.projectId).toBe(project.id)
      expect(projectMember.userId).toBe(member.id)
      expect(projectMember.role).toBe('PROJECT_MEMBER')
      expect(projectMember.joinedAt).toBeDefined()
    })

    it('should create project member with custom role', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const admin = await createTestUser()

      const projectMember = await testPrisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: admin.id,
          role: 'PROJECT_ADMIN',
        },
      })

      expect(projectMember.role).toBe('PROJECT_ADMIN')
    })

    it('should update project member role', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const member = await createTestUser()

      const projectMember = await testPrisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: member.id,
          role: 'PROJECT_MEMBER',
        },
      })

      const updated = await testPrisma.projectMember.update({
        where: {
          projectId_userId: {
            projectId: projectMember.projectId,
            userId: projectMember.userId,
          },
        },
        data: {
          role: 'PROJECT_ADMIN',
        },
      })

      expect(updated.role).toBe('PROJECT_ADMIN')
    })

    it('should delete project member', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const member = await createTestUser()

      const projectMember = await testPrisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: member.id,
          role: 'PROJECT_MEMBER',
        },
      })

      await testPrisma.projectMember.delete({
        where: {
          projectId_userId: {
            projectId: projectMember.projectId,
            userId: projectMember.userId,
          },
        },
      })

      const found = await testPrisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: projectMember.projectId,
            userId: projectMember.userId,
          },
        },
      })
      expect(found).toBeNull()
    })
  })

  describe('Member Roles', () => {
    it('should support PROJECT_OWNER role', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)

      const projectMember = await testPrisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: owner.id,
          role: 'PROJECT_OWNER',
        },
      })

      expect(projectMember.role).toBe('PROJECT_OWNER')
    })

    it('should support PROJECT_ADMIN role', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const admin = await createTestUser()

      const projectMember = await testPrisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: admin.id,
          role: 'PROJECT_ADMIN',
        },
      })

      expect(projectMember.role).toBe('PROJECT_ADMIN')
    })

    it('should support PROJECT_MEMBER role', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const member = await createTestUser()

      const projectMember = await testPrisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: member.id,
          role: 'PROJECT_MEMBER',
        },
      })

      expect(projectMember.role).toBe('PROJECT_MEMBER')
    })
  })

  describe('Composite Primary Key', () => {
    it('should enforce unique projectId-userId combination', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const member = await createTestUser()

      await testPrisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: member.id,
          role: 'PROJECT_MEMBER',
        },
      })

      await expect(
        testPrisma.projectMember.create({
          data: {
            projectId: project.id,
            userId: member.id,
            role: 'PROJECT_MEMBER',
          },
        })
      ).rejects.toThrow()
    })

    it('should allow same user in different projects', async () => {
      const owner = await createTestUser()
      const project1 = await createTestProject(owner.id)
      const project2 = await createTestProject(owner.id)
      const member = await createTestUser()

      await testPrisma.projectMember.create({
        data: {
          projectId: project1.id,
          userId: member.id,
          role: 'PROJECT_MEMBER',
        },
      })

      const pm2 = await testPrisma.projectMember.create({
        data: {
          projectId: project2.id,
          userId: member.id,
          role: 'PROJECT_MEMBER',
        },
      })

      expect(pm2.projectId).toBe(project2.id)
    })

    it('should allow multiple members in same project', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const member1 = await createTestUser()
      const member2 = await createTestUser()

      await testPrisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: member1.id,
          role: 'PROJECT_MEMBER',
        },
      })

      const pm2 = await testPrisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: member2.id,
          role: 'PROJECT_MEMBER',
        },
      })

      expect(pm2.userId).toBe(member2.id)
    })
  })

  describe('Many-to-Many Relationship', () => {
    it('should query project with members', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const member1 = await createTestUser()
      const member2 = await createTestUser()

      await testPrisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: member1.id,
          role: 'PROJECT_MEMBER',
        },
      })

      await testPrisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: member2.id,
          role: 'PROJECT_ADMIN',
        },
      })

      const projectWithMembers = await testPrisma.project.findUnique({
        where: { id: project.id },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      })

      expect(projectWithMembers?.members).toHaveLength(2)
    })

    it('should query user with projects', async () => {
      const owner = await createTestUser()
      const project1 = await createTestProject(owner.id)
      const project2 = await createTestProject(owner.id)
      const member = await createTestUser()

      await testPrisma.projectMember.create({
        data: {
          projectId: project1.id,
          userId: member.id,
          role: 'PROJECT_MEMBER',
        },
      })

      await testPrisma.projectMember.create({
        data: {
          projectId: project2.id,
          userId: member.id,
          role: 'PROJECT_MEMBER',
        },
      })

      const userWithProjects = await testPrisma.user.findUnique({
        where: { id: member.id },
        include: {
          projectMembers: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })

      expect(userWithProjects?.projectMembers).toHaveLength(2)
    })

    it('should filter members by role', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const admin = await createTestUser()
      const member = await createTestUser()

      await testPrisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: admin.id,
          role: 'PROJECT_ADMIN',
        },
      })

      await testPrisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: member.id,
          role: 'PROJECT_MEMBER',
        },
      })

      const admins = await testPrisma.projectMember.findMany({
        where: {
          projectId: project.id,
          role: 'PROJECT_ADMIN',
        },
      })

      expect(admins).toHaveLength(1)
    })
  })

  describe('Cascade Delete', () => {
    it('should delete member when project deleted', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const member = await createTestUser()

      await testPrisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: member.id,
          role: 'PROJECT_MEMBER',
        },
      })

      await testPrisma.project.delete({
        where: { id: project.id },
      })

      const members = await testPrisma.projectMember.findMany({
        where: { projectId: project.id },
      })

      expect(members).toHaveLength(0)
    })

    it('should delete member when user deleted', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const member = await createTestUser()

      const projectMember = await testPrisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: member.id,
          role: 'PROJECT_MEMBER',
        },
      })

      await testPrisma.user.delete({
        where: { id: member.id },
      })

      const found = await testPrisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: projectMember.projectId,
            userId: projectMember.userId,
          },
        },
      })

      expect(found).toBeNull()
    })
  })

  describe('Query Operations', () => {
    it('should find members by projectId', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const member1 = await createTestUser()
      const member2 = await createTestUser()

      await testPrisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: member1.id,
        },
      })

      await testPrisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: member2.id,
        },
      })

      const members = await testPrisma.projectMember.findMany({
        where: { projectId: project.id },
      })

      expect(members.length).toBeGreaterThanOrEqual(2)
    })

    it('should find projects by userId', async () => {
      const owner = await createTestUser()
      const project1 = await createTestProject(owner.id)
      const project2 = await createTestProject(owner.id)
      const member = await createTestUser()

      await testPrisma.projectMember.create({
        data: {
          projectId: project1.id,
          userId: member.id,
        },
      })

      await testPrisma.projectMember.create({
        data: {
          projectId: project2.id,
          userId: member.id,
        },
      })

      const projects = await testPrisma.projectMember.findMany({
        where: { userId: member.id },
      })

      expect(projects).toHaveLength(2)
    })

    it('should order members by joinedAt', async () => {
      const owner = await createTestUser()
      const project = await createTestProject(owner.id)
      const member = await createTestUser()

      await testPrisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: member.id,
        },
      })

      const members = await testPrisma.projectMember.findMany({
        where: { projectId: project.id },
        orderBy: { joinedAt: 'asc' },
      })

      expect(members.length).toBeGreaterThanOrEqual(1)
    })
  })
})
