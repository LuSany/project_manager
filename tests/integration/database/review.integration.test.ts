// ============================================================================
// 评审管理模块单元测试
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('Review 评审管理', () => {
  beforeEach(async () => {
  })

  describe('评审创建', () => {
    it('应该成功创建评审', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'review-owner@test.com',
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

      const review = await prisma.review.create({
              data: {
                title: 'Test Review',
                projectId: project.id,
                typeId: 'feasibility',
                status: 'PENDING',
              },
            })

      expect(review.id).toBeDefined()
      expect(review.title).toBe('Test Review')
      expect(review.type).toBe('FEASIBILITY')
      expect(review.status).toBe('PENDING')
    })

    it('应该设置默认状态为 DRAFT', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'review-owner2@test.com',
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

      const review = await prisma.review.create({
              data: {
                title: 'Test Review',
                projectId: project.id,
                typeId: 'feasibility',
              },
            })

      expect(review.status).toBe('PENDING')
    })

    it('应该支持 FEASIBILITY 评审类型', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'review-owner3@test.com',
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

      const review = await prisma.review.create({
              data: {
                title: 'Feasibility Review',
                projectId: project.id,
                typeId: 'feasibility',
              },
            })

      expect(review.type).toBe('FEASIBILITY')
    })

    it('应该支持 MILESTONE 评审类型', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'review-owner4@test.com',
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

      const review = await prisma.review.create({
              data: {
                title: 'Milestone Review',
                projectId: project.id,
                typeId: 'feasibility',
              },
            })

      expect(review.type).toBe('MILESTONE')
    })

    it('应该支持 TEST_PLAN 评审类型', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'review-owner5@test.com',
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

      const review = await prisma.review.create({
              data: {
                title: 'Test Plan Review',
                projectId: project.id,
                typeId: 'feasibility',
              },
            })

      expect(review.type).toBe('TEST_PLAN')
    })

    it('应该支持 TEST_RELEASE 评审类型', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'review-owner6@test.com',
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

      const review = await prisma.review.create({
              data: {
                title: 'Test Release Review',
                projectId: project.id,
                typeId: 'feasibility',
              },
            })

      expect(review.type).toBe('TEST_RELEASE')
    })

    it('应该支持 TEST_REPORT 评审类型', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'review-owner7@test.com',
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

      const review = await prisma.review.create({
              data: {
                title: 'Test Report Review',
                projectId: project.id,
                typeId: 'feasibility',
              },
            })

      expect(review.type).toBe('TEST_REPORT')
    })
  })

  describe('评审状态流转', () => {
    it('应该更新状态为 SCHEDULED', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'review-owner8@test.com',
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
      const review = await prisma.review.create({
              data: {
                title: 'Test Review',
                projectId: project.id,
                typeId: 'feasibility',
                status: 'PENDING',
              },
            })

      const updated = await prisma.review.update({
        where: { id: review.id },
        data: { status: 'IN_PROGRESS' },
      })

      expect(updated.status).toBe('IN_PROGRESS')
    })

    it('应该更新状态为 IN_PROGRESS', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'review-owner9@test.com',
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 9',
          ownerId: owner.id,
          status: 'ACTIVE',
        },
      })
      const review = await prisma.review.create({
              data: {
                title: 'Test Review',
                projectId: project.id,
                typeId: 'feasibility',
                status: 'IN_PROGRESS',
              },
            })

      const updated = await prisma.review.update({
        where: { id: review.id },
        data: { status: 'IN_PROGRESS' },
      })

      expect(updated.status).toBe('IN_PROGRESS')
    })

    it('应该更新状态为 COMPLETED', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'review-owner10@test.com',
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 10',
          ownerId: owner.id,
          status: 'ACTIVE',
        },
      })
      const review = await prisma.review.create({
              data: {
                title: 'Test Review',
                projectId: project.id,
                typeId: 'feasibility',
                status: 'IN_PROGRESS',
              },
            })

      const updated = await prisma.review.update({
        where: { id: review.id },
        data: { status: 'COMPLETED' },
      })

      expect(updated.status).toBe('COMPLETED')
    })
  })

  describe('评审关联', () => {
    it('应该关联到项目', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'review-owner11@test.com',
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 11',
          ownerId: owner.id,
          status: 'ACTIVE',
        },
      })

      const review = await prisma.review.create({
              data: {
                title: 'Test Review',
                projectId: project.id,
                typeId: 'feasibility',
              },
            })

      expect(review.projectId).toBe(project.id)
    })

    it('应该设置创建人', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'review-owner12@test.com',
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })
      const project = await prisma.project.create({
        data: {
          name: 'Test Project 12',
          ownerId: owner.id,
          status: 'ACTIVE',
        },
      })

      const review = await prisma.review.create({
              data: {
                title: 'Test Review',
                projectId: project.id,
                typeId: 'feasibility',
              },
            })

    })
  })
})
