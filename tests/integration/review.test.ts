import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../src/lib/prisma'

describe.skip('Review API Integration', () => {
  let testProject: any
  let testReviewType: any
  let testReview: any

  beforeAll(async () => {
    const user = await prisma.user.findFirst()
    if (!user) throw new Error('No test user found')

    testProject = await prisma.project.create({
      data: {
        name: 'Test Project for Review',
        ownerId: user.id,
        status: 'PLANNING',
      },
    })

    testReviewType = await prisma.reviewTypeConfig.create({
      data: {
        name: 'TEST_REVIEW_' + Date.now(),
        displayName: '测试评审',
        description: '测试用评审类型',
        isSystem: false,
      },
    })
  })

  afterAll(async () => {
    if (testReview) {
      await prisma.review.delete({ where: { id: testReview.id } }).catch(() => {})
    }
    if (testReviewType) {
      await prisma.reviewTypeConfig.delete({ where: { id: testReviewType.id } }).catch(() => {})
    }
    if (testProject) {
      await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {})
    }
  })

  it('should create a review', async () => {
    testReview = await prisma.review.create({
      data: {
        title: 'Test Review',
        projectId: testProject.id,
        typeId: testReviewType.id,
        status: 'PENDING',
      },
    })

    expect(testReview).toBeDefined()
    expect(testReview.title).toBe('Test Review')
  })

  it('should add participant to review', async () => {
    const user = await prisma.user.findFirst()
    if (!user) throw new Error('No test user found')

    const participant = await prisma.reviewParticipant.create({
      data: {
        reviewId: testReview.id,
        userId: user.id,
        role: 'REVIEWER',
      },
    })

    expect(participant).toBeDefined()
    expect(participant.role).toBe('REVIEWER')

    await prisma.reviewParticipant.delete({
      where: { reviewId_userId: { reviewId: testReview.id, userId: user.id } },
    })
  })

  it('should add material to review', async () => {
    const material = await prisma.reviewMaterial.create({
      data: {
        reviewId: testReview.id,
        fileId: 'test-file-' + Date.now(),
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
      },
    })

    expect(material).toBeDefined()
    expect(material.fileName).toBe('test.pdf')

    await prisma.reviewMaterial.delete({ where: { id: material.id } })
  })

  it('should update review status', async () => {
    const updated = await prisma.review.update({
      where: { id: testReview.id },
      data: { status: 'IN_PROGRESS' },
    })

    expect(updated.status).toBe('IN_PROGRESS')
  })
})
