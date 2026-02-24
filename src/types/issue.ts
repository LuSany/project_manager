// Issue 类型定义

export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "REOPENED";
export type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type IssueCategory = "BUG" | "FEATURE" | "IMPROVEMENT" | "DOCUMENTATION" | "OTHER";

export interface Issue {
  id: string;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  projectId: string;
  requirementId: string | null;
  autoClose: boolean;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  project?: {
    id: string;
    name: string;
  };
  requirement?: {
    id: string;
    title: string;
    status: string;
  } | null;
}

// 状态标签
export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  OPEN: "待处理",
  IN_PROGRESS: "进行中",
  RESOLVED: "已解决",
  CLOSED: "已关闭",
  REOPENED: "重新打开",
};

// 状态颜色
export const ISSUE_STATUS_COLORS: Record<IssueStatus, string> = {
  OPEN: "bg-blue-500",
  IN_PROGRESS: "bg-yellow-500",
  RESOLVED: "bg-green-500",
  CLOSED: "bg-gray-500",
  REOPENED: "bg-orange-500",
};

// 优先级标签
export const ISSUE_PRIORITY_LABELS: Record<IssuePriority, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  URGENT: "紧急",
};

// 优先级颜色
export const ISSUE_PRIORITY_COLORS: Record<IssuePriority, string> = {
  LOW: "bg-gray-500",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

// 类别标签
export const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  BUG: "缺陷",
  FEATURE: "功能请求",
  IMPROVEMENT: "改进建议",
  DOCUMENTATION: "文档问题",
  OTHER: "其他",
};

// 类别颜色
export const ISSUE_CATEGORY_COLORS: Record<IssueCategory, string> = {
  BUG: "bg-red-100 text-red-800",
  FEATURE: "bg-green-100 text-green-800",
  IMPROVEMENT: "bg-blue-100 text-blue-800",
  DOCUMENTATION: "bg-purple-100 text-purple-800",
  OTHER: "bg-gray-100 text-gray-800",
};
