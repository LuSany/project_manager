'use client'

import React from 'react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus, Trash2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// 类型定义
// ============================================================================

interface SubTask {
  id: string
  title: string
  description: string | null
  completed: boolean
  taskId: string
  parentId: string | null
  assigneeId: string | null
  users: {
    id: string
    name: string
    avatar: string | null
  } | null
  createdAt: string
  updatedAt: string
}

interface ProjectMember {
  userId: string
  user: {
    id: string
    name: string
    avatar: string | null
  }
}

interface SubTaskListProps {
  taskId: string
  projectId: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface CreateSubTaskData {
  title: string
  description?: string
  assigneeId?: string | null
}

// ============================================================================
// API 函数
// ============================================================================

async function fetchSubTasks(taskId: string): Promise<SubTask[]> {
  const response = await fetch(`/api/v1/tasks/${taskId}/subtasks`)
  const data: ApiResponse<SubTask[]> = await response.json()
  if (!data.success || !data.data) {
    throw new Error(data.error || '获取子任务列表失败')
  }
  return data.data
}

async function fetchProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const response = await fetch(`/api/v1/projects/${projectId}/members`)
  const data: ApiResponse<Array<{ userId: string; userName: string; userEmail: string }>> =
    await response.json()
  if (!data.success || !data.data) {
    throw new Error(data.error || '获取项目成员失败')
  }
  return data.data.map((m) => ({
    userId: m.userId,
    user: {
      id: m.userId,
      name: m.userName,
      avatar: null,
    },
  }))
}

async function createSubTask(taskId: string, data: CreateSubTaskData): Promise<SubTask> {
  const response = await fetch(`/api/v1/tasks/${taskId}/subtasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const result: ApiResponse<SubTask> = await response.json()
  if (!result.success || !result.data) {
    throw new Error(result.error || '创建子任务失败')
  }
  return result.data
}

async function toggleSubTask(taskId: string, subtaskId: string): Promise<SubTask> {
  const response = await fetch(`/api/v1/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {
    method: 'PUT',
  })
  const data: ApiResponse<SubTask> = await response.json()
  if (!data.success || !data.data) {
    throw new Error(data.error || '切换子任务状态失败')
  }
  return data.data
}

async function deleteSubTask(taskId: string, subtaskId: string): Promise<void> {
  const response = await fetch(`/api/v1/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || '删除子任务失败')
  }
  const text = await response.text()
  if (!text) return
  const data: ApiResponse<null> = JSON.parse(text)
  if (!data.success) {
    throw new Error(data.error || '删除子任务失败')
  }
}

// ============================================================================
// 子任务列表组件
// ============================================================================

export function SubTaskList({ taskId, projectId }: SubTaskListProps) {
  const queryClient = useQueryClient()
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  // 查询子任务列表
  const { data: subTasks = [], isLoading } = useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: () => fetchSubTasks(taskId),
  })

  // 查询项目成员列表
  const { data: projectMembers = [] } = useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: () => fetchProjectMembers(projectId),
  })

  // 创建子任务
  const createMutation = useMutation({
    mutationFn: (data: CreateSubTaskData) => createSubTask(taskId, data),
    onMutate: async (newData) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: ['subtasks', taskId] })

      // 乐观更新：先在本地添加新任务
      const optimisticSubTask: SubTask = {
        id: `temp-${Date.now()}`,
        title: newData.title,
        description: newData.description || null,
        completed: false,
        taskId,
        parentId: null,
        assigneeId: newData.assigneeId || null,
        users: newData.assigneeId
          ? projectMembers.find((m) => m.userId === newData.assigneeId)?.user || null
          : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      queryClient.setQueryData<SubTask[]>(['subtasks', taskId], (old = []) => [
        ...old,
        optimisticSubTask,
      ])

      return { optimisticSubTask }
    },
    onSuccess: (data, variables, context) => {
      // 用服务器返回的数据替换临时数据
      queryClient.setQueryData<SubTask[]>(['subtasks', taskId], (old = []) =>
        old.map((st) => (st.id === context?.optimisticSubTask.id ? data : st))
      )
    },
    onError: (error, variables, context) => {
      // 发生错误时回滚
      queryClient.setQueryData<SubTask[]>(['subtasks', taskId], (old = []) =>
        old.filter((st) => st.id !== context?.optimisticSubTask.id)
      )
      console.error('创建子任务失败:', error)
    },
  })

  // 切换完成状态
  const toggleMutation = useMutation({
    mutationFn: (subtaskId: string) => toggleSubTask(taskId, subtaskId),
    onMutate: async (subtaskId) => {
      await queryClient.cancelQueries({ queryKey: ['subtasks', taskId] })

      // 乐观更新：先在本地切换状态
      queryClient.setQueryData<SubTask[]>(['subtasks', taskId], (old = []) =>
        old.map((st) => (st.id === subtaskId ? { ...st, completed: !st.completed } : st))
      )
    },
    onError: (error, subtaskId) => {
      // 发生错误时回滚
      queryClient.setQueryData<SubTask[]>(['subtasks', taskId], (old = []) =>
        old.map((st) => (st.id === subtaskId ? { ...st, completed: !st.completed } : st))
      )
      console.error('切换子任务状态失败:', error)
    },
  })

  // 删除子任务
  const deleteMutation = useMutation({
    mutationFn: (subtaskId: string) => deleteSubTask(taskId, subtaskId),
    onMutate: async (subtaskId) => {
      await queryClient.cancelQueries({ queryKey: ['subtasks', taskId] })

      // 乐观更新：先在本地删除
      queryClient.setQueryData<SubTask[]>(['subtasks', taskId], (old = []) =>
        old.filter((st) => st.id !== subtaskId)
      )
    },
    onError: (error, subtaskId) => {
      // 发生错误时需要重新获取数据
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
      console.error('删除子任务失败:', error)
    },
  })

  // 处理添加新任务
  const handleAddSubTask = async () => {
    if (!newTaskTitle.trim()) return

    setIsAdding(true)
    try {
      await createMutation.mutateAsync({
        title: newTaskTitle,
        assigneeId: selectedAssignee,
      })
      setNewTaskTitle('')
      setSelectedAssignee(null)
    } catch (error) {
      console.error('添加子任务失败:', error)
      if (error instanceof Error) {
        alert(error.message)
      }
    } finally {
      setIsAdding(false)
    }
  }

  // 处理回车键
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddSubTask()
    }
  }

  // 计算完成进度
  const completedCount = subTasks.filter((st) => st.completed).length
  const totalCount = subTasks.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

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
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">{progress.toFixed(0)}% 完成</p>
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
          <Select
            value={selectedAssignee || ''}
            onValueChange={(v) => setSelectedAssignee(v === '__unassigned__' ? null : v)}
            disabled={isAdding}
          >
            <SelectTrigger className="w-[150px] shrink-0">
              <SelectValue placeholder="选择负责人" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__unassigned__">
                <div className="flex items-center gap-2">
                  <User className="text-muted-foreground h-4 w-4" />
                  <span>未分配</span>
                </div>
              </SelectItem>
              {projectMembers.map((member) => (
                <SelectItem key={member.userId} value={member.userId}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={member.user.avatar || undefined} />
                      <AvatarFallback className="text-xs">
                        {member.user.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{member.user.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleAddSubTask}
            disabled={isAdding || !newTaskTitle.trim()}
            size="icon"
          >
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        {/* 子任务列表 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : subTasks.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            <p className="text-sm">暂无子任务</p>
            <p className="mt-1 text-xs">添加第一个子任务开始追踪进度</p>
          </div>
        ) : (
          <div className="space-y-2">
            {subTasks.map((subTask) => (
              <div
                key={subTask.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-all',
                  subTask.completed
                    ? 'bg-muted/50 border-muted'
                    : 'bg-background hover:border-primary/50'
                )}
              >
                <Checkbox
                  checked={subTask.completed}
                  onCheckedChange={() => toggleMutation.mutate(subTask.id)}
                  disabled={toggleMutation.isPending}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'truncate text-sm font-medium',
                      subTask.completed && 'text-muted-foreground line-through'
                    )}
                  >
                    {subTask.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    {subTask.description && (
                      <p className="text-muted-foreground truncate text-xs">
                        {subTask.description}
                      </p>
                    )}
                    {/* 显示负责人信息 */}
                    {subTask.users && (
                      <div className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={subTask.users.avatar || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {subTask.users.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{subTask.users.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive h-8 w-8"
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
  )
}
