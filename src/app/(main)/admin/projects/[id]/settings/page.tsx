'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Settings, Loader2, Webhook, Bell, SlidersHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/client'
import { WebhookTab } from './components/WebhookTab'
import { NotificationsTab } from './components/NotificationsTab'
import { DefaultsTab } from './components/DefaultsTab'

export default function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string>('')
  const [projectName, setProjectName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params
      setProjectId(resolvedParams.id)

      try {
        const response = await api.get<any>(`/admin/projects`)
        if ((response as { success?: boolean }).success) {
          const projects = (response as { data?: any[] }).data || []
          const project = projects.find((p) => p.id === resolvedParams.id)
          if (project) {
            setProjectName(project.name)
          }
        }
      } catch (error) {
        console.error('获取项目信息失败:', error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [params])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Settings className="text-primary h-6 w-6" />
          <h1 className="text-2xl font-bold">{projectName} - 项目设置</h1>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="webhook">
            <TabsList className="mb-6">
              <TabsTrigger value="webhook" className="gap-2">
                <Webhook className="h-4 w-4" />
                Webhook 配置
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                通知集成
              </TabsTrigger>
              <TabsTrigger value="defaults" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                项目默认值
              </TabsTrigger>
            </TabsList>

            <TabsContent value="webhook">
              {projectId && <WebhookTab projectId={projectId} />}
            </TabsContent>

            <TabsContent value="notifications">
              {projectId && <NotificationsTab projectId={projectId} />}
            </TabsContent>

            <TabsContent value="defaults">
              {projectId && <DefaultsTab projectId={projectId} />}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
