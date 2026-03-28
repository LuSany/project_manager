'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, CalendarIcon, Check, X, Send } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { AcceptancePanel } from './AcceptancePanel'
import { AcceptanceHistory } from './AcceptanceHistory'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  progress: number
  priority: string
  startDate: string | null
  dueDate: string | null
  createdAt: string
  projectId: string
  acceptorId?: string | null
  assignees?: Array<{
    user: { id: string; name: string; email: string }
  }>
}

interface ProjectMember {
  id: string
  name: string
  email: string
}

interface DetailTabProps {
  taskId: string
  onUpdate?: (taskId: string, data: Partial<Task>) => void
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

const STATUS_OPTIONS = [
  { value: 'TODO', label: '待办', color: 'bg-slate-100 text-slate-700' },
  { value: 'IN_PROGRESS', label: '进行中', color: 'bg-blue-100 text-blue-700' },
  { value: 'REVIEW', label: '待审核', color: 'bg-purple-100 text-purple-700' },
  { value: 'TESTING', label: '测试中', color: 'bg-amber-100 text-amber-700' },
  { value: 'DONE', label: '已完成', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'BLOCKED', label: '已阻塞', color: 'bg-red-100 text-red-700' },
  { value: 'CANCELLED', label: '已取消', color: 'bg-gray-100 text-gray-700' },
]

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: '低', color: 'bg-blue-100 text-blue-700' },
  { value: 'MEDIUM', label: '中', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'HIGH', label: '高', color: 'bg-orange-100 text-orange-700' },
  { value: 'CRITICAL', label: '紧急', color: 'bg-red-100 text-red-700' },
]

async function fetchTask(taskId: string): Promise<Task> {
  const response = await fetch(`/api/v1/tasks/${taskId}`)
  const data: ApiResponse<Task> = await response.json()
  if (!data.success || !data.data) throw new Error(data.error || '获取任务详情失败')
  return data.data
}

async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  const response = await fetch(`/api/v1/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  const data: ApiResponse<Task> = await response.json()
  if (!data.success || !data.data) throw new Error(data.error || '更新任务失败')
  return data.data
}

async function fetchProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const response = await fetch(`/api/v1/projects/${projectId}/members`)
  const data: ApiResponse<ProjectMember[]> = await response.json()
  if (!data.success) return []
  return data.data || []
}

export function DetailTab({ taskId, onUpdate }: DetailTabProps) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [editedDesc, setEditedDesc] = useState('')
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [selectedAcceptorId, setSelectedAcceptorId] = useState('')

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => fetchTask(taskId),
  })

  const { data: members = [] } = useQuery({
    queryKey: ['projectMembers', task?.projectId],
    queryFn: () => fetchProjectMembers(task!.projectId),
    enabled: !!task?.projectId,
  })

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Task>) => updateTask(taskId, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(['task', taskId], data)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onUpdate?.(taskId, data)
    },
  })

  const requestAcceptanceMutation = useMutation({
    mutationFn: (acceptorId: string) =>
      fetch(`/api/v1/tasks/${taskId}/acceptance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptorId }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      queryClient.invalidateQueries({ queryKey: ['acceptances', taskId] })
      setIsRequestDialogOpen(false)
      setSelectedAcceptorId('')
    },
  })

  const handleUpdate = (field: string, value: string | number | null) => {
    updateMutation.mutate({ [field]: value } as Partial<Task>)
  }

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!task) return null

  const handleTitleEdit = () => {
    setEditedTitle(task.title)
    setIsEditingTitle(true)
  }

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== task.title) {
      updateMutation.mutate({ title: editedTitle })
    }
    setIsEditingTitle(false)
  }

  const handleDescSave = () => {
    if (editedDesc !== (task.description || '')) {
      updateMutation.mutate({ description: editedDesc || null })
    }
    setIsEditingDesc(false)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '未设置'
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd', { locale: zhCN })
    } catch {
      return '未设置'
    }
  }

  const currentAssigneeIds = task.assignees?.map((a) => a.user.id) || []

  const canRequestAcceptance =
    task.progress === 100 && !['REVIEW', 'DONE', 'CANCELLED'].includes(task.status)

  return (
    <div className="space-y-6 p-4">
      {canRequestAcceptance && (
        <div className="border-b pb-4">
          <Button
            onClick={() => setIsRequestDialogOpen(true)}
            className="w-full"
            disabled={requestAcceptanceMutation.isPending}
          >
            {requestAcceptanceMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            发起验收
          </Button>
        </div>
      )}

      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发起验收</DialogTitle>
            <DialogDescription>选择验收人，发起后任务状态将变为"待审核"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>选择验收人</Label>
              <Select value={selectedAcceptorId} onValueChange={setSelectedAcceptorId}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择验收人" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {member.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {member.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                if (selectedAcceptorId) {
                  requestAcceptanceMutation.mutate(selectedAcceptorId)
                }
              }}
              disabled={!selectedAcceptorId || requestAcceptanceMutation.isPending}
            >
              {requestAcceptanceMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              确认发起
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {task.status === 'REVIEW' && task.acceptorId && user && (
        <AcceptancePanel taskId={taskId} acceptorId={task.acceptorId} currentUserId={user.id} />
      )}

      <AcceptanceHistory taskId={taskId} />
      <div className="space-y-2">
        <Label>任务标题</Label>
        {isEditingTitle ? (
          <div className="flex gap-2">
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave()
                if (e.key === 'Escape') setIsEditingTitle(false)
              }}
              autoFocus
              className="flex-1"
            />
            <Button size="icon" variant="ghost" onClick={handleTitleSave}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setIsEditingTitle(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className="hover:bg-muted/50 cursor-pointer rounded-md border p-2"
            onClick={handleTitleEdit}
          >
            {task.title}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>描述</Label>
        {isEditingDesc ? (
          <div className="space-y-2">
            <Textarea
              value={editedDesc}
              onChange={(e) => setEditedDesc(e.target.value)}
              className="min-h-[100px]"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleDescSave}>
                保存
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditingDesc(false)}>
                取消
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="hover:bg-muted/50 min-h-[60px] cursor-pointer rounded-md border p-2"
            onClick={() => {
              setEditedDesc(task.description || '')
              setIsEditingDesc(true)
            }}
          >
            {task.description || <span className="text-muted-foreground">点击添加描述...</span>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>状态</Label>
          <Select value={task.status} onValueChange={(v) => handleUpdate('status', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <Badge className={cn('mr-2', opt.color)}>{opt.label}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>优先级</Label>
          <Select value={task.priority} onValueChange={(v) => handleUpdate('priority', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <Badge className={cn('mr-2', opt.color)}>{opt.label}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>开始日期</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDate(task.startDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={task.startDate ? new Date(task.startDate) : undefined}
                onSelect={(date) =>
                  handleUpdate('startDate', date ? format(date, 'yyyy-MM-dd') : null)
                }
                locale={zhCN}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label>截止日期</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDate(task.dueDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={task.dueDate ? new Date(task.dueDate) : undefined}
                onSelect={(date) =>
                  handleUpdate('dueDate', date ? format(date, 'yyyy-MM-dd') : null)
                }
                locale={zhCN}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>进度</Label>
          <span className="text-sm font-medium">{task.progress}%</span>
        </div>
        <Input
          type="range"
          min={0}
          max={100}
          step={5}
          value={task.progress}
          onChange={(e) => handleUpdate('progress', parseInt(e.target.value))}
          className="h-2 w-full"
        />
        <div className="mt-2 flex gap-2">
          {[0, 25, 50, 75, 100].map((p) => (
            <Button
              key={p}
              size="sm"
              variant={task.progress === p ? 'default' : 'outline'}
              onClick={() => handleUpdate('progress', p)}
            >
              {p}%
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>负责人</Label>
        {members.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {members.map((member) => {
              const isAssigned = currentAssigneeIds.includes(member.id)
              return (
                <Button
                  key={member.id}
                  size="sm"
                  variant={isAssigned ? 'default' : 'outline'}
                  onClick={() => {
                    const newIds = isAssigned
                      ? currentAssigneeIds.filter((id) => id !== member.id)
                      : [...currentAssigneeIds, member.id]
                    updateMutation.mutate({ assigneeIds: newIds } as Partial<Task>)
                  }}
                  className="flex items-center gap-2"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-xs">
                      {member.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {member.name}
                </Button>
              )
            })}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">暂无项目成员</div>
        )}
      </div>

      <div className="text-muted-foreground space-y-1 border-t pt-4 text-sm">
        <div>创建时间: {new Date(task.createdAt).toLocaleString('zh-CN')}</div>
      </div>
    </div>
  )
}
