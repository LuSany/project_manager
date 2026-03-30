'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus,
  FolderOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ArrowRight,
  Calendar,
  PauseCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Project {
  id: string
  name: string
  description: string | null
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
  progress?: number
}

const statusConfig = {
  PLANNING: {
    label: '计划中',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    icon: Clock,
    bgColor: 'hover:border-amber-200 dark:hover:border-amber-800',
  },
  ACTIVE: {
    label: '进行中',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: FolderOpen,
    bgColor: 'hover:border-emerald-200 dark:hover:border-emerald-800',
  },
  ON_HOLD: {
    label: '已暂停',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    icon: PauseCircle,
    bgColor: 'hover:border-orange-200 dark:hover:border-orange-800',
  },
  COMPLETED: {
    label: '已完成',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: CheckCircle2,
    bgColor: 'hover:border-blue-200 dark:hover:border-blue-800',
  },
  CANCELLED: {
    label: '已取消',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
    icon: AlertCircle,
    bgColor: 'hover:border-slate-200 dark:hover:border-slate-700',
  },
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
  color: 'blue' | 'amber' | 'emerald' | 'slate'
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
    slate: {
      bg: 'bg-slate-50 dark:bg-slate-950/30',
      iconBg: 'bg-slate-100 dark:bg-slate-900/50',
      iconText: 'text-slate-600 dark:text-slate-400',
      valueText: 'text-slate-700 dark:text-slate-300',
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

// 项目卡片组件
function ProjectCard({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
  const config = statusConfig[project.status]
  const StatusIcon = config.icon

  return (
    <Card
      className={cn(
        'group overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-200',
        'hover:shadow-lg dark:border-slate-700 dark:bg-slate-800',
        config.bgColor
      )}
    >
      <CardContent className="p-5">
        {/* 头部：标题和状态 */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-lg font-semibold text-slate-800 dark:text-slate-100">
            {project.name}
          </h3>
          <Badge className={cn('shrink-0 px-2 py-0.5 text-xs font-medium', config.color)}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        </div>

        {/* 描述 */}
        {project.description && (
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {project.description}
          </p>
        )}

        {/* 进度条（如果有） */}
        {project.progress !== undefined && (
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">完成进度</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {project.progress}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  project.status === 'COMPLETED'
                    ? 'bg-blue-500'
                    : project.status === 'ACTIVE'
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                )}
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-700">
          <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(project.createdAt).toLocaleDateString('zh-CN', {
              month: 'short',
              day: 'numeric',
            })}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(project.id)}
              className="text-xs text-slate-400 transition-colors hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
            >
              删除
            </button>
            <Link
              href={`/projects/${project.id}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              详情
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [statusStats, setStatusStats] = useState({
    active: 0,
    completed: 0,
    planning: 0,
    onHold: 0,
    cancelled: 0,
  })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [jumpPage, setJumpPage] = useState('')

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      })

      const response = await fetch('/api/v1/projects?' + searchParams, {
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (data.success) {
        setProjects(data.data.items)
        setTotalCount(data.data.total || 0)
        setTotalPages(data.data.totalPages || 0)
        if (data.data.stats) {
          setStatusStats(data.data.stats)
        }
      }
    } catch (error) {
      console.error('获取项目列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个项目吗？')) return

    try {
      const response = await fetch('/api/v1/projects/' + id, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (data.success) {
        setProjects((prev) => prev.filter((p) => p.id !== id))
      }
    } catch (error) {
      console.error('删除项目失败:', error)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [page, pageSize])

  const stats = {
    total: totalCount,
    active: statusStats.active,
    completed: statusStats.completed,
    planning: statusStats.planning,
  }

  return (
    <div className="space-y-6 pb-8">
      {/* 页面头部 - 渐变背景卡片 */}
      <Card className="via-background border-none bg-gradient-to-br from-[var(--brand-50)] to-[color-mix(in_oklch,var(--brand-100),transparent_50%)] shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">项目管理</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                共 {stats.total} 个项目 · {stats.active} 个进行中
              </p>
            </div>
            <Button
              onClick={() => router.push('/projects/new')}
              className="gap-2 bg-blue-600 shadow-sm hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              新建项目
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="项目总数"
          value={stats.total}
          icon={FolderOpen}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="进行中"
          value={stats.active}
          icon={Clock}
          color="amber"
          loading={loading}
        />
        <StatCard
          title="已完成"
          value={stats.completed}
          icon={CheckCircle2}
          color="emerald"
          loading={loading}
        />
        <StatCard
          title="计划中"
          value={stats.planning}
          icon={AlertCircle}
          color="slate"
          loading={loading}
        />
      </div>

      {/* 项目列表 */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="rounded-xl">
              <CardContent className="p-5">
                <Skeleton className="mb-3 h-6 w-3/4" />
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="mb-4 h-4 w-2/3" />
                <div className="border-t border-slate-100 pt-4 dark:border-slate-700">
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="rounded-xl border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
              <FolderOpen className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-1 text-lg font-medium text-slate-700 dark:text-slate-300">
              暂无项目
            </h3>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              开始创建您的第一个项目
            </p>
            <Button onClick={() => router.push('/projects/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              新建项目
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onDelete={handleDelete} />
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 pt-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>每页显示</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value))
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                  <SelectItem value="48">48</SelectItem>
                  <SelectItem value="96">96</SelectItem>
                </SelectContent>
              </Select>
              <span>条</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="px-3 text-sm text-slate-600 dark:text-slate-400">
                第 {page} / {totalPages} 页
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="ml-4 flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">跳转到</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={jumpPage}
                  onChange={(e) => setJumpPage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const pageNum = parseInt(jumpPage)
                      if (pageNum >= 1 && pageNum <= totalPages) {
                        setPage(pageNum)
                        setJumpPage('')
                      }
                    }
                  }}
                  placeholder="页码"
                  className="h-8 w-20 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!jumpPage || parseInt(jumpPage) < 1 || parseInt(jumpPage) > totalPages}
                  onClick={() => {
                    const pageNum = parseInt(jumpPage)
                    if (pageNum >= 1 && pageNum <= totalPages) {
                      setPage(pageNum)
                      setJumpPage('')
                    }
                  }}
                >
                  跳转
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
