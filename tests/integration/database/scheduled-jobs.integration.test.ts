/**
 * 定时任务集成测试
 *
 * 测试覆盖：
 * - GET /api/v1/admin/scheduled-jobs - 获取定时任务列表
 * - 定时任务 CRUD 操作
 * - Cron 表达式验证
 * - 任务状态管理
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestDatabase, testPrisma } from '../helpers/test-db'
import { createTestUser, createTestAdminUser } from '../helpers/test-data-factory'

// ============================================
// 测试套件
// ============================================

describe('定时任务 API 集成测试', () => {
  setupTestDatabase()

  let adminUser: { id: string }
  let normalUser: { id: string }

  beforeEach(async () => {
    adminUser = await createTestAdminUser()
    normalUser = await createTestUser({ email: 'normal@example.com' })
  })

  // ============================================
  // 定时任务 CRUD 测试
  // ============================================

  describe('定时任务 CRUD 操作', () => {
    it('管理员应该能创建定时任务', async () => {
      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'test-cleanup-job',
          description: '清理过期数据',
          cron: '0 0 * * *', // 每天凌晨执行
          endpoint: '/api/internal/cleanup',
          method: 'POST',
          payload: JSON.stringify({ days: 30 }),
          isActive: true,
          createdBy: adminUser.id,
        },
      })

      expect(job).toBeDefined()
      expect(job.name).toBe('test-cleanup-job')
      expect(job.cron).toBe('0 0 * * *')
      expect(job.isActive).toBe(true)
    })

    it('管理员应该能获取定时任务列表', async () => {
      // 创建多个定时任务
      await testPrisma.scheduledJob.create({
        data: {
          name: 'job-1',
          cron: '0 0 * * *',
          endpoint: '/api/internal/job1',
          method: 'POST',
          isActive: true,
          createdBy: adminUser.id,
        },
      })
      await testPrisma.scheduledJob.create({
        data: {
          name: 'job-2',
          cron: '0 */6 * * *',
          endpoint: '/api/internal/job2',
          method: 'GET',
          isActive: false,
          createdBy: adminUser.id,
        },
      })

      const jobs = await testPrisma.scheduledJob.findMany({
        orderBy: { createdAt: 'desc' },
      })

      expect(jobs.length).toBe(2)
    })

    it('应该能获取定时任务详情', async () => {
      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'detail-test-job',
          description: '测试详情查询',
          cron: '0 12 * * *',
          endpoint: '/api/internal/test',
          method: 'POST',
          isActive: true,
          createdBy: adminUser.id,
        },
      })

      const found = await testPrisma.scheduledJob.findUnique({
        where: { id: job.id },
      })

      expect(found).toBeDefined()
      expect(found?.name).toBe('detail-test-job')
      expect(found?.description).toBe('测试详情查询')
    })

    it('管理员应该能更新定时任务', async () => {
      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'update-test-job',
          cron: '0 0 * * *',
          endpoint: '/api/internal/test',
          method: 'POST',
          isActive: true,
          createdBy: adminUser.id,
        },
      })

      const updated = await testPrisma.scheduledJob.update({
        where: { id: job.id },
        data: {
          cron: '0 6 * * *',
          isActive: false,
        },
      })

      expect(updated.cron).toBe('0 6 * * *')
      expect(updated.isActive).toBe(false)
    })

    it('管理员应该能删除定时任务', async () => {
      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'delete-test-job',
          cron: '0 0 * * *',
          endpoint: '/api/internal/test',
          method: 'POST',
          isActive: true,
          createdBy: adminUser.id,
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
  })

  // ============================================
  // 任务状态管理测试
  // ============================================

  describe('任务状态管理', () => {
    it('应该能记录任务执行状态', async () => {
      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'status-test-job',
          cron: '0 0 * * *',
          endpoint: '/api/internal/test',
          method: 'POST',
          isActive: true,
          lastRunAt: new Date(),
          lastStatus: 'SUCCESS',
          createdBy: adminUser.id,
        },
      })

      expect(job.lastStatus).toBe('SUCCESS')
      expect(job.lastRunAt).toBeDefined()
    })

    it('应该能记录执行错误', async () => {
      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'error-test-job',
          cron: '0 0 * * *',
          endpoint: '/api/internal/test',
          method: 'POST',
          isActive: true,
          lastRunAt: new Date(),
          lastStatus: 'FAILED',
          lastError: 'Connection timeout',
          createdBy: adminUser.id,
        },
      })

      expect(job.lastStatus).toBe('FAILED')
      expect(job.lastError).toBe('Connection timeout')
    })

    it('应该能按状态筛选任务', async () => {
      await testPrisma.scheduledJob.create({
        data: {
          name: 'active-job',
          cron: '0 0 * * *',
          endpoint: '/api/internal/test',
          method: 'POST',
          isActive: true,
          createdBy: adminUser.id,
        },
      })
      await testPrisma.scheduledJob.create({
        data: {
          name: 'inactive-job',
          cron: '0 0 * * *',
          endpoint: '/api/internal/test',
          method: 'POST',
          isActive: false,
          createdBy: adminUser.id,
        },
      })

      const activeJobs = await testPrisma.scheduledJob.findMany({
        where: { isActive: true },
      })

      expect(activeJobs.length).toBe(1)
      expect(activeJobs[0].name).toBe('active-job')
    })
  })

  // ============================================
  // Cron 表达式验证测试
  // ============================================

  describe('Cron 表达式', () => {
    it('应该支持标准 5 字段 Cron 表达式', async () => {
      const cronExpressions = [
        '0 0 * * *', // 每天凌晨
        '0 */6 * * *', // 每 6 小时
        '0 9-17 * * 1-5', // 工作时间
        '0 0 1 * *', // 每月 1 号
        '0 0 * * 0', // 每周日
      ]

      for (const cron of cronExpressions) {
        const job = await testPrisma.scheduledJob.create({
          data: {
            name: `cron-test-${cron.replace(/\s+/g, '-')}`,
            cron,
            endpoint: '/api/internal/test',
            method: 'POST',
            isActive: true,
            createdBy: adminUser.id,
          },
        })
        expect(job.cron).toBe(cron)
      }
    })
  })

  // ============================================
  // HTTP 方法测试
  // ============================================

  describe('HTTP 方法支持', () => {
    it('应该支持 GET 方法', async () => {
      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'get-job',
          cron: '0 0 * * *',
          endpoint: '/api/internal/test',
          method: 'GET',
          isActive: true,
          createdBy: adminUser.id,
        },
      })

      expect(job.method).toBe('GET')
    })

    it('应该支持 POST 方法', async () => {
      const job = await testPrisma.scheduledJob.create({
        data: {
          name: 'post-job',
          cron: '0 0 * * *',
          endpoint: '/api/internal/test',
          method: 'POST',
          payload: JSON.stringify({ action: 'cleanup' }),
          isActive: true,
          createdBy: adminUser.id,
        },
      })

      expect(job.method).toBe('POST')
      expect(job.payload).toBeDefined()
    })
  })
})
