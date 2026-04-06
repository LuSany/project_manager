import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id: reviewId } = await params

    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
      include: {
        projects: { include: { project_members: true } },
        review_participants: true,
      },
    })

    if (!review) {
      return ApiResponder.notFound('评审不存在')
    }

    // 检查当前状态
    if (review.status === 'IN_PROGRESS') {
      return ApiResponder.success(review, '评审已在进行中')
    }

    if (review.status !== 'PENDING') {
      return ApiResponder.error('INVALID_STATUS', '只能启动待评审状态的评审')
    }

    // 检查启动权限：只有项目管理员、评审主持人可以启动评审
    const isOwner = review.projects.ownerId === user.id
    const isAdmin = user.role === 'ADMIN'

    const participant = review.review_participants.find(p => p.userId === user.id)
    const isModerator = participant?.role === 'MODERATOR'

    if (!isOwner && !isAdmin && !isModerator) {
      return ApiResponder.forbidden('只有项目管理员或评审主持人可以启动评审')
    }

    // 更新评审状态为进行中
    const updatedReview = await prisma.reviews.update({
      where: { id: reviewId },
      data: {
        status: 'IN_PROGRESS',
      },
      include: {
        ReviewTypeConfig: true,
        users: { select: { id: true, name: true, avatar: true } },
        projects: { select: { id: true, name: true } },
      },
    })

    return ApiResponder.success(updatedReview, '评审已启动')
  } catch (error) {
    console.error('启动评审失败:', error)
    return ApiResponder.serverError('启动评审失败')
  }
}
