// Dashboard chart types and color definitions
// Shared types for all dashboard chart components

// Task status distribution data
export interface TaskStatusDistributionItem {
  name: string
  value: number
}

// Priority distribution data
export interface PriorityDistributionItem {
  name: string
  value: number
}

// Project comparison data (for bar chart)
export interface ProjectComparisonItem {
  projectId: string
  name: string
  completionRate: number
}

// Milestone progress data
export interface MilestoneProgressItem {
  id: string
  title: string
  status: string
  progress: number
  dueDate: string | null
  projectId: string
  projectName: string
}

// Task status color mapping (value-based, not index-based)
export const TASK_STATUS_COLORS: Record<string, string> = {
  TODO: '#3b82f6', // blue-500
  IN_PROGRESS: '#10b981', // emerald-500
  REVIEW: '#8b5cf6', // violet-500
  TESTING: '#f59e0b', // amber-500
  DONE: '#22c55e', // green-500
  CANCELLED: '#6b7280', // gray-500
  DELAYED: '#ef4444', // red-500
  BLOCKED: '#dc2626', // red-600
}

// Priority color mapping
export const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#3b82f6', // blue-500
  MEDIUM: '#f59e0b', // amber-500
  HIGH: '#ef4444', // red-500
  CRITICAL: '#dc2626', // red-600
}

// Task status labels (Chinese)
export const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: '待办',
  IN_PROGRESS: '进行中',
  REVIEW: '审核中',
  TESTING: '测试中',
  DONE: '已完成',
  CANCELLED: '已取消',
  DELAYED: '已延期',
  BLOCKED: '已阻塞',
}

// Priority labels (Chinese)
export const PRIORITY_LABELS: Record<string, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  CRITICAL: '紧急',
}

// Milestone status color mapping (Tailwind classes)
export const MILESTONE_STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: 'bg-slate-400',
  IN_PROGRESS: 'bg-blue-500',
  COMPLETED: 'bg-emerald-500',
  CANCELLED: 'bg-red-500',
}

// Milestone status dot colors
export const MILESTONE_DOT_COLORS: Record<string, string> = {
  NOT_STARTED: 'bg-slate-400',
  IN_PROGRESS: 'bg-blue-500',
  COMPLETED: 'bg-emerald-500',
  CANCELLED: 'bg-red-500',
}

// Empty state messages
export const EMPTY_STATE_MESSAGES = {
  tasks: '暂无任务数据',
  projects: '暂无项目数据',
  milestones: '暂无里程碑数据',
  default: '暂无数据',
}
