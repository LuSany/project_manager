import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ApiResponder } from '@/lib/api/response'
import { callAI } from '@/lib/ai'
import { addAIReviewer, submitAIVote } from '@/lib/ai-reviewer'

const aiVoteRequestSchema = z.object({})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const apiKey = req.headers.get('x-api-key')
  const internalToken = req.headers.get('x-internal-token')

  const validApiKey = process.env.INTERNAL_API_KEY
  const validToken = process.env.INTERNAL_TOKEN

  const isAuthorized =
    (validApiKey && apiKey === validApiKey) || (validToken && internalToken === validToken)

  if (!isAuthorized) {
    return ApiResponder.unauthorized('需要系统授权才能执行 AI 投票')
  }

  try {
    const { id: reviewId } = await params

    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
      include: {
        ReviewTypeConfig: true,
        review_materials: true,
        review_items: true,
        review_participants: {
          where: { role: 'REVIEWER' },
        },
        review_votes: true,
      },
    })

    if (!review) {
      return ApiResponder.notFound('评审不存在')
    }

    if (review.status !== 'IN_PROGRESS') {
      return ApiResponder.validationError('评审未在进行中')
    }

    const addResult = await addAIReviewer(reviewId)
    if (!addResult.success) {
      return ApiResponder.serverError(addResult.error || '添加 AI 评审员失败')
    }

    const materialsInfo = review.review_materials
      .map((m) => `- ${m.fileName} (${m.fileType})`)
      .join('\n')

    const itemsInfo = review.review_items
      .map((item, i) => `${i + 1}. ${item.title}: ${item.description || '无描述'}`)
      .join('\n')

    const prompt = `你是一个专业的评审专家。请根据以下评审材料决定是否同意该评审：

评审标题：${review.title}
评审类型：${review.ReviewTypeConfig.name}
评审描述：${review.description || '无'}

评审材料：
${materialsInfo || '无材料'}

检查项：
${itemsInfo || '无检查项'}

请仔细分析以上内容，判断该评审是否应该通过。
请以JSON格式回复：
{
  "agreed": true或false,
  "reason": "投票理由"
}`

    const aiResult = await callAI(prompt, 'REVIEWER_VOTE', undefined, review.projectId)

    if (!aiResult.success || !aiResult.response) {
      return ApiResponder.serverError(aiResult.error || 'AI 分析失败')
    }

    let agreed = false
    let reason = ''

    try {
      const parsed = JSON.parse(aiResult.response)
      agreed = parsed.agreed ?? false
      reason = parsed.reason ?? ''
    } catch {
      agreed =
        aiResult.response.toLowerCase().includes('同意') ||
        aiResult.response.toLowerCase().includes('通过')
      reason = aiResult.response.substring(0, 200)
    }

    const voteResult = await submitAIVote(reviewId, agreed)

    if (!voteResult.success) {
      return ApiResponder.serverError(voteResult.error || '提交 AI 投票失败')
    }

    return ApiResponder.success({
      success: true,
      vote: {
        reviewId,
        agreed,
        reason,
        votedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('AI 投票失败:', error)
    return ApiResponder.serverError('AI 投票失败')
  }
}
