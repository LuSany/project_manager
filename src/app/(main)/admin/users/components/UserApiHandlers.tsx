import { User } from './types'
import { CreateUserFormData, UpdateUserFormData } from '../page'
import { toast } from '@/hooks/use-toast'

export interface UserApiHandlers {
  fetchUsers: () => Promise<void>
  handleCreateUser: (data: CreateUserFormData) => Promise<void>
  handleUpdateUser: (data: UpdateUserFormData, selectedUser: User | null) => Promise<void>
  handleDeleteUser: (selectedUser: User | null) => Promise<void>
  handleBulkStatus: (status: 'ACTIVE' | 'DISABLED', table: any) => Promise<void>
  handleBulkRole: (role: string, table: any) => Promise<void>
}

export function createUserApiHandlers(
  setUsers: React.Dispatch<React.SetStateAction<User[]>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setSelectedUser: React.Dispatch<React.SetStateAction<User | null>>,
  setEditDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setAddDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setRowSelection: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  updateForm: any,
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>,
  createForm: any
): UserApiHandlers {
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

  const handleUpdateUser = async (data: UpdateUserFormData, selectedUser: User | null) => {
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

  const handleDeleteUser = async (selectedUser: User | null) => {
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

  const handleBulkStatus = async (status: 'ACTIVE' | 'DISABLED', table: any) => {
    const selectedIds = table.getFilteredSelectedRowModel().rows.map((row: any) => row.original.id)

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

      setUsers((prevUsers) =>
        prevUsers.map((user) => (selectedIds.includes(user.id) ? { ...user, status } : user))
      )

      setRowSelection({})
    } catch (error) {
      throw error
    }
  }

  const handleBulkRole = async (role: string, table: any) => {
    const selectedIds = table.getFilteredSelectedRowModel().rows.map((row: any) => row.original.id)

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

      setUsers((prevUsers) =>
        prevUsers.map((user) => (selectedIds.includes(user.id) ? { ...user, role } : user))
      )

      setRowSelection({})
    } catch (error) {
      throw error
    }
  }

  return {
    fetchUsers,
    handleCreateUser,
    handleUpdateUser,
    handleDeleteUser,
    handleBulkStatus,
    handleBulkRole,
  }
}