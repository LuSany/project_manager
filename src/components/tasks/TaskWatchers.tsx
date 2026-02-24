"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback } from "@/components/ui/avatar";
import { AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Eye, EyeOff, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// 类型定义
// ============================================================================

interface TaskWatcher {
  taskId: string;
  userId: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
}

interface ProjectMember {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface TaskWatchersProps {
  taskId: string;
  projectId: string;
}

// ============================================================================
// API 函数
// ============================================================================

async function fetchWatchers(taskId: string): Promise<TaskWatcher[]> {
  const response = await fetch(`/api/v1/tasks/${taskId}/watchers`);
  const data: ApiResponse<TaskWatcher[]> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || "获取关注者失败");
  }

  return data.data;
}

async function fetchProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const response = await fetch(`/api/v1/projects/${projectId}/members`);
  const data: ApiResponse<ProjectMember[]> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || "获取项目成员失败");
  }

  return data.data;
}

async function addWatcher(taskId: string, userId: string): Promise<TaskWatcher> {
  const response = await fetch(`/api/v1/tasks/${taskId}/watchers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  const data: ApiResponse<TaskWatcher> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || "添加关注者失败");
  }

  return data.data;
}

async function removeWatcher(taskId: string, userId: string): Promise<void> {
  const response = await fetch(`/api/v1/tasks/${taskId}/watchers/${userId}`, {
    method: "DELETE",
  });

  const data: ApiResponse<void> = await response.json();

  if (!data.success) {
    throw new Error(data.error || "移除关注者失败");
  }
}

// ============================================================================
// 组件
// ============================================================================

export function TaskWatchers({ taskId, projectId }: TaskWatchersProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // 查询关注者列表
  const { data: watchers = [], isLoading: isLoadingWatchers } = useQuery({
    queryKey: ["taskWatchers", taskId],
    queryFn: () => fetchWatchers(taskId),
    enabled: isOpen,
  });

  // 查询项目成员
  const { data: members = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: () => fetchProjectMembers(projectId),
    enabled: isOpen,
  });

  // 添加关注者
  const addMutation = useMutation({
    mutationFn: (userId: string) => addWatcher(taskId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskWatchers", taskId] });
    },
  });

  // 移除关注者
  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeWatcher(taskId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskWatchers", taskId] });
    },
  });

  // 获取未关注的成员
  const watcherUserIds = new Set(watchers.map((w) => w.userId));
  const availableMembers = members.filter((m) => !watcherUserIds.has(m.userId));

  const isLoading = isLoadingWatchers || isLoadingMembers;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          <span>关注者</span>
          {watchers.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {watchers.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            任务关注者
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* 添加关注者 */}
          {availableMembers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">添加关注者</h4>
              <div className="flex flex-wrap gap-2">
                {availableMembers.map((member) => (
                  <Button
                    key={member.userId}
                    variant="outline"
                    size="sm"
                    onClick={() => addMutation.mutate(member.userId)}
                    disabled={addMutation.isPending}
                    className="gap-2"
                  >
                    <Plus className="h-3 w-3" />
                    <UserAvatar user={member.user} size="sm" />
                    <span className="text-sm">{member.user.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* 关注者列表 */}
          <div>
            <h4 className="text-sm font-medium mb-2">
              当前关注者 ({watchers.length})
            </h4>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : watchers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <EyeOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>暂无关注者</p>
              </div>
            ) : (
              <div className="space-y-2">
                {watchers.map((watcher) => (
                  <div
                    key={watcher.userId}
                    className="flex items-center justify-between p-2 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar user={watcher.user} />
                      <div>
                        <p className="text-sm font-medium">{watcher.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {watcher.user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMutation.mutate(watcher.userId)}
                      disabled={removeMutation.isPending}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// 用户头像组件
// ============================================================================

interface UserAvatarProps {
  user: {
    name: string;
    avatar?: string | null;
  };
  size?: "sm" | "md";
}

function UserAvatar({ user, size = "md" }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
  };

  return (
    <Avatar className={sizeClasses[size]}>
      {user.avatar ? (
        <AvatarImage src={user.avatar} alt={user.name} />
      ) : null}
      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
    </Avatar>
  );
}
