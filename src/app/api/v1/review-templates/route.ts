import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ApiResponder } from '@/lib/api/response'
import { getAuthenticatedUser, requireAuth } from '@/lib/auth'

// 请求验证Schema
const reviewTemplateSchema = z.object({
  typeId: z.string().min(1, '评审类型ID必填'),
  name: z.string().min(1, '模板名称必填'),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
})

const updateReviewTemplateSchema = z.object({
  typeId: z.string().optional(),
  name: z.string().min(1, '模板名称必填'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

// 创建评审模板
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (user instanceof Error) {
      return ApiResponder.unauthorized(user.message)
    }

    const body = await req.json()
    const validatedData = reviewTemplateSchema.parse(body)

    // 检查评审类型是否存在
    const reviewTypeConfig = await prisma.reviewTypeConfig.findUnique({
      where: { id: validatedData.typeId },
    })

    if (!reviewTypeConfig) {
      return ApiResponder.notFound('评审类型不存在')
    }

    const template = await prisma.reviewTemplate.create({
      data: {
        typeId: validatedData.typeId,
        name: validatedData.name,
        description: validatedData.description,
        isActive: validatedData.isActive ?? true,
      },
    })

    return ApiResponder.success({ data: template })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError('请求数据验证失败', error.issues as any)
    }
    console.error('创建评审模板失败:', error)
    return ApiResponder.serverError('创建失败，请稍后重试')
  }
}

// 获取所有评审模板
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return ApiResponder.unauthorized()

    const { search, typeId, isActive } = Object.fromEntries(new URL(req.url).searchParams.entries())

    const where: any = {}

    if (search) {
      where.OR = [{ name: { contains: search, mode: 'insensitive' } }]
    }

    if (typeId) {
      where.typeId = typeId
    }

    if (isActive === 'true') {
      where.isActive = true
    } else if (isActive === 'false') {
      where.isActive = false
    }

    const templates = await prisma.reviewTemplate.findMany({
      where,
      include: {
        type: true,
        items: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return ApiResponder.success({ data: templates })
  } catch (error) {
    console.error('获取评审模板失败:', error)
    return ApiResponder.serverError('获取失败，请稍后重试')
  }
}
