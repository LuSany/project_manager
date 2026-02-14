"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// 类型定义
// ============================================================================

interface SubTask {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  taskId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SubTaskListProps {
  taskId: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// API 函数
// ============================================================================

async function fetchSubTasks(taskId: string): Promise<SubTask[]> {
  const response = await fetch(`/api/v1/tasks/${taskId}/subtasks`);
  const data: ApiResponse<SubTask[]> = await response.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || "获取子任务列表失败");
  }
  return data.data;
}

async function createSubTask(
  taskId: string,
  title: string,
  description?: string
): Promise<SubTask> {
  const response = await fetch(`/api/v1/tasks/${taskId}/subtasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description }),
  });
  const data: ApiResponse<SubTask> = await response.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || "创建子任务失败");
  }
  return data.data;
}

async function toggleSubTask(
  taskId: string,
  subtaskId: string
): Promise<SubTask> {
  const response = await fetch(
    `/api/v1/tasks/${taskId}/subtasks/${subtaskId}/toggle`,
    { method: "PUT" }
  );
  const data: ApiResponse<SubTask> = await response.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || "切换子任务状态失败");
  }
  return data.data;
}

async function deleteSubTask(
  taskId: string,
  subtaskId: string
): Promise<void> {
  const response = await fetch(
    `/api/v1/tasks/${taskId}/subtasks/${subtaskId}`,
    { method: "DELETE" }
  );
  const data: ApiResponse<null> = await response.json();
  if (!data.success) {
    throw new Error(data.error || "删除子任务失败");
  }
}

// ============================================================================
// 子任务列表组件
// ============================================================================

export function SubTaskList({ taskId }: SubTaskListProps) {
  const queryClient = useQueryClient();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // 查询子任务列表
  const { data: subTasks = [], isLoading } = useQuery({
    queryKey: ["subtasks", taskId],
    queryFn: () => fetchSubTasks(taskId),
  });

  // 创建子任务
  const createMutation = useMutation({
    mutationFn: (title: string) => createSubTask(taskId, title),
    onMutate: async (newTitle) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: ["subtasks", taskId] });

      // 乐观更新：先在本地添加新任务
      const optimisticSubTask: SubTask = {
        id: `temp-${Date.now()}`,
        title: newTitle,
        description: null,
        completed: false,
        taskId,
        parentId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<SubTask[]>(["subtasks", taskId], (old = []) => [
        ...old,
        optimisticSubTask,
      ]);

      return { optimisticSubTask };
    },
    onSuccess: (data, variables, context) => {
      // 用服务器返回的数据替换临时数据
      queryClient.setQueryData<SubTask[]>(["subtasks", taskId], (old = []) =>
        old.map((st) =>
          st.id === context?.optimisticSubTask.id ? data : st
        )
      );
    },
    onError: (error, variables, context) => {
      // 发生错误时回滚
      queryClient.setQueryData<SubTask[]>(["subtasks", taskId], (old = []) =>
        old.filter((st) => st.id !== context?.optimisticSubTask.id)
      );
      console.error("创建子任务失败:", error);
    },
  });

  // 切换完成状态
  const toggleMutation = useMutation({
    mutationFn: (subtaskId: string) => toggleSubTask(taskId, subtaskId),
    onMutate: async (subtaskId) => {
      await queryClient.cancelQueries({ queryKey: ["subtasks", taskId] });

      // 乐观更新：先在本地切换状态
      queryClient.setQueryData<SubTask[]>(["subtasks", taskId], (old = []) =>
        old.map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        )
      );
    },
    onError: (error, subtaskId) => {
      // 发生错误时回滚
      queryClient.setQueryData<SubTask[]>(["subtasks", taskId], (old = []) =>
        old.map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        )
      );
      console.error("切换子任务状态失败:", error);
    },
  });

  // 删除子任务
  const deleteMutation = useMutation({
    mutationFn: (subtaskId: string) => deleteSubTask(taskId, subtaskId),
    onMutate: async (subtaskId) => {
      await queryClient.cancelQueries({ queryKey: ["subtasks", taskId] });

      // 乐观更新：先在本地删除
      queryClient.setQueryData<SubTask[]>(["subtasks", taskId], (old = []) =>
        old.filter((st) => st.id !== subtaskId)
      );
    },
    onError: (error, subtaskId) => {
      // 发生错误时需要重新获取数据
      queryClient.invalidateQueries({ queryKey: ["subtasks", taskId] });
      console.error("删除子任务失败:", error);
    },
  });

  // 处理添加新任务
  const handleAddSubTask = async () => {
    if (!newTaskTitle.trim()) return;

    setIsAdding(true);
    try {
      await createMutation.mutateAsync(newTaskTitle);
      setNewTaskTitle("");
    } catch (error) {
      console.error("添加子任务失败:", error);
    } finally {
      setIsAdding(false);
    }
  };

  // 处理回车键
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddSubTask();
    }
  };

  // 计算完成进度
  const completedCount = subTasks.filter((st) => st.completed).length;
  const totalCount = subTasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">子任务</CardTitle>
          <Badge variant="secondary">
            {completedCount}/{totalCount}
          </Badge>
        </div>
        {totalCount > 0 && (
          <div className="mt-2">
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {progress.toFixed(0)}% 完成
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 添加新任务输入框 */}
        <div className="flex gap-2">
          <Input
            placeholder="添加新子任务..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isAdding}
          />
          <Button
            onClick={handleAddSubTask}
            disabled={isAdding || !newTaskTitle.trim()}
            size="icon"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* 子任务列表 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : subTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">暂无子任务</p>
            <p className="text-xs mt-1">添加第一个子任务开始追踪进度</p>
          </div>
        ) : (
          <div className="space-y-2">
            {subTasks.map((subTask) => (
              <div
                key={subTask.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all",
                  subTask.completed
                    ? "bg-muted/50 border-muted"
                    : "bg-background hover:border-primary/50"
                )}
              >
                <Checkbox
                  checked={subTask.completed}
                  onCheckedChange={() => toggleMutation.mutate(subTask.id)}
                  disabled={toggleMutation.isPending}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium truncate",
                      subTask.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {subTask.title}
                  </p>
                  {subTask.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {subTask.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteMutation.mutate(subTask.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
