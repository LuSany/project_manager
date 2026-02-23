import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

const addParticipantSchema = z.object({
  userId: z.string().min(1, '用户ID不能为空'),
  role: z.enum(['REVIEWER', 'OBSERVER', 'SECRETARY']),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id: reviewId } = await params

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { project: { include: { members: true } } },
    })

    if (!review) {
      return ApiResponder.notFound('评审不存在')
    }

    const isOwner = review.project.ownerId === user.id
    const isMember = review.project.members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('无权访问此评审')
    }

    const participants = await prisma.reviewParticipant.findMany({
      where: { reviewId },
      include: {
        user: { select: { id: true, name: true, avatar: true, email: true } },
      },
      orderBy: { joinedAt: 'asc' },
    })

    return ApiResponder.success(participants)
  } catch (error) {
    console.error('获取评审参与者列表失败:', error)
    return ApiResponder.serverError('获取评审参与者列表失败')
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id: reviewId } = await params
    const body = await req.json()
    const validatedData = addParticipantSchema.parse(body)

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { project: { include: { members: true } } },
    })

    if (!review) {
      return ApiResponder.notFound('评审不存在')
    }

    const isOwner = review.project.ownerId === user.id
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      return ApiResponder.forbidden('无权添加评审参与者')
    }

    const userExists = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    })

    if (!userExists) {
      return ApiResponder.notFound('用户不存在')
    }

    const existingParticipant = await prisma.reviewParticipant.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId: validatedData.userId,
        },
      },
    })

    if (existingParticipant) {
      return this.error('ALREADY_EXISTS', '该用户已经是评审参与者', undefined, 400)
    }

    const participant = await prisma.reviewParticipant.create({
      data: {
        reviewId,
        userId: validatedData.userId,
        role: validatedData.role,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    })

    return ApiResponder.success(participant, '评审参与者添加成功')
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
    console.error('添加评审参与者失败:', error)
    return ApiResponder.serverError('添加评审参与者失败')
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id: reviewId } = await params
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return this.error('MISSING_PARAM', '用户ID不能为空', undefined, 400)
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { project: true },
    })

    if (!review) {
      return ApiResponder.notFound('评审不存在')
    }

    const isOwner = review.project.ownerId === user.id
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      return ApiResponder.forbidden('无权移除评审参与者')
    }

    await prisma.reviewParticipant.delete({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    })

    return ApiResponder.success({ userId }, '评审参与者移除成功')
  } catch (error) {
    console.error('移除评审参与者失败:', error)
    return ApiResponder.serverError('移除评审参与者失败')
  }
}
