'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, List, Columns } from 'lucide-react'

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
        ...(filterStatus && { status: filterStatus }),
        ...(filterPriority && { priority: filterPriority }),
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

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* 页面头部 */}
      <div className="via-background rounded-lg border-none bg-gradient-to-br from-[var(--brand-50)] to-[color-mix(in_oklch,var(--brand-100),transparent_50%)] p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-slate-800 dark:text-slate-100">任务管理</h1>
            <p className="text-slate-500 dark:text-slate-400">查看所有分配给您的任务</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="mr-2 h-4 w-4" />
              列表
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              <Columns className="mr-2 h-4 w-4" />
              看板
            </Button>
            <Button onClick={() => router.push('/tasks/new')}>
              <Plus className="mr-2 h-4 w-4" />
              新建任务
            </Button>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="flex items-center gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="状态" />
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
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="优先级" />
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
      </div>

      {/* 任务列表/看板 */}
      {loading ? (
        <div className="py-8 text-center text-slate-500 dark:text-slate-400">加载中...</div>
      ) : viewMode === 'kanban' ? (
        <div className="rounded-lg border border-slate-200 p-8 text-center dark:border-slate-700">
          <p className="mb-4 text-slate-500 dark:text-slate-400">看板视图仅在项目页面可用</p>
          <Button variant="outline" onClick={() => router.push('/projects')}>
            查看项目列表
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="p-4 text-left font-medium text-slate-600 dark:text-slate-300">
                  任务标题
                </th>
                <th className="p-4 text-left font-medium text-slate-600 dark:text-slate-300">
                  状态
                </th>
                <th className="p-4 text-left font-medium text-slate-600 dark:text-slate-300">
                  优先级
                </th>
                <th className="p-4 text-left font-medium text-slate-600 dark:text-slate-300">
                  进度
                </th>
                <th className="p-4 text-left font-medium text-slate-600 dark:text-slate-300">
                  截止日期
                </th>
                <th className="p-4 text-left font-medium text-slate-600 dark:text-slate-300">
                  项目
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-t border-slate-100 bg-white transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50"
                >
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-100">
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {task.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {task.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                      <div
                        className="h-2 rounded-full bg-blue-600"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {task.progress}%
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('zh-CN') : '-'}
                  </td>
                  <td className="p-4 text-sm">
                    <a
                      href={`/projects/${task.project?.id}`}
                      className="text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {task.project?.name || '-'}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </Button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
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
    </div>
  )
}
