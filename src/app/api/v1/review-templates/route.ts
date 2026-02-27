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
    if (user instanceof Error) return user

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

    const { search, typeId, isActive } = Object.fromEntries(
      new URL(req.url).searchParams.entries()
    )

    const where: {
      type: reviewTypeConfig,
      items: {
        some: {
          template: {
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
          },
        },
      },
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (typeId) {
      where.typeId = typeId
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

// 获取单个评审模板
export async function GET_WITH_ID(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return ApiResponder.unauthorized()

    const template = await prisma.reviewTemplate.findUnique({
      where: { id: params.id },
      include: {
        type: true,
        items: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!template) {
      return ApiResponder.notFound('评审模板不存在')
    }

    return ApiResponder.success({ data: template })
  } catch (error) {
    console.error('获取评审模板失败:', error)
    return ApiResponder.serverError('获取失败，请稍后重试')
  }
}

// 更新评审模板
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req)
    if (user instanceof Error) return user

    const body = await req.json()
    const validatedData = updateReviewTemplateSchema.parse(body)

    // 检查模板是否存在
    const existingTemplate = await prisma.reviewTemplate.findUnique({
      where: { id: params.id },
    })

    if (!existingTemplate) {
      return ApiResponder.notFound('评审模板不存在')
    }

    // 如果要修改typeId，检查新typeId是否存在
    if (validatedData.typeId && validatedData.typeId !== existingTemplate.typeId) {
      const reviewTypeConfig = await prisma.reviewTypeConfig.findUnique({
        where: { id: validatedData.typeId },
      })

      if (!reviewTypeConfig) {
        return ApiResponder.notFound('评审类型不存在')
      }
    }

    const template = await prisma.reviewTemplate.update({
      where: { id: params.id },
      data: {
        ...(validatedData.typeId && { typeId: validatedData.typeId }),
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
      },
    })

    return ApiResponder.success({ data: template })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError('请求数据验证失败', error.issues as any)
    }
    console.error('更新评审模板失败:', error)
    return ApiResponder.serverError('更新失败，请稍后重试')
  }
}

// 删除评审模板
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req)
    if (user instanceof Error) return user

    // 检查模板是否存在
    const template = await prisma.reviewTemplate.findUnique({
      where: { id: params.id },
    })

    if (!template) {
      return ApiResponder.notFound('评审模板不存在')
    }

    // 检查模板是否已被使用
    const inUse = await prisma.review.count({
      where: {
        typeId: template.typeId,
        status: { in: ['IN_PROGRESS', 'PENDING'] },
      },
    })

    if (inUse > 0) {
      return ApiResponder.error('TEMPLATE_IN_USE', '模板正在使用中，无法删除')
    }

    await prisma.reviewTemplate.delete({
      where: { id: params.id },
    })

    return ApiResponder.success({ message: '删除成功' })
  } catch (error) {
    console.error('删除评审模板失败:', error)
    return ApiResponder.serverError('删除失败，请稍后重试')
  }
}
