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
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Calendar, User2 } from 'lucide-react'
import { Loader2, GripVertical } from 'lucide-react'

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
    user: {
      id: string
      name: string
      email: string
    }
  }>
}

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

const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: 'bg-gray-100 text-gray-800 border-gray-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  REVIEW: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  TESTING: 'bg-purple-100 text-purple-800 border-purple-200',
  DONE: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  DELAYED: 'bg-orange-100 text-orange-800 border-orange-200',
  BLOCKED: 'bg-gray-300 text-gray-700 border-gray-400',
}

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

// ============================================================================
// 可排序任务卡片组件
// ============================================================================

interface SortableTaskCardProps {
  task: Task
  isDragging: boolean
}

function SortableTaskCard({ task, isDragging }: SortableTaskCardProps) {
  return (
    <Card
      className={cn(
        'cursor-grab p-4 transition-all active:cursor-grabbing',
        'hover:border-primary/50 hover:shadow-md',
        isDragging && 'scale-95 rotate-2 opacity-50 shadow-xl'
      )}
    >
      {/* 拖拽手柄 */}
      <div className="mb-2 flex items-start gap-2">
        <GripVertical className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold">{task.title}</h4>
        </div>
      </div>

      {/* 优先级徽章 */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge
          variant="secondary"
          className={cn('text-xs', PRIORITY_COLORS[task.priority as TaskPriority])}
        >
          {PRIORITY_LABELS[task.priority as TaskPriority]}
        </Badge>

        {/* 截止日期 */}
        {task.dueDate && (
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" />
            <span>{new Date(task.dueDate).toLocaleDateString('zh-CN')}</span>
          </div>
        )}
      </div>

      {/* 负责人 */}
      {task.assignees && task.assignees.length > 0 && (
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <User2 className="h-3 w-3" />
          <div className="flex -space-x-1">
            {task.assignees.slice(0, 3).map((assignee) => (
              <div
                key={assignee.user.id}
                className="bg-primary/10 border-background flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-medium"
                title={assignee.user.name}
              >
                {assignee.user.name.charAt(0)}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div className="bg-muted border-background flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 进度条 */}
      {task.progress > 0 && (
        <div className="mt-3">
          <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  )
}

// ============================================================================
// 看板列组件
// ============================================================================

interface KanbanColumnComponentProps {
  column: KanbanColumn
  tasks: Task[]
  onDragStart: (event: DragStartEvent) => void
}

function KanbanColumnComponent({ column, tasks, onDragStart }: KanbanColumnComponentProps) {
  return (
    <div className="flex max-w-[350px] min-w-[300px] flex-col">
      {/* 列头 */}
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{column.title}</h3>
          <Badge variant="secondary" className={cn('text-xs', STATUS_COLORS[column.status])}>
            {tasks.length}
          </Badge>
        </div>
      </div>

      {/* 任务列表 */}
      <div
        className={cn(
          'min-h-[400px] flex-1 rounded-lg border-2 border-dashed p-3',
          'bg-muted/20 transition-colors',
          'hover:bg-muted/30'
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
                <SortableTaskCard task={task} isDragging={false} />
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

export function TaskKanban({ projectId }: TaskKanbanProps) {
  const queryClient = useQueryClient()
  const [activeTask, setActiveTask] = useState<Task | null>(null)

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
                />
              </div>
            ))}
          </div>
        </div>

        {/* 拖拽覆盖层 - 显示拖拽中的任务 */}
        <DragOverlay>
          {activeTask ? (
            <div className="scale-105 rotate-3">
              <SortableTaskCard task={activeTask} isDragging={true} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
