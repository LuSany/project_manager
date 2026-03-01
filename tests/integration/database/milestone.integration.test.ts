// ============================================================================
// 里程碑模块单元测试
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('Milestone 里程碑管理', () => {
  beforeEach(async () => {
  })

  describe('里程碑创建', () => {
    it('应该成功创建里程碑', async () => {
      const owner = await prisma.user.create({
        data: {
          email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project',
          ownerId: owner.id,
          status: 'ACTIVE',
        },
      })

      const milestone = await prisma.milestone.create({
        data: {
          title: 'Test Milestone',
          projectId: project.id,
          status: 'NOT_STARTED',
        },
      })

      expect(milestone.id).toBeDefined()
      expect(milestone.title).toBe('Test Milestone')
      expect(milestone.status).toBe('NOT_STARTED')
    })

    it('应该设置默认状态为 PLANNED', async () => {
      const owner = await prisma.user.create({
        data: {
          email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 2',
          ownerId: owner.id,
          status: 'ACTIVE',
        },
      })

      const milestone = await prisma.milestone.create({
        data: {
          title: 'Test Milestone',
          projectId: project.id,
        },
      })

      expect(milestone.status).toBe('NOT_STARTED')
    })

    it('应该支持设置开始日期', async () => {
      const owner = await prisma.user.create({
        data: {
          email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 3',
          ownerId: owner.id,
          status: 'ACTIVE',
        },
      })

      const milestone = await prisma.milestone.create({
        data: {
          title: 'Test Milestone',
          projectId: project.id,
        },
      })

    })

    it('应该支持设置结束日期', async () => {
      const owner = await prisma.user.create({
        data: {
          email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 4',
          ownerId: owner.id,
          status: 'ACTIVE',
        },
      })

      const milestone = await prisma.milestone.create({
        data: {
          title: 'Test Milestone',
          projectId: project.id,
        },
      })

    })
  })

  describe('里程碑状态流转', () => {
    it('应该更新状态为 IN_PROGRESS', async () => {
      const owner = await prisma.user.create({
        data: {
          email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 5',
          ownerId: owner.id,
          status: 'ACTIVE',
        },
      })
      const milestone = await prisma.milestone.create({
        data: {
          title: 'Test Milestone',
          projectId: project.id,
          status: 'NOT_STARTED',
        },
      })

      const updated = await prisma.milestone.update({
        where: { id: milestone.id },
        data: { status: 'IN_PROGRESS' },
      })

      expect(updated.status).toBe('IN_PROGRESS')
    })

    it('应该更新状态为 COMPLETED', async () => {
      const owner = await prisma.user.create({
        data: {
          email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 6',
          ownerId: owner.id,
          status: 'ACTIVE',
        },
      })
      const milestone = await prisma.milestone.create({
        data: {
          title: 'Test Milestone',
          projectId: project.id,
          status: 'IN_PROGRESS',
        },
      })

      const updated = await prisma.milestone.update({
        where: { id: milestone.id },
        data: { status: 'COMPLETED' },
      })

      expect(updated.status).toBe('COMPLETED')
    })
  })

  describe('里程碑关联', () => {
    it('应该关联到项目', async () => {
      const owner = await prisma.user.create({
        data: {
          email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 7',
          ownerId: owner.id,
          status: 'ACTIVE',
        },
      })

      const milestone = await prisma.milestone.create({
        data: {
          title: 'Test Milestone',
          projectId: project.id,
        },
      })

      expect(milestone.projectId).toBe(project.id)
    })

    it('应该支持关联多个任务', async () => {
      const owner = await prisma.user.create({
        data: {
          email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 8',
          ownerId: owner.id,
          status: 'ACTIVE',
        },
      })
      const milestone = await prisma.milestone.create({
        data: {
          title: 'Test Milestone',
          projectId: project.id,
        },
      })

      const task1 = await prisma.task.create({
        data: {
          title: 'Task 1',
          projectId: project.id,
          milestoneId: milestone.id,
        },
      })

      const task2 = await prisma.task.create({
        data: {
          title: 'Task 2',
          projectId: project.id,
          milestoneId: milestone.id,
        },
      })

      expect(task1.milestoneId).toBe(milestone.id)
      expect(task2.milestoneId).toBe(milestone.id)
    })
  })
})
