'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api/client'
import {
  Loader2,
  Users,
  CheckSquare,
  Calendar,
  Trash2,
  Edit,
  Archive,
  ArchiveRestore,
  Plus,
} from 'lucide-react'
import { ProjectDialog } from './components/ProjectDialog'
import { MembersPanel } from './components/MembersPanel'
import { ColumnDef } from '@tanstack/react-table'

interface Member {
  id: string
  userId: string
  projectId: string
  role: string
  joinedAt: string
  users: {
    id: string
    name: string
    email: string
  }
}

interface Project {
  id: string
  name: string
  description?: string
  status: string
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
  ownerId: string
  users: {
    id: string
    name: string
    email: string
  }
  _count?: {
    project_members: number
    tasks: number
  }
}

const statusColors: Record<string, string> = {
  PLANNING: 'bg-blue-500/20 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  ACTIVE: 'bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  ON_HOLD: 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
  COMPLETED: 'bg-gray-500/20 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400',
  CANCELLED: 'bg-red-500/20 text-red-700 dark:bg-red-500/10 dark:text-red-400',
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [projectMembers, setProjectMembers] = useState<Record<string, Member[]>>({})

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const response = await api.get<Project[]>('/admin/projects')
      const data = (response as { data?: Project[] }).data || []
      setProjects(data)

      const total = data.length
      const active = data.filter((p) => p.status === 'ACTIVE').length
      const completed = data.filter((p) => p.status === 'COMPLETED').length
      setStats({ total, active, completed })

      await fetchAllMembers(data.map((p) => p.id))
    } catch (error) {
      console.error('获取项目列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllMembers = async (projectIds: string[]) => {
    try {
      const membersData: Record<string, Member[]> = {}
      for (const projectId of projectIds) {
        const response = await api.get<Member[]>(`/projects/${projectId}/members`)
        if ((response as { success?: boolean }).success) {
          membersData[projectId] = (response as { data?: Member[] }).data || []
        }
      }
      setProjectMembers(membersData)
    } catch (error) {
      console.error('获取成员列表失败:', error)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除项目"${name}"吗？此操作不可恢复。`)) {
      return
    }

    try {
      const response = await api.delete('/admin/projects/' + id)
      if ((response as { success?: boolean }).success) {
        await fetchProjects()
      }
    } catch (error) {
      console.error('删除项目失败:', error)
      alert('删除项目失败，请重试')
    }
  }

  const handleArchive = async (id: string, name: string, currentStatus: string) => {
    const isArchived = currentStatus === 'COMPLETED'
    const action = isArchived ? '取消归档' : '归档'
    const newStatus = isArchived ? 'PLANNING' : 'COMPLETED'

    if (!confirm(`确定要${action}项目"${name}"吗？`)) {
      return
    }

    try {
      const response = await api.put(`/admin/projects/${id}`, {
        status: newStatus,
      })
      if ((response as { success?: boolean }).success) {
        await fetchProjects()
      }
    } catch (error) {
      console.error(`${action}项目失败:`, error)
      alert(`${action}项目失败，请重试`)
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingProject(null)
    setDialogOpen(true)
  }

  const handleDialogSuccess = async () => {
    await fetchProjects()
  }

  const handleMembersChange = async (projectId: string) => {
    await fetchProjects()
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: 'name',
      header: '项目',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          {row.original.description && (
            <p className="text-muted-foreground max-w-xs truncate text-sm">
              {row.original.description}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'users.name',
      header: '负责人',
      cell: ({ row }) => <p className="text-sm">{row.original.users?.name || '-'}</p>,
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => (
        <Badge className={statusColors[row.original.status]}>
          {statusLabels[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: 'members',
      header: '成员',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Users className="text-muted-foreground h-4 w-4" />
          <span>{row.original._count?.project_members || 0}</span>
        </div>
      ),
    },
    {
      accessorKey: 'tasks',
      header: '任务',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <CheckSquare className="text-muted-foreground h-4 w-4" />
          <span>{row.original._count?.tasks || 0}</span>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: '创建时间',
      cell: ({ row }) => (
        <span>{new Date(row.original.createdAt).toLocaleDateString('zh-CN')}</span>
      ),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const project = row.original
        const isArchived = project.status === 'COMPLETED'

        return (
          <div className="flex items-center gap-2">
            <MembersPanel
              projectId={project.id}
              members={projectMembers[project.id] || []}
              onMembersChange={() => handleMembersChange(project.id)}
            />
            <Button variant="ghost" size="icon" onClick={() => handleEdit(project)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleArchive(project.id, project.name, project.status)}
              title={isArchived ? '取消归档' : '归档'}
            >
              {isArchived ? (
                <ArchiveRestore className="h-4 w-4" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(project.id, project.name)}
            >
              <Trash2 className="text-destructive h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">项目管理</h1>
          <p className="text-muted-foreground">管理系统内所有项目及其成员</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          创建项目
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">总项目数</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/20">
                <CheckSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">进行中</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-500/20">
                <Archive className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">已完成</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>项目列表</CardTitle>
          <CardDescription>系统内所有项目的概览</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={projects} />
        </CardContent>
      </Card>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editingProject}
        onSuccess={handleDialogSuccess}
      />
    </div>
  )
}
