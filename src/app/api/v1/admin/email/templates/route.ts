import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ApiResponder } from '@/lib/api/response'
import { getAuthenticatedUser } from '@/lib/auth'

const emailTemplateSchema = z.object({
  name: z.string().min(1, '模板名称不能为空'),
  type: z.string().min(1, '模板类型不能为空'),
  subject: z.string().min(1, '邮件主题不能为空'),
  body: z.string().min(1, '邮件内容不能为空'),
  variables: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以访问邮件模板')
    }

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return ApiResponder.success(templates)
  } catch (error) {
    console.error('获取邮件模板失败:', error)
    return ApiResponder.serverError('获取失败')
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以创建邮件模板')
    }

    const body = await req.json()
    const validatedData = emailTemplateSchema.parse(body)

    const template = await prisma.emailTemplate.create({
      data: {
        name: validatedData.name,
        type: validatedData.type,
        subject: validatedData.subject,
        body: validatedData.body,
        variables: validatedData.variables,
        isActive: validatedData.isActive ?? true,
      },
    })

    return ApiResponder.success(template, '邮件模板创建成功')
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
    console.error('创建邮件模板失败:', error)
    return ApiResponder.serverError('创建失败')
  }
}
