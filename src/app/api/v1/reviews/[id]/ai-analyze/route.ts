import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiReviewService } from '@/lib/services/ai-review'
import { requireAuth } from '@/lib/auth'

export interface AiAnalyzeResponse {
  success: boolean
  result?: {
    completenessScore: number
    analysis: string
    missingItems: string[]
    suggestions: string[]
  }
  error?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { id: reviewId } = await params
    const userId = authResult.id

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, projectId: true },
    })

    if (!review) {
      return NextResponse.json({ success: false, error: '评审不存在' }, { status: 404 })
    }

    const result = await aiReviewService.analyzeMaterials(reviewId, userId)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, result: result.result } as AiAnalyzeResponse)
  } catch (error) {
    console.error('AI analyze error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '分析失败' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params

    const analysis = await prisma.reviewAiAnalysis.findFirst({
      where: { reviewId, analysisType: 'MATERIAL_ANALYSIS' },
      orderBy: { createdAt: 'desc' },
    })

    if (!analysis) {
      return NextResponse.json({ success: false, error: '暂无分析结果' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      result: JSON.parse(analysis.result),
      createdAt: analysis.createdAt,
    })
  } catch (error) {
    console.error('Get AI analyze error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    )
  }
}
