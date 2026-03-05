'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api/client'
import { Loader2, Plus, FileText, CheckSquare } from 'lucide-react'

interface TaskTemplate {
  id: string
  title: string
  description?: string
  isPublic: boolean
  createdBy?: string
  createdAt: string
}

interface ReviewTemplate {
  id: string
  name: string
  description?: string
  isActive: boolean
  type: {
    name: string
    displayName: string
  }
  createdAt: string
}

export default function TemplatesAdminPage() {
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([])
  const [reviewTemplates, setReviewTemplates] = useState<ReviewTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const [taskRes, reviewRes] = await Promise.all([
        api.get('/templates'),
        api.get('/review-templates'),
      ])
      setTaskTemplates((taskRes as { data?: TaskTemplate[] }).data || [])
      setReviewTemplates((reviewRes as { data?: ReviewTemplate[] }).data || [])
    } catch (error) {
      console.error('获取模板列表失败:', error)
    } finally {
      setLoading(false)
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
    <Card>
      <CardHeader>
        <CardTitle>模板管理</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="task">
          <TabsList className="mb-4">
            <TabsTrigger value="task" className="gap-2">
              <CheckSquare className="h-4 w-4" />
              任务模板
            </TabsTrigger>
            <TabsTrigger value="review" className="gap-2">
              <FileText className="h-4 w-4" />
              评审模板
            </TabsTrigger>
          </TabsList>

          <TabsContent value="task">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  新建模板
                </Button>
              </div>

              <div className="border rounded-lg divide-y">
                {taskTemplates.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    暂无任务模板
                  </div>
                ) : (
                  taskTemplates.map((template) => (
                    <div key={template.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{template.title}</p>
                        {template.description && (
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        {template.isPublic && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            公开
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {new Date(template.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="review">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  新建模板
                </Button>
              </div>

              <div className="border rounded-lg divide-y">
                {reviewTemplates.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    暂无评审模板
                  </div>
                ) : (
                  reviewTemplates.map((template) => (
                    <div key={template.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-muted-foreground">
                          类型: {template.type?.displayName || template.type?.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {template.isActive ? (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            启用
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            禁用
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {new Date(template.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
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