'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { api } from '@/lib/api/client'
import { Search, Loader2, UserPlus } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  department?: string
  position?: string
  role: string
  status: string
  createdAt: string
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
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users')
      setUsers((response as { data?: User[] }).data || [])
    } catch (error) {
      console.error('获取用户列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (userId: string, status: string) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { status })
      fetchUsers()
    } catch (error) {
      console.error('更新用户状态失败:', error)
    }
  }

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role })
      fetchUsers()
    } catch (error) {
      console.error('更新用户角色失败:', error)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>用户管理</CardTitle>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            添加用户
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* 筛选栏 */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户..."
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
        </div>

        {/* 用户表格 */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead>部门/职位</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">
                      {user.department || '-'}
                      {user.position && ` / ${user.position}`}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(role) => handleRoleChange(user.id, role)}
                    >
                      <SelectTrigger className="w-32 h-8">
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
                    {user.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                      >
                        审批通过
                      </Button>
                    )}
                    {user.status === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(user.id, 'DISABLED')}
                      >
                        禁用
                      </Button>
                    )}
                    {user.status === 'DISABLED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                      >
                        启用
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}