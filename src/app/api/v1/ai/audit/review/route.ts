import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ApiResponder } from '@/lib/api/response'
import { getAuthenticatedUser } from '@/lib/auth'
import { auditReview } from '@/lib/ai'

const reviewAuditSchema = z.object({
  reviewId: z.string().min(1, '评审ID不能为空'),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const body = await req.json()
    const validatedData = reviewAuditSchema.parse(body)

    const review = await prisma.reviews.findUnique({
      where: { id: validatedData.reviewId },
      include: {
        ReviewTypeConfig: true,
        projects: {
          include: {
            project_members: true,
          },
        },
        review_materials: true,
      },
    })

    if (!review) {
      return ApiResponder.notFound('评审不存在')
    }

    const isOwner = review.projects.ownerId === user.id
    const isMember = review.projects.project_members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('无权审核此评审')
    }

    const materials = review.review_materials.map((m) => ({
      name: m.fileName,
      type: m.fileType || 'document',
      content: '', // ReviewMaterial doesn't have content field
    }))

    const result = await auditReview(
      review.title,
      review.ReviewTypeConfig?.displayName || 'general',
      materials,
      user.id,
      review.projects.id
    )

    if (!result.success) {
      return ApiResponder.serverError(result.error || '评审审核失败')
    }

    return ApiResponder.success({
      reviewId: validatedData.reviewId,
      audit: result.result,
      auditedAt: new Date().toISOString(),
    })
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
    console.error('评审审核失败:', error)
    return ApiResponder.serverError('评审审核失败')
  }
}
