"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ReviewStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

interface ReviewStatusBannerProps {
  status: ReviewStatus;
  scheduledAt?: string | null;
  className?: string;
}

const statusConfig: Record<ReviewStatus, { label: string; color: string }> = {
  PENDING: { label: "待评审", color: "bg-yellow-500" },
  IN_PROGRESS: { label: "评审中", color: "bg-blue-500" },
  COMPLETED: { label: "已完成", color: "bg-green-500" },
  CANCELLED: { label: "已取消", color: "bg-gray-500" },
};

export function ReviewStatusBanner({
  status,
  scheduledAt,
  className,
}: ReviewStatusBannerProps) {
  const config = statusConfig[status];

  const formatScheduledDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Badge className={config.color}>{config.label}</Badge>
        {scheduledAt && status === "PENDING" && (
          <span className="text-sm text-muted-foreground">
            计划时间: {formatScheduledDate(scheduledAt)}
          </span>
        )}
      </div>
      {status === "PENDING" && scheduledAt && (
        <div className="text-xs text-muted-foreground">
          待启动评审
        </div>
      )}
      {status === "IN_PROGRESS" && (
        <div className="text-xs text-muted-foreground">
          评审进行中，请完成评审后投票
        </div>
      )}
      {status === "COMPLETED" && (
        <div className="text-xs text-green-600">
          评审已成功完成
        </div>
      )}
    </div>
  );
}