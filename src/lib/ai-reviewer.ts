import { prisma } from '@/lib/prisma'
import { generateSummary, ReviewSummary } from '@/lib/services/ai-review'

export const SYSTEM_AI_REVIEWER_ID = 'system-ai-reviewer'

export async function addAIReviewer(reviewId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
    })

    if (!review) {
      return { success: false, error: '评审不存在' }
    }

    const existingParticipant = await prisma.review_participants.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId: SYSTEM_AI_REVIEWER_ID,
        },
      },
    })

    if (existingParticipant) {
      return { success: true }
    }

    await prisma.review_participants.create({
      data: {
        reviewId,
        userId: SYSTEM_AI_REVIEWER_ID,
        role: 'AI_REVIEWER',
        joinedAt: new Date(),
      },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '添加 AI 评审员失败',
    }
  }
}

export async function submitAIVote(
  reviewId: string,
  agreed: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
    })

    if (!review) {
      return { success: false, error: '评审不存在' }
    }

    if (review.status !== 'IN_PROGRESS') {
      return { success: false, error: '评审未在进行中' }
    }

    const existingVote = await prisma.review_votes.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId: SYSTEM_AI_REVIEWER_ID,
        },
      },
    })

    if (existingVote) {
      await prisma.review_votes.update({
        where: {
          reviewId_userId: {
            reviewId,
            userId: SYSTEM_AI_REVIEWER_ID,
          },
        },
        data: {
          agreed,
          votedAt: new Date(),
        },
      })
    } else {
      await prisma.review_votes.create({
        data: {
          reviewId,
          userId: SYSTEM_AI_REVIEWER_ID,
          agreed,
          votedAt: new Date(),
        },
      })
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '提交 AI 投票失败',
    }
  }
}

export async function generateResolutionDraft(
  reviewId: string,
  userId?: string
): Promise<{
  success: boolean
  draft?: {
    markdown: string
    generatedAt: string
  }
  error?: string
}> {
  try {
    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
      include: {
        ReviewTypeConfig: true,
      },
    })

    if (!review) {
      return { success: false, error: '评审不存在' }
    }

    const summaryResult = await generateSummary(reviewId, userId)

    if (!summaryResult.success || !summaryResult.result) {
      return { success: false, error: summaryResult.error || '生成摘要失败' }
    }

    const summary: ReviewSummary = summaryResult.result

    const markdown = `# ${review.title} - 决议草案

## 结论

${summary.conclusion}

## 关键发现

${summary.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

## 详细分析

${summary.detailed}

---

*本草案由 AI 自动生成，仅供参考。*
`

    await prisma.review_ai_analysis.create({
      data: {
        id: crypto.randomUUID(),
        reviewId,
        analysisType: 'RESOLUTION_DRAFT',
        result: JSON.stringify({ markdown, summary }),
        duration: 0,
      },
    })

    return {
      success: true,
      draft: {
        markdown,
        generatedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '生成决议草案失败',
    }
  }
}

export const aiReviewerService = {
  addAIReviewer,
  submitAIVote,
  generateResolutionDraft,
}
