import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

// 更新评审组验证Schema
const updateReviewGroupSchema = z.object({
  name: z.string().min(1, '评审组名称不能为空').optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/v1/review-groups/[id] - 获取评审组详情
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id } = await params

    const group = await prisma.reviewGroup.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                department: true,
                position: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!group) {
      return ApiResponder.notFound('评审组不存在')
    }

    return ApiResponder.success(group)
  } catch (error) {
    console.error('获取评审组详情失败:', error)
    return ApiResponder.serverError('获取评审组详情失败')
  }
}

// PUT /api/v1/review-groups/[id] - 更新评审组
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id } = await params
    const body = await req.json()
    const validatedData = updateReviewGroupSchema.parse(body)

    const existingGroup = await prisma.reviewGroup.findUnique({
      where: { id },
    })

    if (!existingGroup) {
      return ApiResponder.notFound('评审组不存在')
    }

    const group = await prisma.reviewGroup.update({
      where: { id },
      data: validatedData,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    return ApiResponder.success(group, '评审组更新成功')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError('数据验证失败', error.issues as any)
    }
    console.error('更新评审组失败:', error)
    return ApiResponder.serverError('更新评审组失败')
  }
}

// DELETE /api/v1/review-groups/[id] - 删除评审组
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id } = await params

    const existingGroup = await prisma.reviewGroup.findUnique({
      where: { id },
    })

    if (!existingGroup) {
      return ApiResponder.notFound('评审组不存在')
    }

    await prisma.reviewGroup.delete({
      where: { id },
    })

    return ApiResponder.success(null, '评审组删除成功')
  } catch (error) {
    console.error('删除评审组失败:', error)
    return ApiResponder.serverError('删除评审组失败')
  }
}