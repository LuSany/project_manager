'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api/client'
import { Loader2, Plus, FileText, CheckSquare, Edit2, Trash2, Upload, Download } from 'lucide-react'
import { TemplateDialog } from './components/TemplateDialog'
import { useToast } from '@/hooks/use-toast'

// CSV解析函数
function parseCSV(text: string): Record<string, unknown>[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV文件至少需要包含标题行和一行数据')
  }

  // 解析标题行，处理可能的逗号分隔和引号包裹
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseCSVLine(lines[0])
  const data: Record<string, unknown>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: Record<string, unknown> = {}

    headers.forEach((header, index) => {
      const value = values[index] || ''
      // 尝试解析数字和布尔值
      if (value === 'true') row[header] = true
      else if (value === 'false') row[header] = false
      else if (!isNaN(Number(value)) && value !== '') row[header] = Number(value)
      else row[header] = value
    })

    data.push(row)
  }

  return data
}

// 根据文件类型解析数据
async function parseTemplateFile(file: File): Promise<Record<string, unknown>[] | null> {
  const text = await file.text()
  const fileName = file.name.toLowerCase()

  if (fileName.endsWith('.json')) {
    try {
      const data = JSON.parse(text)
      if (!Array.isArray(data)) {
        throw new Error('JSON文件需要包含数组格式数据')
      }
      return data
    } catch {
      throw new Error('无法解析JSON文件')
    }
  }

  if (fileName.endsWith('.csv')) {
    try {
      return parseCSV(text)
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '无法解析CSV文件')
    }
  }

  throw new Error('不支持的文件格式，请使用JSON或CSV文件')
}

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
  typeId?: string
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
  const importFileRef = useRef<HTMLInputElement>(null)
  const reviewImportFileRef = useRef<HTMLInputElement>(null)

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

  const handlePageImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const data = await parseTemplateFile(file)

      if (!data || data.length === 0) {
        toast({
          title: '导入失败',
          description: '文件没有包含有效的模板数据',
          variant: 'destructive',
        })
        return
      }

      let imported = 0
      let failed = 0

      for (const item of data) {
        try {
          await api.post('/templates', item)
          imported++
        } catch {
          failed++
        }
      }

      toast({
        title: '导入完成',
        description: `成功导入 ${imported} 个模板${failed > 0 ? `，${failed} 个失败` : ''}`,
        variant: imported > 0 ? 'success' : 'destructive',
      })
      fetchTemplates()
    } catch (error) {
      toast({
        title: '导入失败',
        description: error instanceof Error ? error.message : '无法解析文件',
        variant: 'destructive',
      })
    }

    if (importFileRef.current) {
      importFileRef.current.value = ''
    }
  }

  const handlePageExport = async (type: 'task' | 'review') => {
    try {
      const endpoint = type === 'task' ? '/templates' : '/review-templates'
      const response = await api.get(endpoint)
      const templates =
        (response as { data?: { items?: any[] } }).data?.items ||
        (response as { data?: { data?: any[] } }).data?.data ||
        []
      const filename = `${type}-templates-${new Date().toISOString().split('T')[0]}.json`

      const blob = new Blob([JSON.stringify(templates, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({ title: '导出成功', variant: 'success' })
    } catch {
      toast({ title: '导出失败', variant: 'destructive' })
    }
  }

  const handleReviewImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const data = await parseTemplateFile(file)

      if (!data || data.length === 0) {
        toast({
          title: '导入失败',
          description: '文件没有包含有效的模板数据',
          variant: 'destructive',
        })
        return
      }

      // 获取评审类型列表用于验证
      const typesResponse = await api.get('/review-types')
      const reviewTypes = (typesResponse as { data?: { id: string; name: string }[] }).data || []

      if (reviewTypes.length === 0) {
        toast({
          title: '导入失败',
          description: '请先创建评审类型',
          variant: 'destructive',
        })
        return
      }

      let imported = 0
      let failed = 0
      const errors: string[] = []

      for (const item of data) {
        try {
          // 验证必填字段
          if (!item.name) {
            errors.push(`缺少模板名称`)
            failed++
            continue
          }

          // 如果没有 typeId，使用第一个评审类型
          let typeId = item.typeId as string
          if (!typeId) {
            // 尝试通过类型名称匹配
            if (item.typeName) {
              const matchedType = reviewTypes.find(
                (t: { id: string; name: string }) => t.name === item.typeName
              )
              typeId = matchedType?.id
            }
            if (!typeId) {
              typeId = reviewTypes[0].id
            }
          }

          const templateData = {
            name: item.name,
            description: item.description as string | undefined,
            typeId,
            isActive: item.isActive !== false,
          }

          await api.post('/review-templates', templateData)
          imported++
        } catch (err) {
          console.error('导入模板失败:', err)
          failed++
        }
      }

      toast({
        title: '导入完成',
        description: `成功导入 ${imported} 个评审模板${failed > 0 ? `，${failed} 个失败` : ''}${errors.length > 0 ? `\n${errors.slice(0, 3).join('; ')}` : ''}`,
        variant: imported > 0 ? 'success' : 'destructive',
      })
      fetchTemplates()
    } catch (error) {
      toast({
        title: '导入失败',
        description: error instanceof Error ? error.message : '无法解析文件',
        variant: 'destructive',
      })
    }

    if (reviewImportFileRef.current) {
      reviewImportFileRef.current.value = ''
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
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => handleCreateTemplate('task')}>
                  <Plus className="mr-2 h-4 w-4" />
                  新建模板
                </Button>
                <Button size="sm" variant="outline" onClick={() => importFileRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  导入
                </Button>
                <Button size="sm" variant="outline" onClick={() => handlePageExport('task')}>
                  <Download className="mr-2 h-4 w-4" />
                  导出
                </Button>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".json,.csv"
                  onChange={handlePageImport}
                  className="hidden"
                />
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
              <div className="flex items-center justify-end gap-2">
                <Button size="sm" onClick={() => handleCreateTemplate('review')}>
                  <Plus className="mr-2 h-4 w-4" />
                  新建模板
                </Button>
                <Button size="sm" variant="outline" onClick={() => reviewImportFileRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  导入
                </Button>
                <Button size="sm" variant="outline" onClick={() => handlePageExport('review')}>
                  <Download className="mr-2 h-4 w-4" />
                  导出
                </Button>
                <input
                  ref={reviewImportFileRef}
                  type="file"
                  accept=".json,.csv"
                  onChange={handleReviewImport}
                  className="hidden"
                />
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
