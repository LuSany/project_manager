'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { Bot, Loader2, Sparkles } from 'lucide-react'

interface Voter {
  user: {
    id: string
    name: string
    avatar?: string | null
  }
  agreed: boolean | null
  votedAt: string | null
}

interface VoteSummary {
  total: number
  agreed: number
  pending: number
  allAgreed: boolean
}

interface ReviewVotingProps {
  reviewId: string
  currentUserId?: string
  isReviewer?: boolean
  isModerator?: boolean
  onComplete?: () => void
  className?: string
}

const SYSTEM_AI_REVIEWER_ID = 'system-ai-reviewer'

export function ReviewVoting({
  reviewId,
  currentUserId,
  isReviewer = false,
  isModerator = false,
  onComplete,
  className,
}: ReviewVotingProps) {
  const [voters, setVoters] = React.useState<Voter[]>([])
  const [summary, setSummary] = React.useState<VoteSummary>({
    total: 0,
    agreed: 0,
    pending: 0,
    allAgreed: false,
  })
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [currentUserVote, setCurrentUserVote] = React.useState<boolean | null>(null)
  const [isRequestingAIVote, setIsRequestingAIVote] = React.useState(false)

  const fetchVotes = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/votes`)
      const data = await res.json()

      if (data.success) {
        setVoters(data.data.voters)
        setSummary(data.data.summary)

        const myVote = data.data.voters.find((v: Voter) => v.user.id === currentUserId)
        setCurrentUserVote(myVote?.agreed ?? null)
      }
    } catch (error) {
      console.error('Failed to fetch votes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [reviewId, currentUserId])

  React.useEffect(() => {
    fetchVotes()
  }, [fetchVotes])

  const handleVote = async (agreed: boolean) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreed }),
      })
      const data = await res.json()

      if (data.success) {
        await fetchVotes()
      }
    } catch (error) {
      console.error('Failed to submit vote:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleComplete = async () => {
    if (!confirm('确定要结束评审吗？此操作不可撤销。')) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/complete`, {
        method: 'POST',
      })
      const data = await res.json()

      if (data.success) {
        onComplete?.()
      } else {
        alert(data.error || '结束评审失败')
      }
    } catch (error) {
      console.error('Failed to complete review:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestAIVote = async () => {
    setIsRequestingAIVote(true)
    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/ai-vote`, {
        method: 'POST',
      })
      const data = await res.json()

      if (data.success) {
        await fetchVotes()
      } else {
        alert(data.error || 'AI 投票请求失败')
      }
    } catch (error) {
      console.error('Failed to request AI vote:', error)
      alert('AI 投票请求失败')
    } finally {
      setIsRequestingAIVote(false)
    }
  }

  const aiVoter = voters.find((v) => v.user.id === SYSTEM_AI_REVIEWER_ID)
  const humanVoters = voters.filter((v) => v.user.id !== SYSTEM_AI_REVIEWER_ID)

  if (isLoading) {
    return (
      <div className={cn('rounded-lg border p-4', className)}>
        <div className="text-muted-foreground text-center">加载中...</div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4 rounded-lg border p-4', className)}>
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">投票状态</h3>
        {summary.allAgreed ? (
          <Badge className="bg-green-500">全员同意</Badge>
        ) : (
          <Badge variant="secondary">
            {summary.agreed}/{summary.total} 已同意
          </Badge>
        )}
      </div>

      {/* 进度条 */}
      <div className="space-y-2">
        <Progress
          value={summary.total > 0 ? (summary.agreed / summary.total) * 100 : 0}
          max={100}
          variant="success"
        />
        <div className="text-muted-foreground flex justify-between text-xs">
          <span>{summary.agreed} 已同意</span>
          <span>{summary.pending} 待投票</span>
        </div>
      </div>

      {/* AI 评审员投票 */}
      {aiVoter && (
        <div className="bg-muted/50 space-y-2 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <span className="flex items-center gap-1 font-medium">
                  AI 评审员
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3" />
                  </Badge>
                </span>
              </div>
            </div>
            <div>
              {aiVoter.agreed === null ? (
                <Badge variant="secondary">待投票</Badge>
              ) : aiVoter.agreed ? (
                <Badge className="bg-green-500">同意</Badge>
              ) : (
                <Badge variant="destructive">不同意</Badge>
              )}
            </div>
          </div>
          {aiVoter.agreed !== null && aiVoter.votedAt && (
            <p className="text-muted-foreground text-xs">
              AI 分析结果建议：{aiVoter.agreed ? '通过' : '不通过'}
            </p>
          )}
        </div>
      )}

      {/* 请求 AI 投票按钮（主持人可见） */}
      {!aiVoter && isModerator && (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleRequestAIVote}
          disabled={isRequestingAIVote}
        >
          {isRequestingAIVote ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              请求 AI 投票中...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              请求 AI 投票
            </>
          )}
        </Button>
      )}

      {/* 人工评审员列表 */}
      <div className="space-y-2">
        {humanVoters.map((voter) => (
          <div
            key={voter.user.id}
            className="flex items-center justify-between border-b py-2 last:border-0"
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={voter.user.avatar || undefined} />
                <AvatarFallback>{voter.user.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{voter.user.name}</span>
              {voter.user.id === currentUserId && (
                <Badge variant="outline" className="text-xs">
                  我
                </Badge>
              )}
            </div>
            <div>
              {voter.agreed === null ? (
                <Badge variant="secondary">待投票</Badge>
              ) : voter.agreed ? (
                <Badge className="bg-green-500">同意</Badge>
              ) : (
                <Badge variant="destructive">不同意</Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 投票按钮（仅评审人可见） */}
      {isReviewer && (
        <div className="border-t pt-4">
          <div className="text-muted-foreground mb-2 text-sm">您的投票：</div>
          <div className="flex gap-2">
            <Button
              variant={currentUserVote === true ? 'default' : 'outline'}
              onClick={() => handleVote(true)}
              disabled={isSubmitting}
              className="flex-1"
            >
              同意
            </Button>
          </div>
          {currentUserVote !== null && (
            <div className="text-muted-foreground mt-2 text-xs">点击按钮可以更改投票</div>
          )}
        </div>
      )}

      {/* 结束评审按钮（全员同意后显示） */}
      {summary.allAgreed && onComplete && (
        <div className="border-t pt-4">
          <Button onClick={handleComplete} disabled={isSubmitting} className="w-full">
            结束评审
          </Button>
        </div>
      )}
    </div>
  )
}
