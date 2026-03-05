'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api/client'
import { Loader2, Plus, Calendar, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'

interface Milestone {
  id: string
  title: string
  description?: string
  status: string
  progress: number
  dueDate?: string
  createdAt: string
  _count?: {
    tasks: number
  }
}

const statusColors: Record<string, string> = {
  NOT_STARTED: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  NOT_STARTED: '未开始',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}

export default function ProjectMilestonesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [projectId, setProjectId] = useState<string>('')

  useEffect(() => {
    params.then((p) => {
      setProjectId(p.id)
      fetchMilestones(p.id)
    })
  }, [params])

  const fetchMilestones = async (pid: string) => {
    try {
      const response = await api.get(`/projects/${pid}/milestones`)
      setMilestones((response as { data?: Milestone[] }).data || [])
    } catch (error) {
      console.error('获取里程碑失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">里程碑管理</h1>
          <p className="text-muted-foreground">管理项目里程碑和关键节点</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          新建里程碑
        </Button>
      </div>

      {milestones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            暂无里程碑数据
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {milestones.map((milestone) => (
            <Card key={milestone.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{milestone.title}</h3>
                      <Badge className={statusColors[milestone.status]}>
                        {statusLabels[milestone.status]}
                      </Badge>
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {milestone.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        {milestone._count?.tasks || 0} 个任务
                      </span>
                      {milestone.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(milestone.dueDate).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{milestone.progress}%</div>
                    <p className="text-sm text-muted-foreground">完成进度</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}