import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, CheckSquare, Trash2, Edit, Archive, ArchiveRestore, Settings } from 'lucide-react'
import { Project, statusColors, statusLabels } from './types'
import { Member } from './types'
import Link from 'next/link'
import { MembersPanel } from './MembersPanel'

interface ProjectColumnsProps {
  projectMembers: Record<string, Member[]>
  handleMembersChange: (projectId: string) => void
  openEditDialog: (project: Project) => void
  openArchiveDialog: (project: Project) => void
  openDeleteDialog: (project: Project) => void
}

export function getProjectColumns({
  projectMembers,
  handleMembersChange,
  openEditDialog,
  openArchiveDialog,
  openDeleteDialog,
}: ProjectColumnsProps): ColumnDef<Project>[] {
  return [
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
        <Badge className={statusColors[row.original.status]}>{statusLabels[row.original.status]}</Badge>
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
  ]
}