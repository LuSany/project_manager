import { NextRequest, NextResponse } from 'next/server'
import { aiReviewService } from '@/lib/services/ai-review'
import { requireAuth } from '@/lib/auth'

export interface GenerateSummaryRequest {
  length?: 'short' | 'standard' | 'detailed'
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult

    const { id: reviewId } = await params
    const userId = authResult.id
    const body = await request.json().catch(() => ({}))
    const { length = 'standard' } = body as GenerateSummaryRequest

    const result = await aiReviewService.generateSummary(reviewId, userId)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      result: {
        summary: result.result?.[length] || result.result?.standard,
        fullSummary: result.result,
      }
    })
  } catch (error) {
    console.error('AI generate summary error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '生成失败' },
      { status: 500 }
    )
  }
}
