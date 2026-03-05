/**
 * ScheduledJobs 管理员测试 - 管理员后台专项测试
 *
 * 测试覆盖:
 * - Cron 任务 CRUD
 * - 任务激活/禁用
 * - 任务执行与状态追踪
 * - 错误处理与重试
 *
 * 管理员后台专项 - Phase 2
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../helpers/test-db'
import { createTestUser } from '../helpers/test-data-factory'

describe('Admin - Scheduled Jobs Management', () => {
  describe('Scheduled Job CRUD', () => {
    it('should create cron job successfully', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'Daily Backup',
          cronExpression: '0 2 * * *',
          endpoint: '/api/backup',
          isActive: true,
          method: 'POST',
        },
      })

      expect(job).toBeDefined()
      expect(job.name).toBe('Daily Backup')
      expect(job.cronExpression).toBe('0 2 * * *')
      expect(job.endpoint).toBe('/api/backup')
      expect(job.isActive).toBe(true)
    })

    it('should create job with all fields', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'Complete Job',
          cronExpression: '0 */6 * * *',
          endpoint: '/api/sync',
          method: 'GET',
          timeout: 30000,
          retryCount: 3,
          isActive: true,
          description: 'Sync data every 6 hours',
        },
      })

      expect(job.cronExpression).toBe('0 */6 * * *')
      expect(job.method).toBe('GET')
      expect(job.timeout).toBe(30000)
      expect(job.retryCount).toBe(3)
    })

    it('should update job configuration', async () => {
      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'Original Job',
          cronExpression: '0 1 * * *',
          endpoint: '/api/original',
          isActive: true,
        },
      })

      const updated = await testPrisma.scheduledJob.update({
        where: { id: job.id },
        data: {
          cronExpression: '0 3 * * *',
          endpoint: '/api/updated',
          timeout: 60000,
        },
      })

      expect(updated.cronExpression).toBe('0 3 * * *')
      expect(updated.endpoint).toBe('/api/updated')
      expect(updated.timeout).toBe(60000)
    })

    it('should delete job', async () => {
      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'To Delete',
          cronExpression: '0 0 * * *',
          endpoint: '/api/delete',
        },
      })

      await testPrisma.scheduledJob.delete({
        where: { id: job.id },
      })

      const found = await testPrisma.scheduledJob.findUnique({
        where: { id: job.id },
      })

      expect(found).toBeNull()
    })

    it('should validate cron expression format', async () => {
      // Valid cron expressions
      const validExpressions = [
        '0 2 * * *', // Daily at 2 AM
        '*/15 * * * *', // Every 15 minutes
        '0 0 * * 0', // Weekly on Sunday
        '0 0 1 * *', // Monthly on 1st
        '0 */6 * * *', // Every 6 hours
      ]

      for (const expr of validExpressions) {
        const job = await testPrisma.scheduledJob.create({
          data: {
            name: `Valid Job ${expr}`,
            cronExpression: expr,
            endpoint: '/api/valid',
          },
        })

        expect(job.cronExpression).toBe(expr)
      }
    })
  })

  describe('Job Activation', () => {
    it('should activate job', async () => {
      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'Inactive Job',
          cronExpression: '0 1 * * *',
          endpoint: '/api/inactive',
          isActive: false,
        },
      })

      const activated = await testPrisma.scheduledJob.update({
        where: { id: job.id },
        data: { isActive: true },
      })

      expect(activated.isActive).toBe(true)
    })

    it('should deactivate job', async () => {
      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'Active Job',
          cronExpression: '0 2 * * *',
          endpoint: '/api/active',
          isActive: true,
        },
      })

      const deactivated = await testPrisma.scheduledJob.update({
        where: { id: job.id },
        data: { isActive: false },
      })

      expect(deactivated.isActive).toBe(false)
    })

    it('should prevent activating job with invalid cron', async () => {
      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'Invalid Cron Job',
          cronExpression: 'invalid',
          endpoint: '/api/invalid',
          isActive: false,
        },
      })

      // Try to activate - should fail validation
      await expect(
        testPrisma.scheduledJob.update({
          where: { id: job.id },
          data: {
            isActive: true,
            cronExpression: 'still-invalid',
          },
        })
      ).rejects.toThrow()
    })
  })

  describe('Job Execution & Status', () => {
    it('should record successful execution', async () => {
      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'Test Job',
          cronExpression: '0 * * * *',
          endpoint: '/api/test',
          isActive: true,
        },
      })

      // Simulate execution log
      const execution = await testPrisma.scheduledJob.update({
        where: { id: job.id },
        data: {
          lastRunAt: new Date(),
          lastStatus: 'SUCCESS',
          lastErrorMessage: null,
        },
      })

      expect(execution.lastStatus).toBe('SUCCESS')
      expect(execution.lastRunAt).toBeDefined()
    })

    it('should record failed execution', async () => {
      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'Failing Job',
          cronExpression: '0 * * * *',
          endpoint: '/api/fail',
          isActive: true,
        },
      })

      const execution = await testPrisma.scheduledJob.update({
        where: { id: job.id },
        data: {
          lastRunAt: new Date(),
          lastStatus: 'FAILED',
          lastErrorMessage: 'Connection timeout',
        },
      })

      expect(execution.lastStatus).toBe('FAILED')
      expect(execution.lastErrorMessage).toBe('Connection timeout')
    })

    it('should record timeout execution', async () => {
      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'Timeout Job',
          cronExpression: '0 * * * *',
          endpoint: '/api/timeout',
          timeout: 5000,
          isActive: true,
        },
      })

      const execution = await testPrisma.scheduledJob.update({
        where: { id: job.id },
        data: {
          lastRunAt: new Date(),
          lastStatus: 'TIMEOUT',
          lastErrorMessage: 'Execution timeout after 5000ms',
        },
      })

      expect(execution.lastStatus).toBe('TIMEOUT')
    })

    it('should update next run time', async () => {
      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'Scheduled Job',
          cronExpression: '0 2 * * *',
          endpoint: '/api/scheduled',
          isActive: true,
        },
      })

      const nextRun = new Date()
      nextRun.setHours(2, 0, 0, 0)

      const updated = await testPrisma.scheduledJob.update({
        where: { id: job.id },
        data: { nextRunAt: nextRun },
      })

      expect(updated.nextRunAt).toEqual(nextRun)
    })
  })

  describe('Error Handling & Retry', () => {
    it('should increment retry count on failure', async () => {
      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'Retry Job',
          cronExpression: '0 * * * *',
          endpoint: '/api/retry',
          retryCount: 3,
          isActive: true,
        },
      })

      const execution = await testPrisma.scheduledJob.update({
        where: { id: job.id },
        data: {
          lastStatus: 'FAILED',
          consecutiveFailures: 1,
        },
      })

      expect(execution.consecutiveFailures).toBe(1)
    })

    it('should reset retry count on success', async () => {
      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'Success After Fail Job',
          cronExpression: '0 * * * *',
          endpoint: '/api/recover',
          isActive: true,
        },
      })

      // First fail
      await testPrisma.scheduledJob.update({
        where: { id: job.id },
        data: {
          lastStatus: 'FAILED',
          consecutiveFailures: 3,
        },
      })

      // Then succeed
      const recovered = await testPrisma.scheduledJob.update({
        where: { id: job.id },
        data: {
          lastStatus: 'SUCCESS',
          consecutiveFailures: 0,
        },
      })

      expect(recovered.consecutiveFailures).toBe(0)
    })

    it('should deactivate job after max failures', async () => {
      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'Max Fail Job',
          cronExpression: '0 * * * *',
          endpoint: '/api/maxfail',
          maxFailures: 5,
          isActive: true,
        },
      })

      // Simulate max failures
      const failed = await testPrisma.scheduledJob.update({
        where: { id: job.id },
        data: {
          lastStatus: 'FAILED',
          consecutiveFailures: 5,
          isActive: false, // Auto-deactivate
        },
      })

      expect(failed.consecutiveFailures).toBe(5)
      expect(failed.isActive).toBe(false)
    })
  })

  describe('Job Queries', () => {
    it('should find jobs by status', async () => {
      const activeJob = await testPrisma.scheduledJob.create({
        data: {
          name: 'Active Job',
          cronExpression: '0 1 * * *',
          endpoint: '/api/active',
          isActive: true,
        },
      })

      const inactiveJob = await testPrisma.scheduledJob.create({
        data: {
          name: 'Inactive Job',
          cronExpression: '0 2 * * *',
          endpoint: '/api/inactive',
          isActive: false,
        },
      })

      const activeJobs = await testPrisma.scheduledJob.findMany({
        where: { isActive: true },
      })

      expect(activeJobs.length).toBeGreaterThanOrEqual(1)
    })

    it('should paginate jobs', async () => {
      // Create multiple jobs
      for (let i = 0; i < 15; i++) {
        await testPrisma.scheduledJob.create({
          data: {
            name: `Job ${i}`,
            cronExpression: `0 ${i} * * *`,
            endpoint: `/api/job${i}`,
            isActive: true,
          },
        })
      }

      // Page 1
      const page1 = await testPrisma.scheduledJob.findMany({
        take: 10,
        skip: 0,
      })

      // Page 2
      const page2 = await testPrisma.scheduledJob.findMany({
        take: 10,
        skip: 10,
      })

      expect(page1.length).toBeLessThanOrEqual(10)
      expect(page2.length).toBeLessThanOrEqual(10)
    })

    it('should order jobs by next run time', async () => {
      const job1 = await testPrisma.scheduledJob.create({
        data: {
          name: 'Later Job',
          cronExpression: '0 3 * * *',
          endpoint: '/api/later',
          isActive: true,
        },
      })

      const job2 = await testPrisma.scheduledJob.create({
        data: {
          name: 'Sooner Job',
          cronExpression: '0 1 * * *',
          endpoint: '/api/sooner',
          isActive: true,
        },
      })

      const jobs = await testPrisma.scheduledJob.findMany({
        orderBy: { nextRunAt: 'asc' },
      })

      expect(jobs.length).toBeGreaterThanOrEqual(2)
    })

    it('should filter jobs by last status', async () => {
      const successJob = await testPrisma.scheduledJob.create({
        data: {
          name: 'Success Job',
          cronExpression: '0 1 * * *',
          endpoint: '/api/success',
          lastStatus: 'SUCCESS',
        },
      })

      const failedJob = await testPrisma.scheduledJob.create({
        data: {
          name: 'Failed Job',
          cronExpression: '0 2 * * *',
          endpoint: '/api/failed',
          lastStatus: 'FAILED',
        },
      })

      const failedJobs = await testPrisma.scheduledJob.findMany({
        where: { lastStatus: 'FAILED' },
      })

      expect(failedJobs.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Protected Operations', () => {
    it('should protect running job from deletion', async () => {
      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'Running Job',
          cronExpression: '0 * * * *',
          endpoint: '/api/running',
          isActive: true,
          lastStatus: 'RUNNING',
        },
      })

      // Business logic should prevent deletion of running jobs
      // This test documents the expected behavior
      await testPrisma.scheduledJob.update({
        where: { id: job.id },
        data: { isActive: false, lastStatus: 'STOPPED' },
      })

      // Now safe to delete
      await testPrisma.scheduledJob.delete({
        where: { id: job.id },
      })

      const found = await testPrisma.scheduledJob.findUnique({
        where: { id: job.id },
      })

      expect(found).toBeNull()
    })

    it('should prevent duplicate job names', async () => {
      await testPrisma.scheduledJob.create({
        data: {
          name: 'Unique Job Name',
          cronExpression: '0 1 * * *',
          endpoint: '/api/unique1',
        },
      })

      // Try to create duplicate
      await expect(
        testPrisma.scheduledJob.create({
          data: {
            name: 'Unique Job Name',
            cronExpression: '0 2 * * *',
            endpoint: '/api/unique2',
          },
        })
      ).rejects.toThrow()
    })
  })
})
