'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  List,
  Columns,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  ChevronRight,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  project?: {
    name: string
    id: string
  }
}

const statusConfig: Record<string, { label: string; color: string }> = {
  TODO: {
    label: '待办',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  },
  IN_PROGRESS: {
    label: '进行中',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  REVIEW: {
    label: '待审核',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  TESTING: {
    label: '测试中',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  DONE: {
    label: '已完成',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: '低', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' },
  MEDIUM: {
    label: '中',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  HIGH: {
    label: '高',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  URGENT: { label: '紧急', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

// 统计卡片组件
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  loading,
}: {
  title: string
  value: number
  icon: React.ElementType
  color: 'blue' | 'amber' | 'emerald' | 'red'
  loading?: boolean
}) {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      iconText: 'text-blue-600 dark:text-blue-400',
      valueText: 'text-blue-700 dark:text-blue-300',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50',
      iconText: 'text-amber-600 dark:text-amber-400',
      valueText: 'text-amber-700 dark:text-amber-300',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      iconText: 'text-emerald-600 dark:text-emerald-400',
      valueText: 'text-emerald-700 dark:text-emerald-300',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      iconBg: 'bg-red-100 dark:bg-red-900/50',
      iconText: 'text-red-600 dark:text-red-400',
      valueText: 'text-red-700 dark:text-red-300',
    },
  }

  const styles = colorStyles[color]

  return (
    <Card className={cn('border-transparent transition-all duration-200', styles.bg)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className={cn('text-2xl font-bold', styles.valueText)}>{value}</p>
            )}
          </div>
          <div className={cn('rounded-lg p-2.5', styles.iconBg)}>
            <Icon className={cn('h-5 w-5', styles.iconText)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 任务卡片组件（用于替代表格行）
function TaskCard({ task }: { task: Task }) {
  const statusStyle = statusConfig[task.status] || statusConfig.TODO
  const priorityStyle = priorityConfig[task.priority] || priorityConfig.LOW

  const formatDueDate = (dateStr?: string | null) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: `逾期 ${Math.abs(diffDays)} 天`, color: 'text-red-500' }
    if (diffDays === 0) return { text: '今天到期', color: 'text-orange-500' }
    if (diffDays === 1) return { text: '明天到期', color: 'text-amber-500' }
    if (diffDays <= 7) return { text: `${diffDays} 天后到期`, color: 'text-slate-500' }
    return { text: date.toLocaleDateString('zh-CN'), color: 'text-slate-400' }
  }

  const dueInfo = formatDueDate(task.dueDate)

  return (
    <Card className="group rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:border-blue-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* 复选框区域 */}
          <div className="pt-1">
            <button className="flex h-5 w-5 items-center justify-center rounded border border-slate-300 transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-slate-600 dark:hover:border-blue-400 dark:hover:bg-blue-950/30">
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="min-w-0 flex-1">
            {/* 标题行 */}
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="line-clamp-1 text-base font-medium text-slate-800 dark:text-slate-100">
                {task.title}
              </h3>
              <Badge
                className={cn('shrink-0 px-1.5 py-0 text-xs font-medium', priorityStyle.color)}
              >
                {priorityStyle.label}
              </Badge>
            </div>

            {/* 描述 */}
            {task.description && (
              <p className="mb-3 line-clamp-1 text-sm text-slate-500 dark:text-slate-400">
                {task.description}
              </p>
            )}

            {/* 元信息 */}
            <div className="flex items-center gap-3 text-xs">
              <Badge className={cn('px-1.5 py-0 font-normal', statusStyle.color)}>
                {statusStyle.label}
              </Badge>

              {task.project && (
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <ClipboardList className="h-3 w-3" />
                  {task.project.name}
                </span>
              )}

              {dueInfo && (
                <span className={cn('flex items-center gap-1', dueInfo.color)}>
                  <Calendar className="h-3 w-3" />
                  {dueInfo.text}
                </span>
              )}
            </div>

            {/* 进度条 */}
            {task.progress > 0 && (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">进度</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {task.progress}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                  <div
                    className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 箭头 */}
          <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-slate-300 transition-colors group-hover:text-blue-500 dark:text-slate-600" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function GlobalTasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        pageSize: '10',
        ...(filterStatus && filterStatus !== 'all' && { status: filterStatus }),
        ...(filterPriority && filterPriority !== 'all' && { priority: filterPriority }),
      })

      const response = await fetch(`/api/v1/tasks?${searchParams.toString()}`)
      const data = await response.json()

      if (data.success) {
        setTasks(data.data.items || [])
        setTotalPages(data.data.totalPages || 1)
      }
    } catch (err) {
      console.error('获取任务列表失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [page, filterStatus, filterPriority])

  // 统计数据
  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'TODO').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    urgent: tasks.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length,
  }

  return (
    <div className="space-y-6 pb-8">
      {/* 页面头部 */}
      <Card className="via-background border-none bg-gradient-to-br from-[var(--brand-50)] to-[color-mix(in_oklch,var(--brand-100),transparent_50%)] shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            {/* 左侧：标题和描述 */}
            <div>
              <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">任务管理</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                共 {stats.total} 个任务 · {stats.inProgress} 个进行中
              </p>
            </div>

            {/* 右侧：视图切换和新建按钮 */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="gap-1.5"
                >
                  <List className="h-4 w-4" />
                  列表
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="gap-1.5"
                >
                  <Columns className="h-4 w-4" />
                  看板
                </Button>
              </div>
              <Button
                onClick={() => router.push('/tasks/new')}
                className="gap-1.5 bg-blue-600 shadow-sm hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                新建任务
              </Button>
            </div>
          </div>

          {/* 筛选器 */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-200/60 pt-4 dark:border-slate-700/60">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="TODO">待办</SelectItem>
                <SelectItem value="IN_PROGRESS">进行中</SelectItem>
                <SelectItem value="REVIEW">待审核</SelectItem>
                <SelectItem value="TESTING">测试中</SelectItem>
                <SelectItem value="DONE">已完成</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="全部优先级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部优先级</SelectItem>
                <SelectItem value="LOW">低</SelectItem>
                <SelectItem value="MEDIUM">中</SelectItem>
                <SelectItem value="HIGH">高</SelectItem>
                <SelectItem value="URGENT">紧急</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="任务总数"
          value={stats.total}
          icon={ClipboardList}
          color="blue"
          loading={loading}
        />
        <StatCard title="待办" value={stats.todo} icon={Clock} color="amber" loading={loading} />
        <StatCard
          title="进行中"
          value={stats.inProgress}
          icon={CheckCircle2}
          color="emerald"
          loading={loading}
        />
        <StatCard
          title="高优先级"
          value={stats.urgent}
          icon={AlertCircle}
          color="red"
          loading={loading}
        />
      </div>

      {/* 任务列表 */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="rounded-xl">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : viewMode === 'kanban' ? (
        <Card className="rounded-xl border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
              <Columns className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-1 text-lg font-medium text-slate-700 dark:text-slate-300">
              看板视图
            </h3>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              看板视图仅在项目详情页面可用
            </p>
            <Button variant="outline" onClick={() => router.push('/projects')}>
              查看项目列表
            </Button>
          </CardContent>
        </Card>
      ) : tasks.length === 0 ? (
        <Card className="rounded-xl border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
              <CheckCircle2 className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-1 text-lg font-medium text-slate-700 dark:text-slate-300">
              暂无任务
            </h3>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              开始创建您的第一个任务
            </p>
            <Button onClick={() => router.push('/tasks/new')} className="gap-1.5">
              <Plus className="h-4 w-4" />
              新建任务
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                上一页
              </Button>
              <span className="px-4 text-sm text-slate-500 dark:text-slate-400">
                第 {page} 页 / 共 {totalPages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
