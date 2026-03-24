'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { SkeletonList } from '@/components/ui/skeleton'
import { ClipboardList, Plus, MoreHorizontal, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate?: string
  project?: {
    id: string
    name: string
  }
}

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/v1/dashboard/my-tasks', {
          credentials: 'include',
        })
        const data = await response.json()
        if (data.success) {
          setTasks(data.data || [])
        }
      } catch (e) {
        console.error('获取任务失败:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'HIGH':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return '紧急'
      case 'HIGH':
        return '高'
      case 'MEDIUM':
        return '中'
      default:
        return '低'
    }
  }

  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { text: `逾期 ${Math.abs(diffDays)} 天`, color: 'text-red-500' }
    } else if (diffDays === 0) {
      return { text: '今天到期', color: 'text-orange-500' }
    } else if (diffDays === 1) {
      return { text: '明天到期', color: 'text-amber-500' }
    } else if (diffDays <= 7) {
      return { text: `${diffDays} 天后到期`, color: 'text-slate-500' }
    }
    return { text: date.toLocaleDateString('zh-CN'), color: 'text-slate-400' }
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/v1/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DONE' }),
      })
      if (response.ok) {
        setTasks(tasks.filter((t) => t.id !== taskId))
      }
    } catch (e) {
      console.error('完成任务失败:', e)
    }
  }

  return (
    <Card className="h-full shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <ClipboardList className="h-5 w-5 text-blue-500" />
          我的任务
          {!loading && tasks.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {tasks.length}
            </Badge>
          )}
        </CardTitle>
        <Link href="/tasks/new">
          <Button size="sm" variant="ghost" className="h-8 gap-1">
            <Plus className="h-4 w-4" />
            新建
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <SkeletonList count={4} />
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400">暂无待办任务</p>
            <Link href="/tasks/new">
              <Button variant="link" size="sm" className="mt-2">
                创建第一个任务
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 5).map((task) => {
              const dueInfo = formatDueDate(task.dueDate)
              return (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800/50"
                >
                  <Checkbox
                    className="data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500"
                    onCheckedChange={() => handleCompleteTask(task.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                        {task.title}
                      </span>
                      <Badge className={cn('px-1.5 py-0 text-xs', getPriorityColor(task.priority))}>
                        {getPriorityLabel(task.priority)}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      {task.project && <span className="truncate">{task.project.name}</span>}
                      {dueInfo && (
                        <span className={cn('flex items-center gap-1', dueInfo.color)}>
                          <Clock className="h-3 w-3" />
                          {dueInfo.text}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}

            {tasks.length > 5 && (
              <Link
                href="/tasks"
                className="block py-2 text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                查看全部 {tasks.length} 个任务
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
