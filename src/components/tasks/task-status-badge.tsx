'use client'

import * as React from 'react'
import { Circle, CheckCircle2, Clock, AlertCircle, XCircle, PauseCircle, Ban } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// 任务状态配置
export const TASK_STATUS_CONFIG = {
  TODO: {
    label: '未开始',
    icon: Circle,
    description: '任务尚未开始',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    dotColor: 'bg-gray-400',
  },
  IN_PROGRESS: {
    label: '进行中',
    icon: Clock,
    description: '任务正在执行',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    dotColor: 'bg-blue-500',
  },
  REVIEW: {
    label: '待评审',
    icon: AlertCircle,
    description: '任务等待评审',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    dotColor: 'bg-yellow-500',
  },
  TESTING: {
    label: '测试中',
    icon: Clock,
    description: '任务正在测试',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    dotColor: 'bg-purple-500',
  },
  DONE: {
    label: '已完成',
    icon: CheckCircle2,
    description: '任务已完成',
    color: 'bg-green-100 text-green-700 border-green-300',
    dotColor: 'bg-green-500',
  },
  CANCELLED: {
    label: '已取消',
    icon: Ban,
    description: '任务已取消',
    color: 'bg-red-100 text-red-700 border-red-300',
    dotColor: 'bg-red-500',
  },
  DELAYED: {
    label: '已延期',
    icon: PauseCircle,
    description: '任务已延期',
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    dotColor: 'bg-orange-500',
  },
  BLOCKED: {
    label: '已阻塞',
    icon: XCircle,
    description: '任务被阻塞',
    color: 'bg-red-100 text-red-700 border-red-300',
    dotColor: 'bg-red-600',
  },
} as const

export type TaskStatus = keyof typeof TASK_STATUS_CONFIG

export interface TaskStatusBadgeProps {
  status: string
  showIcon?: boolean
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function TaskStatusBadge({
  status,
  showIcon = true,
  showLabel = true,
  size = 'md',
  className,
}: TaskStatusBadgeProps) {
  const config = TASK_STATUS_CONFIG[status as TaskStatus] || TASK_STATUS_CONFIG.TODO
  const Icon = config.icon

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-2.5 py-1 text-sm',
  }

  return (
    <Badge
      variant="outline"
      className={cn(config.color, sizeClasses[size], 'gap-1 font-medium', className)}
    >
      {showIcon && <Icon className={`h-3 w-3 ${size === 'sm' ? 'h-2.5 w-2.5' : ''}`} />}
      {showLabel && <span>{config.label}</span>}
    </Badge>
  )
}

// 状态点指示器（用于卡片等紧凑显示）
export function TaskStatusDot({ status, className }: { status: string; className?: string }) {
  const config = TASK_STATUS_CONFIG[status as TaskStatus] || TASK_STATUS_CONFIG.TODO

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className={`h-2 w-2 rounded-full ${config.dotColor}`} />
      <span className="text-xs text-gray-600">{config.label}</span>
    </div>
  )
}

// 获取状态描述
export function getStatusDescription(status: string): string {
  const config = TASK_STATUS_CONFIG[status as TaskStatus]
  return config?.description || '未知状态'
}

// 导出配置供其他组件使用
export { TASK_STATUS_CONFIG }
