'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2, Users, Search } from 'lucide-react'

interface ReviewGroup {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  members: Array<{
    userId: string
    role: string
    user: {
      id: string
      name: string
      email: string
      avatar?: string
    }
  }>
}

interface SystemUser {
  id: string
  name: string
  email: string
  avatar?: string
}

export default function ReviewGroupsPage() {
  const [groups, setGroups] = useState<ReviewGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<ReviewGroup | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // 表单状态
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<Array<{ userId: string; role: string }>>([])
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([])
  const [saving, setSaving] = useState(false)

  const fetchGroups = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/v1/review-groups')
      const data = await response.json()
      if (data.success) {
        setGroups(data.data || [])
      }
    } catch (err) {
      console.error('获取评审组列表失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemUsers = async () => {
    try {
      const response = await fetch('/api/v1/users?pageSize=100')
      const data = await response.json()
      if (data.success) {
        setSystemUsers(data.data?.data || data.data || [])
      }
    } catch (err) {
      console.error('获取用户列表失败:', err)
    }
  }

  useEffect(() => {
    fetchGroups()
    fetchSystemUsers()
  }, [])

  const handleOpenDialog = (group?: ReviewGroup) => {
    setEditingGroup(group || null)
    if (group) {
      setName(group.name)
      setDescription(group.description || '')
      setSelectedMembers(group.members.map((m) => ({ userId: m.userId, role: m.role })))
    } else {
      setName('')
      setDescription('')
      setSelectedMembers([])
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingGroup(null)
    setName('')
    setDescription('')
    setSelectedMembers([])
  }

  const handleAddMember = (userId: string, role: string) => {
    if (selectedMembers.some((m) => m.userId === userId)) return
    setSelectedMembers([...selectedMembers, { userId, role }])
  }

  const handleRemoveMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter((m) => m.userId !== userId))
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('请输入评审组名称')
      return
    }

    setSaving(true)
    try {
      const url = editingGroup
        ? `/api/v1/review-groups/${editingGroup.id}`
        : '/api/v1/review-groups'

      const response = await fetch(url, {
        method: editingGroup ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          members: selectedMembers,
        }),
      })

      const data = await response.json()
      if (data.success) {
        fetchGroups()
        handleCloseDialog()
      } else {
        alert(data.error?.message || data.error || '保存失败')
      }
    } catch (err) {
      console.error('保存评审组失败:', err)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (group: ReviewGroup) => {
    if (!confirm(`确定要删除评审组"${group.name}"吗？`)) return

    try {
      const response = await fetch(`/api/v1/review-groups/${group.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (data.success) {
        fetchGroups()
      } else {
        alert('删除失败')
      }
    } catch (err) {
      console.error('删除评审组失败:', err)
      alert('删除失败，请重试')
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'MODERATOR':
        return '主持人'
      case 'REVIEWER':
        return '评审人'
      case 'OBSERVER':
        return '观察者'
      case 'SECRETARY':
        return '记录员'
      default:
        return role
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'MODERATOR':
        return 'default'
      case 'REVIEWER':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const filteredUsers = systemUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">评审组管理</h1>
          <p className="text-muted-foreground mt-1">创建和管理可复用的评审人组合</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          新建评审组
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">暂无评审组</p>
            <p className="text-muted-foreground mb-4">点击上方按钮创建第一个评审组</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              新建评审组
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    {group.description && (
                      <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(group)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(group)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-2">
                  {group.members.length} 名成员
                </div>
                <div className="flex flex-wrap gap-1">
                  {group.members.slice(0, 5).map((member) => (
                    <Badge key={member.userId} variant={getRoleBadgeVariant(member.role) as any}>
                      {member.user.name}
                    </Badge>
                  ))}
                  {group.members.length > 5 && (
                    <Badge variant="outline">+{group.members.length - 5}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 创建/编辑评审组对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingGroup ? '编辑评审组' : '创建评审组'}</DialogTitle>
            <DialogDescription>
              创建可复用的评审人组合，便于快速添加评审参与者
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">评审组名称 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：技术评审组"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="评审组的用途说明"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>添加成员</Label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索用户..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">未找到用户</div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <Select
                        value={selectedMembers.find((m) => m.userId === user.id)?.role || ''}
                        onValueChange={(role) => {
                          if (role === 'none') {
                            handleRemoveMember(user.id)
                          } else {
                            handleAddMember(user.id, role)
                          }
                        }}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="添加" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MODERATOR">主持人</SelectItem>
                          <SelectItem value="REVIEWER">评审人</SelectItem>
                          <SelectItem value="OBSERVER">观察者</SelectItem>
                          <SelectItem value="none">移除</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedMembers.length > 0 && (
              <div className="space-y-2">
                <Label>已选成员 ({selectedMembers.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((member) => {
                    const user = systemUsers.find((u) => u.id === member.userId)
                    return (
                      <Badge key={member.userId} variant="secondary" className="gap-1">
                        {getRoleLabel(member.role)}: {user?.name || member.userId}
                        <span
                          className="cursor-pointer hover:text-destructive"
                          onClick={() => handleRemoveMember(member.userId)}
                        >
                          ×
                        </span>
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}