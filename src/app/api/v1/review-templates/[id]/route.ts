import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ApiResponder } from '@/lib/api/response'
import { getAuthenticatedUser, requireAuth } from '@/lib/auth'

// 更新评审模板验证 Schema
const updateReviewTemplateSchema = z.object({
  typeId: z.string().min(1, '评审类型不能为空').optional(),
  name: z.string().min(1, '模板名称不能为空').optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string().min(1, '评审项标题不能为空'),
        content: z.string().optional(),
        order: z.number().optional().default(0),
        required: z.boolean().optional().default(false),
      })
    )
    .optional(),
})

// GET /api/v1/review-templates/[id] - 获取单个评审模板
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('未授权，请先登录')
    }

    const template = await prisma.reviewTemplate.findUnique({
      where: { id: params.id },
      include: {
        type: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        items: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!template) {
      return ApiResponder.notFound('评审模板不存在')
    }

    return ApiResponder.success(template)
  } catch (error) {
    console.error('获取评审模板失败:', error)
    return ApiResponder.serverError('获取评审模板失败')
  }
}

// PUT /api/v1/review-templates/[id] - 更新评审模板
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req)
    if (user instanceof Error) {
      return ApiResponder.unauthorized('未授权，请先登录')
    }

    const body = await req.json()
    const validatedData = updateReviewTemplateSchema.parse(body)

    // 检查模板是否存在
    const existingTemplate = await prisma.reviewTemplate.findUnique({
      where: { id: params.id },
      include: {
        items: true,
      },
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

    const { items: newItems, ...templateData } = validatedData

    // 处理 items 的更新
    let itemsUpdate:
      | {
          create: Array<{
            title: string
            content: string | null
            order: number
            required: boolean
          }>
          update: Array<{
            where: { id: string }
            data: {
              title: string
              content: string | null
              order: number
              required: boolean
            }
          }>
          delete: Array<{ id: string }>
        }
      | undefined

    if (newItems) {
      const existingItemIds = existingTemplate.items.map((item) => item.id)
      const newItemIds = newItems.filter((item) => item.id).map((item) => item.id as string)

      // 要删除的 items
      const toDelete = existingItemIds.filter((id) => !newItemIds.includes(id))

      // 要更新的 items
      const toUpdate = newItems.filter((item) => item.id)

      // 要创建的 items
      const toCreate = newItems.filter((item) => !item.id)

      itemsUpdate = {
        create: toCreate.map((item, index) => ({
          title: item.title,
          content: item.content ?? null,
          order: item.order ?? index,
          required: item.required ?? false,
        })),
        update: toUpdate.map((item) => ({
          where: { id: item.id },
          data: {
            title: item.title,
            content: item.content ?? null,
            order: item.order ?? 0,
            required: item.required ?? false,
          },
        })),
        delete: toDelete.map((id) => ({ id })),
      }
    }

    const template = await prisma.reviewTemplate.update({
      where: { id: params.id },
      data: {
        ...templateData,
        ...(itemsUpdate && { items: itemsUpdate }),
      },
      include: {
        type: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        items: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return ApiResponder.success(template, '评审模板更新成功')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError('请求数据验证失败', error.format() as any)
    }
    console.error('更新评审模板失败:', error)
    return ApiResponder.serverError('更新评审模板失败')
  }
}

// DELETE /api/v1/review-templates/[id] - 删除评审模板
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req)
    if (user instanceof Error) {
      return ApiResponder.unauthorized('未授权，请先登录')
    }

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
    return ApiResponder.serverError('删除评审模板失败')
  }
}
