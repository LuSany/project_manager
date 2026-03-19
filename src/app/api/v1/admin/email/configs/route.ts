import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ApiResponder } from '@/lib/api/response'
import { getAuthenticatedUser } from '@/lib/auth'
import { randomUUID } from 'crypto'

const emailConfigCreateSchema = z.object({
  name: z.string().min(1, '配置名称不能为空'),
  provider: z.enum(['COMPANY', 'SMTP', 'SENDGRID']),
  apiKey: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  fromAddress: z.string().email('发件人地址格式不正确'),
  fromName: z.string().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以访问邮件配置')
    }

    const configs = await prisma.email_configs.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return ApiResponder.success(configs)
  } catch (error) {
    console.error('获取邮件配置失败:', error)
    return ApiResponder.serverError('获取失败')
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以创建邮件配置')
    }

    const body = await req.json()
    const validatedData = emailConfigCreateSchema.parse(body)

    if (validatedData.isDefault) {
      await prisma.email_configs.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const config = await prisma.email_configs.create({
      data: {
        id: randomUUID(),
        name: validatedData.name,
        provider: validatedData.provider,
        apiKey: validatedData.apiKey,
        smtpHost: validatedData.smtpHost,
        smtpPort: validatedData.smtpPort,
        smtpUser: validatedData.smtpUser,
        smtpPassword: validatedData.smtpPassword,
        fromAddress: validatedData.fromAddress,
        fromName: validatedData.fromName,
        isActive: validatedData.isActive,
        isDefault: validatedData.isDefault,
        updatedAt: new Date(),
      },
    })

    return ApiResponder.success(config, '邮件配置创建成功')
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.reduce(
        (acc, issue) => {
          acc[issue.path.join('.')] = issue.message
          return acc
        },
        {} as Record<string, string>
      )
      return ApiResponder.validationError('数据验证失败', issues)
    }
    console.error('创建邮件配置失败:', error)
    return ApiResponder.serverError('创建失败')
  }
}
