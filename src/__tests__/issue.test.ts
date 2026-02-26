// ============================================================================
// ISSUE 管理模块单元测试
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('Issue ISSUE 管理', () => {
  beforeEach(async () => {
    await prisma.issue.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('ISSUE 创建', () => {
    it('应该成功创建 ISSUE', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'issue-owner@test.com',
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

      const issue = await prisma.issue.create({
        data: {
          title: 'Test Issue',
          description: 'Test Description',
          projectId: project.id,
          status: 'OPEN',
          priority: 'MEDIUM'
        }
      })

      expect(issue.id).toBeDefined()
      expect(issue.title).toBe('Test Issue')
      expect(issue.status).toBe('OPEN')
    })

    it('应该设置默认状态为 OPEN', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'issue-owner2@test.com',
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

      const issue = await prisma.issue.create({
        data: {
          title: 'Test Issue',
          projectId: project.id
        }
      })

      expect(issue.status).toBe('OPEN')
    })

    it('应该设置默认优先级为 MEDIUM', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'issue-owner3@test.com',
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

      const issue = await prisma.issue.create({
        data: {
          title: 'Test Issue',
          projectId: project.id
        }
      })

      expect(issue.priority).toBe('MEDIUM')
    })

    it('应该设置默认 autoClose 为 true', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'issue-owner4@test.com',
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

      const issue = await prisma.issue.create({
        data: {
          title: 'Test Issue',
          projectId: project.id
        }
      })

      expect(issue.autoClose).toBe(true)
    })
  })

  describe('ISSUE 状态流转', () => {
    it('应该更新状态为 IN_PROGRESS', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'issue-owner5@test.com',
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
      const issue = await prisma.issue.create({
        data: {
          title: 'Test Issue',
          projectId: project.id,
          status: 'OPEN'
        }
      })

      const updated = await prisma.issue.update({
        where: { id: issue.id },
        data: { status: 'IN_PROGRESS' }
      })

      expect(updated.status).toBe('IN_PROGRESS')
    })

    it('应该更新状态为 RESOLVED', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'issue-owner6@test.com',
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
      const issue = await prisma.issue.create({
        data: {
          title: 'Test Issue',
          projectId: project.id,
          status: 'OPEN'
        }
      })

      const updated = await prisma.issue.update({
        where: { id: issue.id },
        data: { status: 'RESOLVED' }
      })

      expect(updated.status).toBe('RESOLVED')
    })

    it('应该更新状态为 CLOSED', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'issue-owner7@test.com',
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
      const issue = await prisma.issue.create({
        data: {
          title: 'Test Issue',
          projectId: project.id,
          status: 'OPEN'
        }
      })

      const updated = await prisma.issue.update({
        where: { id: issue.id },
        data: { status: 'CLOSED' }
      })

      expect(updated.status).toBe('CLOSED')
    })
  })

  describe('ISSUE 严重级别', () => {
    it('应该支持 LOW 严重级别', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'issue-owner8@test.com',
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

      const issue = await prisma.issue.create({
        data: {
          title: 'Low Severity Issue',
          projectId: project.id,
          severity: 'LOW'
        }
      })

      expect(issue.severity).toBe('LOW')
    })

    it('应该支持 MEDIUM 严重级别', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'issue-owner9@test.com',
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

      const issue = await prisma.issue.create({
        data: {
          title: 'Medium Severity Issue',
          projectId: project.id,
          severity: 'MEDIUM'
        }
      })

      expect(issue.severity).toBe('MEDIUM')
    })

    it('应该支持 HIGH 严重级别', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'issue-owner10@test.com',
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

      const issue = await prisma.issue.create({
        data: {
          title: 'High Severity Issue',
          projectId: project.id,
          severity: 'HIGH'
        }
      })

      expect(issue.severity).toBe('HIGH')
    })

    it('应该支持 CRITICAL 严重级别', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'issue-owner11@test.com',
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 11',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      })

      const issue = await prisma.issue.create({
        data: {
          title: 'Critical Severity Issue',
          projectId: project.id,
          severity: 'CRITICAL'
        }
      })

      expect(issue.severity).toBe('CRITICAL')
    })
  })

  describe('ISSUE 分类', () => {
    it('应该支持 BUG 分类', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'issue-owner12@test.com',
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 12',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      })

      const issue = await prisma.issue.create({
        data: {
          title: 'Bug Issue',
          projectId: project.id,
          category: 'BUG'
        }
      })

      expect(issue.category).toBe('BUG')
    })

    it('应该支持 FEATURE 分类', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'issue-owner13@test.com',
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 13',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      })

      const issue = await prisma.issue.create({
        data: {
          title: 'Feature Request',
          projectId: project.id,
          category: 'FEATURE'
        }
      })

      expect(issue.category).toBe('FEATURE')
    })

    it('应该支持 OTHER 分类', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'issue-owner14@test.com',
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 14',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      })

      const issue = await prisma.issue.create({
        data: {
          title: 'Other Issue',
          projectId: project.id,
          category: 'OTHER'
        }
      })

      expect(issue.category).toBe('OTHER')
    })
  })

  describe('ISSUE 关联', () => {
    it('应该关联到项目', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'issue-owner15@test.com',
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 15',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      })

      const issue = await prisma.issue.create({
        data: {
          title: 'Test Issue',
          projectId: project.id
        }
      })

      expect(issue.projectId).toBe(project.id)
    })
  })
})
