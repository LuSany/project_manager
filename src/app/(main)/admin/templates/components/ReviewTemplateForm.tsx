'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ReviewType } from './types'

const reviewTemplateSchema = z.object({
  typeId: z.string().min(1, '评审类型不能为空'),
  name: z.string().min(1, '模板名称不能为空'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export type ReviewTemplateFormData = z.infer<typeof reviewTemplateSchema>

interface ReviewTemplateFormProps {
  form: ReturnType<typeof useForm<ReviewTemplateFormData>>
  loading: boolean
  reviewTypes: ReviewType[]
  onSubmit: (data: ReviewTemplateFormData) => Promise<void>
}

export function ReviewTemplateForm({
  form,
  loading,
  reviewTypes,
  onSubmit,
}: ReviewTemplateFormProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="typeId">
            评审类型 <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.watch('typeId')}
            onValueChange={(value) => form.setValue('typeId', value)}
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
          {form.formState.errors.typeId && (
            <p className="text-destructive text-sm">{form.formState.errors.typeId.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name">
            模板名称 <span className="text-destructive">*</span>
          </Label>
          <input
            id="name"
            {...form.register('name')}
            placeholder="请输入模板名称"
            disabled={loading}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {form.formState.errors.name && (
            <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>
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
          <Label htmlFor="isActive" className="flex flex-col space-y-1">
            <span>启用模板</span>
            <span className="text-muted-foreground text-xs">禁用的模板不会被使用</span>
          </Label>
          <Switch
            id="isActive"
            checked={form.watch('isActive')}
            onCheckedChange={(checked) => form.setValue('isActive', checked)}
            disabled={loading}
          />
        </div>
      </div>
    </form>
  )
}