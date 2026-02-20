// 里程碑类型定义
export interface Milestone {
  id: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  progress: number;
  dueDate: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
    progress: number;
  }>;
  completedTasks?: number;
  totalTasks?: number;
}

export type MilestoneStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  NOT_STARTED: "未开始",
  IN_PROGRESS: "进行中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

export const MILESTONE_STATUS_COLORS: Record<MilestoneStatus, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-800 border-gray-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};
