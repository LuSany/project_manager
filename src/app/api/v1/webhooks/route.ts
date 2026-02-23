import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

const createWebhookSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  url: z.string().url('请输入有效的URL'),
  events: z.array(z.string()),
  secret: z.string().optional(),
  isActive: z.boolean().optional(),
})

const updateWebhookSchema = createWebhookSchema.partial()

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以访问Webhook配置')
    }

    const { searchParams } = new URL(req.url)
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: any = {}

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [webhooks, total] = await Promise.all([
      prisma.webhook.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.webhook.count({ where }),
    ])

    return ApiResponder.success({
      data: webhooks,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    console.error('获取Webhook列表失败:', error)
    return ApiResponder.serverError('获取Webhook列表失败')
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以创建Webhook')
    }

    const body = await req.json()
    const validatedData = createWebhookSchema.parse(body)

    const webhook = await prisma.webhook.create({
      data: {
        name: validatedData.name,
        url: validatedData.url,
        events: JSON.stringify(validatedData.events),
        secret: validatedData.secret,
        isActive: validatedData.isActive ?? true,
        createdBy: user.id,
      },
    })

    return ApiResponder.success(webhook, 'Webhook创建成功')
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
    console.error('创建Webhook失败:', error)
    return ApiResponder.serverError('创建Webhook失败')
  }
}
