import { describe, it, expect, vi } from 'vitest'

// Mock sendSMTPEmail
vi.mock('@/lib/email-providers/smtp', () => ({
  sendSMTPEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'mock-id' }),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    emailLog: {
      create: vi.fn().mockResolvedValue({ id: 'log-1' }),
      update: vi.fn().mockResolvedValue({ id: 'log-1' }),
    },
    emailTemplate: {
      findFirst: vi.fn().mockImplementation(({ where }) => {
        if (where.type === 'TEST_TEMPLATE') {
          return Promise.resolve({
            id: 'template-1',
            name: 'Test Template',
            type: 'TEST_TEMPLATE',
            subject: '测试邮件 - {{name}}',
            body: '你好 {{name}}，这是测试内容',
            isActive: true,
          })
        }
        return Promise.resolve(null)
      }),
    },
    emailConfig: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}))



import {
  sendEmail,
  sendPasswordResetEmail,
  getEmailTemplate,
  getDefaultEmailConfig,
} from '@/lib/email'

describe('邮件服务模块', () => {
  describe('sendEmail - 发送邮件', () => {
    it('应该成功发送邮件', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: '测试邮件',
        body: '这是测试内容',
      })
      expect(result.success).toBe(true)
      expect(result.messageId).toBeDefined()
    })

    it('应该支持模板类型', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: '测试邮件',
        body: '内容',
        templateType: 'PASSWORD_RESET',
      })
      expect(result.success).toBe(true)
    })

    it('应该支持用户和项目 ID', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: '测试邮件',
        body: '内容',
        userId: 'user-1',
        projectId: 'project-1',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('sendPasswordResetEmail - 发送密码重置邮件', () => {
    it('应该成功发送密码重置邮件', async () => {
      const result = await sendPasswordResetEmail('test@example.com', 'reset-token', new Date())
      expect(result.success).toBe(true)
    })
  })

  describe('getEmailTemplate - 获取邮件模板', () => {
    it('不存在的模板应返回 null', async () => {
      const result = await getEmailTemplate('NON_EXISTENT', { name: 'test' })
      expect(result).toBeNull()
    })

    it('应该返回模板并替换变量', async () => {
      const result = await getEmailTemplate('TEST_TEMPLATE', { name: '张三' })
      expect(result).not.toBeNull()
      expect(result?.subject).toBe('测试邮件 - 张三')
      expect(result?.body).toBe('你好 张三，这是测试内容')
    })

    it('应该替换多个变量', async () => {
      const result = await getEmailTemplate('TEST_TEMPLATE', { name: '李四' })
      expect(result?.subject).toBe('测试邮件 - 李四')
    })
  })

  describe('getDefaultEmailConfig - 获取默认邮件配置', () => {
    it('应该返回 null 当没有配置', async () => {
      const result = await getDefaultEmailConfig()
      expect(result).toBeNull()
    })
  })
})
