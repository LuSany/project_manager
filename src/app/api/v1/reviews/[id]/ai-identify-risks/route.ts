import { NextRequest, NextResponse } from 'next/server'
import { aiReviewService } from '@/lib/services/ai-review'
import { requireAuth } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult

    const { id: reviewId } = await params
    const userId = authResult.id

    const result = await aiReviewService.identifyRisks(reviewId, userId)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, result: result.result })
  } catch (error) {
    console.error('AI identify risks error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '识别失败' },
      { status: 500 }
    )
  }
}
