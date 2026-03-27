"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { TaskKanban } from "@/components/tasks/TaskKanban";
import { TaskList } from "@/components/tasks/list/TaskList";
import { TaskListFilters } from "@/components/tasks/list/TaskListFilters";
import { TaskDetailDrawer } from "@/components/tasks/detail/TaskDetailDrawer";
import { TaskCalendar } from "@/components/tasks/calendar";
import { useTaskViewStore } from "@/stores/taskViewStore";
import { ArrowLeft } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  priority: string;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  assignees?: Array<{
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  tags?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export default function TasksPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>("");

  useEffect(() => {
    params.then(p => setProjectId(p.id));
  }, [params]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 详情抽屉状态
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 从 taskViewStore 获取视图状态
  const viewMode = useTaskViewStore((state) => state.viewMode);
  const setViewMode = useTaskViewStore((state) => state.setViewMode);
  const filters = useTaskViewStore((state) => state.filters);

  const fetchTasks = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        pageSize: "25",
        projectId,
      });

      // 添加筛选条件
      filters.forEach((filter) => {
        searchParams.set(filter.field, filter.value);
      });

      const response = await fetch('/api/v1/tasks?' + searchParams, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setTasks(data.data.items);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error("获取任务列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, projectId, filters]);

  // 处理任务更新（内联编辑）
  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch('/api/v1/tasks/' + taskId, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        // 更新本地状态
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
        );
      }
    } catch (error) {
      console.error("更新任务失败:", error);
    }
  };

  // 快速创建任务（日历视图）
  const handleQuickCreate = async (title: string, dueDate: Date) => {
    try {
      const response = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          dueDate: format(dueDate, 'yyyy-MM-dd'),
          projectId,
          status: 'TODO',
          priority: 'MEDIUM',
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchTasks(); // 刷新任务列表
      }
    } catch (error) {
      console.error('创建任务失败:', error);
    }
  };

  // 处理打开任务详情
  const handleOpenDetail = (taskId: string) => {
    setSelectedTaskId(taskId);
    setDrawerOpen(true);
  };

  // 处理抽屉关闭
  const handleDrawerOpenChange = (open: boolean) => {
    setDrawerOpen(open);
    if (!open) {
      setSelectedTaskId(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
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
      <div className="flex items-center justify-between py-4">
        <h1 className="text-2xl font-bold">任务列表</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-md p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              列表视图
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              看板视图
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "calendar"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              日历视图
            </button>
          </div>
          <Button onClick={() => router.push(`/projects/${projectId}/tasks/new`)}>
            新建任务
          </Button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "kanban" ? (
          <TaskKanban projectId={projectId} onOpenDetail={handleOpenDetail} />
        ) : viewMode === "calendar" ? (
          <TaskCalendar
            projectId={projectId}
            tasks={tasks}
            isLoading={loading}
            onOpenDetail={handleOpenDetail}
            onUpdateDueDate={(taskId, dueDate) => handleTaskUpdate(taskId, { dueDate: format(dueDate, 'yyyy-MM-dd') })}
            onCreateTask={handleQuickCreate}
          />
        ) : (
          <div className="flex h-full flex-col">
            {/* 筛选栏 */}
            <TaskListFilters />

            {/* 任务列表 */}
            <div className="flex-1 overflow-auto">
              <TaskList
                projectId={projectId}
                tasks={tasks}
                isLoading={loading}
                onTaskUpdate={handleTaskUpdate}
                onOpenDetail={handleOpenDetail}
              />
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4 border-t">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="text-muted-foreground">
                  第 {page} / {totalPages} 页
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 任务详情抽屉 */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        open={drawerOpen}
        onOpenChange={handleDrawerOpenChange}
      />
    </div>
  );
}