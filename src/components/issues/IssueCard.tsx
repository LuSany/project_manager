"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Issue } from "@/types/issue";
import {
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_COLORS,
  ISSUE_PRIORITY_LABELS,
  ISSUE_PRIORITY_COLORS,
} from "@/types/issue";

interface IssueCardProps {
  issue: Issue;
  onEdit?: (issue: Issue) => void;
  onDelete?: (id: string) => void;
  onResolve?: (issue: Issue) => void;
}

export function IssueCard({ issue, onEdit, onDelete, onResolve }: IssueCardProps) {
  const isOverdue = issue.status !== "RESOLVED" && issue.status !== "CLOSED";

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">{issue.title}</h3>
          </div>
          {issue.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{issue.description}</p>
          )}
        </div>
      </div>

      {/* 状态和优先级标签 */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Badge className={cn("text-xs", ISSUE_STATUS_COLORS[issue.status])}>
          {ISSUE_STATUS_LABELS[issue.status]}
        </Badge>
        <Badge className={cn("text-xs", ISSUE_PRIORITY_COLORS[issue.priority])}>
          {ISSUE_PRIORITY_LABELS[issue.priority]}
        </Badge>
        {issue.requirementId && (
          <Badge variant="outline" className="text-xs">
            <LinkIcon className="h-3 w-3 mr-1" />
            已关联需求
          </Badge>
        )}
      </div>

      {/* 解决时间 */}
      {issue.resolvedAt && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Calendar className="h-3 w-3" />
          <span>解决时间：{new Date(issue.resolvedAt).toLocaleDateString("zh-CN")}</span>
        </div>
      )}

      {/* 创建时间 */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <Calendar className="h-3 w-3" />
        <span>创建时间：{new Date(issue.createdAt).toLocaleDateString("zh-CN")}</span>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(issue)}
            className="text-xs"
          >
            编辑
          </Button>
        )}
        {onResolve && issue.status !== "RESOLVED" && issue.status !== "CLOSED" && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onResolve(issue)}
            className="text-xs"
          >
            解决
          </Button>
        )}
        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(issue.id)}
            className="text-xs"
          >
            删除
          </Button>
        )}
      </div>
    </Card>
  );
}
