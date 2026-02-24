"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Risk, RiskCategory, RiskStatus } from "@/types/risk";
import {
  RISK_CATEGORY_LABELS,
  RISK_STATUS_LABELS,
  calculateRiskLevel,
  RISK_LEVEL_COLORS,
  RISK_LEVEL_LABELS,
} from "@/types/risk";

interface RiskFormProps {
  projectId: string;
  risk?: Risk;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RiskForm({ projectId, risk, open, onOpenChange, onSuccess }: RiskFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: risk?.title || "",
    description: risk?.description || "",
    category: risk?.category || "OTHER" as RiskCategory,
    probability: risk?.probability || 1,
    impact: risk?.impact || 1,
    status: risk?.status || "OPEN" as RiskStatus,
    owner: risk?.owner || "",
    dueDate: risk?.dueDate ? new Date(risk.dueDate).toISOString().split("T")[0] : "",
  });

  // 当概率或影响变化时，更新风险等级显示
  const currentRiskLevel = calculateRiskLevel(formData.probability, formData.impact);

  // 重置表单当对话框打开/关闭或编辑对象变化时
  useEffect(() => {
    if (open) {
      setFormData({
        title: risk?.title || "",
        description: risk?.description || "",
        category: risk?.category || "OTHER",
        probability: risk?.probability || 1,
        impact: risk?.impact || 1,
        status: risk?.status || "OPEN",
        owner: risk?.owner || "",
        dueDate: risk?.dueDate ? new Date(risk.dueDate).toISOString().split("T")[0] : "",
      });
    }
  }, [open, risk]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("请输入风险标题");
      return;
    }

    if (formData.probability < 1 || formData.probability > 5) {
      alert("概率必须在 1-5 之间");
      return;
    }

    if (formData.impact < 1 || formData.impact > 5) {
      alert("影响必须在 1-5 之间");
      return;
    }

    setLoading(true);

    try {
      const url = risk
        ? `/api/v1/risks/${risk.id}`
        : "/api/v1/risks";

      const response = await fetch(url, {
        method: risk ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          projectId: risk ? undefined : projectId,
          dueDate: formData.dueDate || undefined,
          owner: formData.owner || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onOpenChange(false);
        onSuccess?.();
      } else {
        alert(data.error || "操作失败");
      }
    } catch (error) {
      console.error("提交失败:", error);
      alert("操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{risk ? "编辑风险" : "创建风险"}</DialogTitle>
          <DialogDescription>
            {risk ? "修改风险信息" : "为项目识别并记录新风险"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 标题 */}
          <div>
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="输入风险标题"
              required
            />
          </div>

          {/* 描述 */}
          <div>
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="详细描述风险情况"
              rows={3}
            />
          </div>

          {/* 类别和状态 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">类别</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as RiskCategory })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RISK_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as RiskStatus })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RISK_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 概率和影响 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="probability">概率 (1-5) *</Label>
              <Select
                value={formData.probability.toString()}
                onValueChange={(value) => setFormData({ ...formData, probability: parseInt(value) })}
              >
                <SelectTrigger id="probability">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <SelectItem key={value} value={value.toString()}>
                      {value} - {value === 1 ? "极低" : value === 2 ? "低" : value === 3 ? "中" : value === 4 ? "高" : "极高"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="impact">影响 (1-5) *</Label>
              <Select
                value={formData.impact.toString()}
                onValueChange={(value) => setFormData({ ...formData, impact: parseInt(value) })}
              >
                <SelectTrigger id="impact">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <SelectItem key={value} value={value.toString()}>
                      {value} - {value === 1 ? "轻微" : value === 2 ? "较小" : value === 3 ? "中等" : value === 4 ? "严重" : "灾难性"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 风险等级显示 */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">计算的风险等级：</span>
            <Badge className={cn(RISK_LEVEL_COLORS[currentRiskLevel])}>
              {RISK_LEVEL_LABELS[currentRiskLevel]} (分数: {formData.probability * formData.impact})
            </Badge>
          </div>

          {/* 负责人和截止日期 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="owner">负责人</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                placeholder="负责人姓名"
              />
            </div>

            <div>
              <Label htmlFor="dueDate">截止日期</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {risk ? "更新" : "创建"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
