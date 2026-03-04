/**
 * RequirementDiscussion 模型测试 - P1 重要业务模型
 *
 * 测试覆盖:
 * - CRUD 操作
 * - 讨论内容与需求关联
 * - 讨论与任务关联
 * - 用户参与讨论
 * - 讨论时间线
 *
 * 优先级：P1 - 重要业务模型
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestRequirement,
  createTestTask,
} from '../../helpers/test-data-factory'

describe('RequirementDiscussion Model - P1 Core', () => {
  describe('Basic CRUD', () => {
    it('should create requirement discussion successfully', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const discussion = await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Discussion about this requirement',
        },
      })

      expect(discussion).toBeDefined()
      expect(discussion.requirementId).toBe(requirement.id)
      expect(discussion.userId).toBe(user.id)
      expect(discussion.content).toBe('Discussion about this requirement')
    })

    it('should create discussion with rich content', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const richContent = `
        # Discussion Points
        
        ## Technical Considerations
        - Database changes required
        - API endpoints to update
        
        ## Questions
        1. What about backward compatibility?
        2. Timeline constraints?
      `.trim()

      const discussion = await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: richContent,
        },
      })

      expect(discussion.content).toContain('Technical Considerations')
      expect(discussion.content).toContain('backward compatibility')
    })

    it('should update discussion content', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const discussion = await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Initial comment',
        },
      })

      const updated = await testPrisma.requirementDiscussion.update({
        where: { id: discussion.id },
        data: {
          content: 'Updated comment with more details',
        },
      })

      expect(updated.content).toBe('Updated comment with more details')
    })

    it('should delete discussion', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const discussion = await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'To be deleted',
        },
      })

      await testPrisma.requirementDiscussion.delete({
        where: { id: discussion.id },
      })

      const found = await testPrisma.requirementDiscussion.findUnique({
        where: { id: discussion.id },
      })
      expect(found).toBeNull()
    })
  })

  describe('Discussion Content', () => {
    it('should store long discussion content', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const longContent = 'A'.repeat(5000)

      const discussion = await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: longContent,
        },
      })

      expect(discussion.content.length).toBe(5000)
    })

    it('should store markdown content', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const markdown = `
        # Technical Analysis
        
        ## Impact
        This will affect **multiple systems**
        
        ## Recommendation
        - Phase 1: Core changes
        - Phase 2: UI updates
        
        > Note: Requires careful planning
      `.trim()

      const discussion = await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: markdown,
        },
      })

      expect(discussion.content).toContain('# Technical Analysis')
      expect(discussion.content).toContain('**multiple systems**')
    })
  })

  describe('RequirementDiscussion Relationships', () => {
    it('should associate discussion with requirement', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const discussion = await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Related discussion',
        },
      })

      expect(discussion.requirementId).toBe(requirement.id)

      // Verify from requirement side
      const requirementWithDiscussions = await testPrisma.requirement.findUnique({
        where: { id: requirement.id },
        include: { discussions: true },
      })

      expect(requirementWithDiscussions?.discussions).toHaveLength(1)
    })

    it('should associate discussion with user', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const discussion = await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'User discussion',
        },
      })

      expect(discussion.userId).toBe(user.id)

      // Verify from user side
      const userWithDiscussions = await testPrisma.user.findUnique({
        where: { id: user.id },
        include: { requirementDiscussions: true },
      })

      expect(userWithDiscussions?.requirementDiscussions).toHaveLength(1)
    })

    it('should associate discussion with task', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)
      const task = await createTestTask(project.id, user.id)

      const discussion = await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Discussion related to task',
          taskId: task.id,
        },
      })

      expect(discussion.taskId).toBe(task.id)

      // Verify from task side
      const taskWithDiscussions = await testPrisma.task.findUnique({
        where: { id: task.id },
        include: { discussions: true },
      })

      expect(taskWithDiscussions?.discussions).toHaveLength(1)
    })

    it('should allow null task association', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const discussion = await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Standalone discussion',
          taskId: null,
        },
      })

      expect(discussion.taskId).toBeNull()
    })

    it('should cascade delete discussion when requirement deleted', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const discussion = await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Cascade test',
        },
      })

      // Delete requirement
      await testPrisma.requirement.delete({
        where: { id: requirement.id },
      })

      // Verify discussion is also deleted (CASCADE)
      const found = await testPrisma.requirementDiscussion.findUnique({
        where: { id: discussion.id },
      })

      expect(found).toBeNull()
    })

    it('should cascade delete discussion when user deleted', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const discussion = await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'User cascade',
        },
      })

      // Delete user
      await testPrisma.user.delete({
        where: { id: user.id },
      })

      // Verify discussion is also deleted (CASCADE)
      const found = await testPrisma.requirementDiscussion.findUnique({
        where: { id: discussion.id },
      })

      expect(found).toBeNull()
    })

    it('should not cascade delete when task deleted', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)
      const task = await createTestTask(project.id, user.id)

      const discussion = await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Task linked discussion',
          taskId: task.id,
        },
      })

      // Delete task
      await testPrisma.task.delete({
        where: { id: task.id },
      })

      // Discussion should still exist (SET NULL)
      const updated = await testPrisma.requirementDiscussion.findUnique({
        where: { id: discussion.id },
      })

      expect(updated).toBeDefined()
      expect(updated?.taskId).toBeNull()
    })
  })

  describe('Multiple Discussions', () => {
    it('should allow multiple discussions for same requirement', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()
      const project = await createTestProject(user1.id)
      const requirement = await createTestRequirement(project.id)

      await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user1.id,
          content: 'Discussion 1',
        },
      })

      await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user2.id,
          content: 'Discussion 2',
        },
      })

      const discussions = await testPrisma.requirementDiscussion.findMany({
        where: { requirementId: requirement.id },
      })

      expect(discussions).toHaveLength(2)
    })

    it('should allow same user to create multiple discussions', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'First comment',
        },
      })

      await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Second comment',
        },
      })

      const discussions = await testPrisma.requirementDiscussion.findMany({
        where: {
          requirementId: requirement.id,
          userId: user.id,
        },
      })

      expect(discussions).toHaveLength(2)
    })
  })

  describe('Discussion Queries', () => {
    it('should find discussions by requirementId', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Discussion 1',
        },
      })

      await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Discussion 2',
        },
      })

      const discussions = await testPrisma.requirementDiscussion.findMany({
        where: { requirementId: requirement.id },
      })

      expect(discussions).toHaveLength(2)
    })

    it('should find discussions by userId', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const req1 = await createTestRequirement(project.id)
      const req2 = await createTestRequirement(project.id)

      await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: req1.id,
          userId: user.id,
          content: 'Discussion on req1',
        },
      })

      await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: req2.id,
          userId: user.id,
          content: 'Discussion on req2',
        },
      })

      const userDiscussions = await testPrisma.requirementDiscussion.findMany({
        where: { userId: user.id },
      })

      expect(userDiscussions).toHaveLength(2)
    })

    it('should query discussion with requirement and user', async () => {
      const user = await createTestUser({
        email: 'discussant@example.com',
        name: 'Test Discussant',
      })
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id, {
        title: 'Discussion Topic',
      })

      const discussion = await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Test discussion',
        },
      })

      const discussionWithRelations = await testPrisma.requirementDiscussion.findUnique({
        where: { id: discussion.id },
        include: {
          requirement: {
            select: {
              id: true,
              title: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      expect(discussionWithRelations?.requirement.title).toBe('Discussion Topic')
      expect(discussionWithRelations?.user.email).toBe('discussant@example.com')
    })

    it('should order discussions by createdAt', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const discussion1 = await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'First discussion',
        },
      })

      await new Promise((resolve) => setTimeout(resolve, 10))

      const discussion2 = await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user.id,
          content: 'Second discussion',
        },
      })

      const discussions = await testPrisma.requirementDiscussion.findMany({
        where: { requirementId: requirement.id },
        orderBy: { createdAt: 'asc' },
      })

      expect(discussions[0].id).toBe(discussion1.id)
      expect(discussions[1].id).toBe(discussion2.id)
    })
  })

  describe('Discussion Thread', () => {
    it('should create discussion thread for requirement', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()
      const user3 = await createTestUser()
      const project = await createTestProject(user1.id)
      const requirement = await createTestRequirement(project.id)

      // Initial proposal
      await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user1.id,
          content: 'I propose we implement feature X',
        },
      })

      // Response
      await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user2.id,
          content: 'Good idea, but we need to consider Y',
        },
      })

      // Counter-response
      await testPrisma.requirementDiscussion.create({
        data: {
          requirementId: requirement.id,
          userId: user3.id,
          content: 'I agree with user2, Y is important',
        },
      })

      const thread = await testPrisma.requirementDiscussion.findMany({
        where: { requirementId: requirement.id },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      })

      expect(thread).toHaveLength(3)
      expect(thread[0].user.name).toBeDefined()
      expect(thread[1].content).toContain('Good idea')
      expect(thread[2].content).toContain('agree')
    })
  })
})
