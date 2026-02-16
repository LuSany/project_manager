import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    emailLog: {
      create: vi.fn().mockResolvedValue({ id: 'log-1' }),
      update: vi.fn().mockResolvedValue({ id: 'log-1' }),
    },
    emailTemplate: {
      findUnique: vi.fn().mockResolvedValue(null),
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

    it('应该支持用户和项目ID', async () => {
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
    it('不存在的模板应返回null', async () => {
      const result = await getEmailTemplate('NON_EXISTENT', { name: 'test' })
      expect(result).toBeNull()
    })
  })

  describe('getDefaultEmailConfig - 获取默认邮件配置', () => {
    it('应该返回null当没有配置', async () => {
      const result = await getDefaultEmailConfig()
      expect(result).toBeNull()
    })
  })
})
