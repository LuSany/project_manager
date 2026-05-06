'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'

interface UpdateUserFormData {
  name?: string
  email?: string
  password?: string
  role?: string
  department?: string | null
  position?: string | null
  phone?: string | null
  status?: string
}

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<UpdateUserFormData>
  onSubmit: (data: UpdateUserFormData) => void
  submitting: boolean
}

export function EditUserDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  submitting,
}: EditUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑用户</DialogTitle>
          <DialogDescription>修改用户信息</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">姓名 *</Label>
            <Input id="edit-name" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">邮箱 *</Label>
            <Input id="edit-email" type="email" {...form.register('email')} />
            {form.formState.errors.email && (
              <p className="text-destructive text-sm">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-password">新密码（留空不修改）</Label>
            <Input
              id="edit-password"
              type="password"
              {...form.register('password')}
              placeholder="留空则不修改密码"
            />
            {form.formState.errors.password && (
              <p className="text-destructive text-sm">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>角色</Label>
              <Select
                value={form.watch('role')}
                onValueChange={(value) => form.setValue('role', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">系统管理员</SelectItem>
                  <SelectItem value="PROJECT_ADMIN">项目管理员</SelectItem>
                  <SelectItem value="PROJECT_OWNER">项目所有者</SelectItem>
                  <SelectItem value="PROJECT_MEMBER">项目成员</SelectItem>
                  <SelectItem value="EMPLOYEE">普通员工</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(value) => form.setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">已激活</SelectItem>
                  <SelectItem value="PENDING">待审批</SelectItem>
                  <SelectItem value="DISABLED">已禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-department">部门</Label>
              <Input id="edit-department" {...form.register('department')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-position">职位</Label>
              <Input id="edit-position" {...form.register('position')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">电话</Label>
            <Input id="edit-phone" {...form.register('phone')} />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}