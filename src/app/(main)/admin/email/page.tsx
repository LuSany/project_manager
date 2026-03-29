'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api/client'
import {
  Loader2,
  Plus,
  Mail,
  FileText,
  History,
  Edit2,
  Trash2,
  Upload,
  Download,
} from 'lucide-react'
import { EmailConfigDialog } from './components/EmailConfigDialog'
import { useToast } from '@/hooks/use-toast'

interface EmailConfig {
  id: string
  name: string
  provider: string
  fromAddress: string
  fromName?: string
  isActive: boolean
  isDefault: boolean
}

interface EmailTemplate {
  id: string
  name: string
  type: string
  subject: string
  isActive: boolean
}

interface EmailLog {
  id: string
  to: string
  subject: string
  status: string
  createdAt: string
}

export default function EmailAdminPage() {
  const { toast } = useToast()
  const [configs, setConfigs] = useState<EmailConfig[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<EmailConfig | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [configsRes, templatesRes, logsRes] = await Promise.all([
        api.get('/admin/email/configs'),
        api.get('/admin/email/templates'),
        api.get('/admin/email/logs'),
      ])
      setConfigs((configsRes as { data?: EmailConfig[] }).data || [])
      setTemplates((templatesRes as { data?: EmailTemplate[] }).data || [])
      setLogs((logsRes as { data?: EmailLog[] }).data || [])
    } catch (error) {
      console.error('获取邮件配置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateConfig = () => {
    setEditingConfig(null)
    setDialogOpen(true)
  }

  const handleEditConfig = (config: EmailConfig) => {
    setEditingConfig(config)
    setDialogOpen(true)
  }

  const handleDeleteConfig = async (id: string) => {
    if (!confirm('确定要删除这个配置吗?')) {
      return
    }

    try {
      await api.delete(`/admin/email/configs/${id}`)
      toast({
        title: '删除成功',
        variant: 'success',
      })
      fetchData()
    } catch (error) {
      console.error('删除配置失败:', error)
      toast({
        title: '删除失败',
        description: '请重试',
        variant: 'destructive',
      })
    }
  }

  const handleDialogSuccess = () => {
    fetchData()
    setDialogOpen(false)
    setEditingConfig(null)
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
    SENT: 'bg-blue-500/20 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    DELIVERED: 'bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400',
    FAILED: 'bg-red-500/20 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  }

  const statusLabels: Record<string, string> = {
    PENDING: '待发送',
    SENT: '已发送',
    DELIVERED: '已送达',
    FAILED: '发送失败',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>邮件服务配置</CardTitle>
        <CardDescription>管理邮件服务商和模板</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="configs">
          <TabsList className="mb-4">
            <TabsTrigger value="configs" className="gap-2">
              <Mail className="h-4 w-4" />
              服务配置
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              邮件模板
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <History className="h-4 w-4" />
              发送日志
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configs">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={handleCreateConfig}>
                  <Plus className="mr-2 h-4 w-4" />
                  添加配置
                </Button>
              </div>

              <div className="divide-y rounded-lg border">
                {configs.length === 0 ? (
                  <div className="text-muted-foreground p-8 text-center">暂无邮件服务配置</div>
                ) : (
                  configs.map((config) => (
                    <div key={config.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{config.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {config.provider} · {config.fromAddress}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {config.isDefault && <Badge variant="secondary">默认</Badge>}
                        {config.isActive ? (
                          <Badge className="bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                            启用
                          </Badge>
                        ) : (
                          <Badge variant="outline">禁用</Badge>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleEditConfig(config)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteConfig(config.id)}
                        >
                          <Trash2 className="text-destructive h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  新建模板
                </Button>
              </div>

              <div className="divide-y rounded-lg border">
                {templates.length === 0 ? (
                  <div className="text-muted-foreground p-8 text-center">暂无邮件模板</div>
                ) : (
                  templates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-muted-foreground text-sm">{template.subject}</p>
                      </div>
                      <Badge variant="outline">{template.type}</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <div className="divide-y rounded-lg border">
              {logs.length === 0 ? (
                <div className="text-muted-foreground p-8 text-center">暂无发送记录</div>
              ) : (
                logs.slice(0, 20).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium">{log.subject}</p>
                      <p className="text-muted-foreground text-sm">收件人: {log.to}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={statusColors[log.status]}>{statusLabels[log.status]}</Badge>
                      <span className="text-muted-foreground text-sm">
                        {new Date(log.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
        <EmailConfigDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          config={editingConfig}
          onSuccess={handleDialogSuccess}
        />
      </CardContent>
    </Card>
  )
}
