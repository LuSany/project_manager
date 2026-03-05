/**
 * Email Management 管理员测试 - 管理员后台专项测试
 *
 * 测试覆盖:
 * - 邮件配置 CRUD（SMTP/公司邮箱）
 * - 邮件模板管理
 * - 邮件日志追踪
 * - 配置激活/切换
 * - 邮件发送测试
 *
 * 管理员后台专项 - Phase 2
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../helpers/test-db'
import { createTestUser } from '../helpers/test-data-factory'

describe('Admin - Email Management', () => {
  describe('Email Config CRUD', () => {
    it('should create SMTP config successfully', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const config = await testPrisma.emailConfig.create({
        data: {
          name: 'Gmail SMTP',
          provider: 'SMTP',
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUser: 'test@gmail.com',
          smtpPassword: 'app-password',
          fromAddress: 'noreply@example.com',
          fromName: 'Project Manager',
          isActive: true,
        },
      })

      expect(config).toBeDefined()
      expect(config.provider).toBe('SMTP')
      expect(config.smtpHost).toBe('smtp.gmail.com')
      expect(config.smtpPort).toBe(587)
    })

    it('should create company email config', async () => {
      const admin = await createTestUser({ role: 'ADMIN' })

      const config = await testPrisma.emailConfig.create({
        data: {
          name: 'Company Exchange',
          provider: 'EXCHANGE',
          smtpHost: 'mail.company.com',
          smtpPort: 25,
          smtpUser: 'project@company.com',
          smtpPassword: 'password',
          fromAddress: 'project@company.com',
          fromName: 'PM System',
          isActive: true,
        },
      })

      expect(config.provider).toBe('EXCHANGE')
      expect(config.smtpHost).toBe('mail.company.com')
    })

    it('should update email config', async () => {
      const config = await testPrisma.emailConfig.create({
        data: {
          name: 'Original Config',
          provider: 'SMTP',
          smtpHost: 'smtp.original.com',
          smtpPort: 587,
          isActive: true,
        },
      })

      const updated = await testPrisma.emailConfig.update({
        where: { id: config.id },
        data: {
          smtpHost: 'smtp.updated.com',
          smtpPort: 465,
        },
      })

      expect(updated.smtpHost).toBe('smtp.updated.com')
      expect(updated.smtpPort).toBe(465)
    })

    it('should delete email config', async () => {
      const config = await testPrisma.emailConfig.create({
        data: {
          name: 'To Delete',
          provider: 'SMTP',
          smtpHost: 'smtp.delete.com',
          smtpPort: 587,
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

  describe('Config Activation', () => {
    it('should activate email config', async () => {
      const config = await testPrisma.emailConfig.create({
        data: {
          name: 'Inactive Config',
          provider: 'SMTP',
          smtpHost: 'smtp.inactive.com',
          isActive: false,
        },
      })

      const activated = await testPrisma.emailConfig.update({
        where: { id: config.id },
        data: { isActive: true },
      })

      expect(activated.isActive).toBe(true)
    })

    it('should deactivate email config', async () => {
      const config = await testPrisma.emailConfig.create({
        data: {
          name: 'Active Config',
          provider: 'SMTP',
          smtpHost: 'smtp.active.com',
          isActive: true,
        },
      })

      const deactivated = await testPrisma.emailConfig.update({
        where: { id: config.id },
        data: { isActive: false },
      })

      expect(deactivated.isActive).toBe(false)
    })

    it('should set default config', async () => {
      const config = await testPrisma.emailConfig.create({
        data: {
          name: 'Default Config',
          provider: 'SMTP',
          smtpHost: 'smtp.default.com',
          isDefault: true,
          isActive: true,
        },
      })

      expect(config.isDefault).toBe(true)
    })

    it('should change default config', async () => {
      const config1 = await testPrisma.emailConfig.create({
        data: {
          name: 'Old Default',
          provider: 'SMTP',
          smtpHost: 'smtp.old.com',
          isDefault: true,
          isActive: true,
        },
      })

      const config2 = await testPrisma.emailConfig.create({
        data: {
          name: 'New Default',
          provider: 'SMTP',
          smtpHost: 'smtp.new.com',
          isDefault: false,
          isActive: true,
        },
      })

      // Update to make config2 the new default
      await testPrisma.emailConfig.update({
        where: { id: config1.id },
        data: { isDefault: false },
      })

      await testPrisma.emailConfig.update({
        where: { id: config2.id },
        data: { isDefault: true },
      })

      const newDefault = await testPrisma.emailConfig.findUnique({
        where: { id: config2.id },
      })

      expect(newDefault?.isDefault).toBe(true)
    })
  })

  describe('Email Template Management', () => {
    it('should create email template', async () => {
      const template = await testPrisma.emailTemplate.create({
        data: {
          name: 'Welcome Email',
          subject: 'Welcome to Project Manager',
          body: 'Hello {{name}}, welcome to {{project}}!',
          templateType: 'WELCOME',
          isActive: true,
        },
      })

      expect(template).toBeDefined()
      expect(template.templateType).toBe('WELCOME')
      expect(template.body).toContain('{{name}}')
    })

    it('should create notification email template', async () => {
      const template = await testPrisma.emailTemplate.create({
        data: {
          name: 'Task Assignment',
          subject: 'You have been assigned to a task',
          body: 'Hi {{assignee}}, you have been assigned to {{taskTitle}}',
          templateType: 'NOTIFICATION',
          isActive: true,
        },
      })

      expect(template.templateType).toBe('NOTIFICATION')
    })

    it('should update email template', async () => {
      const template = await testPrisma.emailTemplate.create({
        data: {
          name: 'Original Template',
          subject: 'Original Subject',
          body: 'Original body',
          templateType: 'GENERAL',
        },
      })

      const updated = await testPrisma.emailTemplate.update({
        where: { id: template.id },
        data: {
          subject: 'Updated Subject',
          body: 'Updated body with {{variables}}',
        },
      })

      expect(updated.subject).toBe('Updated Subject')
      expect(updated.body).toContain('{{variables}}')
    })

    it('should deactivate email template', async () => {
      const template = await testPrisma.emailTemplate.create({
        data: {
          name: 'Old Template',
          subject: 'Old Subject',
          body: 'Old body',
          templateType: 'GENERAL',
          isActive: true,
        },
      })

      const deactivated = await testPrisma.emailTemplate.update({
        where: { id: template.id },
        data: { isActive: false },
      })

      expect(deactivated.isActive).toBe(false)
    })

    it('should find active templates', async () => {
      await testPrisma.emailTemplate.create({
        data: {
          name: 'Active Template 1',
          subject: 'Active 1',
          body: 'Body 1',
          templateType: 'NOTIFICATION',
          isActive: true,
        },
      })

      await testPrisma.emailTemplate.create({
        data: {
          name: 'Inactive Template',
          subject: 'Inactive',
          body: 'Inactive body',
          templateType: 'NOTIFICATION',
          isActive: false,
        },
      })

      await testPrisma.emailTemplate.create({
        data: {
          name: 'Active Template 2',
          subject: 'Active 2',
          body: 'Body 2',
          templateType: 'WELCOME',
          isActive: true,
        },
      })

      const active = await testPrisma.emailTemplate.findMany({
        where: { isActive: true },
      })

      expect(active).toHaveLength(2)
    })

    it('should find templates by type', async () => {
      await testPrisma.emailTemplate.create({
        data: {
          name: 'Welcome 1',
          subject: 'Welcome',
          body: 'Welcome body',
          templateType: 'WELCOME',
        },
      })

      await testPrisma.emailTemplate.create({
        data: {
          name: 'Notification 1',
          subject: 'Notification',
          body: 'Notification body',
          templateType: 'NOTIFICATION',
        },
      })

      const notifications = await testPrisma.emailTemplate.findMany({
        where: { templateType: 'NOTIFICATION' },
      })

      expect(notifications).toHaveLength(1)
      expect(notifications[0].templateType).toBe('NOTIFICATION')
    })
  })

  describe('Email Log Tracking', () => {
    it('should create email log entry', async () => {
      const config = await testPrisma.emailConfig.create({
        data: {
          name: 'Logging Config',
          provider: 'SMTP',
          smtpHost: 'smtp.logging.com',
          isActive: true,
        },
      })

      const log = await testPrisma.emailLog.create({
        data: {
          configId: config.id,
          to: 'recipient@example.com',
          subject: 'Test Email',
          body: 'This is a test email',
          status: 'SENT',
          sentAt: new Date(),
        },
      })

      expect(log).toBeDefined()
      expect(log.to).toBe('recipient@example.com')
      expect(log.status).toBe('SENT')
    })

    it('should log failed email', async () => {
      const config = await testPrisma.emailConfig.create({
        data: {
          name: 'Failed Config',
          provider: 'SMTP',
          smtpHost: 'smtp.failed.com',
        },
      })

      const log = await testPrisma.emailLog.create({
        data: {
          configId: config.id,
          to: 'invalid@example.com',
          subject: 'Failed Email',
          body: 'This email failed to send',
          status: 'FAILED',
          errorMessage: 'SMTP connection failed',
        },
      })

      expect(log.status).toBe('FAILED')
      expect(log.errorMessage).toBe('SMTP connection failed')
    })

    it('should log email with attachments', async () => {
      const config = await testPrisma.emailConfig.create({
        data: {
          name: 'Attachment Config',
          provider: 'SMTP',
          smtpHost: 'smtp.attachment.com',
        },
      })

      const log = await testPrisma.emailLog.create({
        data: {
          configId: config.id,
          to: 'recipient@example.com',
          subject: 'Email with attachments',
          body: 'Please find attached',
          status: 'SENT',
          attachments: JSON.stringify(['file1.pdf', 'file2.docx']),
        },
      })

      expect(log.attachments).toBe('["file1.pdf","file2.docx"]')
    })

    it('should find sent emails', async () => {
      const config = await testPrisma.emailConfig.create({
        data: {
          name: 'Sent Config',
          provider: 'SMTP',
          smtpHost: 'smtp.sent.com',
        },
      })

      await testPrisma.emailLog.create({
        data: {
          configId: config.id,
          to: 'user1@example.com',
          subject: 'Email 1',
          status: 'SENT',
        },
      })

      await testPrisma.emailLog.create({
        data: {
          configId: config.id,
          to: 'user2@example.com',
          subject: 'Email 2',
          status: 'FAILED',
        },
      })

      await testPrisma.emailLog.create({
        data: {
          configId: config.id,
          to: 'user3@example.com',
          subject: 'Email 3',
          status: 'SENT',
        },
      })

      const sent = await testPrisma.emailLog.findMany({
        where: { status: 'SENT' },
      })

      expect(sent).toHaveLength(2)
    })

    it('should find emails by recipient', async () => {
      const config = await testPrisma.emailConfig.create({
        data: {
          name: 'Recipient Config',
          provider: 'SMTP',
          smtpHost: 'smtp.recipient.com',
        },
      })

      await testPrisma.emailLog.create({
        data: {
          configId: config.id,
          to: 'specific@example.com',
          subject: 'Email to specific user',
          status: 'SENT',
        },
      })

      await testPrisma.emailLog.create({
        data: {
          configId: config.id,
          to: 'other@example.com',
          subject: 'Email to other user',
          status: 'SENT',
        },
      })

      const specificUserEmails = await testPrisma.emailLog.findMany({
        where: { to: 'specific@example.com' },
      })

      expect(specificUserEmails).toHaveLength(1)
    })

    it('should order logs by sentAt', async () => {
      const config = await testPrisma.emailConfig.create({
        data: {
          name: 'Time Config',
          provider: 'SMTP',
          smtpHost: 'smtp.time.com',
        },
      })

      const oldTime = new Date('2024-01-01')
      const newTime = new Date('2024-12-01')

      await testPrisma.emailLog.create({
        data: {
          configId: config.id,
          to: 'user@example.com',
          subject: 'Old Email',
          status: 'SENT',
          sentAt: oldTime,
        },
      })

      await testPrisma.emailLog.create({
        data: {
          configId: config.id,
          to: 'user@example.com',
          subject: 'New Email',
          status: 'SENT',
          sentAt: newTime,
        },
      })

      const logs = await testPrisma.emailLog.findMany({
        where: { configId: config.id },
        orderBy: { sentAt: 'asc' },
      })

      expect(logs[0].subject).toBe('Old Email')
      expect(logs[1].subject).toBe('New Email')
    })
  })

  describe('Email Statistics', () => {
    it('should calculate send success rate', async () => {
      const config = await testPrisma.emailConfig.create({
        data: {
          name: 'Stats Config',
          provider: 'SMTP',
          smtpHost: 'smtp.stats.com',
        },
      })

      // Create 8 sent, 2 failed
      for (let i = 0; i < 8; i++) {
        await testPrisma.emailLog.create({
          data: {
            configId: config.id,
            to: `user${i}@example.com`,
            subject: `Email ${i}`,
            status: 'SENT',
          },
        })
      }

      for (let i = 0; i < 2; i++) {
        await testPrisma.emailLog.create({
          data: {
            configId: config.id,
            to: `failed${i}@example.com`,
            subject: `Failed ${i}`,
            status: 'FAILED',
          },
        })
      }

      const logs = await testPrisma.emailLog.findMany({
        where: { configId: config.id },
      })

      const total = logs.length
      const sent = logs.filter((l) => l.status === 'SENT').length
      const successRate = (sent / total) * 100

      expect(total).toBe(10)
      expect(sent).toBe(8)
      expect(successRate).toBe(80)
    })
  })

  describe('Email Config Switching', () => {
    it('should support hot config switching', async () => {
      const config1 = await testPrisma.emailConfig.create({
        data: {
          name: 'Primary SMTP',
          provider: 'SMTP',
          smtpHost: 'smtp.primary.com',
          isDefault: true,
          isActive: true,
        },
      })

      const config2 = await testPrisma.emailConfig.create({
        data: {
          name: 'Backup SMTP',
          provider: 'SMTP',
          smtpHost: 'smtp.backup.com',
          isDefault: false,
          isActive: true,
        },
      })

      // Switch default
      await testPrisma.emailConfig.update({
        where: { id: config1.id },
        data: { isDefault: false },
      })

      await testPrisma.emailConfig.update({
        where: { id: config2.id },
        data: { isDefault: true },
      })

      const newDefault = await testPrisma.emailConfig.findFirst({
        where: { isDefault: true },
      })

      expect(newDefault?.id).toBe(config2.id)
      expect(newDefault?.smtpHost).toBe('smtp.backup.com')
    })
  })
})
