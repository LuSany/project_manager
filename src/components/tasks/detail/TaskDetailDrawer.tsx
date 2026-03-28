'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, FileText, CheckSquare, MessageSquare, Tag } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SubTaskList } from '@/components/tasks/SubTaskList'
import { DetailTab } from './DetailTab'
import { CommentsTab } from './CommentsTab'
import { TagsTab } from './TagsTab'

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
  projectId: string
  assignees?: Array<{
    user: { id: string; name: string; email: string }
  }>
}

interface TaskDetailDrawerProps {
  taskId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
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

// ============================================================================
// TaskDetailDrawer 组件
// ============================================================================

export function TaskDetailDrawer({ taskId, open, onOpenChange }: TaskDetailDrawerProps) {
  // 获取任务详情
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => fetchTask(taskId!),
    enabled: !!taskId && open,
  })

  // 当前激活的 Tab
  const [activeTab, setActiveTab] = useState('detail')

  // 任务 ID 变化时重置 Tab
  useEffect(() => {
    if (taskId) {
      setActiveTab('detail')
    }
  }, [taskId])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="truncate">{task?.title || '任务详情'}</SheetTitle>
          <SheetDescription className="sr-only">查看和编辑任务详情</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : task ? (
          <Tabs
            defaultValue="detail"
            value={activeTab}
            onValueChange={setActiveTab}
            className="mt-4"
          >
            <TabsList className="w-full">
              <TabsTrigger value="detail" className="flex-1">
                <FileText className="mr-1.5 h-4 w-4" />
                详情
              </TabsTrigger>
              <TabsTrigger value="subtasks" className="flex-1">
                <CheckSquare className="mr-1.5 h-4 w-4" />
                子任务
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex-1">
                <MessageSquare className="mr-1.5 h-4 w-4" />
                评论
              </TabsTrigger>
              <TabsTrigger value="tags" className="flex-1">
                <Tag className="mr-1.5 h-4 w-4" />
                标签
              </TabsTrigger>
            </TabsList>

            <TabsContent value="detail">
              <DetailTab taskId={task.id} />
            </TabsContent>

            <TabsContent value="subtasks">
              <SubTaskList taskId={task.id} projectId={task.projectId} />
            </TabsContent>

            <TabsContent value="comments">
              <CommentsTab taskId={task.id} />
            </TabsContent>

            <TabsContent value="tags">
              <TagsTab taskId={task.id} />
            </TabsContent>
          </Tabs>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
