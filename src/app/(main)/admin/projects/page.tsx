'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api/client'
import { Loader2, Users, CheckSquare, AlertCircle, Calendar, Trash2 } from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  status: string
  startDate?: string
  endDate?: string
  createdAt: string
  owner: {
    id: string
    name: string
    email: string
  }
  _count?: {
    members: number
    tasks: number
    risks: number
  }
}

const statusColors: Record<string, string> = {
  PLANNING: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  PLANNING: '计划中',
  ACTIVE: '进行中',
  ON_HOLD: '暂停',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}

export default function ProjectsAdminPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
  })

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除项目"${name}"吗？此操作不可恢复。`)) {
      return
    }

    try {
      const response = await api.delete('/admin/projects/' + id)
      if ((response as { success?: boolean }).success) {
        setProjects(prev => prev.filter(p => p.id !== id))
        // 更新统计
        const updated = projects.filter(p => p.id !== id)
        setStats({
          total: updated.length,
          active: updated.filter(p => p.status === 'ACTIVE').length,
          completed: updated.filter(p => p.status === 'COMPLETED').length,
        })
      }
    } catch (error) {
      console.error('删除项目失败:', error)
      alert('删除项目失败，请重试')
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await api.get<Project[]>('/projects?all=true')
      // API 返回格式: { success: true, data: [...] }
      const data = (response as { data?: Project[] }).data || []
      setProjects(data)

      // 计算统计
      const total = data.length
      const active = data.filter((p) => p.status === 'ACTIVE').length
      const completed = data.filter((p) => p.status === 'COMPLETED').length
      setStats({ total, active, completed })
    } catch (error) {
      console.error('获取项目列表失败:', error)
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
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总项目数</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">进行中</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已完成</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 项目列表 */}
      <Card>
        <CardHeader>
          <CardTitle>项目列表</CardTitle>
          <CardDescription>系统内所有项目的概览</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>项目名称</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>成员数</TableHead>
                  <TableHead>任务数</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{project.name}</p>
                        {project.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{project.owner?.name || '-'}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[project.status]}>
                        {statusLabels[project.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{project._count?.members || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                        <span>{project._count?.tasks || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(project.createdAt).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(project.id, project.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}