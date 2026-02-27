import { prisma } from '@/lib/prisma'
import { sendSMTPEmail } from '@/lib/email-providers/smtp'

/**
 * 邮件服务工具类
 *
 * 注意：当前为MVP版本，仅实现架构和日志记录
 * 实际邮件发送功能需配置SMTP或第三方服务后实现
 */

export interface SendEmailOptions {
  to: string
  subject: string
  body: string
  templateType?: string
  userId?: string
  projectId?: string
}

export interface EmailTemplateVariables {
  [key: string]: string
}

/**
 * 发送邮件
 *
 * MVP版本：仅记录日志，不实际发送
 * 后续可集成 nodemailer / AWS SES / SendGrid 等
 */
export async function sendEmail(options: SendEmailOptions): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  const { to, subject, body, templateType, userId, projectId } = options

  let emailLog: { id: string } | null = null

  try {
    // 创建邮件日志记录
    emailLog = await prisma.emailLog.create({
      data: {
        to,
        subject,
        content: body,
        templateType: templateType || null,
        userId: userId || null,
        projectId: projectId || null,
        status: 'PENDING',
      },
    })

    // MVP阶段：仅打印日志模拟发送
    console.log('='.repeat(50))
    console.log('📧 邮件发送（模拟）')
    console.log('-'.repeat(50))
    console.log(`收件人: ${to}`)
    console.log(`主题: ${subject}`)
    console.log(`内容: ${body.substring(0, 100)}...`)
    console.log(`模板类型: ${templateType || '无'}`)
    console.log(`日志ID: ${emailLog.id}`)
    console.log('='.repeat(50))

    // 模拟发送成功
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    })

    return {
      success: true,
      messageId: emailLog.id,
    }
  } catch (error) {
    console.error('邮件发送失败:', error)

    // 记录失败状态
    if (emailLog?.id) {
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : '未知错误',
        },
      })
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '邮件发送失败',
    }
  }
}

/**
 * 根据模板类型获取并渲染邮件模板
 */
export async function getEmailTemplate(
  type: string,
  variables: EmailTemplateVariables
): Promise<{ subject: string; body: string } | null> {
  const template = await prisma.emailTemplate.findFirst({
    where: {
      type,
      isActive: true,
    },
  })

  if (!template) {
    console.warn(`邮件模板不存在或已禁用: ${type}`)
    return null
  }

  // 简单的变量替换
  let subject = template.subject
  let body = template.body

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`
    subject = subject.replace(new RegExp(placeholder, 'g'), value)
    body = body.replace(new RegExp(placeholder, 'g'), value)
  }

  return { subject, body }
}

/**
 * 发送密码重置邮件
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  _expiresAt: Date
): Promise<{ success: boolean; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">密码重置请求</h2>
      <p style="color: #666; line-height: 1.6;">
        您请求重置密码，请在1小时内点击以下链接重置密码：
      </p>
      <p style="margin: 20px 0;">
        <a href="${resetUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          重置密码
        </a>
      </p>
      <p style="color: #999; font-size: 12px;">
        链接有效期：1小时<br/>
        如果您没有请求重置密码，请忽略此邮件。
      </p>
    </div>
  `

  const textBody = `您请求重置密码，请在1小时内点击以下链接重置密码：\n\n${resetUrl}\n\n如果您没有请求重置密码，请忽略此邮件。`

  const result = await sendSMTPEmail(
    email,
    '密码重置请求',
    htmlBody,
    textBody
  )

  return {
    success: result.success,
    error: result.error,
  }
}

/**
 * 获取默认邮件配置
 */
export async function getDefaultEmailConfig() {
  return await prisma.emailConfig.findFirst({
    where: {
      isActive: true,
      isDefault: true,
    },
  })
}
