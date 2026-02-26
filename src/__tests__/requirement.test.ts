// ============================================================================
// 需求管理模块单元测试
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('Requirement 需求管理', () => {
  beforeEach(async () => {
    await prisma.requirement.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('需求创建', () => {
    it('应该成功创建需求', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'req-owner@test.com',
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      })

      const requirement = await prisma.requirement.create({
        data: {
          title: 'Test Requirement',
          description: 'Test Description',
          projectId: project.id,
          status: 'PENDING',
          priority: 'HIGH'
        }
      })

      expect(requirement.id).toBeDefined()
      expect(requirement.title).toBe('Test Requirement')
      expect(requirement.status).toBe('PENDING')
    })

    it('应该设置默认状态为 PENDING', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'req-owner2@test.com',
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 2',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      })

      const requirement = await prisma.requirement.create({
        data: {
          title: 'Test Requirement',
          projectId: project.id
        }
      })

      expect(requirement.status).toBe('PENDING')
    })
  })

  describe('需求状态流转', () => {
    it('应该更新状态为 APPROVED', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'req-owner3@test.com',
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 3',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      })
      const requirement = await prisma.requirement.create({
        data: {
          title: 'Test Requirement',
          projectId: project.id,
          status: 'PENDING'
        }
      })

      const updated = await prisma.requirement.update({
        where: { id: requirement.id },
        data: { status: 'APPROVED' }
      })

      expect(updated.status).toBe('APPROVED')
    })

    it('应该更新状态为 REJECTED', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'req-owner4@test.com',
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 4',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      })
      const requirement = await prisma.requirement.create({
        data: {
          title: 'Test Requirement',
          projectId: project.id,
          status: 'PENDING'
        }
      })

      const updated = await prisma.requirement.update({
        where: { id: requirement.id },
        data: { status: 'REJECTED' }
      })

      expect(updated.status).toBe('REJECTED')
    })

    it('应该更新状态为 IN_PROGRESS', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'req-owner5@test.com',
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 5',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      })
      const requirement = await prisma.requirement.create({
        data: {
          title: 'Test Requirement',
          projectId: project.id,
          status: 'APPROVED'
        }
      })

      const updated = await prisma.requirement.update({
        where: { id: requirement.id },
        data: { status: 'IN_PROGRESS' }
      })

      expect(updated.status).toBe('IN_PROGRESS')
    })

    it('应该更新状态为 COMPLETED', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'req-owner6@test.com',
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 6',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      })
      const requirement = await prisma.requirement.create({
        data: {
          title: 'Test Requirement',
          projectId: project.id,
          status: 'IN_PROGRESS'
        }
      })

      const updated = await prisma.requirement.update({
        where: { id: requirement.id },
        data: { status: 'COMPLETED' }
      })

      expect(updated.status).toBe('COMPLETED')
    })
  })

  describe('需求优先级', () => {
    it('应该支持 HIGH 优先级', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'req-owner7@test.com',
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 7',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      })

      const requirement = await prisma.requirement.create({
        data: {
          title: 'High Priority Requirement',
          projectId: project.id,
          priority: 'HIGH'
        }
      })

      expect(requirement.priority).toBe('HIGH')
    })

    it('应该支持 MEDIUM 优先级', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'req-owner8@test.com',
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 8',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      })

      const requirement = await prisma.requirement.create({
        data: {
          title: 'Medium Priority Requirement',
          projectId: project.id,
          priority: 'MEDIUM'
        }
      })

      expect(requirement.priority).toBe('MEDIUM')
    })

    it('应该支持 LOW 优先级', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'req-owner9@test.com',
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 9',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      })

      const requirement = await prisma.requirement.create({
        data: {
          title: 'Low Priority Requirement',
          projectId: project.id,
          priority: 'LOW'
        }
      })

      expect(requirement.priority).toBe('LOW')
    })
  })

  describe('需求关联', () => {
    it('应该关联到项目', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'req-owner10@test.com',
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 10',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      })

      const requirement = await prisma.requirement.create({
        data: {
          title: 'Test Requirement',
          projectId: project.id
        }
      })

      expect(requirement.projectId).toBe(project.id)
    })
  })
})
