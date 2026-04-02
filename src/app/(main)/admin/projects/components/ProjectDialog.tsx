'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { api } from '@/lib/api/client'
import { Loader2 } from 'lucide-react'

const projectFormSchema = z.object({
  name: z.string().min(1, '项目名称不能为空'),
  description: z.string().optional(),
  ownerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

type ProjectFormData = z.infer<typeof projectFormSchema>

interface User {
  id: string
  name: string
  email: string
}

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: {
    id: string
    name: string
    description?: string
    status: string
    ownerId: string
    startDate?: string
    endDate?: string
  } | null
  onSuccess: () => void
}

export function ProjectDialog({ open, onOpenChange, project, onSuccess }: ProjectDialogProps) {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({})

  const form = useForm<ProjectFormData>({
    defaultValues: {
      name: '',
      description: '',
      ownerId: '',
      startDate: '',
      endDate: '',
    },
  })

  const isEdit = !!project

  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        description: project.description || '',
        ownerId: project.ownerId,
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      })
      setErrors({})
    } else {
      form.reset()
      setErrors({})
    }
  }, [project, form])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const response = await api.get<User[]>('/admin/users')
      if ((response as { success?: boolean }).success) {
        setUsers((response as { data?: User[] }).data || [])
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const validateForm = (data: ProjectFormData): boolean => {
    try {
      projectFormSchema.parse(data)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof ProjectFormData, string>> = {}
        error.issues.forEach((issue) => {
          const path = issue.path[0] as keyof ProjectFormData
          newErrors[path] = issue.message
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const onSubmit = async (data: ProjectFormData) => {
    if (!validateForm(data)) {
      return
    }

    setLoading(true)
    try {
      if (isEdit && project) {
        const response = await api.put(`/admin/projects/${project.id}`, data)
        if ((response as { success?: boolean }).success) {
          onSuccess()
          onOpenChange(false)
        }
      } else {
        const response = await api.post('/admin/projects', data)
        if ((response as { success?: boolean }).success) {
          onSuccess()
          onOpenChange(false)
        }
      }
    } catch (error) {
      console.error(isEdit ? '更新项目失败:' : '创建项目失败:', error)
      alert(isEdit ? '更新项目失败，请重试' : '创建项目失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑项目' : '创建项目'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改项目信息' : '填写项目详情以创建新项目'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                项目名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="请输入项目名称"
                disabled={loading}
              />
              {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">项目描述</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="请输入项目描述"
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ownerId">项目负责人</Label>
              {loadingUsers ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  加载中...
                </div>
              ) : (
                <Select
                  value={form.watch('ownerId') || ''}
                  onValueChange={(value) => form.setValue('ownerId', value)}
                  disabled={loading}
                >
                  <SelectTrigger id="ownerId">
                    <SelectValue placeholder="请选择项目负责人" />
                  </SelectTrigger>
                  <SelectContent>
                    {!users || users.length === 0 ? (
                      <div className="text-muted-foreground py-4 text-center text-sm">
                        暂无可用用户
                      </div>
                    ) : (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">开始日期</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...form.register('startDate')}
                  disabled={loading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate">结束日期</Label>
                <Input id="endDate" type="date" {...form.register('endDate')} disabled={loading} />
              </div>
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
      </DialogContent>
    </Dialog>
  )
}
