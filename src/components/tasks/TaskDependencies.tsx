"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Link2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DependencyType, TaskDependencyDetail } from "@/types/task-dependency";

// ============================================================================
// 类型定义
// ============================================================================

interface TaskDependenciesProps {
  taskId: string;
  projectId: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
}

// ============================================================================
// API 函数
// ============================================================================

async function fetchDependencies(taskId: string): Promise<TaskDependencyDetail[]> {
  const response = await fetch(`/api/v1/tasks/${taskId}/dependencies`);
  const data: ApiResponse<TaskDependencyDetail[]> = await response.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || "获取任务依赖列表失败");
  }
  return data.data;
}

async function createDependency(
  taskId: string,
  dependsOnId: string,
  dependencyType: DependencyType
): Promise<TaskDependencyDetail> {
  const response = await fetch(`/api/v1/tasks/${taskId}/dependencies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dependsOnId, dependencyType }),
  });
  const data: ApiResponse<TaskDependencyDetail> = await response.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || "添加任务依赖失败");
  }
  return data.data;
}

async function deleteDependency(taskId: string, depId: string): Promise<void> {
  const response = await fetch(`/api/v1/tasks/${taskId}/dependencies/${depId}`, {
    method: "DELETE",
  });
  const data: ApiResponse<null> = await response.json();
  if (!data.success) {
    throw new Error(data.error || "删除任务依赖失败");
  }
}

async function fetchProjectTasks(projectId: string): Promise<Task[]> {
  const response = await fetch(`/api/v1/projects/${projectId}/tasks`);
  const data: ApiResponse<Task[]> = await response.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || "获取项目任务列表失败");
  }
  return data.data;
}

// ============================================================================
// 依赖类型标签组件
// ============================================================================

function DependencyTypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; color: string }> = {
    FINISH_TO_START: { label: "完成→开始", color: "bg-blue-100 text-blue-800" },
    START_TO_START: { label: "开始→开始", color: "bg-green-100 text-green-800" },
    FINISH_TO_FINISH: { label: "完成→完成", color: "bg-purple-100 text-purple-800" },
    START_TO_FINISH: { label: "开始→完成", color: "bg-orange-100 text-orange-800" },
  };

  const { label, color } = config[type] || config.FINISH_TO_START;

  return (
    <Badge variant="secondary" className={cn("text-xs", color)}>
      {label}
    </Badge>
  );
}

// ============================================================================
// 任务依赖组件
// ============================================================================

export function TaskDependencies({ taskId, projectId }: TaskDependenciesProps) {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDependsOnId, setSelectedDependsOnId] = useState("");
  const [selectedDependencyType, setSelectedDependencyType] = useState<DependencyType>(DependencyType.FINISH_TO_START);

  // 查询任务依赖列表
  const { data: dependencies = [], isLoading } = useQuery({
    queryKey: ["task-dependencies", taskId],
    queryFn: () => fetchDependencies(taskId),
  });

  // 查询项目任务列表（用于添加依赖时选择）
  const { data: projectTasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: () => fetchProjectTasks(projectId),
    enabled: isAddDialogOpen,
  });

  // 创建依赖关系
  const createMutation = useMutation({
    mutationFn: () => createDependency(taskId, selectedDependsOnId, selectedDependencyType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-dependencies", taskId] });
      setIsAddDialogOpen(false);
      setSelectedDependsOnId("");
      setSelectedDependencyType(DependencyType.FINISH_TO_START);
    },
    onError: (error) => {
      console.error("添加任务依赖失败:", error);
    },
  });

  // 删除依赖关系
  const deleteMutation = useMutation({
    mutationFn: (depId: string) => deleteDependency(taskId, depId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-dependencies", taskId] });
    },
    onError: (error) => {
      console.error("删除任务依赖失败:", error);
    },
  });

  // 处理添加依赖
  const handleAddDependency = () => {
    if (!selectedDependsOnId.trim()) return;
    createMutation.mutate();
  };

  // 过滤掉当前任务和已依赖的任务
  const availableTasks = projectTasks.filter(
    (t) => t.id !== taskId && !dependencies.some((d) => d.dependsOnId === t.id)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            任务依赖
          </CardTitle>
          <Badge variant="secondary">
            {dependencies.length}
          </Badge>
        </div>
        {dependencies.length > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            此任务依赖于其他任务的完成
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 添加依赖按钮 */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              添加依赖
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加任务依赖</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">选择依赖任务</label>
                {isLoadingTasks ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : availableTasks.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>没有可用的任务</span>
                  </div>
                ) : (
                  <Select value={selectedDependsOnId} onValueChange={setSelectedDependsOnId}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择一个任务" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">依赖类型</label>
                <Select
                  value={selectedDependencyType}
                  onValueChange={(v) => setSelectedDependencyType(v as DependencyType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DependencyType.FINISH_TO_START}>
                      完成→开始（默认）
                    </SelectItem>
                    <SelectItem value={DependencyType.START_TO_START}>
                      开始→开始
                    </SelectItem>
                    <SelectItem value={DependencyType.FINISH_TO_FINISH}>
                      完成→完成
                    </SelectItem>
                    <SelectItem value={DependencyType.START_TO_FINISH}>
                      开始→完成
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                取消
              </Button>
              <Button
                onClick={handleAddDependency}
                disabled={!selectedDependsOnId || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                添加
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 依赖列表 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : dependencies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无依赖任务</p>
            <p className="text-xs mt-1">添加依赖以管理任务间的关系</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dependencies.map((dependency) => (
              <div
                key={dependency.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:border-primary/50 transition-all"
              >
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {dependency.dependsOnTask.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <DependencyTypeBadge type={dependency.dependencyType} />
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        dependency.dependsOnTask.status === "DONE"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      )}
                    >
                      {dependency.dependsOnTask.status === "DONE" ? "已完成" : "进行中"}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteMutation.mutate(dependency.id)}
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
