'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { TaskStatusBadge } from '@/components/tasks/task-status-badge'
import { SortableTaskCard, type Task } from './kanban/SortableTaskCard'

// ============================================================================
// 类型定义
// ============================================================================

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

type TaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'TESTING'
  | 'DONE'
  | 'CANCELLED'
  | 'DELAYED'
  | 'BLOCKED'

type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

interface TaskKanbanProps {
  projectId: string
  onUpdate?: (taskId: string, data: Partial<Task>) => void
  onOpenDetail?: (taskId: string) => void
}

interface KanbanColumn {
  id: TaskStatus
  title: string
  status: TaskStatus
}

// ============================================================================
// 看板列配置
// ============================================================================

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'TODO', title: '待办', status: 'TODO' },
  { id: 'IN_PROGRESS', title: '进行中', status: 'IN_PROGRESS' },
  { id: 'REVIEW', title: '待评审', status: 'REVIEW' },
  { id: 'TESTING', title: '测试中', status: 'TESTING' },
  { id: 'DONE', title: '已完成', status: 'DONE' },
  { id: 'CANCELLED', title: '已取消', status: 'CANCELLED' },
  { id: 'DELAYED', title: '延期', status: 'DELAYED' },
  { id: 'BLOCKED', title: '阻塞', status: 'BLOCKED' },
]

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: '待办',
  IN_PROGRESS: '进行中',
  REVIEW: '待评审',
  TESTING: '测试中',
  DONE: '已完成',
  CANCELLED: '已取消',
  DELAYED: '延期',
  BLOCKED: '阻塞',
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  CRITICAL: '紧急',
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  MEDIUM: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  HIGH: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  CRITICAL: 'bg-red-100 text-red-800 hover:bg-red-200',
}

// 导出类型和常量供其他组件使用
export type { Task, TaskStatus, TaskPriority }
export { STATUS_LABELS, PRIORITY_LABELS, PRIORITY_COLORS, KANBAN_COLUMNS }

// ============================================================================
// API 函数
// ============================================================================

async function fetchProjectTasks(projectId: string): Promise<Task[]> {
  const searchParams = new URLSearchParams({
    projectId,
    pageSize: '100',
  })

  const response = await fetch(`/api/v1/tasks?${searchParams}`)
  const data: ApiResponse<{ items: Task[] }> = await response.json()

  if (!data.success || !data.data) {
    throw new Error(data.error || '获取任务列表失败')
  }

  return data.data.items
}

async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
  const response = await fetch(`/api/v1/tasks/${taskId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })

  const data: ApiResponse<Task> = await response.json()

  if (!data.success || !data.data) {
    throw new Error(data.error || '更新任务状态失败')
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
// 看板列组件
// ============================================================================

interface KanbanColumnComponentProps {
  column: KanbanColumn
  tasks: Task[]
  onDragStart: (event: DragStartEvent) => void
  onUpdate?: (taskId: string, data: Partial<Task>) => void
  onOpenDetail?: (taskId: string) => void
  isOver?: boolean
}

function KanbanColumnComponent({
  column,
  tasks,
  onDragStart,
  onUpdate,
  onOpenDetail,
  isOver,
}: KanbanColumnComponentProps) {
  return (
    <div className="flex max-w-[350px] min-w-[280px] flex-col">
      {/* 列头 */}
      <div className="mb-4 flex items-center justify-between px-1">
        <TaskStatusBadge status={column.status} showIcon={false} showLabel={true} size="sm" />
        <span className="text-sm text-muted-foreground ml-2">{tasks.length}</span>
      </div>

      {/* 任务列表 */}
      <div
        className={cn(
          'min-h-[400px] flex-1 rounded-lg border-2 border-dashed p-3',
          'bg-muted/20 transition-colors',
          'hover:bg-muted/30',
          isOver && 'border-primary bg-primary/5'
        )}
      >
        {tasks.length === 0 ? (
          <div className="text-muted-foreground flex h-full items-center justify-center py-8">
            <p className="text-xs">拖拽任务到此处</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} data-task-id={task.id} className="touch-none">
                <SortableTaskCard
                  task={task}
                  isDragging={false}
                  onUpdate={onUpdate}
                  onOpenDetail={onOpenDetail}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// 任务看板主组件
// ============================================================================

export function TaskKanban({ projectId, onUpdate, onOpenDetail }: TaskKanbanProps) {
  const queryClient = useQueryClient()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null)

  // 传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // 查询任务列表
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectId, 'kanban'],
    queryFn: () => fetchProjectTasks(projectId),
  })

  // 按状态分组任务
  const tasksByStatus: Record<TaskStatus, Task[]> = {
    TODO: tasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
    REVIEW: tasks.filter((t) => t.status === 'REVIEW'),
    TESTING: tasks.filter((t) => t.status === 'TESTING'),
    DONE: tasks.filter((t) => t.status === 'DONE'),
    CANCELLED: tasks.filter((t) => t.status === 'CANCELLED'),
    DELAYED: tasks.filter((t) => t.status === 'DELAYED'),
    BLOCKED: tasks.filter((t) => t.status === 'BLOCKED'),
  }

  // 更新任务状态
  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      updateTaskStatus(taskId, status),
    onMutate: async ({ taskId, status }) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId, 'kanban'] })

      // 乐观更新：先在本地更新状态
      queryClient.setQueryData<Task[]>(['tasks', projectId, 'kanban'], (old = []) =>
        old.map((task) => (task.id === taskId ? { ...task, status } : task))
      )

      return { taskId }
    },
    onSuccess: (data, variables) => {
      // 用服务器返回的数据更新
      queryClient.setQueryData<Task[]>(['tasks', projectId, 'kanban'], (old = []) =>
        old.map((task) => (task.id === variables.taskId ? data : task))
      )
    },
    onError: (error, variables) => {
      // 发生错误时回滚
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId, 'kanban'] })
      console.error('更新任务状态失败:', error)
    },
  })

  // 更新任务属性
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) =>
      updateTask(taskId, updates),
    onMutate: async ({ taskId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId, 'kanban'] })

      // 乐观更新
      queryClient.setQueryData<Task[]>(['tasks', projectId, 'kanban'], (old = []) =>
        old.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
      )

      return { taskId }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<Task[]>(['tasks', projectId, 'kanban'], (old = []) =>
        old.map((task) => (task.id === variables.taskId ? data : task))
      )
      // 调用外部回调
      onUpdate?.(variables.taskId, variables.updates)
    },
    onError: (error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId, 'kanban'] })
      console.error('更新任务失败:', error)
    },
  })

  // 处理任务更新
  const handleUpdate = (taskId: string, updates: Partial<Task>) => {
    updateTaskMutation.mutate({ taskId, updates })
  }

  // 处理拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const taskId = active.id as string
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      setActiveTask(task)
    }
  }

  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    setOverColumn(null)

    if (!over) return

    const taskId = active.id as string
    const targetStatus = over.id as TaskStatus

    // 如果拖拽到不同的状态列，更新任务状态
    const task = tasks.find((t) => t.id === taskId)
    if (task && task.status !== targetStatus) {
      updateStatusMutation.mutate({ taskId, status: targetStatus })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* 拖拽上下文 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* 看板容器 - 水平滚动 */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex h-full gap-6 px-1">
            {KANBAN_COLUMNS.map((column) => (
              <div key={column.id} id={column.id} className="flex-shrink-0">
                <KanbanColumnComponent
                  column={column}
                  tasks={tasksByStatus[column.status]}
                  onDragStart={handleDragStart}
                  onUpdate={handleUpdate}
                  onOpenDetail={onOpenDetail}
                  isOver={overColumn === column.status}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 拖拽覆盖层 - 显示拖拽中的任务 */}
        <DragOverlay>
          {activeTask ? (
            <div className="scale-105 rotate-3">
              <SortableTaskCard
                task={activeTask}
                isDragging={true}
                onUpdate={handleUpdate}
                onOpenDetail={onOpenDetail}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}