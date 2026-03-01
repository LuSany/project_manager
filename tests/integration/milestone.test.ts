import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../src/lib/prisma'

describe.skip('Milestone API Integration', () => {
  let testProject: any
  let testMilestone: any

  beforeAll(async () => {
    const user = await prisma.user.findFirst()
    if (!user) throw new Error('No test user found')

    testProject = await prisma.project.create({
      data: {
        name: 'Test Project for Milestone',
        ownerId: user.id,
        status: 'PLANNING',
      },
    })
  })

  afterAll(async () => {
    if (testMilestone) {
      await prisma.milestone.delete({ where: { id: testMilestone.id } }).catch(() => {})
    }
    if (testProject) {
      await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {})
    }
  })

  it('should create a milestone', async () => {
    testMilestone = await prisma.milestone.create({
      data: {
        title: 'Test Milestone',
        projectId: testProject.id,
        status: 'NOT_STARTED',
        progress: 0,
      },
    })

    expect(testMilestone).toBeDefined()
    expect(testMilestone.title).toBe('Test Milestone')
    expect(testMilestone.projectId).toBe(testProject.id)
  })

  it('should list milestones by project', async () => {
    const milestones = await prisma.milestone.findMany({
      where: { projectId: testProject.id },
    })

    expect(milestones).toBeDefined()
    expect(milestones.length).toBeGreaterThan(0)
  })

  it('should update milestone progress', async () => {
    const updated = await prisma.milestone.update({
      where: { id: testMilestone.id },
      data: { progress: 50, status: 'IN_PROGRESS' },
    })

    expect(updated.progress).toBe(50)
    expect(updated.status).toBe('IN_PROGRESS')
  })

  it('should associate task with milestone', async () => {
    const task = await prisma.task.create({
      data: {
        title: 'Test Task for Milestone',
        projectId: testProject.id,
        milestoneId: testMilestone.id,
        status: 'TODO',
      },
    })

    expect(task.milestoneId).toBe(testMilestone.id)

    await prisma.task.delete({ where: { id: task.id } })
  })
})
