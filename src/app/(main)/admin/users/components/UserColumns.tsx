import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Edit, Trash2 } from 'lucide-react'
import { User, statusColors, roleLabels, statusLabels } from './types'

export type OpenEditDialogFn = (user: User) => void
export type OpenDeleteDialogFn = (user: User) => void

interface UserColumnsProps {
  openEditDialog: OpenEditDialogFn
  openDeleteDialog: OpenDeleteDialogFn
}

export function getUserColumns({
  openEditDialog,
  openDeleteDialog,
}: UserColumnsProps): ColumnDef<User>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? 'indeterminate'
                : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="选择所有行"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="选择行"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: '用户',
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <span className="text-primary text-sm font-medium">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'department',
      header: '部门/职位',
      cell: ({ row }) => {
        const user = row.original
        return (
          <p className="text-sm">
            {user.department || '-'}
            {user.position && ` / ${user.position}`}
          </p>
        )
      },
    },
    {
      accessorKey: 'role',
      header: '角色',
      cell: ({ row }) => {
        const role = row.getValue('role') as string
        return <Badge variant="outline">{roleLabels[role] || role}</Badge>
      },
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return <Badge className={statusColors[status]}>{statusLabels[status]}</Badge>
      },
    },
    {
      accessorKey: 'createdAt',
      header: '注册时间',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string
        return <span>{new Date(date).toLocaleDateString('zh-CN')}</span>
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => openEditDialog(user)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openDeleteDialog(user)}
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