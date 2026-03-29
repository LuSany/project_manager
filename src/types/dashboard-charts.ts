/**
 * Dashboard chart component types and utilities
 */

import type { LucideIcon } from 'lucide-react'
import type { TaskStatus, TaskPriority, MilestoneStatus } from '@prisma/client'

// ============================================================================
// Data Types
// ============================================================================

/**
 * Task status distribution item
 */
export interface TaskStatusDistributionItem {
  status: TaskStatus
  count: number
  color: string
}

/**
 * Priority distribution item
 */
export interface PriorityDistributionItem {
  priority: TaskPriority
  count: number
  color: string
}

/**
 * Project comparison item (for completion rate chart)
 */
export interface ProjectComparisonItem {
  projectId: string
  projectName: string
  completedTasks: number
  totalTasks: number
  completionRate: number
}

/**
 * Milestone progress item
 */
export interface MilestoneProgressItem {
  milestoneId: string
  title: string
  dueDate: Date | null
  status: MilestoneStatus
  completedTasks: number
  totalTasks: number
  progress: number
}

// ============================================================================
// Color Maps
// ============================================================================

/**
 * Task status color mapping (hex colors for Recharts)
 */
export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: '#94a3b8', // slate-400
  IN_PROGRESS: '#3b82f6', // blue-500
  REVIEW: '#a855f7', // purple-500
  TESTING: '#f59e0b', // amber-500
  DONE: '#22c55e', // green-500
  CANCELLED: '#6b7280', // gray-500
  DELAYED: '#ef4444', // red-500
  BLOCKED: '#dc2626', // red-600
}

/**
 * Priority color mapping (hex colors for Recharts)
 */
export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: '#60a5fa', // blue-400
  MEDIUM: '#f59e0b', // amber-500
  HIGH: '#f97316', // orange-500
  CRITICAL: '#ef4444', // red-500
}

/**
 * Milestone status color mapping (Tailwind classes)
 */
export const MILESTONE_STATUS_COLORS: Record<MilestoneStatus, string> = {
  NOT_STARTED: 'bg-gray-200 text-gray-700',
  IN_PROGRESS: 'bg-blue-500 text-white',
  COMPLETED: 'bg-green-500 text-white',
  CANCELLED: 'bg-gray-400 text-white',
}

/**
 * Milestone status color mapping (hex for progress bars)
 */
export const MILESTONE_STATUS_HEX_COLORS: Record<MilestoneStatus, string> = {
  NOT_STARTED: '#e5e7eb', // gray-200
  IN_PROGRESS: '#3b82f6', // blue-500
  COMPLETED: '#22c55e', // green-500
  CANCELLED: '#9ca3af', // gray-400
}

// ============================================================================
// Labels (Chinese)
// ============================================================================

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: '待办',
  IN_PROGRESS: '进行中',
  REVIEW: '审核中',
  TESTING: '测试中',
  DONE: '已完成',
  CANCELLED: '已取消',
  DELAYED: '已延期',
  BLOCKED: '已阻塞',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  CRITICAL: '紧急',
}

// ============================================================================
// Empty State Messages
// ============================================================================

export const EMPTY_TASK_MESSAGE = '暂无任务数据'
export const EMPTY_PROJECT_MESSAGE = '暂无项目数据'
export const EMPTY_MILESTONE_MESSAGE = '暂无里程碑数据'

// ============================================================================
// Chart Card Props
// ============================================================================

export interface ChartCardProps {
  title: string
  icon: LucideIcon
  iconColor?: string
  children: React.ReactNode
  loading?: boolean
  emptyMessage?: string
}
