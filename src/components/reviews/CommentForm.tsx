"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  submitText?: string;
  onCancel?: () => void;
  isReply?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CommentForm({
  onSubmit,
  placeholder = "写下你的评论...",
  submitText = "发表评论",
  onCancel,
  isReply = false,
  disabled = false,
  className,
}: CommentFormProps) {
  const [content, setContent] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-3", className)}>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || isSubmitting}
        rows={isReply ? 2 : 3}
        className="resize-none"
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            取消
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting ? "提交中..." : submitText}
        </Button>
      </div>
    </form>
  );
}