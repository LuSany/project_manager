"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommentForm } from "./CommentForm";
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

interface CommentThreadProps {
  comment: Comment;
  currentUserId?: string;
  onReply: (commentId: string, content: string) => Promise<void>;
  onResolve?: (commentId: string) => Promise<void>;
  onReopen?: (commentId: string) => Promise<void>;
  onEdit?: (commentId: string, content: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  isReplying?: boolean;
  replyTargetId?: string;
  onStartReply?: (commentId: string) => void;
  onCancelReply?: () => void;
}

export function CommentThread({
  comment,
  currentUserId,
  onReply,
  onResolve,
  onReopen,
  onEdit,
  onDelete,
  isReplying,
  replyTargetId,
  onStartReply,
  onCancelReply,
}: CommentThreadProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState(comment.content);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isAuthor = comment.author.id === currentUserId;
  const canResolve = isAuthor;

  const handleEdit = async () => {
    if (!editContent.trim() || !onEdit) return;
    setIsSubmitting(true);
    try {
      await onEdit(comment.id, editContent.trim());
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !confirm("确定要删除这条评论吗？")) return;
    await onDelete(comment.id);
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      {/* 头部 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.author.avatar || undefined} />
            <AvatarFallback>{comment.author.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{comment.author.name}</div>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
                locale: zhCN,
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {comment.material && (
            <Badge variant="outline" className="text-xs">
              材料: {comment.material.fileName}
            </Badge>
          )}
          {comment.item && (
            <Badge variant="outline" className="text-xs">
              评审项: {comment.item.title}
            </Badge>
          )}
          <Badge
            variant={comment.status === "RESOLVED" ? "default" : "secondary"}
            className="text-xs"
          >
            {comment.status === "RESOLVED" ? "已解决" : "待解决"}
          </Badge>
        </div>
      </div>

      {/* 内容 */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full min-h-[60px] rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none"
            disabled={isSubmitting}
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsEditing(false);
                setEditContent(comment.content);
              }}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleEdit}
              disabled={!editContent.trim() || isSubmitting}
            >
              保存
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        {onStartReply && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onStartReply(comment.id)}
          >
            回复
          </Button>
        )}
        {isAuthor && onEdit && !isEditing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
          >
            编辑
          </Button>
        )}
        {isAuthor && onDelete && (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={handleDelete}
          >
            删除
          </Button>
        )}
        {canResolve && comment.status === "OPEN" && onResolve && (
          <Button size="sm" variant="outline" onClick={() => onResolve(comment.id)}>
            标记已解决
          </Button>
        )}
        {canResolve && comment.status === "RESOLVED" && onReopen && (
          <Button size="sm" variant="outline" onClick={() => onReopen(comment.id)}>
            重新打开
          </Button>
        )}
      </div>

      {/* 回复列表 */}
      {comment.replies.length > 0 && (
        <div className="ml-8 space-y-3 border-l-2 pl-4">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={reply.author.avatar || undefined} />
                  <AvatarFallback className="text-xs">
                    {reply.author.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{reply.author.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(reply.createdAt), {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                {reply.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 回复表单 */}
      {isReplying && replyTargetId === comment.id && (
        <div className="ml-8">
          <CommentForm
            onSubmit={async (content) => {
              await onReply(comment.id, content);
              onCancelReply?.();
            }}
            placeholder="写下你的回复..."
            submitText="回复"
            onCancel={onCancelReply}
            isReply
          />
        </div>
      )}
    </div>
  );
}