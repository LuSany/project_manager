"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

interface Requirement {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  projectId: string;
  createdAt: string;
  project?: {
    name: string;
    id: string;
  };
}

export default function GlobalRequirementsPage() {
  const router = useRouter();
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
        ...(filterStatus && { status: filterStatus }),
        ...(filterPriority && { priority: filterPriority }),
      });

      const response = await fetch(`/api/v1/requirements?${searchParams.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRequirements(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
      }
    } catch (err) {
      console.error("获取需求列表失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, [page, filterStatus, filterPriority]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline">待审批</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-500">已批准</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">已拒绝</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-500">进行中</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-600">已完成</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return <Badge variant="outline">低</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-blue-500">中</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-500">高</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">需求管理</h1>
          <p className="text-muted-foreground">
            查看所有项目的需求
          </p>
        </div>

        <Button onClick={() => router.push("/requirements/new")}>
          <Plus className="h-4 w-4 mr-2" />
          新建需求
        </Button>
      </div>

      {/* 筛选器 */}
      <div className="flex items-center gap-4 mb-6">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="PENDING">待审批</SelectItem>
            <SelectItem value="APPROVED">已批准</SelectItem>
            <SelectItem value="REJECTED">已拒绝</SelectItem>
            <SelectItem value="IN_PROGRESS">进行中</SelectItem>
            <SelectItem value="COMPLETED">已完成</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="优先级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部优先级</SelectItem>
            <SelectItem value="LOW">低</SelectItem>
            <SelectItem value="MEDIUM">中</SelectItem>
            <SelectItem value="HIGH">高</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 需求列表 */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">加载中...</div>
      ) : requirements.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">暂无需求</div>
      ) : (
        <div className="border rounded-lg">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left font-medium">需求标题</th>
                <th className="p-3 text-left font-medium">状态</th>
                <th className="p-3 text-left font-medium">优先级</th>
                <th className="p-3 text-left font-medium">创建时间</th>
                <th className="p-3 text-left font-medium">项目</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((req) => (
                <tr key={req.id} className="border-t hover:bg-muted/50">
                  <td className="p-3">
                    <div>
                      <div className="font-medium">{req.title}</div>
                      {req.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {req.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">{getStatusBadge(req.status)}</td>
                  <td className="p-3">{getPriorityBadge(req.priority)}</td>
                  <td className="p-3 text-sm">
                    {new Date(req.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="p-3 text-sm">
                    <a
                      href={`/projects/${req.project?.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {req.project?.name || "-"}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {page} 页 / 共 {totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
