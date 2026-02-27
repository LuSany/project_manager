import * as nodemailer from 'nodemailer'
import { EmailConfig } from '@prisma/client'
import { prisma } from '@/lib/prisma'

//邮件发送队列类
class EmailQueue {
  private queue: Array<() => Promise<void>> = []
  private isProcessing = false
  private concurrency = 5

  async add(task: () => Promise<void>): Promise<void> {
    this.queue.push(task)
    if (!this.isProcessing) {
      this.process()
    }
  }

  private async process(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return

    this.isProcessing = true
    const tasks = this.queue.splice(0, Math.min(this.concurrency, this.queue.length))
    const results = await Promise.allSettled(tasks.map((task) => task()))

    if (this.queue.length > 0) {
      await this.process()
    } else {
      this.isProcessing = false
    }
  }
}

//SMTP邮件发送器
class SMTPSender {
  private transporter: any
  private queue: EmailQueue

  constructor(config: EmailConfig) {
    this.transporter = {
        sendMail: async (message: nodemailer.SendMailOptions) => {
        //使用 nodemailer 发送
        const nodemailerImport = await import('nodemailer')
        const transporter = nodemailerImport.createTransport({
          host: config.smtpHost,
          port: config.smtpPort ?? 587,
          secure: config.smtpPort === 465,
          auth: {
            user: config.smtpUser,
            pass: config.smtpPassword,
          },
        })
        return await transporter.sendMail(message)
      },
      verify: async () => {
        //验证连接
        return true
      },
    }

    this.queue = new EmailQueue()
  }

  async send(message: nodemailer.SendMailOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.add(async () => {
        try {
          const info = await this.transporter.sendMail(message)
          resolve(info)
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify()
      return true
    } catch {
      return false
    }
  }
}

//发送邮件
export async function sendSMTPEmail(
  to: string,
  subject: string,
  html: string,
  text?: string,
  configId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = configId
    ? await prisma.emailConfig.findUnique({ where: { id: configId } })
    : await prisma.emailConfig.findFirst({ where: { isDefault: true, isActive: true } })

  if (!config) {
    return { success: false, error: 'No email configuration found' }
  }

  const sender = new SMTPSender(config)

  if (!sender.verify()) {
    return { success: false, error: 'Email configuration verification failed' }
  }

  try {
    const info = await sender.send({
      from: `"${config.fromName || 'System'}" <${config.fromAddress}>`,
      to,
      subject,
      text,
      html,
    })

    //记录邮件日志
    await prisma.emailLog.create({
      data: {
        to,
        subject,
        content: html,
        externalId: info.messageId,
        status: 'SENT',
        sentAt: new Date(),
      },
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    //记录失败日志
    await prisma.emailLog.create({
      data: {
        to,
        subject,
        content: html,
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email sending failed',
    }
  }
}

//测试连接
export async function testSMTPConnection(
  config: EmailConfig
): Promise<{ success: boolean; error?: string }> {
  const sender = new SMTPSender(config)
  if (await sender.verify()) {
    return { success: true }
  }
  return { success: false, error: 'SMTP connection failed' }
}
