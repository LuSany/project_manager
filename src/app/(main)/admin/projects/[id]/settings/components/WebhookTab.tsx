'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { api } from '@/lib/api/client'
import { Loader2, Plus, Edit2, Trash2, Play, Check, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Webhook {
  id: string
  name: string
  url: string
  events: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const eventOptions = [
  { id: 'task.created', label: '任务创建' },
  { id: 'task.updated', label: '任务更新' },
  { id: 'task.deleted', label: '任务删除' },
  { id: 'member.added', label: '成员加入' },
  { id: 'member.removed', label: '成员移除' },
]

interface WebhookTabProps {
  projectId: string
}

export function WebhookTab({ projectId }: WebhookTabProps) {
  const { toast } = useToast()
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [webhookToDelete, setWebhookToDelete] = useState<Webhook | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    fetchWebhooks()
  }, [projectId])

  const fetchWebhooks = async () => {
    setLoading(true)
    try {
      const response = await api.get<Webhook[]>(`/webhooks?projectId=${projectId}`)
      const data = (response as { data?: Webhook[] }).data || []
      setWebhooks(data)
    } catch (error) {
      console.error('获取 Webhook 列表失败:', error)
      toast({
        title: '获取失败',
        description: '获取 Webhook 列表失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingWebhook(null)
    setName('')
    setUrl('')
    setSelectedEvents([])
    setIsActive(true)
    setDialogOpen(true)
  }

  const openEditDialog = (webhook: Webhook) => {
    setEditingWebhook(webhook)
    setName(webhook.name)
    setUrl(webhook.url)
    setSelectedEvents(JSON.parse(webhook.events))
    setIsActive(webhook.isActive)
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!name.trim() || !url.trim() || selectedEvents.length === 0) {
      toast({
        title: '验证失败',
        description: '请填写所有必填字段',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name,
        url,
        events: selectedEvents,
        isActive,
      }

      if (editingWebhook) {
        await api.put(`/webhooks/${editingWebhook.id}`, payload)
        toast({
          title: '更新成功',
          variant: 'success',
        })
      } else {
        await api.post('/webhooks', payload)
        toast({
          title: '创建成功',
          variant: 'success',
        })
      }

      setDialogOpen(false)
      fetchWebhooks()
    } catch (error) {
      console.error('保存 Webhook 失败:', error)
      toast({
        title: '保存失败',
        description: '请重试',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!webhookToDelete) return

    setSubmitting(true)
    try {
      await api.delete(`/webhooks/${webhookToDelete.id}`)
      toast({
        title: '删除成功',
        variant: 'success',
      })
      setDeleteDialogOpen(false)
      setWebhookToDelete(null)
      fetchWebhooks()
    } catch (error) {
      console.error('删除 Webhook 失败:', error)
      toast({
        title: '删除失败',
        description: '请重试',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleTest = async (webhook: Webhook) => {
    try {
      const response = await api.post('/webhooks/test', {
        url: webhook.url,
        event: 'test',
        payload: { test: true, timestamp: new Date().toISOString() },
      })

      const result = response as any
      if (result.success) {
        toast({
          title: '测试成功',
          description: `响应时间: ${result.data.duration}ms`,
          variant: 'success',
        })
      } else {
        throw new Error('测试失败')
      }
    } catch (error) {
      console.error('测试 Webhook 失败:', error)
      toast({
        title: '测试失败',
        description: '请检查 URL 是否正确',
        variant: 'destructive',
      })
    }
  }

  const openDeleteDialog = (webhook: Webhook) => {
    setWebhookToDelete(webhook)
    setDeleteDialogOpen(true)
  }

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Webhook 配置</h3>
          <p className="text-muted-foreground text-sm">配置项目事件触发时自动调用的外部服务</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          添加 Webhook
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      ) : webhooks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">暂无 Webhook 配置</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => {
            const events = JSON.parse(webhook.events)
            return (
              <Card key={webhook.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <p className="font-medium">{webhook.name}</p>
                        {webhook.isActive ? (
                          <Badge className="bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                            <Check className="mr-1 h-3 w-3" />
                            启用
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <X className="mr-1 h-3 w-3" />
                            禁用
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-2 text-sm">{webhook.url}</p>
                      <div className="flex flex-wrap gap-1">
                        {events.map((event: string) => (
                          <Badge key={event} variant="secondary" className="text-xs">
                            {eventOptions.find((e) => e.id === event)?.label || event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleTest(webhook)}>
                        <Play className="mr-1 h-4 w-4" />
                        测试
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEditDialog(webhook)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openDeleteDialog(webhook)}>
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingWebhook ? '编辑 Webhook' : '添加 Webhook'}</DialogTitle>
            <DialogDescription>配置项目事件触发时自动调用的外部服务</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-name">名称 *</Label>
              <Input
                id="webhook-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Webhook 名称"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-url">URL *</Label>
              <Input
                id="webhook-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/webhook"
              />
            </div>

            <div className="space-y-2">
              <Label>触发事件 *</Label>
              <div className="space-y-2">
                {eventOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={selectedEvents.includes(option.id)}
                      onCheckedChange={() => toggleEvent(option.id)}
                    />
                    <Label htmlFor={option.id} className="font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="webhook-active" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="webhook-active">启用此 Webhook</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingWebhook ? '更新' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除 Webhook「{webhookToDelete?.name}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
