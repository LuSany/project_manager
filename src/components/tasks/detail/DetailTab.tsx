'use client'

import React from 'react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

// ============================================================================
// 类型定义
// ============================================================================

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  progress: number
  priority: string
  startDate: string | null
  dueDate: string | null
  createdAt: string
  assignees?: Array<{
    user: { id: string; name: string; email: string }
  }>
}

interface DetailTabProps {
  taskId: string
  onUpdate?: (taskId: string, data: Partial<Task>) => void
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================================
// API 函数
// ============================================================================

async function fetchTask(taskId: string): Promise<Task> {
  const response = await fetch(`/api/v1/tasks/${taskId}`)
  const data: ApiResponse<Task> = await response.json()

  if (!data.success || !data.data) {
    throw new Error(data.error || '获取任务详情失败')
  }

  return data.data
}

async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  const response = await fetch(`/api/v1/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })

  const data: ApiResponse<Task> = await response.json()

  if (!data.success || !data.data) {
    throw new Error(data.error || '更新任务失败')
  }

  return data.data
}

// ============================================================================
// DetailTab 组件
// ============================================================================

export function DetailTab({ taskId, onUpdate }: DetailTabProps) {
  const queryClient = useQueryClient()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')

  // 获取任务详情
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => fetchTask(taskId),
  })

  // 更新任务
  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Task>) => updateTask(taskId, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(['task', taskId], data)
      onUpdate?.(taskId, data)
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!task) {
    return null
  }

  // 处理标题编辑
  const handleTitleEdit = () => {
    setEditedTitle(task.title)
    setIsEditingTitle(true)
  }

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== task.title) {
      updateMutation.mutate({ title: editedTitle })
    }
    setIsEditingTitle(false)
  }

  const handleTitleCancel = () => {
    setIsEditingTitle(false)
    setEditedTitle('')
  }

  return (
    <div className="space-y-6 p-4">
      {/* 任务标题 */}
      <div className="space-y-2">
        <Label>任务标题</Label>
        {isEditingTitle ? (
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSave()
              if (e.key === 'Escape') handleTitleCancel()
            }}
            autoFocus
          />
        ) : (
          <div
            className="cursor-pointer rounded-md border p-2 hover:bg-muted/50"
            onClick={handleTitleEdit}
          >
            {task.title}
          </div>
        )}
      </div>

      {/* 描述 */}
      <div className="space-y-2">
        <Label>描述</Label>
        <Textarea
          placeholder="添加描述..."
          defaultValue={task.description || ''}
          className="min-h-[100px]"
        />
      </div>

      {/* 状态和优先级 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>状态</Label>
          <div className="rounded-md border p-2">{task.status}</div>
        </div>
        <div className="space-y-2">
          <Label>优先级</Label>
          <div className="rounded-md border p-2">{task.priority}</div>
        </div>
      </div>

      {/* 日期 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>开始日期</Label>
          <div className="rounded-md border p-2 text-muted-foreground">
            {task.startDate || '未设置'}
          </div>
        </div>
        <div className="space-y-2">
          <Label>截止日期</Label>
          <div className="rounded-md border p-2 text-muted-foreground">
            {task.dueDate || '未设置'}
          </div>
        </div>
      </div>

      {/* 进度 */}
      <div className="space-y-2">
        <Label>进度</Label>
        <div className="rounded-md border p-2">{task.progress}%</div>
      </div>

      {/* 时间信息 */}
      <div className="space-y-2 text-sm text-muted-foreground">
        <div>创建时间: {new Date(task.createdAt).toLocaleString('zh-CN')}</div>
      </div>
    </div>
  )
}