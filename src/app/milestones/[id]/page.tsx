'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Edit, CheckCircle2, Clock } from 'lucide-react'
import type { Milestone } from '@/types/milestone'
import { MILESTONE_STATUS_LABELS, MILESTONE_STATUS_COLORS } from '@/types/milestone'

export default function MilestoneDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [milestoneId, setMilestoneId] = useState<string>('')
  const [milestone, setMilestone] = useState<Milestone | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then((p) => setMilestoneId(p.id))
  }, [params])

  useEffect(() => {
    if (milestoneId) {
      fetchMilestone()
    }
  }, [milestoneId])

  const fetchMilestone = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/v1/milestones/${milestoneId}`)
      const data = await response.json()

      if (data.success) {
        setMilestone(data.data)
      }
    } catch (error) {
      console.error('获取里程碑详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center">加载中...</div>
  }

  if (!milestone) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-muted-foreground">里程碑不存在</p>
        <Button variant="link" onClick={() => router.back()}>
          返回
        </Button>
      </div>
    )
  }

  const isOverdue =
    milestone.dueDate &&
    new Date(milestone.dueDate) < new Date() &&
    milestone.status !== 'COMPLETED'

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* 头部 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{milestone.title}</h1>
          {milestone.projects && (
            <p className="text-muted-foreground">项目: {milestone.projects.name}</p>
          )}
        </div>
        <Badge className={MILESTONE_STATUS_COLORS[milestone.status]}>
          {MILESTONE_STATUS_LABELS[milestone.status]}
        </Badge>
      </div>

      {/* 基本信息 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {milestone.description && (
              <div>
                <p className="text-muted-foreground mb-1 text-sm">描述</p>
                <p>{milestone.description}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-sm">截止日期</p>
                <p className={isOverdue ? 'text-destructive font-medium' : ''}>
                  {milestone.dueDate
                    ? new Date(milestone.dueDate).toLocaleDateString('zh-CN')
                    : '未设置'}
                  {isOverdue && ' (已逾期)'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground mb-2 text-sm">进度</p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="bg-secondary h-3 w-full rounded-full">
                    <div
                      className="bg-primary h-3 rounded-full transition-all"
                      style={{ width: `${milestone.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium">{milestone.progress}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>任务统计</CardTitle>
          </CardHeader>
          <CardContent>
            {milestone.tasks && milestone.tasks.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">总任务数</span>
                  <span className="font-medium">{milestone.tasks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">已完成</span>
                  <span className="font-medium text-green-600">
                    {milestone.tasks.filter((t) => t.status === 'DONE').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">进行中</span>
                  <span className="font-medium text-blue-600">
                    {milestone.tasks.filter((t) => t.status === 'IN_PROGRESS').length}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">暂无关联任务</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 关联任务列表 */}
      {milestone.tasks && milestone.tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>关联任务</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {milestone.tasks.map((task) => (
                <div
                  key={task.id}
                  className="hover:bg-accent flex cursor-pointer items-center justify-between rounded-lg border p-3"
                  onClick={() => router.push(`/tasks/${task.id}`)}
                >
                  <div className="flex-1">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-muted-foreground text-xs">进度: {task.progress}%</p>
                  </div>
                  <Badge variant="outline">{task.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
