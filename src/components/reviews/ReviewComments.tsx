"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommentForm } from "./CommentForm";
import { CommentThread } from "./CommentThread";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  avatar?: string | null;
}

interface Reply {
  id: string;
  content: string;
  author: User;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  content: string;
  status: "OPEN" | "RESOLVED";
  author: User;
  material?: { id: string; fileName: string } | null;
  item?: { id: string; title: string } | null;
  replies: Reply[];
  createdAt: string;
  updatedAt: string;
}

interface ReviewCommentsProps {
  reviewId: string;
  currentUserId?: string;
  className?: string;
}

type FilterType = "all" | "OPEN" | "RESOLVED";
type SortType = "newest" | "oldest";

export function ReviewComments({
  reviewId,
  currentUserId,
  className,
}: ReviewCommentsProps) {
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<FilterType>("all");
  const [sort, setSort] = React.useState<SortType>("newest");
  const [replyTargetId, setReplyTargetId] = React.useState<string | null>(null);

  const fetchComments = React.useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.set("status", filter);
      }

      const res = await fetch(
        `/api/v1/reviews/${reviewId}/comments?${params.toString()}`
      );
      const data = await res.json();

      if (data.success) {
        const sorted = [...data.data];
        if (sort === "oldest") {
          sorted.reverse();
        }
        setComments(sorted);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [reviewId, filter, sort]);

  React.useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleCreateComment = async (content: string) => {
    const res = await fetch(`/api/v1/reviews/${reviewId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (data.success) {
      setComments((prev) => [data.data, ...prev]);
    }
  };

  const handleReply = async (commentId: string, content: string) => {
    const res = await fetch(`/api/v1/reviews/${reviewId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, parentId: commentId }),
    });
    const data = await res.json();
    if (data.success) {
      await fetchComments();
    }
  };

  const handleResolve = async (commentId: string) => {
    const res = await fetch(
      `/api/v1/reviews/${reviewId}/comments/${commentId}/resolve`,
      { method: "POST" }
    );
    const data = await res.json();
    if (data.success) {
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, status: "RESOLVED" } : c))
      );
    }
  };

  const handleReopen = async (commentId: string) => {
    const res = await fetch(
      `/api/v1/reviews/${reviewId}/comments/${commentId}/reopen`,
      { method: "POST" }
    );
    const data = await res.json();
    if (data.success) {
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, status: "OPEN" } : c))
      );
    }
  };

  const handleEdit = async (commentId: string, content: string) => {
    const res = await fetch(
      `/api/v1/reviews/${reviewId}/comments/${commentId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }
    );
    const data = await res.json();
    if (data.success) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, content: data.data.content } : c
        )
      );
    }
  };

  const handleDelete = async (commentId: string) => {
    const res = await fetch(
      `/api/v1/reviews/${reviewId}/comments/${commentId}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (data.success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  const openCount = comments.filter((c) => c.status === "OPEN").length;
  const resolvedCount = comments.filter((c) => c.status === "RESOLVED").length;

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="text-center text-muted-foreground py-8">
          加载中...
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 标题和统计 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">评论 ({comments.length})</h3>
          <div className="flex gap-2">
            <Badge variant="secondary">{openCount} 待解决</Badge>
            <Badge variant="outline">{resolvedCount} 已解决</Badge>
          </div>
        </div>
      </div>

      {/* 过滤和排序 */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          全部
        </Button>
        <Button
          size="sm"
          variant={filter === "OPEN" ? "default" : "outline"}
          onClick={() => setFilter("OPEN")}
        >
          待解决
        </Button>
        <Button
          size="sm"
          variant={filter === "RESOLVED" ? "default" : "outline"}
          onClick={() => setFilter("RESOLVED")}
        >
          已解决
        </Button>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setSort(sort === "newest" ? "oldest" : "newest")}
        >
          {sort === "newest" ? "最新优先" : "最早优先"}
        </Button>
      </div>

      {/* 发表评论表单 */}
      <CommentForm onSubmit={handleCreateComment} />

      {/* 评论列表 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            暂无评论
          </div>
        ) : (
          comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onReply={handleReply}
              onResolve={handleResolve}
              onReopen={handleReopen}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isReplying={replyTargetId !== null}
              replyTargetId={replyTargetId || undefined}
              onStartReply={setReplyTargetId}
              onCancelReply={() => setReplyTargetId(null)}
            />
          ))
        )}
      </div>
    </div>
  );
}