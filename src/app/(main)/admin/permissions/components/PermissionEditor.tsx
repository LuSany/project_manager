'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { api } from '@/lib/api/client'
import { Trash2, UserPlus } from 'lucide-react'
import { getInitials } from '@/lib/utils'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface Member {
  id: string
  userId: string
  projectId: string
  role: string
  joinedAt: string
  users: User
}

interface PermissionEditorProps {
  resourceId: string
  resourceName: string
  onPermissionsChange: () => void
}

export function PermissionEditor({
  resourceId,
  resourceName,
  onPermissionsChange,
}: PermissionEditorProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('PROJECT_MEMBER')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchMembers()
  }, [resourceId])

  useEffect(() => {
    fetchUsers()
  }, [searchQuery])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const response = await api.get<Member[]>(`/admin/permissions/${resourceId}`)
      if ((response as { success?: boolean }).success) {
        setMembers((response as { data?: Member[] }).data || [])
      }
    } catch (error) {
      console.error('获取成员列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await api.get<User[]>('/admin/users')
      if ((response as { success?: boolean }).success) {
        const fetchedUsers = (response as { data?: User[] }).data || []
        const existingUserIds = members.map((m) => m.userId)
        setUsers(fetchedUsers.filter((u) => !existingUserIds.includes(u.id)))
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
    }
  }

  const handleAddMember = async () => {
    if (!selectedUserId) return

    try {
      const response = await api.post('/admin/permissions', {
        userId: selectedUserId,
        projectId: resourceId,
        role: selectedRole,
      })

      if ((response as { success?: boolean }).success) {
        setSelectedUserId('')
        setSelectedRole('PROJECT_MEMBER')
        setSearchQuery('')
        await fetchMembers()
        onPermissionsChange()
      }
    } catch (error) {
      console.error('添加成员失败:', error)
      alert('添加成员失败，请重试')
    }
  }

  const handleDeleteClick = (userId: string) => {
    setMemberToDelete(userId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return

    try {
      const response = await api.delete(`/admin/permissions/${resourceId}`)
      if ((response as { success?: boolean }).success) {
        setDeleteDialogOpen(false)
        setMemberToDelete(null)
        await fetchMembers()
        onPermissionsChange()
      }
    } catch (error) {
      console.error('移除成员失败:', error)
      alert('移除成员失败，请重试')
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      PROJECT_OWNER: '项目负责人',
      PROJECT_ADMIN: '项目管理员',
      PROJECT_MEMBER: '项目成员',
      PROJECT_DIRECTOR: '项目总监',
    }
    return labels[role] || role
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      PROJECT_OWNER: 'bg-purple-500/20 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
      PROJECT_ADMIN: 'bg-blue-500/20 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
      PROJECT_MEMBER: 'bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400',
      PROJECT_DIRECTOR:
        'bg-orange-500/20 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
    }
    return colors[role] || 'bg-gray-500/20 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{resourceName}</h2>
          <p className="text-muted-foreground">权限配置</p>
        </div>
      </div>

      <div className="flex items-end gap-4">
        <div className="flex-1">
          <Input
            placeholder="搜索用户..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="选择用户" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{user.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PROJECT_MEMBER">项目成员</SelectItem>
            <SelectItem value="PROJECT_ADMIN">项目管理员</SelectItem>
            <SelectItem value="PROJECT_OWNER">项目负责人</SelectItem>
            <SelectItem value="PROJECT_DIRECTOR">项目总监</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAddMember} disabled={!selectedUserId}>
          <UserPlus className="mr-2 h-4 w-4" />
          添加成员
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>来源</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow key="loading">
                  <TableCell colSpan={4} className="py-8 text-center">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow key="empty">
                  <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                    暂无成员
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.userId || `member-${members.indexOf(member)}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.users.avatar} />
                          <AvatarFallback>{getInitials(member.users.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.users.name}</p>
                          <p className="text-muted-foreground text-sm">{member.users.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(member.role)}>
                        {getRoleLabel(member.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">直接分配</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(member.userId)}
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认移除</DialogTitle>
            <DialogDescription>确定要移除该成员吗？此操作不可恢复。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              确认移除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
