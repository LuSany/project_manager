"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Requirement {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
}

export default function RequirementsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>("");

  useEffect(() => {
    params.then(p => setProjectId(p.id));
  }, [params]);

  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");

  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        pageSize: "10",
        projectId,
        ...(filterStatus && { status: filterStatus }),
        ...(filterPriority && { priority: filterPriority }),
      });

      const response = await fetch('/api/v1/requirements?' + searchParams, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setRequirements(data.data.items);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error("获取需求列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个需求吗？")) {
      return;
    }

    try {
      const response = await fetch('/api/v1/requirements/' + id, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setRequirements((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (error) {
      console.error("删除需求失败:", error);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, [page, filterStatus, filterPriority]);

  const statusLabels: Record<string, string> = {
    PENDING: "待审批",
    APPROVED: "已批准",
    REJECTED: "已拒绝",
    IN_PROGRESS: "进行中",
    COMPLETED: "已完成",
  };

  const priorityLabels: Record<string, string> = {
    LOW: "低",
    MEDIUM: "中",
    HIGH: "高",
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-gray-100 text-gray-800",
  };

  const priorityColors: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-800",
    MEDIUM: "bg-blue-100 text-blue-800",
    HIGH: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">需求列表</h1>
            <Button
              onClick={() => router.push(`/projects/${projectId}/requirements/new`)}
            >
              新建需求
            </Button>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="border border-border rounded-md px-3 py-2 bg-background"
            >
              <option value="">全部状态</option>
              <option value="PENDING">待审批</option>
              <option value="APPROVED">已批准</option>
              <option value="REJECTED">已拒绝</option>
              <option value="IN_PROGRESS">进行中</option>
              <option value="COMPLETED">已完成</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => {
                setFilterPriority(e.target.value);
                setPage(1);
              }}
              className="border border-border rounded-md px-3 py-2 bg-background"
            >
              <option value="">全部优先级</option>
              <option value="LOW">低</option>
              <option value="MEDIUM">中</option>
              <option value="HIGH">高</option>
            </select>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : requirements.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-lg font-medium mb-2 text-muted-foreground">暂无需求</p>
                <p className="text-sm text-muted-foreground">开始创建您的第一个需求</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {requirements.map((requirement) => (
                <Card key={requirement.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold">{requirement.title}</h3>
                          <Badge className={statusColors[requirement.status]}>
                            {statusLabels[requirement.status]}
                          </Badge>
                          <Badge className={priorityColors[requirement.priority]}>
                            {priorityLabels[requirement.priority]}
                          </Badge>
                        </div>
                        {requirement.description && (
                          <p className="text-muted-foreground text-sm">{requirement.description}</p>
                        )}
                        <div className="text-sm text-muted-foreground mt-2">
                          创建于 {new Date(requirement.createdAt).toLocaleDateString("zh-CN")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="link"
                        onClick={() => router.push(`/projects/${projectId}/requirements/${requirement.id}`)}
                      >
                        查看详情
                      </Button>
                      <Button
                        variant="link"
                        className="text-destructive"
                        onClick={() => handleDelete(requirement.id)}
                      >
                        删除
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>
              <span className="text-muted-foreground">
                第 {page} / {totalPages} 页
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                下一页
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
