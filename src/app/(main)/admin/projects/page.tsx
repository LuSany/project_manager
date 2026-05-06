'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  SortingState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Search } from 'lucide-react'
import { ProjectPageHeader } from './components/ProjectPageHeader'
import { ProjectStats } from './components/ProjectStats'
import { ProjectTable } from './components/ProjectTable'
import { DeleteProjectDialog } from './components/DeleteProjectDialog'
import { ArchiveProjectDialog } from './components/ArchiveProjectDialog'
import { ProjectDialog } from './components/ProjectDialog'
import { MembersPanel } from './components/MembersPanel'
import { Project, Member } from './components/types'
import { getProjectColumns } from './components/ProjectColumns'
import { createProjectApiHandlers, ProjectApiHandlers } from './components/ProjectApiHandlers'

export default function ProjectsAdminPage() {
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

  const apiHandlers = createProjectApiHandlers(
    setProjects,
    setLoading,
    setStats,
    setProjectMembers,
    setDeleteDialogOpen,
    setArchiveDialogOpen,
    setSelectedProject,
    setSubmitting
  )

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

  const columns = getProjectColumns({
    projectMembers,
    handleMembersChange: (projectId: string) => {
      apiHandlers.fetchAllMembers([projectId])
    },
    openEditDialog: (project: Project) => {
      setEditingProject(project)
      setDialogOpen(true)
    },
    openArchiveDialog: (project: Project) => {
      setSelectedProject(project)
      setArchiveDialogOpen(true)
    },
    openDeleteDialog: (project: Project) => {
      setSelectedProject(project)
      setDeleteDialogOpen(true)
    },
  })

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
    apiHandlers.fetchProjects()
  }, [])

  const handleDialogSuccess = async () => {
    await apiHandlers.fetchProjects()
  }

  return (
    <div className="space-y-6">
      <ProjectPageHeader
        onCreateProject={() => {
          setEditingProject(null)
          setDialogOpen(true)
        }}
      />

      <ProjectStats stats={stats} />

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
          <ProjectTable
            table={table}
            columns={columns}
            loading={loading}
            filteredCount={filteredProjects.length}
          />
        </CardContent>
      </Card>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editingProject}
        onSuccess={handleDialogSuccess}
      />

      <DeleteProjectDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        projectName={selectedProject?.name}
        onConfirm={() => apiHandlers.handleDeleteProject(selectedProject)}
        submitting={submitting}
      />

      <ArchiveProjectDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        projectStatus={selectedProject?.status}
        projectName={selectedProject?.name}
        onConfirm={() => apiHandlers.handleArchiveProject(selectedProject)}
        submitting={submitting}
      />
    </div>
  )
}