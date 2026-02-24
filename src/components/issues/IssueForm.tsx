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
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Issue } from "@/types/issue";
import {
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_COLORS,
  ISSUE_PRIORITY_LABELS,
  ISSUE_PRIORITY_COLORS,
} from "@/types/issue";

interface IssueFormProps {
  projectId: string;
  issue?: Issue;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function IssueForm({ projectId, issue, open, onOpenChange, onSuccess }: IssueFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: issue?.title || "",
    description: issue?.description || "",
    status: issue?.status || "OPEN" as Issue["status"],
    priority: issue?.priority || "MEDIUM" as Issue["priority"],
    requirementId: issue?.requirementId || "",
  });

  // 重置表单当对话框打开/关闭或编辑对象变化时
  useEffect(() => {
    if (open) {
      setFormData({
        title: issue?.title || "",
        description: issue?.description || "",
        status: issue?.status || "OPEN",
        priority: issue?.priority || "MEDIUM",
        requirementId: issue?.requirementId || "",
      });
    }
  }, [open, issue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("请输入问题标题");
      return;
    }

    setLoading(true);

    try {
      const url = issue
        ? `/api/v1/issues/${issue.id}`
        : "/api/v1/issues";

      const body: Record<string, any> = {
        title: formData.title,
        description: formData.description || undefined,
        status: formData.status,
        priority: formData.priority,
      };

      if (!issue) {
        body.projectId = projectId;
      }

      const response = await fetch(url, {
        method: issue ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
          <DialogTitle>{issue ? "编辑问题" : "创建问题"}</DialogTitle>
          <DialogDescription>
            {issue ? "修改问题信息" : "记录并追踪新项目中的问题"}
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
              placeholder="输入问题标题"
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
              placeholder="详细描述这个问题"
              rows={4}
            />
          </div>

          {/* 状态 */}
          <div>
            <Label>状态</Label>
            <Select
              value={formData.status}
              onValueChange={(value: Issue["status"]) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ISSUE_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <Badge className={cn("mr-2", ISSUE_STATUS_COLORS[value as Issue["status"]])} variant="outline" />
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 优先级 */}
          <div>
            <Label>优先级</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: Issue["priority"]) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ISSUE_PRIORITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <Badge className={cn("mr-2", ISSUE_PRIORITY_COLORS[value as Issue["priority"]])} variant="outline" />
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 关联需求 */}
          <div>
            <Label htmlFor="requirementId">关联需求</Label>
            <Input
              id="requirementId"
              value={formData.requirementId}
              onChange={(e) => setFormData({ ...formData, requirementId: e.target.value })}
              placeholder="输入需求 ID（可选）"
            />
            <p className="text-xs text-muted-foreground mt-1">
              将问题关联到特定需求，便于追踪
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {issue ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
