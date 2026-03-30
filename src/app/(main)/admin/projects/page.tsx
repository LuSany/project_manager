'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
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
  Settings,
  Search,
} from 'lucide-react'
import { ProjectDialog } from './components/ProjectDialog'
import { MembersPanel } from './components/MembersPanel'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { api } from '@/lib/api/client'

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
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [searchFilter, setSearchFilter] = useState('')
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [projectMembers, setProjectMembers] = useState<Record<string, Member[]>>({})

  const filteredProjects = useMemo(() => {
    if (!searchFilter) return projects
    const q = searchFilter.toLowerCase()
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.users?.name?.toLowerCase().includes(q)
    )
  }, [projects, searchFilter])

  const columns = useMemo<ColumnDef<Project>[]>(
    () => [
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
            <div className="flex items-center gap-1">
              <MembersPanel
                projectId={project.id}
                members={projectMembers[project.id] || []}
                onMembersChange={() => handleMembersChange(project.id)}
              />
              <Link href={`/admin/projects/${project.id}/settings`}>
                <Button variant="ghost" size="icon" title="项目设置">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => openEditDialog(project)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openArchiveDialog(project)}
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
                onClick={() => openDeleteDialog(project)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        },
      },
    ],
    [projectMembers]
  )

  const table = useReactTable({
    data: filteredProjects,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  useEffect(() => {
    fetchProjects()
  }, [])

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
      toast({
        title: '获取失败',
        description: '获取项目列表失败，请检查网络连接',
        variant: 'destructive',
      })
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

  const handleDeleteProject = async () => {
    if (!selectedProject) return
    setSubmitting(true)
    try {
      const response = await api.delete('/admin/projects/' + selectedProject.id)
      if ((response as { success?: boolean }).success) {
        toast({ title: '删除成功', description: `项目「${selectedProject.name}」已删除` })
        setDeleteDialogOpen(false)
        setSelectedProject(null)
        await fetchProjects()
      }
    } catch (error) {
      toast({ title: '删除失败', description: '删除项目失败，请重试', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleArchiveProject = async () => {
    if (!selectedProject) return
    const isArchived = selectedProject.status === 'COMPLETED'
    const newStatus = isArchived ? 'PLANNING' : 'COMPLETED'
    const action = isArchived ? '取消归档' : '归档'

    setSubmitting(true)
    try {
      const response = await api.put(`/admin/projects/${selectedProject.id}`, {
        status: newStatus,
      })
      if ((response as { success?: boolean }).success) {
        toast({ title: '操作成功', description: `已${action}项目「${selectedProject.name}」` })
        setArchiveDialogOpen(false)
        setSelectedProject(null)
        await fetchProjects()
      }
    } catch (error) {
      toast({
        title: `${action}失败`,
        description: `${action}项目失败，请重试`,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (project: Project) => {
    setEditingProject(project)
    setDialogOpen(true)
  }

  const openDeleteDialog = (project: Project) => {
    setSelectedProject(project)
    setDeleteDialogOpen(true)
  }

  const openArchiveDialog = (project: Project) => {
    setSelectedProject(project)
    setArchiveDialogOpen(true)
  }

  const handleDialogSuccess = async () => {
    await fetchProjects()
  }

  const handleMembersChange = async (_projectId: string) => {
    await fetchProjects()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">项目管理</h1>
          <p className="text-muted-foreground">管理系统内所有项目及其成员</p>
        </div>
        <Button
          onClick={() => {
            setEditingProject(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          创建项目
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400">
                <Calendar className="h-6 w-6" />
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
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20 text-green-600 dark:text-green-400">
                <CheckSquare className="h-6 w-6" />
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
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-500/20 text-gray-600 dark:text-gray-400">
                <Archive className="h-6 w-6" />
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>项目列表</CardTitle>
              <CardDescription>系统内所有项目的概览</CardDescription>
            </div>
            <div className="relative min-w-[200px]">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="搜索项目名称..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        暂无项目数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between space-x-2 px-4 py-4">
                <div className="text-muted-foreground text-sm">
                  共 {filteredProjects.length} 个项目
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <span className="text-sm">
                    第 {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1} 页
                  </span>
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editingProject}
        onSuccess={handleDialogSuccess}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除项目「{selectedProject?.name}
              」吗？此操作不可撤销，项目相关的所有数据将被永久删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProject?.status === 'COMPLETED' ? '取消归档' : '归档'}项目
            </DialogTitle>
            <DialogDescription>
              {selectedProject?.status === 'COMPLETED'
                ? `确定要将项目「${selectedProject?.name}」取消归档吗？`
                : `确定要归档项目「${selectedProject?.name}」吗？归档后项目将标记为已完成。`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setArchiveDialogOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button onClick={handleArchiveProject} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
