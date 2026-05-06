'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  ColumnFiltersState,
  SortingState,
  RowSelectionState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPageHeader } from './components/UserPageHeader'
import { UserTable } from './components/UserTable'
import { UserFilters } from './components/UserFilters'
import { AddUserDialog } from './components/AddUserDialog'
import { EditUserDialog } from './components/EditUserDialog'
import { DeleteUserDialog } from './components/DeleteUserDialog'
import { BulkActionsBar } from './components/BulkActionsBar'
import { CSVImportDialog } from './components/CSVImportDialog'
import { User } from './components/types'
import { getUserColumns, OpenEditDialogFn, OpenDeleteDialogFn } from './components/UserColumns'
import { createUserApiHandlers, UserApiHandlers } from './components/UserApiHandlers'

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

export type CreateUserFormData = z.infer<typeof createUserSchema>
export type UpdateUserFormData = z.infer<typeof updateUserSchema>

export default function UsersAdminPage() {
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

  const apiHandlers = createUserApiHandlers(
    setUsers,
    setLoading,
    setSelectedUser,
    setEditDialogOpen,
    setDeleteDialogOpen,
    setAddDialogOpen,
    setRowSelection,
    updateForm,
    setSubmitting,
    createForm
  )

  const openEditDialog: OpenEditDialogFn = (user: User) => {
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

  const openDeleteDialog: OpenDeleteDialogFn = (user: User) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const columns = getUserColumns({ openEditDialog, openDeleteDialog })

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
    apiHandlers.fetchUsers()
  }, [])

  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  return (
    <div className="space-y-6">
      <UserPageHeader
        onBack={() => window.history.back()}
        onImportClick={() => setCsvImportOpen(true)}
        onAddClick={() => {
          createForm.reset()
          setAddDialogOpen(true)
        }}
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <UserFilters
            table={table}
            userCount={users.length}
            activeCount={users.filter((u) => u.status === 'ACTIVE').length}
            pendingCount={users.filter((u) => u.status === 'PENDING').length}
            disabledCount={users.filter((u) => u.status === 'DISABLED').length}
          />

          <BulkActionsBar
            selectedCount={selectedCount}
            onBulkStatus={(status) => apiHandlers.handleBulkStatus(status, table)}
            onBulkRole={(role) => apiHandlers.handleBulkRole(role, table)}
            onClearSelection={() => setRowSelection({})}
          />

          <UserTable table={table} columns={columns} loading={loading} />
        </CardContent>
      </Card>

      <AddUserDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        form={createForm}
        onSubmit={apiHandlers.handleCreateUser}
        submitting={submitting}
      />

      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        form={updateForm}
        onSubmit={(data) => apiHandlers.handleUpdateUser(data, selectedUser)}
        submitting={submitting}
      />

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        userName={selectedUser?.name}
        onConfirm={() => apiHandlers.handleDeleteUser(selectedUser)}
        submitting={submitting}
      />

      <CSVImportDialog
        open={csvImportOpen}
        onOpenChange={setCsvImportOpen}
        onSuccess={apiHandlers.fetchUsers}
      />
    </div>
  )
}