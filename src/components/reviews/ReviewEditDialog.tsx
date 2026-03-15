'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Trash2, Upload, UserPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface MaterialFile {
  id: string
  fileId: string
  fileName: string
  fileType: string
  fileSize: number
}

interface Participant {
  user: {
    id: string
    name: string
    email: string
  }
  role: string
}

interface ProjectMember {
  userId: string
  userName: string
  userEmail: string
  role: string
}

interface ReviewEditDialogProps {
  reviewId: string
  projectId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ReviewEditDialog({
  reviewId,
  projectId,
  open,
  onOpenChange,
  onSuccess,
}: ReviewEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [materials, setMaterials] = useState<MaterialFile[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [uploading, setUploading] = useState(false)

  // 添加参与者相关状态
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('REVIEWER')
  const [addingParticipant, setAddingParticipant] = useState(false)

  // 加载评审数据
  useEffect(() => {
    if (open && reviewId) {
      loadReview()
    }
  }, [open, reviewId])

  // 加载项目成员
  useEffect(() => {
    if (open && projectId) {
      loadProjectMembers()
    }
  }, [open, projectId])

  const loadProjectMembers = async () => {
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/members`)
      const data = await response.json()
      if (data.success) {
        setProjectMembers(data.data || [])
      }
    } catch (err) {
      console.error('加载项目成员失败:', err)
    }
  }

  const loadReview = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/v1/reviews/${reviewId}`)
      const data = await response.json()
      if (data.success) {
        const review = data.data
        setTitle(review.title)
        setDescription(review.description || '')
        setScheduledAt(review.scheduledAt ? review.scheduledAt.slice(0, 16) : '')
        setMaterials(review.materials || [])
        setParticipants(review.participants || [])
      }
    } catch (err) {
      console.error('加载评审失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBasicInfo = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/v1/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        }),
      })
      const data = await response.json()
      if (data.success) {
        onSuccess()
      } else {
        alert(data.error?.message || '保存失败')
      }
    } catch (err) {
      console.error('保存评审失败:', err)
      alert('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)

        const uploadRes = await fetch('/api/v1/files/upload', {
          method: 'POST',
          body: formData,
        })
        const uploadData = await uploadRes.json()

        if (uploadData.success && uploadData.data) {
          // 添加材料到评审
          const addRes = await fetch(`/api/v1/reviews/${reviewId}/materials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileId: uploadData.data.id,
              fileName: uploadData.data.originalName || file.name,
              fileType: file.type,
              fileSize: file.size,
            }),
          })
          const addData = await addRes.json()
          if (addData.success) {
            setMaterials((prev) => [...prev, addData.data])
          }
        }
      }
      onSuccess()
    } catch (err) {
      console.error('上传文件失败:', err)
      alert('上传文件失败')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveMaterial = async (materialId: string) => {
    if (!confirm('确定要删除这个材料吗？')) return

    try {
      const response = await fetch(`/api/v1/reviews/${reviewId}/materials/${materialId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        setMaterials((prev) => prev.filter((m) => m.id !== materialId))
        onSuccess()
      }
    } catch (err) {
      console.error('删除材料失败:', err)
    }
  }

  const handleRemoveParticipant = async (userId: string) => {
    if (!confirm('确定要移除这个参与者吗？')) return

    try {
      const response = await fetch(
        `/api/v1/reviews/${reviewId}/participants?userId=${userId}`,
        { method: 'DELETE' }
      )
      const data = await response.json()
      if (data.success) {
        setParticipants((prev) => prev.filter((p) => p.user.id !== userId))
        onSuccess()
      }
    } catch (err) {
      console.error('移除参与者失败:', err)
    }
  }

  const handleAddParticipant = async () => {
    if (!selectedUserId) {
      alert('请选择要添加的用户')
      return
    }

    // 检查用户是否已经是参与者
    if (participants.some((p) => p.user.id === selectedUserId)) {
      alert('该用户已经是评审参与者')
      return
    }

    setAddingParticipant(true)
    try {
      const response = await fetch(`/api/v1/reviews/${reviewId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          role: selectedRole,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setParticipants((prev) => [...prev, data.data])
        setSelectedUserId('')
        setSelectedRole('REVIEWER')
        onSuccess()
      } else {
        alert(data.error?.message || '添加参与者失败')
      }
    } catch (err) {
      console.error('添加参与者失败:', err)
      alert('添加参与者失败')
    } finally {
      setAddingParticipant(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑评审</DialogTitle>
          <DialogDescription>修改评审信息、参与者和材料</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h3 className="font-medium">基本信息</h3>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="title">标题</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="scheduledAt">计划时间</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleSaveBasicInfo} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存基本信息
              </Button>
            </div>

            {/* 参与者 */}
            <div className="space-y-4">
              <h3 className="font-medium">参与者</h3>

              {/* 添加参与者 */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor="user-select" className="text-xs text-muted-foreground">选择用户</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger id="user-select">
                      <SelectValue placeholder="选择项目成员" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectMembers
                        .filter((m) => !participants.some((p) => p.user.id === m.userId))
                        .map((member) => (
                          <SelectItem key={member.userId} value={member.userId}>
                            {member.userName} ({member.userEmail})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32">
                  <Label htmlFor="role-select" className="text-xs text-muted-foreground">角色</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger id="role-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REVIEWER">评审人</SelectItem>
                      <SelectItem value="OBSERVER">观察者</SelectItem>
                      <SelectItem value="SECRETARY">记录员</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddParticipant}
                  disabled={!selectedUserId || addingParticipant}
                  size="sm"
                >
                  {addingParticipant ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无参与者</p>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.user.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 h-8 w-8 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {participant.user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{participant.user.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {participant.user.email}
                          </div>
                        </div>
                        <Badge variant="secondary">{getRoleLabel(participant.role)}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveParticipant(participant.user.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 材料 */}
            <div className="space-y-4">
              <h3 className="font-medium">评审材料</h3>

              {/* 上传区域 */}
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  id="file-upload"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.png,.jpg,.jpeg,.gif"
                />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">上传中...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <Button
                      variant="link"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      点击上传文件
                    </Button>
                  </div>
                )}
              </div>

              {/* 已有材料 */}
              {materials.length > 0 && (
                <div className="space-y-2">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="text-sm font-medium">{material.fileName}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(material.fileSize)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMaterial(material.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}