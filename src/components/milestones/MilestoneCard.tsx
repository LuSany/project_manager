"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Milestone } from "@/types/milestone";
import { MILESTONE_STATUS_LABELS, MILESTONE_STATUS_COLORS } from "@/types/milestone";

interface MilestoneCardProps {
  milestone: Milestone;
  onEdit?: (milestone: Milestone) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
}

export function MilestoneCard({ milestone, onEdit, onDelete, onView }: MilestoneCardProps) {
  const progressPercentage = milestone.progress || 0;
  const isOverdue = milestone.dueDate && new Date(milestone.dueDate) < new Date() && milestone.status !== "COMPLETED";

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1 cursor-pointer hover:text-primary" onClick={() => onView?.(milestone.id)}>
            {milestone.title}
          </h3>
          {milestone.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{milestone.description}</p>
          )}
        </div>
        <Badge className={cn("ml-2", MILESTONE_STATUS_COLORS[milestone.status])}>
          {MILESTONE_STATUS_LABELS[milestone.status]}
        </Badge>
      </div>

      {/* 进度条 */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>进度</span>
          <span>{progressPercentage}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* 任务统计 */}
      {milestone.totalTasks !== undefined && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>{milestone.completedTasks || 0}/{milestone.totalTasks} 任务</span>
          </div>
        </div>
      )}

      {/* 截止日期 */}
      {milestone.dueDate && (
        <div className={cn(
          "flex items-center gap-2 text-xs mb-3",
          isOverdue ? "text-destructive" : "text-muted-foreground"
        )}>
          <Calendar className="h-3 w-3" />
          <span>{new Date(milestone.dueDate).toLocaleDateString("zh-CN")}</span>
          {isOverdue && <span className="text-destructive font-medium">(已逾期)</span>}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center gap-2 justify-end">
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={() => onEdit(milestone)}>
            编辑
          </Button>
        )}
        {onDelete && milestone.status !== "COMPLETED" && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(milestone.id)}
          >
            删除
          </Button>
        )}
      </div>
    </Card>
  );
}
