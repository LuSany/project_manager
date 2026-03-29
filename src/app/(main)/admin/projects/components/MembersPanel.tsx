'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api/client'
import { Users, Loader2, X, UserPlus } from 'lucide-react'

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
    avatar?: string
  }
}

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface MembersPanelProps {
  projectId: string
  members: Member[]
  onMembersChange: () => void
}

const roleLabels: Record<string, string> = {
  PROJECT_OWNER: '项目负责人',
  PROJECT_ADMIN: '项目管理员',
  PROJECT_MEMBER: '项目成员',
  PROJECT_DIRECTOR: '项目总监',
}

const roleColors: Record<string, string> = {
  PROJECT_OWNER: 'bg-blue-500/20 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  PROJECT_ADMIN: 'bg-purple-500/20 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  PROJECT_MEMBER: 'bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  PROJECT_DIRECTOR: 'bg-amber-500/20 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
}

export function MembersPanel({ projectId, members, onMembersChange }: MembersPanelProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('PROJECT_MEMBER')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const response = await api.get<User[]>('/admin/users')
      if ((response as { success?: boolean }).success) {
        setUsers((response as { data?: User[] }).data || [])
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleAddMember = async () => {
    if (!selectedUserId) {
      alert('请选择用户')
      return
    }

    setAdding(true)
    try {
      const response = await api.post(`/admin/projects/${projectId}/members`, {
        userId: selectedUserId,
        role: selectedRole,
      })

      if ((response as { success?: boolean }).success) {
        onMembersChange()
        setSelectedUserId('')
        setSelectedRole('PROJECT_MEMBER')
      }
    } catch (error) {
      console.error('添加成员失败:', error)
      alert('添加成员失败，请重试')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('确定要移除该成员吗？')) {
      return
    }

    setLoading(true)
    try {
      const response = await api.delete(`/admin/projects/${projectId}/members?userId=${userId}`)
      if ((response as { success?: boolean }).success) {
        onMembersChange()
      }
    } catch (error) {
      console.error('移除成员失败:', error)
      alert('移除成员失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      !members.some((m) => m.userId === user.id) &&
      (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="mr-2 h-4 w-4" />
          成员管理 ({members.length})
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>项目成员管理</SheetTitle>
          <SheetDescription>管理项目成员及其角色权限</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* 添加成员 */}
          <div className="space-y-4">
            <h3 className="font-medium">添加成员</h3>
            <div className="space-y-3">
              <Input
                placeholder="搜索用户..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loadingUsers}
              />
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={loadingUsers || adding}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择用户" />
                </SelectTrigger>
                <SelectContent>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-muted-foreground py-4 text-center text-sm">
                      {searchQuery ? '未找到匹配的用户' : '所有用户都已添加'}
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <Select value={selectedRole} onValueChange={setSelectedRole} disabled={adding}>
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <SelectItem key={role} value={role}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleAddMember}
                disabled={adding || !selectedUserId}
                className="w-full"
              >
                {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <UserPlus className="mr-2 h-4 w-4" />
                添加成员
              </Button>
            </div>
          </div>

          {/* 成员列表 */}
          <div className="space-y-4">
            <h3 className="font-medium">当前成员 ({members.length})</h3>
            {members.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center text-sm">暂无成员</div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.users.avatar} alt={member.users.name} />
                        <AvatarFallback>
                          {member.users.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.users.name}</p>
                        <p className="text-muted-foreground text-sm">{member.users.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={roleColors[member.role]}>{roleLabels[member.role]}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.userId)}
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <SheetClose asChild>
            <Button variant="outline">关闭</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
}
