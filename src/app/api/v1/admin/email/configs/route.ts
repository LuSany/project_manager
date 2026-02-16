import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ApiResponder } from '@/lib/api/response'
import { getAuthenticatedUser } from '@/lib/auth'

const emailConfigSchema = z.object({
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

    const configs = await prisma.emailConfig.findMany({
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
    const validatedData = emailConfigSchema.parse(body)

    if (validatedData.isDefault) {
      await prisma.emailConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const config = await prisma.emailConfig.create({
      data: validatedData,
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
