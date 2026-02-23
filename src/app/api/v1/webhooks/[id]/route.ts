import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

const updateWebhookSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  secret: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以访问Webhook')
    }

    const { id } = await params

    const webhook = await prisma.webhook.findUnique({
      where: { id },
      include: {
        _count: { select: { deliveries: true } },
      },
    })

    if (!webhook) {
      return ApiResponder.notFound('Webhook不存在')
    }

    return ApiResponder.success(webhook)
  } catch (error) {
    console.error('获取Webhook详情失败:', error)
    return ApiResponder.serverError('获取Webhook详情失败')
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以更新Webhook')
    }

    const { id } = await params
    const body = await req.json()
    const validatedData = updateWebhookSchema.parse(body)

    const webhook = await prisma.webhook.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.url && { url: validatedData.url }),
        ...(validatedData.events && { events: JSON.stringify(validatedData.events) }),
        ...(validatedData.secret !== undefined && { secret: validatedData.secret }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
      },
    })

    return ApiResponder.success(webhook, 'Webhook更新成功')
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
    console.error('更新Webhook失败:', error)
    return ApiResponder.serverError('更新Webhook失败')
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以删除Webhook')
    }

    const { id } = await params

    await prisma.webhook.delete({
      where: { id },
    })

    return ApiResponder.success({ id }, 'Webhook删除成功')
  } catch (error) {
    console.error('删除Webhook失败:', error)
    return ApiResponder.serverError('删除Webhook失败')
  }
}
