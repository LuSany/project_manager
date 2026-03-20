import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

const updateReviewSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  typeId: z.string().optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id } = await params

    const review = await prisma.reviews.findUnique({
      where: { id },
      include: {
        projects: {
          include: { project_members: true },
        },
        ReviewTypeConfig: true,
        users: { select: { id: true, name: true, avatar: true, email: true } }, // 包含作者信息
        review_materials: true,
        review_participants: {
          include: {
            users: { select: { id: true, name: true, avatar: true } },
          },
        },
        review_items: { orderBy: { order: 'asc' } },
      },
    })

    if (!review) {
      return ApiResponder.notFound('评审不存在')
    }

    const isOwner = review.projects.ownerId === user.id
    const isMember = review.projects.project_members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('无权访问此评审')
    }

    return ApiResponder.success(review)
  } catch (error) {
    console.error('获取评审详情失败:', error)
    return ApiResponder.serverError('获取评审详情失败')
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id } = await params
    const body = await req.json()
    const validatedData = updateReviewSchema.parse(body)

    const existing = await prisma.reviews.findUnique({
      where: { id },
      include: { projects: { include: { project_members: true } } },
    })

    if (!existing) {
      return ApiResponder.notFound('评审不存在')
    }

    const isOwner = existing.projects.ownerId === user.id
    const isMember = existing.projects.project_members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('只有项目所有者、成员或管理员可以更新评审')
    }

    const review = await prisma.reviews.update({
      where: { id },
      data: {
        ...(validatedData.title !== undefined && { title: validatedData.title }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description,
        }),
        ...(validatedData.typeId !== undefined && { typeId: validatedData.typeId }),
        ...(validatedData.scheduledAt !== undefined && {
          scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
        }),
        ...(validatedData.status !== undefined && { status: validatedData.status }),
      },
      include: {
        projects: { select: { id: true, name: true } },
        ReviewTypeConfig: { select: { id: true, displayName: true } },
      },
    })

    return ApiResponder.success(review, '评审更新成功')
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
    console.error('更新评审失败:', error)
    return ApiResponder.serverError('更新评审失败')
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id } = await params

    const existing = await prisma.reviews.findUnique({
      where: { id },
      include: { projects: { include: { project_members: true } } },
    })

    if (!existing) {
      return ApiResponder.notFound('评审不存在')
    }

    const isOwner = existing.projects.ownerId === user.id
    const isMember = existing.projects.project_members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('只有项目所有者、成员或管理员可以删除评审')
    }

    await prisma.reviews.delete({
      where: { id },
    })

    return ApiResponder.success({ id }, '评审删除成功')
  } catch (error) {
    console.error('删除评审失败:', error)
    return ApiResponder.serverError('删除评审失败')
  }
}
