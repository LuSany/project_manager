import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { sendSMTPEmail, testSMTPConnection } from '@/lib/email-providers/smtp'

// Mock nodemailer
vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => ({
    sendMail: vi.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
  })),
}))

describe('SMTP Email Service', () => {
  const mockConfig = {
    id: 'config-1',
    name: 'Test SMTP',
    provider: 'SMTP',
    apiKey: null,
    smtpHost: 'smtp.test.com',
    smtpPort: 587,
    smtpUser: 'test@test.com',
    smtpPassword: 'password123',
    fromAddress: 'test@test.com',
    fromName: 'Test',
    isActive: true,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(async () => {
    //创建测试配置
    await prisma.emailConfig.create({ data: mockConfig })
  })

  afterEach(async () => {
    vi.clearAllMocks()
    await prisma.emailConfig.deleteMany()
    await prisma.emailLog.deleteMany()
  })

  describe('sendSMTPEmail', () => {
    it('应该返回无配置时的错误', async () => {
      await prisma.emailConfig.deleteMany()

      const result = await sendSMTPEmail('recipient@test.com', 'Test Subject', '<p>Test HTML</p>')

      expect(result.success).toBe(false)
      expect(result.error).toBe('No email configuration found')
    })

    it('应该成功发送邮件', async () => {
      const result = await sendSMTPEmail(
        'recipient@test.com',
        'Test Subject',
        '<p>Test HTML</p>',
        'Test Text'
      )

      expect(result.success).toBe(true)
      expect(result.messageId).toBeDefined()

      //验证邮件日志
      const log = await prisma.emailLog.findFirst({
        where: { to: 'recipient@test.com' },
      })
      expect(log).toBeDefined()
      expect(log?.status).toBe('SENT')
    })

    it('应该记录邮件日志', async () => {
      await sendSMTPEmail('recipient@test.com', 'Test Subject', '<p>Test HTML</p>')

      const log = await prisma.emailLog.findFirst({
        where: { to: 'recipient@test.com' },
      })
      expect(log).toBeDefined()
      expect(log?.subject).toBe('Test Subject')
      expect(log?.content).toBe('<p>Test HTML</p>')
      expect(log?.status).toBe('SENT')
    })

    it('应该使用自定义配置ID', async () => {
      //创建第二个配置
      const customConfig = {
        ...mockConfig,
        id: 'config-2',
        name: 'Custom SMTP',
        smtpHost: 'smtp.custom.com',
      }
      await prisma.emailConfig.create({ data: customConfig })

      const result = await sendSMTPEmail(
        'recipient@test.com',
        'Test with custom config',
        '<p>Test HTML</p>',
        undefined,
        'config-2'
      )

      expect(result.success).toBe(true)
    })
  })

  describe('testSMTPConnection', () => {
    it('应该验证配置', async () => {
      const result = await testSMTPConnection(mockConfig)

      expect(result.success).toBe(true)
    })
  })
})
