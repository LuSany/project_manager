"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
}

interface Project {
  name: string;
  status: string;
}

export default function TasksPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const projectId = params.id;
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        pageSize: "10",
        projectId,
        ...(filterStatus && { status: filterStatus }),
        ...(filterPriority && { priority: filterPriority }),
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

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个任务吗？")) {
      return;
    }

    try {
      const response = await fetch('/api/v1/tasks/' + id, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error("删除任务失败:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [page, filterStatus, filterPriority]);

  const statusLabels: Record<string, string> = {
    TODO: "待办",
    IN_PROGRESS: "进行中",
    REVIEW: "待审核",
    TESTING: "测试中",
    DONE: "已完成",
  };

  const priorityLabels: Record<string, string> = {
    LOW: "低",
    MEDIUM: "中",
    HIGH: "高",
    URGENT: "紧急",
  };

  const statusColors: Record<string, string> = {
    TODO: "bg-gray-100 text-gray-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    REVIEW: "bg-yellow-100 text-yellow-800",
    TESTING: "bg-purple-100 text-purple-800",
    DONE: "bg-green-100 text-green-800",
  };

  const priorityColors: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-800",
    MEDIUM: "bg-blue-100 text-blue-800",
    HIGH: "bg-orange-100 text-orange-800",
    URGENT: "bg-red-100 text-red-800",
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">任务列表</h1>
            <button
              onClick={() => router.push(`/projects/${projectId}/tasks/new`)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              新建任务
            </button>
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
              <option value="TODO">待办</option>
              <option value="IN_PROGRESS">进行中</option>
              <option value="REVIEW">待审核</option>
              <option value="TESTING">测试中</option>
              <option value="DONE">已完成</option>
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
              <option value="URGENT">紧急</option>
            </select>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-lg font-medium mb-2 text-muted-foreground">暂无任务</p>
                <p className="text-sm text-muted-foreground">开始创建您的第一个任务</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="bg-card border rounded-lg p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold">{task.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                          {statusLabels[task.status]}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                          {priorityLabels[task.priority]}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-muted-foreground text-sm mb-2">{task.description}</p>
                      )}
                      <div className="text-sm text-muted-foreground">
                        进度: {task.progress}%
                        {task.dueDate && (
                          <span className="ml-4">
                            截止: {new Date(task.dueDate).toLocaleDateString("zh-CN")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/projects/${projectId}/tasks/${task.id}`)}
                      className="text-primary hover:underline"
                    >
                      查看详情 →
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="text-destructive hover:underline text-sm"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
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
      </div>
    </div>
  );
}
