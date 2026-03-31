import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ApiResponder } from '@/lib/api/response'
import { getAuthenticatedUser } from '@/lib/auth'
import { generateResolutionDraft } from '@/lib/ai-reviewer'

const resolutionDraftRequestSchema = z.object({})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)

    const { id: reviewId } = await params

    const result = await generateResolutionDraft(reviewId, user?.id)

    if (!result.success) {
      return ApiResponder.serverError(result.error || '生成决议草案失败')
    }

    return ApiResponder.success({
      success: true,
      draft: result.draft,
    })
  } catch (error) {
    console.error('生成决议草案失败:', error)
    return ApiResponder.serverError('生成决议草案失败')
  }
}
