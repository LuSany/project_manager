'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api/client'
import { Loader2, Plus, Brain, History, Database } from 'lucide-react'

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
  const [configs, setConfigs] = useState<AIConfig[]>([])
  const [logs, setLogs] = useState<AILog[]>([])
  const [cache, setCache] = useState<AICache[]>([])
  const [loading, setLoading] = useState(true)

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

  const serviceTypeLabels: Record<string, string> = {
    RISK_ANALYSIS: '风险分析',
    REVIEW_AUDIT: '评审审核',
    DOC_PARSE: '文档解析',
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    SUCCESS: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
  }

  const statusLabels: Record<string, string> = {
    PENDING: '处理中',
    SUCCESS: '成功',
    FAILED: '失败',
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
                    暂无 AI 服务配置
                  </div>
                ) : (
                  configs.map((config) => (
                    <div key={config.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{config.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {config.provider} · {config.model}
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

          <TabsContent value="logs">
            <div className="border rounded-lg divide-y">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  暂无调用日志
                </div>
              ) : (
                logs.slice(0, 30).map((log) => (
                  <div key={log.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {serviceTypeLabels[log.serviceType] || log.serviceType}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {log.provider} · {log.model}
                        {log.duration && ` · ${log.duration}ms`}
                      </p>
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

          <TabsContent value="cache">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  AI 响应缓存可减少重复调用，降低成本
                </p>
                <Button variant="outline" size="sm">
                  清理过期缓存
                </Button>
              </div>

              <div className="border rounded-lg divide-y">
                {cache.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    暂无缓存记录
                  </div>
                ) : (
                  cache.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {serviceTypeLabels[item.serviceType] || item.serviceType}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          命中次数: {item.hitCount}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        过期: {new Date(item.expiresAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}