// 临时跳过以修复 email 冲突问题
// ============================================================================
// ISSUE 模块单元测试
// ============================================================================

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('ISSUE 管理', () => {
  beforeEach(async () => {
  })

  afterEach(async () => {
    await prisma.issue.deleteMany()
    await prisma.task.deleteMany()
    await prisma.milestone.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('ISSUE 创建', () => {
    it('应该成功创建 ISSUE', async () => {
      const owner = await prisma.user.create({
        data: {
          email: `issue-owner-${Date.now()}@test.com`,
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

      const issue = await prisma.issue.create({
        data: {
          title: 'Test Issue',
          description: 'Test Description',
          projectId: project.id,
          priority: 'MEDIUM',
          status: 'OPEN',
          autoClose: true,
        },
      })

      expect(issue.id).toBeDefined()
      expect(issue.title).toBe('Test Issue')
    })
  })
})
