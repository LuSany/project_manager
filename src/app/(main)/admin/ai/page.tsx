'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api/client'
import { Loader2, Plus, Brain, History, Database, Edit2, Trash2, Clock, Bot } from 'lucide-react'
import { AIConfigDialog } from './components/AIConfigDialog'
import { ScanConfigTab } from './components/ScanConfigTab'
import { AIReviewerConfigPanel } from './components/AIReviewerConfigPanel'
import { useToast } from '@/hooks/use-toast'

interface AIConfig {
  id: string
  name: string
  provider: string
  model: string
  isActive: boolean
  isDefault: boolean
}

interface AILog {
  id: string
  serviceType: string
  provider: string
  model: string
  status: string
  duration?: number
  createdAt: string
}

interface AICache {
  id: string
  serviceType: string
  hitCount: number
  expiresAt: string
  createdAt: string
}

export default function AIAdminPage() {
  const { toast } = useToast()
  const [configs, setConfigs] = useState<AIConfig[]>([])
  const [logs, setLogs] = useState<AILog[]>([])
  const [cache, setCache] = useState<AICache[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [configsRes, logsRes] = await Promise.all([
        api.get('/admin/ai/configs'),
        api.get('/ai/logs'),
      ])
      setConfigs((configsRes as any).data || [])
      setLogs((logsRes as any).data || [])
    } catch (error) {
      console.error('获取AI配置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateConfig = () => {
    setEditingConfig(null)
    setDialogOpen(true)
  }

  const handleEditConfig = (config: AIConfig) => {
    setEditingConfig(config)
    setDialogOpen(true)
  }

  const handleDeleteConfig = async (id: string) => {
    if (!confirm('确定要删除这个配置吗?')) {
      return
    }

    try {
      await api.delete(`/admin/ai/configs/${id}`)
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

  const serviceTypeLabels: Record<string, string> = {
    RISK_ANALYSIS: '风险分析',
    REVIEW_AUDIT: '评审审核',
    DOC_PARSE: '文档解析',
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
    SUCCESS: 'bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400',
    FAILED: 'bg-red-500/20 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  }

  const statusLabels: Record<string, string> = {
    PENDING: '处理中',
    SUCCESS: '成功',
    FAILED: '失败',
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
        <CardTitle>AI 服务配置</CardTitle>
        <CardDescription>管理 AI 服务接入和监控使用情况</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="configs">
          <TabsList className="mb-4">
            <TabsTrigger value="configs" className="gap-2">
              <Brain className="h-4 w-4" />
              服务配置
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <History className="h-4 w-4" />
              调用日志
            </TabsTrigger>
            <TabsTrigger value="cache" className="gap-2">
              <Database className="h-4 w-4" />
              缓存管理
            </TabsTrigger>
            <TabsTrigger value="scan" className="gap-2">
              <Clock className="h-4 w-4" />
              定时扫描
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
                  <div className="text-muted-foreground p-8 text-center">暂无 AI 服务配置</div>
                ) : (
                  configs.map((config) => (
                    <div key={config.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{config.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {config.provider} · {config.model}
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

          <TabsContent value="logs">
            <div className="divide-y rounded-lg border">
              {logs.length === 0 ? (
                <div className="text-muted-foreground p-8 text-center">暂无调用日志</div>
              ) : (
                logs.slice(0, 30).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium">
                        {serviceTypeLabels[log.serviceType] || log.serviceType}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {log.provider} · {log.model}
                        {log.duration && ` · ${log.duration}ms`}
                      </p>
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

          <TabsContent value="cache">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">AI 响应缓存可减少重复调用，降低成本</p>
                <Button variant="outline" size="sm">
                  清理过期缓存
                </Button>
              </div>

              <div className="divide-y rounded-lg border">
                {cache.length === 0 ? (
                  <div className="text-muted-foreground p-8 text-center">暂无缓存记录</div>
                ) : (
                  cache.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-sm font-medium">
                          {serviceTypeLabels[item.serviceType] || item.serviceType}
                        </p>
                        <p className="text-muted-foreground text-sm">命中次数: {item.hitCount}</p>
                      </div>
                      <span className="text-muted-foreground text-sm">
                        过期: {new Date(item.expiresAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scan">
            <ScanConfigTab />
          </TabsContent>
        </Tabs>
        <AIConfigDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          config={editingConfig}
          onSuccess={handleDialogSuccess}
        />
      </CardContent>
    </Card>
  )
}
