'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api/client'
import { ArrowLeft, Save, Loader2, Bell, Mail, MessageSquare } from 'lucide-react'
import Link from 'next/link'

interface NotificationPreferences {
  emailEnabled: boolean
  inAppEnabled: boolean
  taskDue: boolean
  taskAssigned: boolean
  reviewInvite: boolean
  riskAlert: boolean
  commentMention: boolean
  dailyDigest: boolean
  weeklyDigest: boolean
}

const defaultPreferences: NotificationPreferences = {
  emailEnabled: true,
  inAppEnabled: true,
  taskDue: true,
  taskAssigned: true,
  reviewInvite: true,
  riskAlert: true,
  commentMention: true,
  dailyDigest: false,
  weeklyDigest: false,
}

const notificationTypes = [
  { key: 'taskDue', label: '任务到期提醒', description: '任务即将到期时收到提醒' },
  { key: 'taskAssigned', label: '任务分配通知', description: '有新任务分配给您时通知' },
  { key: 'reviewInvite', label: '评审邀请', description: '被邀请参与评审时通知' },
  { key: 'riskAlert', label: '风险预警', description: '项目风险状态变化时通知' },
  { key: 'commentMention', label: '@提及通知', description: '在评论中被提及时通知' },
]

const digestOptions = [
  { key: 'dailyDigest', label: '每日摘要', description: '每天汇总发送一次通知' },
  { key: 'weeklyDigest', label: '每周摘要', description: '每周汇总发送一次通知' },
]

export default function PreferencesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await api.get('/notifications/preferences')
      const data = (response as { data?: NotificationPreferences }).data
      if (data) {
        setPreferences({ ...defaultPreferences, ...data })
      }
    } catch (error) {
      // 使用默认值
    } finally {
      setFetching(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.put('/notifications/preferences', preferences)
      toast({
        title: '保存成功',
        description: '您的通知偏好已更新',
      })
    } catch (error) {
      toast({
        title: '保存失败',
        description: '请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  if (fetching) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">通知偏好</h1>
          <p className="text-muted-foreground">配置您接收通知的方式</p>
        </div>
      </div>

      {/* 通知渠道 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知渠道
          </CardTitle>
          <CardDescription>选择您希望接收通知的方式</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label>邮件通知</Label>
                <p className="text-sm text-muted-foreground">通过邮件接收通知</p>
              </div>
            </div>
            <Switch
              checked={preferences.emailEnabled}
              onCheckedChange={(checked) => updatePreference('emailEnabled', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label>站内通知</Label>
                <p className="text-sm text-muted-foreground">在系统内接收通知</p>
              </div>
            </div>
            <Switch
              checked={preferences.inAppEnabled}
              onCheckedChange={(checked) => updatePreference('inAppEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 通知类型 */}
      <Card>
        <CardHeader>
          <CardTitle>通知类型</CardTitle>
          <CardDescription>选择您希望接收的通知类型</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map((type) => (
            <div key={type.key} className="flex items-center justify-between">
              <div>
                <Label>{type.label}</Label>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
              <Switch
                checked={preferences[type.key as keyof NotificationPreferences] as boolean}
                onCheckedChange={(checked) =>
                  updatePreference(type.key as keyof NotificationPreferences, checked)
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 摘要设置 */}
      <Card>
        <CardHeader>
          <CardTitle>摘要通知</CardTitle>
          <CardDescription>设置定期汇总通知</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {digestOptions.map((option) => (
            <div key={option.key} className="flex items-center justify-between">
              <div>
                <Label>{option.label}</Label>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
              <Switch
                checked={preferences[option.key as keyof NotificationPreferences] as boolean}
                onCheckedChange={(checked) =>
                  updatePreference(option.key as keyof NotificationPreferences, checked)
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              保存更改
            </>
          )}
        </Button>
      </div>
    </div>
  )
}