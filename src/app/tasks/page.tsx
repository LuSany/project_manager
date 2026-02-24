"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TaskKanban } from "@/components/tasks/TaskKanban";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, List, Columns } from "lucide-react";

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
  project?: {
    name: string;
    id: string;
  };
}

export default function GlobalTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        pageSize: "10",
        ...(filterStatus && { status: filterStatus }),
        ...(filterPriority && { priority: filterPriority }),
      });

      const response = await fetch(`/api/v1/tasks?${searchParams.toString()}`);
      const data = await response.json();

      if (data.success) {
        setTasks(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
      }
    } catch (err) {
      console.error("获取任务列表失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [page, filterStatus, filterPriority]);

  return (
    <div className="container mx-auto py-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">任务管理</h1>
          <p className="text-muted-foreground">
            查看所有分配给您的任务
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4 mr-2" />
            列表
          </Button>
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("kanban")}
          >
            <Columns className="h-4 w-4 mr-2" />
            看板
          </Button>
          <Button onClick={() => router.push("/tasks/new")}>
            <Plus className="h-4 w-4 mr-2" />
            新建任务
          </Button>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="flex items-center gap-4 mb-6">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="TODO">待办</SelectItem>
            <SelectItem value="IN_PROGRESS">进行中</SelectItem>
            <SelectItem value="REVIEW">待审核</SelectItem>
            <SelectItem value="TESTING">测试中</SelectItem>
            <SelectItem value="DONE">已完成</SelectItem>
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
            <SelectItem value="URGENT">紧急</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 任务列表/看板 */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">加载中...</div>
      ) : viewMode === "kanban" ? (
        <TaskKanban tasks={tasks} onChange={fetchTasks} />
      ) : (
        <div className="border rounded-lg">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left font-medium">任务标题</th>
                <th className="p-3 text-left font-medium">状态</th>
                <th className="p-3 text-left font-medium">优先级</th>
                <th className="p-3 text-left font-medium">进度</th>
                <th className="p-3 text-left font-medium">截止日期</th>
                <th className="p-3 text-left font-medium">项目</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t hover:bg-muted/50">
                  <td className="p-3">
                    <div>
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-sm">{task.status}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-sm">{task.priority}</span>
                  </td>
                  <td className="p-3">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{task.progress}%</span>
                  </td>
                  <td className="p-3 text-sm">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString("zh-CN")
                      : "-"}
                  </td>
                  <td className="p-3 text-sm">
                    <a
                      href={`/projects/${task.project?.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {task.project?.name || "-"}
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
