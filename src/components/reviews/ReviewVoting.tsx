"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Voter {
  user: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  agreed: boolean | null;
  votedAt: string | null;
}

interface VoteSummary {
  total: number;
  agreed: number;
  pending: number;
  allAgreed: boolean;
}

interface ReviewVotingProps {
  reviewId: string;
  currentUserId?: string;
  isReviewer?: boolean;
  onComplete?: () => void;
  className?: string;
}

export function ReviewVoting({
  reviewId,
  currentUserId,
  isReviewer = false,
  onComplete,
  className,
}: ReviewVotingProps) {
  const [voters, setVoters] = React.useState<Voter[]>([]);
  const [summary, setSummary] = React.useState<VoteSummary>({
    total: 0,
    agreed: 0,
    pending: 0,
    allAgreed: false,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentUserVote, setCurrentUserVote] = React.useState<boolean | null>(null);

  const fetchVotes = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/votes`);
      const data = await res.json();

      if (data.success) {
        setVoters(data.data.voters);
        setSummary(data.data.summary);

        const myVote = data.data.voters.find(
          (v: Voter) => v.user.id === currentUserId
        );
        setCurrentUserVote(myVote?.agreed ?? null);
      }
    } catch (error) {
      console.error("Failed to fetch votes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [reviewId, currentUserId]);

  React.useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  const handleVote = async (agreed: boolean) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreed }),
      });
      const data = await res.json();

      if (data.success) {
        await fetchVotes();
      }
    } catch (error) {
      console.error("Failed to submit vote:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm("确定要结束评审吗？此操作不可撤销。")) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/complete`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        onComplete?.();
      } else {
        alert(data.error || "结束评审失败");
      }
    } catch (error) {
      console.error("Failed to complete review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("p-4 border rounded-lg", className)}>
        <div className="text-center text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className={cn("p-4 border rounded-lg space-y-4", className)}>
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">投票状态</h3>
        {summary.allAgreed ? (
          <Badge className="bg-green-500">全员同意</Badge>
        ) : (
          <Badge variant="secondary">{summary.agreed}/{summary.total} 已同意</Badge>
        )}
      </div>

      {/* 进度条 */}
      <div className="space-y-2">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${(summary.agreed / summary.total) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{summary.agreed} 已同意</span>
          <span>{summary.pending} 待投票</span>
        </div>
      </div>

      {/* 投票人列表 */}
      <div className="space-y-2">
        {voters.map((voter) => (
          <div
            key={voter.user.id}
            className="flex items-center justify-between py-2 border-b last:border-0"
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={voter.user.avatar || undefined} />
                <AvatarFallback>{voter.user.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{voter.user.name}</span>
              {voter.user.id === currentUserId && (
                <Badge variant="outline" className="text-xs">我</Badge>
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
        <div className="pt-4 border-t">
          <div className="text-sm text-muted-foreground mb-2">您的投票：</div>
          <div className="flex gap-2">
            <Button
              variant={currentUserVote === true ? "default" : "outline"}
              onClick={() => handleVote(true)}
              disabled={isSubmitting}
              className="flex-1"
            >
              同意
            </Button>
          </div>
          {currentUserVote !== null && (
            <div className="text-xs text-muted-foreground mt-2">
              点击按钮可以更改投票
            </div>
          )}
        </div>
      )}

      {/* 结束评审按钮（全员同意后显示） */}
      {summary.allAgreed && onComplete && (
        <div className="pt-4 border-t">
          <Button
            onClick={handleComplete}
            disabled={isSubmitting}
            className="w-full"
          >
            结束评审
          </Button>
        </div>
      )}
    </div>
  );
}