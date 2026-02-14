import { QueryClient, defaultOptions } from "@tanstack/react-query";
import type { ApiResponse } from "@/types/api";

// TanStack Query配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5分钟
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query Keys工厂
export const queryKeys = {
  // 用户相关
  user: ["users"] as const,
  currentUser: ["user", "current"] as const,

  // 项目相关
  projects: ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
  projectMembers: (id: string) => ["projects", id, "members"] as const,
  projectStats: (id: string) => ["projects", id, "stats"] as const,

  // 里程碑相关
  milestones: (id: string) => ["projects", id, "milestones"] as const,
  milestone: (id: string) => ["projects", id, "milestone"] as const,

  // 任务相关
  tasks: (projectId: string) => ["projects", projectId, "tasks"] as const,
  task: (projectId: string, taskId: string) => ["projects", projectId, "tasks", taskId] as const,
  myTasks: ["tasks", "my"] as const,

  // 需求相关
  requirements: (projectId: string) => ["projects", id, "requirements"] as const,
  requirement: (projectId: string, reqId: string) => ["projects", id, "requirements", reqId] as const,
} as const;

export default queryClient;
