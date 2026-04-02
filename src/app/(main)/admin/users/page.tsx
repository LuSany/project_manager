'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Search, Loader2, UserPlus, Edit, Trash2, Users, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BulkActionsBar } from './components/BulkActionsBar'
import { CSVImportDialog } from './components/CSVImportDialog'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  email: string
  name: string
  department?: string
  position?: string
  role: string
  status: string
  phone?: string
  avatar?: string
  createdAt: string
  updatedAt?: string
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
  ACTIVE: 'bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  DISABLED: 'bg-red-500/20 text-red-700 dark:bg-red-500/10 dark:text-red-400',
}

const statusLabels: Record<string, string> = {
  PENDING: '待审批',
  ACTIVE: '已激活',
  DISABLED: '已禁用',
}

const roleLabels: Record<string, string> = {
  ADMIN: '系统管理员',
  PROJECT_ADMIN: '项目管理员',
  PROJECT_OWNER: '项目所有者',
  PROJECT_MEMBER: '项目成员',
  EMPLOYEE: '普通员工',
}

const createUserSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6个字符'),
  role: z.enum(['ADMIN', 'PROJECT_ADMIN', 'PROJECT_OWNER', 'PROJECT_MEMBER', 'EMPLOYEE']),
  department: z.string().optional(),
  position: z.string().optional(),
})

const updateUserSchema = z.object({
  name: z.string().min(1, '姓名不能为空').optional(),
  email: z.string().email('邮箱格式不正确').optional(),
  password: z.string().min(6, '密码至少6个字符').optional(),
  role: z
    .enum(['ADMIN', 'PROJECT_ADMIN', 'PROJECT_OWNER', 'PROJECT_MEMBER', 'EMPLOYEE'])
    .optional(),
  department: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'ACTIVE', 'DISABLED']).optional(),
})

type CreateUserFormData = z.infer<typeof createUserSchema>
type UpdateUserFormData = z.infer<typeof updateUserSchema>

export default function UsersAdminPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [csvImportOpen, setCsvImportOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const createForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
      department: '',
      position: '',
    },
  })

  const updateForm = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
      department: '',
      position: '',
      phone: '',
      status: 'ACTIVE',
    },
  })

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
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
    ],
    []
  )

  const table = useReactTable({
    data: users,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/v1/admin/users')
      const data = await response.json()
      if (data.success) {
        setUsers(data.data || [])
      } else {
        toast({
          title: '获取失败',
          description: data.error?.message || '获取用户列表失败',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '获取失败',
        description: '获取用户列表失败，请检查网络连接',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (data: CreateUserFormData) => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: '创建成功',
          description: '用户已创建',
          variant: 'success',
        })
        setAddDialogOpen(false)
        createForm.reset()
        fetchUsers()
      } else {
        toast({
          title: '创建失败',
          description: result.error?.message || '添加失败',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '创建失败',
        description: '添加用户失败',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateUser = async (data: UpdateUserFormData) => {
    if (!selectedUser) return

    setSubmitting(true)
    try {
      const updateData: any = {
        ...data,
      }

      const response = await fetch(`/api/v1/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: '更新成功',
          description: '用户已更新',
          variant: 'success',
        })
        setEditDialogOpen(false)
        setSelectedUser(null)
        updateForm.reset()
        fetchUsers()
      } else {
        toast({
          title: '更新失败',
          description: result.error?.message || '更新失败',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '更新失败',
        description: '更新用户失败',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/v1/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: '删除成功',
          description: '用户已删除',
          variant: 'success',
        })
        setDeleteDialogOpen(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        toast({
          title: '删除失败',
          description: result.error?.message || '删除失败',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '删除失败',
        description: '删除用户失败',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleBulkStatus = async (status: 'ACTIVE' | 'DISABLED') => {
    const selectedIds = table.getFilteredSelectedRowModel().rows.map((row) => row.original.id)

    try {
      const response = await fetch('/api/v1/admin/users/bulk/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedIds, status }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error?.message || '批量更新失败')
      }

      // 更新本地状态
      setUsers((prevUsers) =>
        prevUsers.map((user) => (selectedIds.includes(user.id) ? { ...user, status } : user))
      )
    } catch (error) {
      throw error
    }
  }

  const handleBulkRole = async (role: string) => {
    const selectedIds = table.getFilteredSelectedRowModel().rows.map((row) => row.original.id)

    try {
      const response = await fetch('/api/v1/admin/users/bulk/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedIds, role }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error?.message || '批量更新失败')
      }

      // 更新本地状态
      setUsers((prevUsers) =>
        prevUsers.map((user) => (selectedIds.includes(user.id) ? { ...user, role } : user))
      )
    } catch (error) {
      throw error
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    updateForm.reset({
      name: user.name,
      email: user.email,
      role: user.role as any,
      department: user.department || '',
      position: user.position || '',
      phone: user.phone || '',
      status: user.status as any,
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                用户管理
              </CardTitle>
              <CardDescription>管理系统用户，包括查看、新增、编辑和删除用户</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCsvImportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                导入用户
              </Button>
              <Button
                onClick={() => {
                  createForm.reset()
                  setAddDialogOpen(true)
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                新增用户
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative min-w-[200px] flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="搜索姓名或邮箱..."
                value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={(table.getColumn('status')?.getFilterValue() as string) ?? 'all'}
              onValueChange={(value) =>
                table.getColumn('status')?.setFilterValue(value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="PENDING">待审批</SelectItem>
                <SelectItem value="ACTIVE">已激活</SelectItem>
                <SelectItem value="DISABLED">已禁用</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={(table.getColumn('role')?.getFilterValue() as string) ?? 'all'}
              onValueChange={(value) =>
                table.getColumn('role')?.setFilterValue(value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="角色筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部角色</SelectItem>
                <SelectItem value="ADMIN">系统管理员</SelectItem>
                <SelectItem value="PROJECT_ADMIN">项目管理员</SelectItem>
                <SelectItem value="PROJECT_OWNER">项目所有者</SelectItem>
                <SelectItem value="PROJECT_MEMBER">项目成员</SelectItem>
                <SelectItem value="EMPLOYEE">普通员工</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-muted-foreground mb-4 flex gap-4 text-sm">
            <span>共 {users.length} 个用户</span>
            <span>|</span>
            <span>已激活: {users.filter((u) => u.status === 'ACTIVE').length}</span>
            <span>待审批: {users.filter((u) => u.status === 'PENDING').length}</span>
            <span>已禁用: {users.filter((u) => u.status === 'DISABLED').length}</span>
          </div>

          <BulkActionsBar
            selectedCount={selectedCount}
            onBulkStatus={handleBulkStatus}
            onBulkRole={handleBulkRole}
            onClearSelection={() => setRowSelection({})}
          />

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
                      <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
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
                        暂无用户数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between space-x-2 px-4 py-4">
                <div className="text-muted-foreground text-sm">
                  已选择 {table.getFilteredSelectedRowModel().rows.length} /{' '}
                  {table.getFilteredRowModel().rows.length} 行
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
                    第 {table.getState().pagination.pageIndex + 1} / {table.getPageCount()} 页
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

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新增用户</DialogTitle>
            <DialogDescription>创建一个新的系统用户</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">姓名 *</Label>
              <Input id="add-name" {...createForm.register('name')} placeholder="输入用户姓名" />
              {createForm.formState.errors.name && (
                <p className="text-destructive text-sm">
                  {createForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-email">邮箱 *</Label>
              <Input
                id="add-email"
                type="email"
                {...createForm.register('email')}
                placeholder="输入邮箱地址"
              />
              {createForm.formState.errors.email && (
                <p className="text-destructive text-sm">
                  {createForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">密码 *</Label>
              <Input
                id="add-password"
                type="password"
                {...createForm.register('password')}
                placeholder="至少6个字符"
              />
              {createForm.formState.errors.password && (
                <p className="text-destructive text-sm">
                  {createForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <Select
                value={createForm.watch('role')}
                onValueChange={(value) => createForm.setValue('role', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">系统管理员</SelectItem>
                  <SelectItem value="PROJECT_ADMIN">项目管理员</SelectItem>
                  <SelectItem value="PROJECT_OWNER">项目所有者</SelectItem>
                  <SelectItem value="PROJECT_MEMBER">项目成员</SelectItem>
                  <SelectItem value="EMPLOYEE">普通员工</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-department">部门</Label>
                <Input
                  id="add-department"
                  {...createForm.register('department')}
                  placeholder="部门名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-position">职位</Label>
                <Input
                  id="add-position"
                  {...createForm.register('position')}
                  placeholder="职位名称"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
                disabled={submitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                创建
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>修改用户信息</DialogDescription>
          </DialogHeader>
          <form onSubmit={updateForm.handleSubmit(handleUpdateUser)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">姓名 *</Label>
              <Input id="edit-name" {...updateForm.register('name')} />
              {updateForm.formState.errors.name && (
                <p className="text-destructive text-sm">
                  {updateForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">邮箱 *</Label>
              <Input id="edit-email" type="email" {...updateForm.register('email')} />
              {updateForm.formState.errors.email && (
                <p className="text-destructive text-sm">
                  {updateForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">新密码（留空不修改）</Label>
              <Input
                id="edit-password"
                type="password"
                {...updateForm.register('password')}
                placeholder="留空则不修改密码"
              />
              {updateForm.formState.errors.password && (
                <p className="text-destructive text-sm">
                  {updateForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>角色</Label>
                <Select
                  value={updateForm.watch('role')}
                  onValueChange={(value) => updateForm.setValue('role', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">系统管理员</SelectItem>
                    <SelectItem value="PROJECT_ADMIN">项目管理员</SelectItem>
                    <SelectItem value="PROJECT_OWNER">项目所有者</SelectItem>
                    <SelectItem value="PROJECT_MEMBER">项目成员</SelectItem>
                    <SelectItem value="EMPLOYEE">普通员工</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <Select
                  value={updateForm.watch('status')}
                  onValueChange={(value) => updateForm.setValue('status', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">已激活</SelectItem>
                    <SelectItem value="PENDING">待审批</SelectItem>
                    <SelectItem value="DISABLED">已禁用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-department">部门</Label>
                <Input id="edit-department" {...updateForm.register('department')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-position">职位</Label>
                <Input id="edit-position" {...updateForm.register('position')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">电话</Label>
              <Input id="edit-phone" {...updateForm.register('phone')} />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={submitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除用户「{selectedUser?.name}
              」吗？此操作不可撤销，用户相关的所有数据将被永久删除。
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
            <Button variant="destructive" onClick={handleDeleteUser} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CSVImportDialog
        open={csvImportOpen}
        onOpenChange={setCsvImportOpen}
        onSuccess={fetchUsers}
      />
    </div>
  )
}
