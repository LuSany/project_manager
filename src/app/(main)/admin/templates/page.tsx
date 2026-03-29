'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api/client'
import { Loader2, Plus, FileText, CheckSquare, Edit2, Trash2 } from 'lucide-react'
import { TemplateDialog } from './components/TemplateDialog'
import { useToast } from '@/hooks/use-toast'

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
  const { toast } = useToast()
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([])
  const [reviewTemplates, setReviewTemplates] = useState<ReviewTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | ReviewTemplate | null>(null)
  const [dialogType, setDialogType] = useState<'task' | 'review'>('task')

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const [taskRes, reviewRes] = await Promise.all([
        api.get('/templates'),
        api.get('/review-templates'),
      ])
      setTaskTemplates((taskRes as { data?: { items?: TaskTemplate[] } }).data?.items || [])
      setReviewTemplates((reviewRes as { data?: { data?: ReviewTemplate[] } }).data?.data || [])
    } catch (error) {
      console.error('获取模板列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = (type: 'task' | 'review') => {
    setDialogType(type)
    setEditingTemplate(null)
    setDialogOpen(true)
  }

  const handleEditTemplate = (template: TaskTemplate | ReviewTemplate, type: 'task' | 'review') => {
    setDialogType(type)
    setEditingTemplate(template)
    setDialogOpen(true)
  }

  const handleDeleteTemplate = async (id: string, type: 'task' | 'review') => {
    if (!confirm('确定要删除这个模板吗?')) {
      return
    }

    try {
      await api.delete(`/${type === 'task' ? 'templates' : 'review-templates'}/${id}`)
      toast({
        title: '删除成功',
        variant: 'success',
      })
      fetchTemplates()
    } catch (error) {
      console.error('删除模板失败:', error)
      toast({
        title: '删除失败',
        description: '请重试',
        variant: 'destructive',
      })
    }
  }

  const handleDialogSuccess = () => {
    fetchTemplates()
    setDialogOpen(false)
    setEditingTemplate(null)
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
              <div className="flex justify-between">
                <Button size="sm" onClick={() => handleCreateTemplate('task')}>
                  <Plus className="mr-2 h-4 w-4" />
                  新建模板
                </Button>
              </div>

              <div className="divide-y rounded-lg border">
                {taskTemplates.length === 0 ? (
                  <div className="text-muted-foreground p-8 text-center">暂无任务模板</div>
                ) : (
                  taskTemplates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{template.title}</p>
                        {template.description && (
                          <p className="text-muted-foreground text-sm">{template.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        {template.isPublic && (
                          <Badge className="bg-blue-500/20 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                            公开
                          </Badge>
                        )}
                        <span className="text-muted-foreground text-sm">
                          {new Date(template.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTemplate(template, 'task')}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTemplate(template.id, 'task')}
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

          <TabsContent value="review">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => handleCreateTemplate('review')}>
                  <Plus className="mr-2 h-4 w-4" />
                  新建模板
                </Button>
              </div>

              <div className="divide-y rounded-lg border">
                {reviewTemplates.length === 0 ? (
                  <div className="text-muted-foreground p-8 text-center">暂无评审模板</div>
                ) : (
                  reviewTemplates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-muted-foreground text-sm">
                          类型: {template.type?.displayName || template.type?.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {template.isActive ? (
                          <Badge className="bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                            启用
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-500/20 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400">
                            禁用
                          </Badge>
                        )}
                        <span className="text-muted-foreground text-sm">
                          {new Date(template.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTemplate(template, 'review')}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTemplate(template.id, 'review')}
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
        </Tabs>
        <TemplateDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          template={editingTemplate}
          type={dialogType}
          onSuccess={handleDialogSuccess}
        />
      </CardContent>
    </Card>
  )
}
