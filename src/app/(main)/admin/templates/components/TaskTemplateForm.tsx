'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Upload, Download, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { parseTemplateFile } from './fileParsers'
import { api } from '@/lib/api/client'

const taskTemplateSchema = z.object({
  title: z.string().min(1, '模板标题不能为空'),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  templateData: z.string().min(1, '模板数据不能为空'),
})

export type TaskTemplateFormData = z.infer<typeof taskTemplateSchema>

interface TaskTemplateFormProps {
  form: ReturnType<typeof useForm<TaskTemplateFormData>>
  loading: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  showPreview: boolean
  setShowPreview: (show: boolean) => void
  onSubmit: (data: TaskTemplateFormData) => Promise<void>
}

export function TaskTemplateForm({
  form,
  loading,
  fileInputRef,
  showPreview,
  setShowPreview,
  onSubmit,
}: TaskTemplateFormProps) {
  const { toast } = useToast()

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const data = await parseTemplateFile(file)

      if (data && Array.isArray(data)) {
        const formatted = JSON.stringify(data, null, 2)
        form.setValue('templateData', formatted)
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

  const renderPreview = () => {
    const templateData = form.watch('templateData')
    try {
      const parsed = JSON.parse(templateData || '{}')
      const formatted = JSON.stringify(parsed, null, 2)
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="title">
            标题 <span className="text-destructive">*</span>
          </Label>
          <input
            id="title"
            {...form.register('title')}
            placeholder="请输入模板标题"
            disabled={loading}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {form.formState.errors.title && (
            <p className="text-destructive text-sm">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">描述</Label>
          <textarea
            id="description"
            {...form.register('description')}
            placeholder="请输入模板描述"
            rows={3}
            disabled={loading}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="isPublic" className="flex flex-col space-y-1">
            <span>公开模板</span>
            <span className="text-muted-foreground text-xs">公开模板可以被所有用户使用</span>
          </Label>
          <Switch
            id="isPublic"
            checked={form.watch('isPublic')}
            onCheckedChange={(checked) => form.setValue('isPublic', checked)}
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
          <textarea
            id="templateData"
            {...form.register('templateData')}
            placeholder='{"key": "value"}'
            rows={10}
            disabled={loading}
            className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {form.formState.errors.templateData && (
            <p className="text-destructive text-sm">{form.formState.errors.templateData.message}</p>
          )}
        </div>

        {showPreview && renderPreview()}
      </div>
    </form>
  )
}