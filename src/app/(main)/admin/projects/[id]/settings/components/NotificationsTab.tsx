'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api/client'
import { Loader2, Bell } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface NotificationSettings {
  taskAssignment: boolean
  taskDueReminders: boolean
  dueReminderTime: string
  memberJoinLeave: boolean
  riskThresholdAlerts: boolean
  riskThreshold: string
}

const defaultSettings: NotificationSettings = {
  taskAssignment: true,
  taskDueReminders: true,
  dueReminderTime: '24h',
  memberJoinLeave: true,
  riskThresholdAlerts: false,
  riskThreshold: 'MEDIUM',
}

interface NotificationsTabProps {
  projectId: string
}

export function NotificationsTab({ projectId }: NotificationsTabProps) {
  const { toast } = useToast()
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [projectId])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await api.get<any>(`/projects/${projectId}`)
      const project = (response as { data?: any }).data
      if (project?.config?.notifications) {
        setSettings(project.config.notifications)
      }
    } catch (error) {
      console.error('获取通知设置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/admin/projects/${projectId}`, {
        config: {
          notifications: settings,
        },
      })
      toast({
        title: '保存成功',
        variant: 'success',
      })
    } catch (error) {
      console.error('保存通知设置失败:', error)
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
        <h3 className="mb-2 text-lg font-semibold">通知集成</h3>
        <p className="text-muted-foreground text-sm">配置项目事件触发时的通知方式</p>
      </div>

      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg">
                <Bell className="text-primary h-5 w-5" />
              </div>
              <div>
                <Label className="text-base font-medium">任务分配通知</Label>
                <p className="text-muted-foreground text-sm">当任务分配给成员时发送通知</p>
              </div>
            </div>
            <Switch
              checked={settings.taskAssignment}
              onCheckedChange={(checked) => setSettings({ ...settings, taskAssignment: checked })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg">
                  <Bell className="text-primary h-5 w-5" />
                </div>
                <div>
                  <Label className="text-base font-medium">任务截止提醒</Label>
                  <p className="text-muted-foreground text-sm">在任务截止前自动发送提醒通知</p>
                </div>
              </div>
              <Switch
                checked={settings.taskDueReminders}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, taskDueReminders: checked })
                }
              />
            </div>

            {settings.taskDueReminders && (
              <div className="ml-12 space-y-2">
                <Label>提醒时间</Label>
                <Select
                  value={settings.dueReminderTime}
                  onValueChange={(value) => setSettings({ ...settings, dueReminderTime: value })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">提前 1 小时</SelectItem>
                    <SelectItem value="24h">提前 1 天</SelectItem>
                    <SelectItem value="3d">提前 3 天</SelectItem>
                    <SelectItem value="7d">提前 1 周</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg">
                <Bell className="text-primary h-5 w-5" />
              </div>
              <div>
                <Label className="text-base font-medium">成员加入/离开通知</Label>
                <p className="text-muted-foreground text-sm">当成员加入或离开项目时发送通知</p>
              </div>
            </div>
            <Switch
              checked={settings.memberJoinLeave}
              onCheckedChange={(checked) => setSettings({ ...settings, memberJoinLeave: checked })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg">
                  <Bell className="text-primary h-5 w-5" />
                </div>
                <div>
                  <Label className="text-base font-medium">风险阈值告警</Label>
                  <p className="text-muted-foreground text-sm">当项目风险超过设定阈值时发送告警</p>
                </div>
              </div>
              <Switch
                checked={settings.riskThresholdAlerts}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, riskThresholdAlerts: checked })
                }
              />
            </div>

            {settings.riskThresholdAlerts && (
              <div className="ml-12 space-y-2">
                <Label>告警阈值</Label>
                <Select
                  value={settings.riskThreshold}
                  onValueChange={(value) => setSettings({ ...settings, riskThreshold: value })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">高风险</SelectItem>
                    <SelectItem value="MEDIUM">中风险</SelectItem>
                    <SelectItem value="LOW">低风险</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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
