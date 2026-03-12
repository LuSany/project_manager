"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Risk } from "@/types/risk";
import {
  RISK_STATUS_LABELS,
  RISK_STATUS_COLORS,
  RISK_CATEGORY_LABELS,
  RISK_LEVEL_COLORS,
  RISK_LEVEL_LABELS,
} from "@/types/risk";

interface RiskCardProps {
  risk: Risk;
  onEdit?: (risk: Risk) => void;
  onDelete?: (id: string) => void;
}

export function RiskCard({ risk, onEdit, onDelete }: RiskCardProps) {
  const riskScore = risk.probability * risk.impact;
  const isOverdue = risk.dueDate && new Date(risk.dueDate) < new Date() && risk.status !== "RESOLVED" && risk.status !== "CLOSED";

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className={cn(
              "h-4 w-4",
              risk.riskLevel === "CRITICAL" ? "text-red-500" :
              risk.riskLevel === "HIGH" ? "text-orange-500" :
              risk.riskLevel === "MEDIUM" ? "text-yellow-500" :
              "text-green-500"
            )} />
            <h3 className="font-semibold text-lg">{risk.title}</h3>
          </div>
          {risk.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{risk.description}</p>
          )}
        </div>
      </div>

      {/* 类别和状态标签 */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Badge variant="outline" className="text-xs">
          {RISK_CATEGORY_LABELS[risk.category]}
        </Badge>
        <Badge className={cn("text-xs", RISK_STATUS_COLORS[risk.status])}>
          {RISK_STATUS_LABELS[risk.status]}
        </Badge>
        <Badge className={cn("text-xs", RISK_LEVEL_COLORS[risk.riskLevel])}>
          {RISK_LEVEL_LABELS[risk.riskLevel]} 风险
        </Badge>
      </div>

      {/* 风险矩阵信息 */}
      <div className="bg-muted/50 rounded p-3 mb-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">概率：</span>
            <span className="font-medium">{risk.probability}/5</span>
          </div>
          <div>
            <span className="text-muted-foreground">影响：</span>
            <span className="font-medium">{risk.impact}/5</span>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">风险评分：</span>
            <span className={cn(
              "font-bold",
              riskScore <= 4 ? "text-green-600" :
              riskScore <= 9 ? "text-yellow-600" :
              riskScore <= 16 ? "text-orange-600" :
              "text-red-600"
            )}>
              {riskScore}/25 ({RISK_LEVEL_LABELS[risk.riskLevel]})
            </span>
          </div>
        </div>
      </div>

      {/* 负责人 */}
      {risk.owner && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <User className="h-3 w-3" />
          <span>负责人: {risk.owner.name}</span>
        </div>
      )}

      {/* 截止日期 */}
      {risk.dueDate && (
        <div className={cn(
          "flex items-center gap-2 text-xs mb-3",
          isOverdue ? "text-destructive" : "text-muted-foreground"
        )}>
          <Calendar className="h-3 w-3" />
          <span>{new Date(risk.dueDate).toLocaleDateString("zh-CN")}</span>
          {isOverdue && <span className="text-destructive font-medium">(已逾期)</span>}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center gap-2 justify-end">
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={() => onEdit(risk)}>
            编辑
          </Button>
        )}
        {onDelete && risk.status !== "CLOSED" && risk.status !== "RESOLVED" && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(risk.id)}
          >
            删除
          </Button>
        )}
      </div>
    </Card>
  );
}
