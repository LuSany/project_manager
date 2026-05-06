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
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/api/client'
import { TaskTemplateForm, TaskTemplateFormData } from './TaskTemplateForm'
import { ReviewTemplateForm, ReviewTemplateFormData } from './ReviewTemplateForm'
import { Template, ReviewType, TemplateType } from './types'

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

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: Template | null
  type: TemplateType
  onSuccess: () => void
}

export function TemplateDialog({
  open,
  onOpenChange,
  template,
  type,
  onSuccess,
}: TemplateDialogProps) {
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

  const onSubmitTask = async (data: TaskTemplateFormData) => {
    setLoading(true)
    try {
      let templateData: Record<string, unknown>
      try {
        templateData = JSON.parse(data.templateData)
      } catch (error) {
        alert('模板数据格式错误，请输入有效的 JSON')
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
          <TaskTemplateForm
            form={taskForm}
            loading={loading}
            fileInputRef={fileInputRef}
            showPreview={showPreview}
            setShowPreview={setShowPreview}
            onSubmit={onSubmitTask}
          />
        ) : (
          <ReviewTemplateForm
            form={reviewForm}
            loading={loading}
            reviewTypes={reviewTypes}
            onSubmit={onSubmitReview}
          />
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            type={isTaskTemplate ? 'submit' : 'button'}
            onClick={isTaskTemplate ? undefined : reviewForm.handleSubmit(onSubmitReview)}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? '保存' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}