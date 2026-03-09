'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { ArrowLeft, Search, Loader2, UserPlus, Edit, Trash2, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  DISABLED: 'bg-red-100 text-red-800',
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

export default function UsersAdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // 对话框状态
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    department: '',
    position: '',
    phone: '',
    status: 'ACTIVE',
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
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
      department: '',
      position: '',
      phone: '',
      status: 'ACTIVE',
    })
  }

  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      alert('请填写必填项')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          department: formData.department || undefined,
          position: formData.position || undefined,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setAddDialogOpen(false)
        resetForm()
        fetchUsers()
      } else {
        alert(data.error?.message || data.error || '添加失败')
      }
    } catch (error) {
      console.error('添加用户失败:', error)
      alert('添加用户失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser || !formData.name || !formData.email) {
      alert('请填写必填项')
      return
    }

    setSubmitting(true)
    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
      }

      if (formData.department !== undefined) updateData.department = formData.department || null
      if (formData.position !== undefined) updateData.position = formData.position || null
      if (formData.phone !== undefined) updateData.phone = formData.phone || null
      if (formData.password) updateData.password = formData.password

      const response = await fetch(`/api/v1/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()
      if (data.success) {
        setEditDialogOpen(false)
        setSelectedUser(null)
        resetForm()
        fetchUsers()
      } else {
        alert(data.error?.message || data.error || '更新失败')
      }
    } catch (error) {
      console.error('更新用户失败:', error)
      alert('更新用户失败')
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

      const data = await response.json()
      if (data.success) {
        setDeleteDialogOpen(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        alert(data.error?.message || data.error || '删除失败')
      }
    } catch (error) {
      console.error('删除用户失败:', error)
      alert('删除用户失败')
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department || '',
      position: user.position || '',
      phone: user.phone || '',
      status: user.status,
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesStatus && matchesRole
  })

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
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
            <Button onClick={() => { resetForm(); setAddDialogOpen(true); }}>
              <UserPlus className="h-4 w-4 mr-2" />
              新增用户
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 筛选栏 */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索姓名或邮箱..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
            <Select value={roleFilter} onValueChange={setRoleFilter}>
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

          {/* 用户统计 */}
          <div className="flex gap-4 mb-4 text-sm text-muted-foreground">
            <span>共 {users.length} 个用户</span>
            <span>|</span>
            <span>已激活: {users.filter(u => u.status === 'ACTIVE').length}</span>
            <span>待审批: {users.filter(u => u.status === 'PENDING').length}</span>
            <span>已禁用: {users.filter(u => u.status === 'DISABLED').length}</span>
          </div>

          {/* 用户表格 */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>联系方式</TableHead>
                    <TableHead>部门/职位</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>注册时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        暂无用户数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{user.phone || '-'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {user.department || '-'}
                            {user.position && ` / ${user.position}`}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{roleLabels[user.role] || user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[user.status]}>
                            {statusLabels[user.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(user)}
                            >
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
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增用户对话框 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新增用户</DialogTitle>
            <DialogDescription>创建一个新的系统用户</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">姓名 *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="输入用户姓名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-email">邮箱 *</Label>
              <Input
                id="add-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="输入邮箱地址"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">密码 *</Label>
              <Input
                id="add-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="至少6个字符"
              />
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
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
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="部门名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-position">职位</Label>
                <Input
                  id="add-position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="职位名称"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={submitting}>
              取消
            </Button>
            <Button onClick={handleAddUser} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑用户对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>修改用户信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">姓名 *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">邮箱 *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">新密码（留空不修改）</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="留空则不修改密码"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>角色</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
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
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
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
                <Input
                  id="edit-department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-position">职位</Label>
                <Input
                  id="edit-position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">电话</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={submitting}>
              取消
            </Button>
            <Button onClick={handleEditUser} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除用户「{selectedUser?.name}」吗？此操作不可撤销，用户相关的所有数据将被永久删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}