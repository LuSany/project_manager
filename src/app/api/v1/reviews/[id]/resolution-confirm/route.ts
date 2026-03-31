import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ApiResponder } from '@/lib/api/response'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ConfirmResolutionSchema = z.object({
  content: z.string().min(1, '决议内容不能为空'),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('未授权访问')
    }

    const { id: reviewId } = await params
    const body = await req.json()
    const { content } = ConfirmResolutionSchema.parse(body)

    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
    })

    if (!review) {
      return ApiResponder.notFound('评审不存在')
    }

    if (review.status !== 'COMPLETED') {
      return ApiResponder.error('只能在评审完成后确认决议', '400')
    }

    await prisma.review_ai_analysis.create({
      data: {
        id: crypto.randomUUID(),
        reviewId,
        analysisType: 'RESOLUTION_CONFIRMED',
        result: JSON.stringify({
          content,
          confirmedBy: user.id,
          confirmedAt: new Date().toISOString(),
        }),
        duration: 0,
      },
    })

    return ApiResponder.success({
      success: true,
      message: '决议已确认',
    })
  } catch (error) {
    console.error('确认决议失败:', error)
    if (error instanceof z.ZodError) {
      return ApiResponder.error('验证失败', '400')
    }
    return ApiResponder.serverError('确认决议失败')
  }
}
