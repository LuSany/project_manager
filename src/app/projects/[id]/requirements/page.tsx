"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";

interface Requirement {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
  // 新增字段
  assigneeId: string | null;
  reporterId: string | null;
  dueDate: string | null;
  estimateHours: number | null;
  businessLine: string | null;
  tags: string[];
  assignee?: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  reporter?: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
}

interface ProjectMember {
  userId: string;
  users: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export default function RequirementsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>("");

  useEffect(() => {
    params.then(p => {
      setProjectId(p.id);
      fetchProjectMembers(p.id);
    });
  }, [params]);

  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  // 新增筛选
  const [filterAssignee, setFilterAssignee] = useState<string>("");
  const [filterBusinessLine, setFilterBusinessLine] = useState<string>("");

  // 项目成员列表
  const [members, setMembers] = useState<ProjectMember[]>([]);
  // 业务线列表（从已有需求提取）
  const [businessLines, setBusinessLines] = useState<string[]>([]);

  const fetchProjectMembers = async (pid: string) => {
    try {
      const response = await fetch(`/api/v1/projects/${pid}/members`);
      const data = await response.json();
      if (data.success) {
        setMembers(data.data || []);
      }
    } catch (error) {
      console.error("获取项目成员失败:", error);
    }
  };

  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        pageSize: "10",
        projectId,
        ...(filterStatus && { status: filterStatus }),
        ...(filterPriority && { priority: filterPriority }),
        ...(filterAssignee && { assigneeId: filterAssignee }),
        ...(filterBusinessLine && { businessLine: filterBusinessLine }),
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

        // 提取业务线列表
        const lines = new Set<string>();
        data.data.items.forEach((req: Requirement) => {
          if (req.businessLine) lines.add(req.businessLine);
        });
        setBusinessLines(Array.from(lines));
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
    if (projectId) {
      fetchRequirements();
    }
  }, [page, filterStatus, filterPriority, filterAssignee, filterBusinessLine, projectId]);

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

  // 计算截止日期状态
  const getDueDateStatus = (dueDate: string | null): { color: string; text: string } => {
    if (!dueDate) return { color: "text-muted-foreground", text: "" };
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { color: "text-red-500", text: `已过期 ${Math.abs(diffDays)} 天` };
    } else if (diffDays === 0) {
      return { color: "text-orange-500", text: "今天截止" };
    } else if (diffDays <= 3) {
      return { color: "text-orange-500", text: `剩余 ${diffDays} 天` };
    } else {
      return { color: "text-muted-foreground", text: due.toLocaleDateString("zh-CN") };
    }
  };

  return (
    <div className="space-y-6">
      {/* 返回导航 */}
      <div className="flex items-center gap-2">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            返回项目
          </Button>
        </Link>
      </div>

      {/* 标题和操作 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">需求列表</h1>
        <Button
          onClick={() => router.push(`/projects/${projectId}/requirements/new`)}
        >
          新建需求
        </Button>
      </div>

      {/* 筛选器 */}
      <div className="flex flex-wrap items-center gap-4">
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

        {/* 新增：指派人筛选 */}
        <select
          value={filterAssignee}
          onChange={(e) => {
            setFilterAssignee(e.target.value);
            setPage(1);
          }}
          className="border border-border rounded-md px-3 py-2 bg-background"
        >
          <option value="">全部指派人</option>
          {members.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.users.name}
            </option>
          ))}
        </select>

        {/* 新增：业务线筛选 */}
        {businessLines.length > 0 && (
          <select
            value={filterBusinessLine}
            onChange={(e) => {
              setFilterBusinessLine(e.target.value);
              setPage(1);
            }}
            className="border border-border rounded-md px-3 py-2 bg-background"
          >
            <option value="">全部业务线</option>
            {businessLines.map((line) => (
              <option key={line} value={line}>
                {line}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 内容区 */}
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
              {requirements.map((requirement) => {
                const dueDateStatus = getDueDateStatus(requirement.dueDate);
                return (
                  <Card key={requirement.id} className="hover:shadow-md transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-xl font-semibold">{requirement.title}</h3>
                            <Badge className={statusColors[requirement.status]}>
                              {statusLabels[requirement.status]}
                            </Badge>
                            <Badge className={priorityColors[requirement.priority]}>
                              {priorityLabels[requirement.priority]}
                            </Badge>
                            {/* 新增：业务线标签 */}
                            {requirement.businessLine && (
                              <Badge variant="outline">
                                {requirement.businessLine}
                              </Badge>
                            )}
                          </div>
                          {requirement.description && (
                            <p className="text-muted-foreground text-sm line-clamp-2">{requirement.description}</p>
                          )}

                          {/* 新增：信息行 */}
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                            {/* 指派人 */}
                            {requirement.assignee && (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>{requirement.assignee.name}</span>
                              </div>
                            )}

                            {/* 截止日期 */}
                            {requirement.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span className={dueDateStatus.color}>{dueDateStatus.text}</span>
                              </div>
                            )}

                            {/* 预估工时 */}
                            {requirement.estimateHours && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{requirement.estimateHours}h</span>
                              </div>
                            )}
                          </div>

                          {/* 新增：标签 */}
                          {requirement.tags && requirement.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {requirement.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
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
                );
              })}
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
  );
}