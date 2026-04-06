'use client'

import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api/client'
import { Loader2, Upload, Download, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// CSV解析函数
function parseCSV(text: string): Record<string, unknown>[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV文件至少需要包含标题行和一行数据')
  }

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

const taskTemplateSchema = z.object({
  title: z.string().min(1, '模板标题不能为空'),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  templateData: z.string().min(1, '模板数据不能为空'),
})

const reviewTemplateSchema = z.object({
  typeId: z.string().min(1, '评审类型不能为空'),
  name: z.string().min(1, '模板名称不能为空'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

type TaskTemplateFormData = z.infer<typeof taskTemplateSchema>
type ReviewTemplateFormData = z.infer<typeof reviewTemplateSchema>

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: {
    id: string
    title?: string
    name?: string
    description?: string
    isPublic?: boolean
    isActive?: boolean
    templateData?: string
    typeId?: string
  } | null
  type: 'task' | 'review'
  onSuccess: () => void
}

interface ReviewType {
  id: string
  name: string
  displayName: string
}

export function TemplateDialog({
  open,
  onOpenChange,
  template,
  type,
  onSuccess,
}: TemplateDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [reviewTypes, setReviewTypes] = useState<ReviewType[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEdit = !!template
  const isTaskTemplate = type === 'task'

  const taskForm = useForm<TaskTemplateFormData>({
    resolver: zodResolver(taskTemplateSchema),
    defaultValues: {
      title: '',
      description: '',
      isPublic: false,
      templateData: '{}',
    },
  })

  const reviewForm = useForm<ReviewTemplateFormData>({
    resolver: zodResolver(reviewTemplateSchema),
    defaultValues: {
      typeId: '',
      name: '',
      description: '',
      isActive: true,
    },
  })

  useEffect(() => {
    if (open && !isTaskTemplate) {
      fetchReviewTypes()
    }
  }, [open, isTaskTemplate])

  useEffect(() => {
    if (template) {
      if (isTaskTemplate) {
        taskForm.reset({
          title: template.title || '',
          description: template.description || '',
          isPublic: template.isPublic || false,
          templateData: template.templateData || '{}',
        })
      } else {
        reviewForm.reset({
          typeId: template.typeId || '',
          name: template.name || '',
          description: template.description || '',
          isActive: template.isActive ?? true,
        })
      }
    } else {
      if (isTaskTemplate) {
        taskForm.reset()
      } else {
        reviewForm.reset()
      }
    }
  }, [template, isTaskTemplate, taskForm, reviewForm])

  const fetchReviewTypes = async () => {
    try {
      const response = await api.get('/review-types')
      setReviewTypes((response as { data?: ReviewType[] }).data || [])
    } catch (error) {
      console.error('获取评审类型失败:', error)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const data = await parseTemplateFile(file)

      if (data && Array.isArray(data)) {
        const formatted = JSON.stringify(data, null, 2)
        taskForm.setValue('templateData', formatted)
        toast({
          title: '导入成功',
          description: `已导入 ${data.length} 条数据`,
          variant: 'success',
        })
      } else {
        toast({
          title: '导入失败',
          description: '文件格式不正确',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('导入失败:', error)
      toast({
        title: '导入失败',
        description: error instanceof Error ? error.message : '无法解析文件',
        variant: 'destructive',
      })
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleExport = async () => {
    try {
      const response = await api.get('/templates')
      const templates = (response as { data?: { items?: any[] } }).data?.items || []

      const blob = new Blob([JSON.stringify(templates, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `templates-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: '导出成功',
        variant: 'success',
      })
    } catch (error) {
      console.error('导出失败:', error)
      toast({
        title: '导出失败',
        variant: 'destructive',
      })
    }
  }

  const onSubmitTask = async (data: TaskTemplateFormData) => {
    setLoading(true)
    try {
      let templateData: Record<string, unknown>
      try {
        templateData = JSON.parse(data.templateData)
      } catch (error) {
        toast({
          title: '模板数据格式错误',
          description: '请输入有效的 JSON',
          variant: 'destructive',
        })
        return
      }

      if (isEdit && template) {
        const response = await api.put(`/templates/${template.id}`, {
          ...data,
          templateData,
        })
        if ((response as { success?: boolean }).success) {
          onSuccess()
          onOpenChange(false)
        }
      } else {
        const response = await api.post('/templates', {
          ...data,
          templateData,
        })
        if ((response as { success?: boolean }).success) {
          onSuccess()
          onOpenChange(false)
        }
      }
    } catch (error) {
      console.error(isEdit ? '更新模板失败:' : '创建模板失败:', error)
      alert(isEdit ? '更新模板失败，请重试' : '创建模板失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const onSubmitReview = async (data: ReviewTemplateFormData) => {
    setLoading(true)
    try {
      if (isEdit && template) {
        const response = await api.put(`/review-templates/${template.id}`, data)
        if ((response as { success?: boolean }).success) {
          onSuccess()
          onOpenChange(false)
        }
      } else {
        const response = await api.post('/review-templates', data)
        if ((response as { success?: boolean }).success) {
          onSuccess()
          onOpenChange(false)
        }
      }
    } catch (error) {
      console.error(isEdit ? '更新模板失败:' : '创建模板失败:', error)
      alert(isEdit ? '更新模板失败，请重试' : '创建模板失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const renderPreview = () => {
    if (!isTaskTemplate) return null

    const templateData = taskForm.watch('templateData')
    try {
      const parsed = JSON.parse(templateData || '{}')
      const formatted = JSON.stringify(parsed, null, 2)
      // 高亮变量占位符 {{xxx}}
      const highlighted = formatted.replace(
        /\{\{(\w+)\}\}/g,
        '<mark className="bg-yellow-500/30 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 rounded px-0.5">{{$1}}</mark>'
      )
      return (
        <div className="bg-muted mt-4 rounded-lg p-4">
          <h4 className="mb-2 font-medium">预览</h4>
          <pre
            className="max-h-60 overflow-auto text-xs"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </div>
      )
    } catch {
      return (
        <div className="bg-destructive/10 mt-4 rounded-lg p-4">
          <p className="text-destructive text-sm">JSON 格式错误</p>
        </div>
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? '编辑' : '创建'} {isTaskTemplate ? '任务' : '评审'}模板
          </DialogTitle>
          <DialogDescription>
            {isEdit ? '修改' : '创建'} {isTaskTemplate ? '任务' : '评审'} 模板
          </DialogDescription>
        </DialogHeader>

        {isTaskTemplate ? (
          <form onSubmit={taskForm.handleSubmit(onSubmitTask)} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">
                  标题 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  {...taskForm.register('title')}
                  placeholder="请输入模板标题"
                  disabled={loading}
                />
                {taskForm.formState.errors.title && (
                  <p className="text-destructive text-sm">
                    {taskForm.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  {...taskForm.register('description')}
                  placeholder="请输入模板描述"
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="isPublic" className="flex flex-col space-y-1">
                  <span>公开模板</span>
                  <span className="text-muted-foreground text-xs">公开模板可以被所有用户使用</span>
                </Label>
                <Switch
                  id="isPublic"
                  checked={taskForm.watch('isPublic')}
                  onCheckedChange={(checked) => taskForm.setValue('isPublic', checked)}
                  disabled={loading}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="templateData">
                    模板数据 (JSON) <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-1 h-4 w-4" />
                      导入
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={handleExport}>
                      <Download className="mr-1 h-4 w-4" />
                      导出全部
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? (
                        <EyeOff className="mr-1 h-4 w-4" />
                      ) : (
                        <Eye className="mr-1 h-4 w-4" />
                      )}
                      {showPreview ? '隐藏' : '预览'}
                    </Button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  onChange={handleImport}
                  className="hidden"
                />
                <Textarea
                  id="templateData"
                  {...taskForm.register('templateData')}
                  placeholder='{"key": "value"}'
                  rows={10}
                  disabled={loading}
                  className="font-mono text-sm"
                />
                {taskForm.formState.errors.templateData && (
                  <p className="text-destructive text-sm">
                    {taskForm.formState.errors.templateData.message}
                  </p>
                )}
              </div>

              {showPreview && renderPreview()}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? '保存' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={reviewForm.handleSubmit(onSubmitReview)} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="typeId">
                  评审类型 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={reviewForm.watch('typeId')}
                  onValueChange={(value) => reviewForm.setValue('typeId', value)}
                  disabled={loading}
                >
                  <SelectTrigger id="typeId">
                    <SelectValue placeholder="请选择评审类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {reviewTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.displayName || type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {reviewForm.formState.errors.typeId && (
                  <p className="text-destructive text-sm">
                    {reviewForm.formState.errors.typeId.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">
                  模板名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...reviewForm.register('name')}
                  placeholder="请输入模板名称"
                  disabled={loading}
                />
                {reviewForm.formState.errors.name && (
                  <p className="text-destructive text-sm">
                    {reviewForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  {...reviewForm.register('description')}
                  placeholder="请输入模板描述"
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="isActive" className="flex flex-col space-y-1">
                  <span>启用模板</span>
                  <span className="text-muted-foreground text-xs">禁用的模板不会被使用</span>
                </Label>
                <Switch
                  id="isActive"
                  checked={reviewForm.watch('isActive')}
                  onCheckedChange={(checked) => reviewForm.setValue('isActive', checked)}
                  disabled={loading}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? '保存' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
