import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; materialId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id: reviewId, materialId } = await params

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        authorId: true,
        project: {
          select: {
            ownerId: true,
            members: { select: { userId: true } },
          },
        },
      },
    })

    if (!review) {
      return ApiResponder.notFound('评审不存在')
    }

    const isOwner = review.project.ownerId === user.id
    const isAuthor = review.authorId === user.id
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isAuthor && !isAdmin) {
      return ApiResponder.forbidden('无权删除评审材料')
    }

    // 检查材料是否属于该评审
    const material = await prisma.reviewMaterial.findFirst({
      where: { id: materialId, reviewId },
    })

    if (!material) {
      return ApiResponder.notFound('材料不存在')
    }

    await prisma.reviewMaterial.delete({
      where: { id: materialId },
    })

    return ApiResponder.success({ id: materialId }, '材料删除成功')
  } catch (error) {
    console.error('删除评审材料失败:', error)
    return ApiResponder.serverError('删除评审材料失败')
  }
}