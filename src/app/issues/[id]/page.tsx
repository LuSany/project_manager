"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { IssueForm } from "@/components/issues/IssueForm";
import { IssueCard } from "@/components/issues/IssueCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Edit, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import type { Issue } from "@/types/issue";
import { ISSUE_STATUS_LABELS, ISSUE_STATUS_COLORS } from "@/types/issue";

interface IssueDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchIssue = async () => {
    try {
      const response = await fetch(`/api/v1/issues/${id}`);
      const result = await response.json();

      if (result.success) {
        setIssue(result.data);
      } else {
        console.error("获取问题详情失败:", result.error);
      }
    } catch (error) {
      console.error("获取问题详情失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [id]);

  const handleResolve = async () => {
    if (!issue) return;

    setActionLoading(true);
    try {
      const action = issue.status === "RESOLVED" || issue.status === "CLOSED" ? "reopen" : "resolve";
      const response = await fetch(`/api/v1/issues/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (result.success) {
        fetchIssue();
      } else {
        alert(result.error || "操作失败");
      }
    } catch (error) {
      console.error("操作失败:", error);
      alert("操作失败，请重试");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这个问题吗？")) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/v1/issues/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/projects/${issue?.projectId}/issues`);
      } else {
        alert(result.error || "删除失败");
      }
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败，请重试");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFormSuccess = () => {
    fetchIssue();
    setFormOpen(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">问题不存在</h1>
          <Button onClick={() => router.back()}>返回</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* 返回按钮 */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 问题详情 */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">{issue.title}</h1>
                {issue.description && (
                  <p className="text-muted-foreground">{issue.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Badge className={ISSUE_STATUS_COLORS[issue.status]}>
                {ISSUE_STATUS_LABELS[issue.status]}
              </Badge>
              {issue.resolvedAt && (
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  已解决
                </Badge>
              )}
            </div>

            {/* 元数据 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">项目：</span>
                <span className="font-medium">{issue.project?.name || "未知"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">创建时间：</span>
                <span className="font-medium">
                  {new Date(issue.createdAt).toLocaleDateString("zh-CN")}
                </span>
              </div>
              {issue.resolvedAt && (
                <div>
                  <span className="text-muted-foreground">解决时间：</span>
                  <span className="font-medium">
                    {new Date(issue.resolvedAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              )}
              {issue.requirementId && (
                <div>
                  <span className="text-muted-foreground">关联需求：</span>
                  <span className="font-medium">{issue.requirementId}</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 侧边栏操作 */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">操作</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setFormOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                编辑问题
              </Button>
              <Button
                variant={issue.status === "RESOLVED" ? "outline" : "default"}
                className="w-full justify-start"
                onClick={handleResolve}
                disabled={actionLoading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {issue.status === "RESOLVED" ? "重新打开" : "解决问题"}
              </Button>
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={handleDelete}
                disabled={actionLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除问题
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* 编辑表单 */}
      {issue.projectId && (
        <IssueForm
          projectId={issue.projectId}
          issue={issue}
          open={formOpen}
          onOpenChange={setFormOpen}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
