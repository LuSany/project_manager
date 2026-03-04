/**
 * Issue 模型测试 - P0 核心业务模型
 *
 * 测试覆盖:
 * - CRUD 操作完整性
 * - 状态流转（OPEN → IN_PROGRESS → RESOLVED → CLOSED）
 * - 优先级管理
 * - 自动关闭功能
 * - 与任务、需求的关联关系
 *
 * 优先级：P0 - 核心业务模型
 * 目标覆盖率：100%
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestTask,
  createTestRequirement,
  createTestIssue,
} from '../../helpers/test-data-factory'

describe('Issue Model - P0 Core', () => {
  describe('CRUD Operations', () => {
    it('should create issue successfully', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      const issue = await createTestIssue(project.id, {
        title: 'Test Issue',
        description: 'Test Description',
      })

      expect(issue).toBeDefined()
      expect(issue.id).toBeDefined()
      expect(issue.title).toBe('Test Issue')
      expect(issue.description).toBe('Test Description')
      expect(issue.status).toBe('OPEN')
      expect(issue.priority).toBe('MEDIUM')
      expect(issue.autoClose).toBe(true)
    })

    it('should create issue with all fields', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      const issue = await testPrisma.issue.create({
        data: {
          title: 'Complete Issue',
          description: 'Complete Description',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          autoClose: false,
          projectId: project.id,
        },
      })

      expect(issue.status).toBe('IN_PROGRESS')
      expect(issue.priority).toBe('HIGH')
      expect(issue.autoClose).toBe(false)
    })

    it('should update issue successfully', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const issue = await createTestIssue(project.id)

      const updated = await testPrisma.issue.update({
        where: { id: issue.id },
        data: {
          status: 'RESOLVED',
          priority: 'URGENT',
          resolvedAt: new Date(),
        },
      })

      expect(updated.status).toBe('RESOLVED')
      expect(updated.priority).toBe('URGENT')
      expect(updated.resolvedAt).toBeDefined()
    })

    it('should delete issue successfully', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const issue = await createTestIssue(project.id)

      const deleted = await testPrisma.issue.delete({
        where: { id: issue.id },
      })

      expect(deleted.id).toBe(issue.id)

      // Verify deletion
      const found = await testPrisma.issue.findUnique({
        where: { id: issue.id },
      })
      expect(found).toBeNull()
    })
  })

  describe('Issue Status Flow', () => {
    it('should create issue with OPEN status (default)', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      const issue = await createTestIssue(project.id)
      expect(issue.status).toBe('OPEN')
    })

    it('should transition from OPEN to IN_PROGRESS', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const issue = await createTestIssue(project.id)

      const updated = await testPrisma.issue.update({
        where: { id: issue.id },
        data: { status: 'IN_PROGRESS' },
      })

      expect(updated.status).toBe('IN_PROGRESS')
    })

    it('should transition from IN_PROGRESS to RESOLVED', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const issue = await createTestIssue(project.id, { status: 'IN_PROGRESS' })

      const updated = await testPrisma.issue.update({
        where: { id: issue.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
        },
      })

      expect(updated.status).toBe('RESOLVED')
      expect(updated.resolvedAt).toBeDefined()
    })

    it('should transition from RESOLVED to CLOSED', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const issue = await createTestIssue(project.id, {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      })

      const updated = await testPrisma.issue.update({
        where: { id: issue.id },
        data: { status: 'CLOSED' },
      })

      expect(updated.status).toBe('CLOSED')
    })

    it('should transition from any status to REOPENED', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const issue = await createTestIssue(project.id, { status: 'RESOLVED' })

      const updated = await testPrisma.issue.update({
        where: { id: issue.id },
        data: { status: 'REOPENED' },
      })

      expect(updated.status).toBe('REOPENED')
    })

    it('should allow transition from OPEN to CLOSED directly', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const issue = await createTestIssue(project.id)

      const updated = await testPrisma.issue.update({
        where: { id: issue.id },
        data: { status: 'CLOSED' },
      })

      expect(updated.status).toBe('CLOSED')
    })
  })

  describe('Issue Priority', () => {
    it('should create issue with MEDIUM priority (default)', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      const issue = await createTestIssue(project.id)
      expect(issue.priority).toBe('MEDIUM')
    })

    it('should support LOW priority', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      const issue = await createTestIssue(project.id, { priority: 'LOW' })
      expect(issue.priority).toBe('LOW')
    })

    it('should support HIGH priority', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      const issue = await createTestIssue(project.id, { priority: 'HIGH' })
      expect(issue.priority).toBe('HIGH')
    })

    it('should support URGENT priority', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      const issue = await createTestIssue(project.id, { priority: 'URGENT' })
      expect(issue.priority).toBe('URGENT')
    })
  })

  describe('Auto Close Feature', () => {
    it('should create issue with autoClose=true (default)', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      const issue = await createTestIssue(project.id)
      expect(issue.autoClose).toBe(true)
    })

    it('should create issue with autoClose=false', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      const issue = await createTestIssue(project.id, { autoClose: false })
      expect(issue.autoClose).toBe(false)
    })

    it('should update autoClose setting', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const issue = await createTestIssue(project.id)

      const updated = await testPrisma.issue.update({
        where: { id: issue.id },
        data: { autoClose: false },
      })

      expect(updated.autoClose).toBe(false)
    })
  })

  describe('Issue Relationships', () => {
    it('should associate issue with project', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      const issue = await createTestIssue(project.id)

      expect(issue.projectId).toBe(project.id)

      // Verify from project side
      const projectWithIssues = await testPrisma.project.findUnique({
        where: { id: project.id },
        include: { issues: true },
      })

      expect(projectWithIssues?.issues).toHaveLength(1)
    })

    it('should associate issue with requirement', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const requirement = await createTestRequirement(project.id)

      const issue = await testPrisma.issue.create({
        data: {
          title: 'Related Issue',
          projectId: project.id,
          requirementId: requirement.id,
        },
      })

      expect(issue.requirementId).toBe(requirement.id)

      // Verify from requirement side
      const requirementWithIssues = await testPrisma.requirement.findUnique({
        where: { id: requirement.id },
        include: { issues: true },
      })

      expect(requirementWithIssues?.issues).toHaveLength(1)
    })

    it('should associate issue with tasks', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const task = await createTestTask(project.id, user.id)

      const issue = await testPrisma.issue.create({
        data: {
          title: 'Task Issue',
          projectId: project.id,
          tasks: {
            connect: { id: task.id },
          },
        },
      })

      // Verify from task side
      const taskWithIssue = await testPrisma.task.findUnique({
        where: { id: task.id },
        include: { issue: true },
      })

      expect(taskWithIssue?.issue?.id).toBe(issue.id)
    })

    it('should cascade delete issue when project deleted', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const issue = await createTestIssue(project.id)

      // Delete project
      await testPrisma.project.delete({
        where: { id: project.id },
      })

      // Verify issue is also deleted (CASCADE)
      const deletedIssue = await testPrisma.issue.findUnique({
        where: { id: issue.id },
      })

      expect(deletedIssue).toBeNull()
    })
  })

  describe('Issue Queries', () => {
    it('should find issues by project', async () => {
      const user = await createTestUser()
      const project1 = await createTestProject(user.id)
      const project2 = await createTestProject(user.id)

      await createTestIssue(project1.id)
      await createTestIssue(project1.id)
      await createTestIssue(project2.id)

      const project1Issues = await testPrisma.issue.findMany({
        where: { projectId: project1.id },
      })

      expect(project1Issues).toHaveLength(2)
    })

    it('should find issues by status', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      await createTestIssue(project.id, { status: 'OPEN' })
      await createTestIssue(project.id, { status: 'OPEN' })
      await createTestIssue(project.id, { status: 'CLOSED' })

      const openIssues = await testPrisma.issue.findMany({
        where: { status: 'OPEN' },
      })

      expect(openIssues).toHaveLength(2)
    })

    it('should find issues by priority', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      await createTestIssue(project.id, { priority: 'HIGH' })
      await createTestIssue(project.id, { priority: 'HIGH' })
      await createTestIssue(project.id, { priority: 'LOW' })

      const highPriorityIssues = await testPrisma.issue.findMany({
        where: { priority: 'HIGH' },
      })

      expect(highPriorityIssues).toHaveLength(2)
    })

    it('should find open issues with autoClose=true', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      await createTestIssue(project.id, { status: 'OPEN', autoClose: true })
      await createTestIssue(project.id, { status: 'OPEN', autoClose: false })

      const issues = await testPrisma.issue.findMany({
        where: {
          status: 'OPEN',
          autoClose: true,
        },
      })

      expect(issues).toHaveLength(1)
    })
  })
})
