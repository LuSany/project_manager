'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api/client'
import { Loader2, Plus, Mail, FileText, History } from 'lucide-react'

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
  const [configs, setConfigs] = useState<EmailConfig[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)

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

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    SENT: 'bg-blue-100 text-blue-800',
    DELIVERED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  添加配置
                </Button>
              </div>

              <div className="border rounded-lg divide-y">
                {configs.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    暂无邮件服务配置
                  </div>
                ) : (
                  configs.map((config) => (
                    <div key={config.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{config.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {config.provider} · {config.fromAddress}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {config.isDefault && (
                          <Badge variant="secondary">默认</Badge>
                        )}
                        {config.isActive ? (
                          <Badge className="bg-green-100 text-green-800">启用</Badge>
                        ) : (
                          <Badge variant="outline">禁用</Badge>
                        )}
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
                  <Plus className="h-4 w-4 mr-2" />
                  新建模板
                </Button>
              </div>

              <div className="border rounded-lg divide-y">
                {templates.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    暂无邮件模板
                  </div>
                ) : (
                  templates.map((template) => (
                    <div key={template.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-muted-foreground">{template.subject}</p>
                      </div>
                      <Badge variant="outline">{template.type}</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <div className="border rounded-lg divide-y">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  暂无发送记录
                </div>
              ) : (
                logs.slice(0, 20).map((log) => (
                  <div key={log.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{log.subject}</p>
                      <p className="text-sm text-muted-foreground">收件人: {log.to}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={statusColors[log.status]}>
                        {statusLabels[log.status]}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}