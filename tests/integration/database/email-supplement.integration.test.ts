/**
 * 邮件服务补充集成测试
 *
 * 测试覆盖：
 * - 邮件配置管理
 * - 邮件日志记录
 * - 邮件模板管理
 * - SMTP 提供商
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestDatabase, testPrisma } from '../../helpers/test-db'
import { createTestUser, createTestAdminUser } from '../../helpers/test-data-factory'

// ============================================
// 测试套件
// ============================================

describe('邮件服务补充集成测试', () => {
  setupTestDatabase()

  let adminUser: { id: string }

  beforeEach(async () => {
    adminUser = await createTestAdminUser()
  })

  // ============================================
  // 邮件配置测试
  // ============================================

  describe('邮件配置管理', () => {
    it('应该能创建邮件配置', async () => {
      const config = await testPrisma.emailConfig.create({
        data: {
          name: '主邮件服务',
          provider: 'SMTP',
          smtpHost: 'smtp.example.com',
          smtpPort: 587,
          smtpUser: 'user@example.com',
          smtpPassword: 'password',
          fromAddress: 'noreply@example.com',
          fromName: '项目管理系统',
          isActive: true,
          isDefault: true,
        },
      })

      expect(config).toBeDefined()
      expect(config.provider).toBe('SMTP')
      expect(config.isActive).toBe(true)
    })

    it('应该能获取所有邮件配置', async () => {
      await testPrisma.emailConfig.create({
        data: {
          name: '配置1',
          provider: 'SMTP',
          smtpHost: 'smtp1.example.com',
          smtpPort: 587,
          fromAddress: 'noreply1@example.com',
          isActive: true,
        },
      })
      await testPrisma.emailConfig.create({
        data: {
          name: '配置2',
          provider: 'SENDGRID',
          fromAddress: 'noreply2@example.com',
          isActive: false,
        },
      })

      const configs = await testPrisma.emailConfig.findMany()
      expect(configs.length).toBe(2)
    })

    it('应该能设置默认邮件配置', async () => {
      const config = await testPrisma.emailConfig.create({
        data: {
          name: '默认配置',
          provider: 'SMTP',
          smtpHost: 'smtp.example.com',
          smtpPort: 587,
          fromAddress: 'noreply@example.com',
          isActive: true,
          isDefault: true,
        },
      })

      const defaultConfig = await testPrisma.emailConfig.findFirst({
        where: { isDefault: true },
      })

      expect(defaultConfig?.id).toBe(config.id)
    })

    it('应该能更新邮件配置', async () => {
      const config = await testPrisma.emailConfig.create({
        data: {
          name: '待更新',
          provider: 'SMTP',
          smtpHost: 'smtp.example.com',
          smtpPort: 587,
          fromAddress: 'noreply@example.com',
          isActive: true,
        },
      })

      const updated = await testPrisma.emailConfig.update({
        where: { id: config.id },
        data: { smtpPort: 465 },
      })

      expect(updated.smtpPort).toBe(465)
    })

    it('应该能删除邮件配置', async () => {
      const config = await testPrisma.emailConfig.create({
        data: {
          name: '待删除',
          provider: 'SMTP',
          smtpHost: 'smtp.example.com',
          smtpPort: 587,
          fromAddress: 'noreply@example.com',
          isActive: true,
        },
      })

      await testPrisma.emailConfig.delete({
        where: { id: config.id },
      })

      const found = await testPrisma.emailConfig.findUnique({
        where: { id: config.id },
      })

      expect(found).toBeNull()
    })
  })

  // ============================================
  // 邮件日志测试
  // ============================================

  describe('邮件日志记录', () => {
    it('应该能创建邮件发送日志', async () => {
      const log = await testPrisma.emailLog.create({
        data: {
          to: 'recipient@example.com',
          subject: '测试邮件',
          status: 'SENT',
          sentAt: new Date(),
        },
      })

      expect(log).toBeDefined()
      expect(log.status).toBe('SENT')
    })

    it('应该能记录发送失败的日志', async () => {
      const log = await testPrisma.emailLog.create({
        data: {
          to: 'failed@example.com',
          subject: '失败的邮件',
          status: 'FAILED',
          errorMessage: 'Connection timeout',
        },
      })

      expect(log.status).toBe('FAILED')
      expect(log.errorMessage).toBe('Connection timeout')
    })

    it('应该能查询邮件发送历史', async () => {
      await testPrisma.emailLog.create({
        data: { to: 'user1@example.com', subject: '邮件1', status: 'SENT' },
      })
      await testPrisma.emailLog.create({
        data: { to: 'user2@example.com', subject: '邮件2', status: 'FAILED' },
      })

      const sentLogs = await testPrisma.emailLog.findMany({
        where: { status: 'SENT' },
      })

      expect(sentLogs.length).toBe(1)
    })
  })

  // ============================================
  // 邮件模板测试
  // ============================================

  describe('邮件模板管理', () => {
    it('应该能创建邮件模板', async () => {
      const template = await testPrisma.emailTemplate.create({
        data: {
          name: '欢迎邮件',
          subject: '欢迎加入我们',
          body: '您好 {{name}}，欢迎加入！',
          type: 'WELCOME',
          isActive: true,
        },
      })

      expect(template).toBeDefined()
      expect(template.type).toBe('WELCOME')
    })

    it('应该能获取所有模板', async () => {
      await testPrisma.emailTemplate.create({
        data: { name: '模板1', subject: '主题1', body: '内容1', type: 'WELCOME', isActive: true },
      })
      await testPrisma.emailTemplate.create({
        data: {
          name: '模板2',
          subject: '主题2',
          body: '内容2',
          type: 'NOTIFICATION',
          isActive: true,
        },
      })

      const templates = await testPrisma.emailTemplate.findMany()
      expect(templates.length).toBe(2)
    })

    it('应该能按类型筛选模板', async () => {
      await testPrisma.emailTemplate.create({
        data: {
          name: '通知模板',
          subject: '通知',
          body: '内容',
          type: 'NOTIFICATION',
          isActive: true,
        },
      })

      const notificationTemplates = await testPrisma.emailTemplate.findMany({
        where: { type: 'NOTIFICATION' },
      })

      expect(notificationTemplates.length).toBe(1)
    })

    it('应该能更新邮件模板', async () => {
      const template = await testPrisma.emailTemplate.create({
        data: {
          name: '待更新',
          subject: '旧主题',
          body: '旧内容',
          type: 'WELCOME',
          isActive: true,
        },
      })

      const updated = await testPrisma.emailTemplate.update({
        where: { id: template.id },
        data: { subject: '新主题' },
      })

      expect(updated.subject).toBe('新主题')
    })
  })
})
