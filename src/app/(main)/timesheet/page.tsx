'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  Plus,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  Timer,
} from 'lucide-react'
import Link from 'next/link'

interface TimeRecord {
  id: string
  project: { id: string; name: string }
  task?: { id: string; title: string }
  date: string
  hours: number
  description: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

interface TimeStats {
  totalHours: number
  approvedHours: number
  pendingHours: number
  thisWeek: number
}

export default function TimesheetPage() {
  const [records, setRecords] = useState<TimeRecord[]>([])
  const [stats, setStats] = useState<TimeStats>({
    totalHours: 0,
    approvedHours: 0,
    pendingHours: 0,
    thisWeek: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTimeRecords()
  }, [])

  const fetchTimeRecords = async () => {
    try {
      // TODO: 实现实际的API调用
      // const response = await fetch('/api/v1/timesheet')
      // const data = await response.json()

      // 模拟数据
      setRecords([
        {
          id: '1',
          project: { id: 'p1', name: '项目管理系统' },
          task: { id: 't1', title: '前端页面开发' },
          date: '2026-03-09',
          hours: 4,
          description: '完成工作台页面布局',
          status: 'APPROVED',
        },
        {
          id: '2',
          project: { id: 'p1', name: '项目管理系统' },
          task: { id: 't2', title: 'API接口开发' },
          date: '2026-03-08',
          hours: 6,
          description: '评审管理API',
          status: 'PENDING',
        },
      ])

      setStats({
        totalHours: 10,
        approvedHours: 4,
        pendingHours: 6,
        thisWeek: 10,
      })
    } catch (error) {
      console.error('获取工时记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      PENDING: { label: '待审批', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
      APPROVED: { label: '已通过', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
      REJECTED: { label: '已拒绝', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    }
    return config[status] || config.PENDING
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">机时管理</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">记录和管理测试资源机时</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          新建工时记录
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              本周工时
            </CardTitle>
            <Timer className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.thisWeek}h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              总工时
            </CardTitle>
            <Clock className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.totalHours}h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              已审批
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.approvedHours}h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              待审批
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.pendingHours}h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 工时记录列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">工时记录</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Calendar className="h-4 w-4" />
                本周
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <FileText className="h-4 w-4" />
                导出
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 mb-4">暂无工时记录</p>
              <Button variant="outline">添加第一条记录</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => {
                const statusConfig = getStatusBadge(record.status)
                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/projects/${record.project.id}`}
                            className="font-medium text-slate-900 dark:text-slate-100 hover:text-primary"
                          >
                            {record.project.name}
                          </Link>
                          {record.task && (
                            <>
                              <span className="text-slate-300 dark:text-slate-600">/</span>
                              <Link
                                href={`/projects/${record.project.id}/tasks/${record.task.id}`}
                                className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary"
                              >
                                {record.task.title}
                              </Link>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {record.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {record.hours}h
                        </div>
                        <div className="text-xs text-slate-400">{formatDate(record.date)}</div>
                      </div>
                      <Badge className={statusConfig.className}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}