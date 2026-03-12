'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { api } from '@/lib/api/client'
import { Loader2, Plus, Calendar, CheckCircle2, ArrowLeft, Home, Edit, Trash2, Link2 } from 'lucide-react'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  status: string
  progress: number
}

interface Milestone {
  id: string
  title: string
  description?: string
  status: string
  progress: number
  dueDate?: string
  createdAt: string
  tasks?: Task[]
  _count?: {
    tasks: number
  }
}

interface ProjectTask {
  id: string
  title: string
  status: string
  milestoneId?: string | null
}

const statusColors: Record<string, string> = {
  NOT_STARTED: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  NOT_STARTED: '未开始',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}

const taskStatusLabels: Record<string, string> = {
  TODO: '待办',
  IN_PROGRESS: '进行中',
  REVIEW: '待审核',
  TESTING: '测试中',
  DONE: '已完成',
  CANCELLED: '已取消',
}

export default function ProjectMilestonesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [projectId, setProjectId] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [linkTaskDialogOpen, setLinkTaskDialogOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [linkingMilestone, setLinkingMilestone] = useState<Milestone | null>(null)
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([])
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
  })
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    status: 'NOT_STARTED',
    progress: 0,
    dueDate: '',
  })

  useEffect(() => {
    params.then((p) => {
      setProjectId(p.id)
      fetchMilestones(p.id)
    })
  }, [params])

  const fetchMilestones = async (pid: string) => {
    try {
      const response = await api.get(`/projects/${pid}/milestones`)
      setMilestones((response as { data?: Milestone[] }).data || [])
    } catch (error) {
      console.error('获取里程碑失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectTasks = async (pid: string) => {
    try {
      const response = await api.get(`/tasks?projectId=${pid}`)
      const data = response as { success?: boolean; data?: { items?: ProjectTask[] } }
      setProjectTasks(data.data?.items || [])
    } catch (error) {
      console.error('获取项目任务失败:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert('请输入里程碑标题')
      return
    }

    setSubmitting(true)
    try {
      const response = await api.post(`/projects/${projectId}/milestones`, formData)
      if ((response as { success?: boolean }).success) {
        setDialogOpen(false)
        setFormData({ title: '', description: '', dueDate: '' })
        fetchMilestones(projectId)
      }
    } catch (error) {
      console.error('创建里程碑失败:', error)
      alert('创建里程碑失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone)
    setEditFormData({
      title: milestone.title,
      description: milestone.description || '',
      status: milestone.status,
      progress: milestone.progress,
      dueDate: milestone.dueDate ? milestone.dueDate.split('T')[0] : '',
    })
    setEditDialogOpen(true)
  }

  const handleUpdateMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMilestone) return

    setSubmitting(true)
    try {
      const response = await api.put(`/milestones/${editingMilestone.id}`, {
        title: editFormData.title,
        description: editFormData.description,
        status: editFormData.status,
        progress: editFormData.progress,
        dueDate: editFormData.dueDate ? new Date(editFormData.dueDate).toISOString() : undefined,
      })
      if ((response as { success?: boolean }).success) {
        setEditDialogOpen(false)
        setEditingMilestone(null)
        fetchMilestones(projectId)
      }
    } catch (error) {
      console.error('更新里程碑失败:', error)
      alert('更新里程碑失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMilestone = async (id: string) => {
    if (!confirm('确定要删除此里程碑吗？')) return

    try {
      const response = await api.delete(`/milestones/${id}`)
      if ((response as { success?: boolean }).success) {
        fetchMilestones(projectId)
      }
    } catch (error) {
      console.error('删除里程碑失败:', error)
      alert('删除里程碑失败')
    }
  }

  const handleOpenLinkTaskDialog = async (milestone: Milestone) => {
    setLinkingMilestone(milestone)
    await fetchProjectTasks(projectId)
    // 预选已关联的任务
    const linkedTaskIds = milestone.tasks?.map(t => t.id) || []
    setSelectedTaskIds(linkedTaskIds)
    setLinkTaskDialogOpen(true)
  }

  const handleTaskSelection = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTaskIds(prev => [...prev, taskId])
    } else {
      setSelectedTaskIds(prev => prev.filter(id => id !== taskId))
    }
  }

  const handleLinkTasks = async () => {
    if (!linkingMilestone) return

    setSubmitting(true)
    try {
      // 获取需要关联和取消关联的任务
      const currentLinkedIds = linkingMilestone.tasks?.map(t => t.id) || []
      const toLink = selectedTaskIds.filter(id => !currentLinkedIds.includes(id))
      const toUnlink = currentLinkedIds.filter(id => !selectedTaskIds.includes(id))

      // 并行执行关联和取消关联
      const promises = [
        ...toLink.map(taskId =>
          api.post(`/milestones/${linkingMilestone.id}/tasks`, { taskId })
        ),
        ...toUnlink.map(taskId =>
          api.delete(`/milestones/${linkingMilestone.id}/tasks?taskId=${taskId}`)
        ),
      ]

      await Promise.all(promises)

      setLinkTaskDialogOpen(false)
      setLinkingMilestone(null)
      setSelectedTaskIds([])
      fetchMilestones(projectId)
    } catch (error) {
      console.error('关联任务失败:', error)
      alert('关联任务失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 返回导航 */}
      <div className="flex items-center gap-2">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            返回项目
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-1">
            <Home className="h-4 w-4" />
            工作台
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">里程碑管理</h1>
          <p className="text-muted-foreground">管理项目里程碑和关键节点</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建里程碑
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建里程碑</DialogTitle>
              <DialogDescription>
                为项目创建一个新的里程碑
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">标题 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="输入里程碑标题"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="输入里程碑描述（可选）"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">截止日期</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    '创建'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 编辑里程碑对话框 */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑里程碑</DialogTitle>
              <DialogDescription>
                修改里程碑信息和状态
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateMilestone}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">标题 *</Label>
                  <Input
                    id="edit-title"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">描述</Label>
                  <Textarea
                    id="edit-description"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">状态</Label>
                    <Select
                      value={editFormData.status}
                      onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NOT_STARTED">未开始</SelectItem>
                        <SelectItem value="IN_PROGRESS">进行中</SelectItem>
                        <SelectItem value="COMPLETED">已完成</SelectItem>
                        <SelectItem value="CANCELLED">已取消</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-progress">进度 (%)</Label>
                    <Input
                      id="edit-progress"
                      type="number"
                      min="0"
                      max="100"
                      value={editFormData.progress}
                      onChange={(e) => setEditFormData({ ...editFormData, progress: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dueDate">截止日期</Label>
                  <Input
                    id="edit-dueDate"
                    type="date"
                    value={editFormData.dueDate}
                    onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    '保存'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 关联任务对话框 */}
        <Dialog open={linkTaskDialogOpen} onOpenChange={setLinkTaskDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>关联任务</DialogTitle>
              <DialogDescription>
                选择要关联到里程碑「{linkingMilestone?.title}」的任务
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {projectTasks.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  项目暂无任务，请先创建任务
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {projectTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={selectedTaskIds.includes(task.id)}
                        onCheckedChange={(checked) => handleTaskSelection(task.id, checked as boolean)}
                      />
                      <label
                        htmlFor={`task-${task.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-muted-foreground">
                          状态: {taskStatusLabels[task.status] || task.status}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLinkTaskDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleLinkTasks} disabled={submitting || projectTasks.length === 0}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    处理中...
                  </>
                ) : (
                  '确定'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {milestones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            暂无里程碑数据，点击"新建里程碑"创建第一个里程碑
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {milestones.map((milestone) => (
            <Card key={milestone.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{milestone.title}</h3>
                      <Badge className={statusColors[milestone.status]}>
                        {statusLabels[milestone.status]}
                      </Badge>
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {milestone.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        {milestone._count?.tasks || milestone.tasks?.length || 0} 个任务
                      </span>
                      {milestone.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(milestone.dueDate).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                    </div>
                    {/* 显示关联的任务列表 */}
                    {milestone.tasks && milestone.tasks.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm font-medium mb-2">关联任务:</div>
                        <div className="flex flex-wrap gap-2">
                          {milestone.tasks.map((task) => (
                            <Link
                              key={task.id}
                              href={`/projects/${projectId}/tasks/${task.id}`}
                              className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200 transition-colors"
                            >
                              {task.title}
                              <Badge variant="outline" className="ml-2 text-xs">
                                {task.progress}%
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold">{milestone.progress}%</div>
                      <p className="text-sm text-muted-foreground">完成进度</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenLinkTaskDialog(milestone)}
                        title="关联任务"
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(milestone)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteMilestone(milestone.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}