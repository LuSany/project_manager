"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Flag,
  FolderOpen,
  ListTodo,
  TriangleAlert
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  ownerId: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  members: any[];
  milestones: any[];
  tasks: any[];
  requirements: any[];
  risks: any[];
  createdAt: string;
  updatedAt: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/projects/${projectId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setProject(data.data);
      } else {
        setError(data.error?.message || "加载项目失败");
      }
    } catch (err) {
      console.error("加载项目失败:", err);
      setError("加载项目失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      PLANNING: "bg-yellow-500",
      ACTIVE: "bg-green-500",
      ON_HOLD: "bg-orange-500",
      COMPLETED: "bg-blue-500",
      CANCELLED: "bg-gray-500",
    };

    const labels: Record<string, string> = {
      PLANNING: "计划中",
      ACTIVE: "进行中",
      ON_HOLD: "已暂停",
      COMPLETED: "已完成",
      CANCELLED: "已取消",
    };

    return (
      <Badge className={variants[status] || "bg-gray-500"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getTaskStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      TODO: <Circle className="h-4 w-4 text-gray-400" />,
      IN_PROGRESS: <Clock className="h-4 w-4 text-blue-500" />,
      REVIEW: <FileText className="h-4 w-4 text-purple-500" />,
      TESTING: <TriangleAlert className="h-4 w-4 text-orange-500" />,
      DONE: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      CANCELLED: <Circle className="h-4 w-4 text-gray-300" />,
      DELAYED: <TriangleAlert className="h-4 w-4 text-red-500" />,
      BLOCKED: <TriangleAlert className="h-4 w-4 text-red-500" />,
    };
    return icons[status] || <Circle className="h-4 w-4" />;
  };

  const getTaskStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      TODO: "未开始",
      IN_PROGRESS: "进行中",
      REVIEW: "待评审",
      TESTING: "测试中",
      DONE: "已完成",
      CANCELLED: "已取消",
      DELAYED: "延期",
      BLOCKED: "阻塞",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">加载失败</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.history.back()}>
              返回上一页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>项目不存在</CardTitle>
            <CardDescription>该项目可能已被删除或您无权访问</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.history.back()}>
              返回上一页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航栏 */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(project.status)}
                <span className="text-sm text-muted-foreground">
                  所有者：{project.owner.name}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${projectId}/settings`}>设置</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="container mx-auto py-6 px-6">
        {/* 项目描述 */}
        {project.description && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>项目描述</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{project.description}</p>
            </CardContent>
          </Card>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">任务</CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.tasks?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">里程碑</CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.milestones?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">需求</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.requirements?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">风险</CardTitle>
              <TriangleAlert className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.risks?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* 快速操作 */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button asChild>
            <Link href={`/projects/${projectId}/tasks/new`}>
              <ListTodo className="h-4 w-4 mr-2" />
              新建任务
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/projects/${projectId}/milestones`}>
              <Flag className="h-4 w-4 mr-2" />
              管理里程碑
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/projects/${projectId}/requirements/new`}>
              <FileText className="h-4 w-4 mr-2" />
              新建需求
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/projects/${projectId}/risks`}>
              <TriangleAlert className="h-4 w-4 mr-2" />
              管理风险
            </Link>
          </Button>
        </div>

        {/* 最近任务 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>最近任务</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/projects/${projectId}/tasks`}>查看全部</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {project.tasks && project.tasks.length > 0 ? (
              <div className="space-y-2">
                {project.tasks.slice(0, 5).map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-3">
                      {getTaskStatusIcon(task.status)}
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {getTaskStatusLabel(task.status)}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/projects/${projectId}/tasks/${task.id}`}
                      className="text-primary text-sm hover:underline"
                    >
                      查看 →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>暂无任务</p>
                <Button variant="link" asChild>
                  <Link href={`/projects/${projectId}/tasks/new`}>创建第一个任务</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 里程碑 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>里程碑</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/projects/${projectId}/milestones`}>查看全部</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {project.milestones && project.milestones.length > 0 ? (
              <div className="space-y-3">
                {project.milestones.slice(0, 3).map((milestone: any) => (
                  <div key={milestone.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{milestone.title}</span>
                      <Badge variant={milestone.status === 'COMPLETED' ? 'default' : 'secondary'}>
                        {milestone.status === 'COMPLETED' ? '已完成' : '进行中'}
                      </Badge>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${milestone.progress || 0}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      进度：{milestone.progress || 0}%
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Flag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>暂无里程碑</p>
                <Button variant="link" asChild>
                  <Link href={`/projects/${projectId}/milestones`}>创建里程碑</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
