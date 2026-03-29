'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api/client'
import { Loader2, SlidersHorizontal, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ProjectMember {
  id: string
  users: {
    id: string
    name: string
    email: string
  }
}

interface DefaultSettings {
  defaultAssignee: string
  defaultPriority: string
  defaultStatus: string
  defaultVisibility: string
}

const defaultSettings: DefaultSettings = {
  defaultAssignee: '',
  defaultPriority: 'MEDIUM',
  defaultStatus: 'TODO',
  defaultVisibility: 'PUBLIC',
}

const priorityOptions = [
  { value: 'LOW', label: '低' },
  { value: 'MEDIUM', label: '中' },
  { value: 'HIGH', label: '高' },
  { value: 'URGENT', label: '紧急' },
]

const statusOptions = [
  { value: 'TODO', label: '待办' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'DONE', label: '已完成' },
  { value: 'BLOCKED', label: '已阻塞' },
]

const visibilityOptions = [
  { value: 'PUBLIC', label: '公开' },
  { value: 'PRIVATE', label: '私有' },
]

interface DefaultsTabProps {
  projectId: string
}

export function DefaultsTab({ projectId }: DefaultsTabProps) {
  const { toast } = useToast()
  const [settings, setSettings] = useState<DefaultSettings>(defaultSettings)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [projectRes, membersRes] = await Promise.all([
        api.get<any>(`/projects/${projectId}`),
        api.get<ProjectMember[]>(`/projects/${projectId}/members`),
      ])

      const project = (projectRes as { data?: any }).data
      if (project?.config?.defaults) {
        setSettings(project.config.defaults)
      }

      const membersData = (membersRes as { data?: ProjectMember[] }).data || []
      setMembers(membersData)
    } catch (error) {
      console.error('获取设置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/admin/projects/${projectId}`, {
        config: {
          defaults: settings,
        },
      })
      toast({
        title: '保存成功',
        variant: 'success',
      })
    } catch (error) {
      console.error('保存默认设置失败:', error)
      toast({
        title: '保存失败',
        description: '请重试',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-lg font-semibold">项目默认值</h3>
        <p className="text-muted-foreground text-sm">配置项目中创建任务时的默认选项</p>
      </div>

      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg">
                <User className="text-primary h-5 w-5" />
              </div>
              <Label className="text-base font-medium">默认任务负责人</Label>
            </div>
            <Select
              value={settings.defaultAssignee}
              onValueChange={(value) => setSettings({ ...settings, defaultAssignee: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择默认负责人" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">不指定</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.users.id}>
                    {member.users.name} ({member.users.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-sm">新创建的任务将默认分配给该成员</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg">
                <SlidersHorizontal className="text-primary h-5 w-5" />
              </div>
              <Label className="text-base font-medium">默认任务优先级</Label>
            </div>
            <Select
              value={settings.defaultPriority}
              onValueChange={(value) => setSettings({ ...settings, defaultPriority: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-sm">新创建的任务将默认使用此优先级</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg">
                <SlidersHorizontal className="text-primary h-5 w-5" />
              </div>
              <Label className="text-base font-medium">默认任务状态</Label>
            </div>
            <Select
              value={settings.defaultStatus}
              onValueChange={(value) => setSettings({ ...settings, defaultStatus: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-sm">新创建的任务将默认使用此状态</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg">
                <SlidersHorizontal className="text-primary h-5 w-5" />
              </div>
              <Label className="text-base font-medium">默认可见性</Label>
            </div>
            <Select
              value={settings.defaultVisibility}
              onValueChange={(value) => setSettings({ ...settings, defaultVisibility: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-sm">新创建的任务将默认使用此可见性设置</p>
          </div>

          <div className="border-t pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存设置
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
