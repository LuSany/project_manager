"use client";

import { useState, useEffect } from "react";
import { IssueCard } from "./IssueCard";
import { IssueForm } from "./IssueForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter } from "lucide-react";
import type { Issue, IssueStatus, IssuePriority } from "@/types/issue";
import { ISSUE_STATUS_LABELS, ISSUE_PRIORITY_LABELS } from "@/types/issue";

interface IssueListProps {
  projectId?: string;
  requirementId?: string;
}

interface IssueListData {
  items: Issue[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function IssueList({ projectId, requirementId }: IssueListProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<IssueListData>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", data.page.toString());
      params.set("pageSize", data.pageSize.toString());

      if (projectId) {
        params.set("projectId", projectId);
      }

      if (requirementId) {
        params.set("requirementId", requirementId);
      }

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      if (priorityFilter !== "all") {
        params.set("priority", priorityFilter);
      }

      const response = await fetch(`/api/v1/issues?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("获取问题列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [projectId, requirementId, statusFilter, priorityFilter, data.page]);

  const handleEdit = (issue: Issue) => {
    setEditingIssue(issue);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个问题吗？")) return;

    try {
      const response = await fetch(`/api/v1/issues/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        fetchIssues();
      } else {
        alert(result.error || "删除失败");
      }
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败，请重试");
    }
  };

  const handleResolve = async (issue: Issue) => {
    if (!confirm("标记此问题为已解决？")) return;

    try {
      const response = await fetch(`/api/v1/issues/${issue.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve" }),
      });

      const result = await response.json();

      if (result.success) {
        fetchIssues();
      } else {
        alert(result.error || "操作失败");
      }
    } catch (error) {
      console.error("解决问题失败:", error);
      alert("操作失败，请重试");
    }
  };

  const handleFormSuccess = () => {
    fetchIssues();
    setFormOpen(false);
    setEditingIssue(undefined);
  };

  return (
    <div className="space-y-4">
      {/* 操作栏 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索问题..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              {Object.entries(ISSUE_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="优先级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部优先级</SelectItem>
              {Object.entries(ISSUE_PRIORITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => { setEditingIssue(undefined); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          新建问题
        </Button>
      </div>

      {/* 问题列表 */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          加载中...
        </div>
      ) : data.items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          暂无问题
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onResolve={handleResolve}
            />
          ))}
        </div>
      )}

      {/* 分页 */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={data.page === 1}
            onClick={() => setData({ ...data, page: data.page - 1 })}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {data.page} 页 / 共 {data.totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={data.page === data.totalPages}
            onClick={() => setData({ ...data, page: data.page + 1 })}
          >
            下一页
          </Button>
        </div>
      )}

      {/* 表单对话框 */}
      {projectId && (
        <IssueForm
          projectId={projectId}
          issue={editingIssue}
          open={formOpen}
          onOpenChange={setFormOpen}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
