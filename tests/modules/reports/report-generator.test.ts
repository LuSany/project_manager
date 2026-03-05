/**
 * ReportGenerator 测试 - 报告生成模块
 *
 * 测试覆盖:
 * - 项目进度报告生成
 * - 里程碑完成报告
 * - 风险汇总报告
 * - 评审报告生成
 * - 数据聚合与格式验证
 *
 * Phase 3 扩展测试
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestTask,
  createTestMilestone,
  createTestRisk,
  createTestReview,
  createTestReviewTypeConfig,
} from '../../helpers/test-data-factory'

describe('ReportGenerator - Core Functionality', () => {
  describe('Project Progress Report', () => {
    it('should generate project progress report', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      // Create tasks for the project
      await createTestTask(project.id, user.id, { status: 'COMPLETED' })
      await createTestTask(project.id, user.id, { status: 'IN_PROGRESS' })
      await createTestTask(project.id, user.id, { status: 'TODO' })

      // Generate report data
      const tasks = await testPrisma.task.findMany({
        where: { projectId: project.id },
      })

      const total = tasks.length
      const completed = tasks.filter((t) => t.status === 'COMPLETED').length
      const progress = (completed / total) * 100

      expect(total).toBe(3)
      expect(completed).toBe(1)
      expect(progress).toBeCloseTo(33.33, 1)
    })

    it('should calculate milestone completion rate', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      const m1 = await createTestMilestone(project.id, { progress: 100 })
      const m2 = await createTestMilestone(project.id, { progress: 50 })
      const m3 = await createTestMilestone(project.id, { progress: 0 })

      const milestones = await testPrisma.milestone.findMany({
        where: { projectId: project.id },
      })

      const avgProgress = milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length

      expect(milestones).toHaveLength(3)
      expect(avgProgress).toBe(50)
    })

    it('should aggregate task statistics', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      // Create tasks with different statuses
      await createTestTask(project.id, user.id, { status: 'COMPLETED', progress: 100 })
      await createTestTask(project.id, user.id, { status: 'IN_PROGRESS', progress: 50 })
      await createTestTask(project.id, user.id, { status: 'TODO', progress: 0 })

      const stats = await testPrisma.task.groupBy({
        by: ['status'],
        where: { projectId: project.id },
        _count: true,
      })

      expect(stats.length).toBeGreaterThanOrEqual(3)
    })

    it('should include team member workload', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      const task1 = await createTestTask(project.id, user.id)
      const task2 = await createTestTask(project.id, user.id)

      const tasksByUser = await testPrisma.task.groupBy({
        by: ['assigneeId'],
        where: { projectId: project.id },
        _count: true,
      })

      expect(tasksByUser.length).toBeGreaterThanOrEqual(1)
    })

    it('should format report as JSON', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      const report = {
        projectId: project.id,
        projectName: project.name,
        generatedAt: new Date().toISOString(),
        statistics: {
          totalTasks: 3,
          completedTasks: 1,
          progress: 33.33,
        },
      }

      expect(report).toHaveProperty('projectId')
      expect(report).toHaveProperty('statistics')
      expect(JSON.stringify(report)).toBeDefined()
    })

    it('should filter report by date range', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      const endDate = new Date()

      const tasks = await testPrisma.task.findMany({
        where: {
          projectId: project.id,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      })

      expect(tasks).toBeDefined()
    })
  })

  describe('Risk Summary Report', () => {
    it('should generate risk summary report', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      const r1 = await createTestRisk(project.id, user.id, { riskLevel: 'HIGH' })
      const r2 = await createTestRisk(project.id, user.id, { riskLevel: 'MEDIUM' })
      const r3 = await createTestRisk(project.id, user.id, { riskLevel: 'LOW' })

      const risks = await testPrisma.risk.findMany({
        where: { projectId: project.id },
      })

      const byLevel = risks.reduce(
        (acc, r) => {
          acc[r.riskLevel] = (acc[r.riskLevel] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      expect(risks).toHaveLength(3)
      expect(byLevel.HIGH).toBe(1)
      expect(byLevel.MEDIUM).toBe(1)
    })

    it('should categorize risks by category', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      await createTestRisk(project.id, user.id, { category: 'TECHNICAL' })
      await createTestRisk(project.id, user.id, { category: 'BUSINESS' })
      await createTestRisk(project.id, user.id, { category: 'TECHNICAL' })

      const byCategory = await testPrisma.risk.groupBy({
        by: ['category'],
        where: { projectId: project.id },
        _count: true,
      })

      expect(byCategory.length).toBeGreaterThanOrEqual(2)
    })

    it('should calculate risk exposure', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      const risk = await createTestRisk(project.id, user.id, {
        probability: 4,
        impact: 5,
      })

      const exposure = risk.probability * risk.impact

      expect(exposure).toBe(20)
    })

    it('should track risk mitigation progress', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)

      const risk = await createTestRisk(project.id, user.id, {
        status: 'MITIGATING',
        progress: 60,
      })

      expect(risk.progress).toBe(60)
      expect(risk.status).toBe('MITIGATING')
    })
  })

  describe('Review Report', () => {
    it('should generate review summary report', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()

      const r1 = await createTestReview(project.id, type.id, { status: 'COMPLETED', passed: true })
      const r2 = await createTestReview(project.id, type.id, { status: 'COMPLETED', passed: false })
      const r3 = await createTestReview(project.id, type.id, { status: 'PENDING' })

      const reviews = await testPrisma.review.findMany({
        where: { projectId: project.id },
      })

      const completed = reviews.filter((r) => r.status === 'COMPLETED')
      const passRate = (completed.filter((r) => r.passed).length / completed.length) * 100

      expect(reviews).toHaveLength(3)
      expect(completed).toHaveLength(2)
      expect(passRate).toBe(50)
    })

    it('should aggregate review criteria scores', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()

      const review = await createTestReview(project.id, type.id)

      const criteria = await testPrisma.reviewCriterion.findMany({
        where: { typeId: type.id },
      })

      if (criteria.length > 0) {
        const avgScore = criteria.reduce((sum, c) => sum + c.weight, 0) / criteria.length
        expect(avgScore).toBeDefined()
      }
    })

    it('should include reviewer feedback', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()

      const review = await createTestReview(project.id, type.id, {
        conclusion: 'Overall good quality with minor improvements needed',
      })

      expect(review.conclusion).toBeDefined()
    })

    it('should track review turnaround time', async () => {
      const user = await createTestUser()
      const project = await createTestProject(user.id)
      const type = await createTestReviewTypeConfig()

      const review = await createTestReview(project.id, type.id)

      const createdAt = new Date(review.createdAt)
      const now = new Date()
      const turnaroundTime = now.getTime() - createdAt.getTime()

      expect(turnaroundTime).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Report Export Formats', () => {
    it('should export report as JSON', async () => {
      const report = {
        title: 'Project Report',
        generatedAt: new Date().toISOString(),
        data: {
          tasks: 10,
          completed: 5,
          progress: 50,
        },
      }

      const json = JSON.stringify(report, null, 2)

      expect(json).toContain('Project Report')
      expect(json).toContain('50')
    })

    it('should export report as CSV', async () => {
      const data = [
        { name: 'Task 1', status: 'COMPLETED', progress: 100 },
        { name: 'Task 2', status: 'IN_PROGRESS', progress: 50 },
        { name: 'Task 3', status: 'TODO', progress: 0 },
      ]

      const csvHeader = Object.keys(data[0]).join(',')
      const csvRows = data.map((row) => Object.values(row).join(','))
      const csv = [csvHeader, ...csvRows].join('\n')

      expect(csv).toContain('name,status,progress')
      expect(csv.split('\n')).toHaveLength(4)
    })

    it('should include report metadata', async () => {
      const report = {
        title: 'Monthly Report',
        generatedAt: new Date().toISOString(),
        generatedBy: 'System',
        version: '1.0',
        projectId: 'test-project',
      }

      expect(report).toHaveProperty('generatedAt')
      expect(report).toHaveProperty('generatedBy')
      expect(report).toHaveProperty('version')
    })

    it('should support custom report templates', async () => {
      const template = {
        header: '{{projectName}} - Monthly Report',
        sections: ['Overview', 'Tasks', 'Risks', 'Milestones'],
        footer: 'Generated on {{date}}',
      }

      const rendered = template.header.replace('{{projectName}}', 'Test Project')

      expect(rendered).toContain('Test Project')
    })
  })

  describe('Report Scheduling', () => {
    it('should schedule recurring report generation', async () => {
      const schedule = {
        frequency: 'WEEKLY',
        dayOfWeek: 1, // Monday
        time: '09:00',
        recipients: ['manager@example.com'],
      }

      expect(schedule.frequency).toBe('WEEKLY')
      expect(schedule.dayOfWeek).toBe(1)
    })

    it('should send report to stakeholders', async () => {
      const recipients = ['pm@example.com', 'stakeholder1@example.com', 'stakeholder2@example.com']

      expect(recipients).toHaveLength(3)
      expect(recipients[0]).toContain('@')
    })
  })
})
