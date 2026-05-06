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

interface CreateUserFormData {
  name: string
  email: string
  password: string
  role: string
  department: string
  position: string
}

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<CreateUserFormData>
  onSubmit: (data: CreateUserFormData) => void
  submitting: boolean
}

export function AddUserDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  submitting,
}: AddUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新增用户</DialogTitle>
          <DialogDescription>创建一个新的系统用户</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="add-name">姓名 *</Label>
            <Input id="add-name" {...form.register('name')} placeholder="输入用户姓名" />
            {form.formState.errors.name && (
              <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-email">邮箱 *</Label>
            <Input
              id="add-email"
              type="email"
              {...form.register('email')}
              placeholder="输入邮箱地址"
            />
            {form.formState.errors.email && (
              <p className="text-destructive text-sm">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-password">密码 *</Label>
            <Input
              id="add-password"
              type="password"
              {...form.register('password')}
              placeholder="至少6个字符"
            />
            {form.formState.errors.password && (
              <p className="text-destructive text-sm">{form.formState.errors.password.message}</p>
            )}
          </div>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-department">部门</Label>
              <Input id="add-department" {...form.register('department')} placeholder="部门名称" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-position">职位</Label>
              <Input id="add-position" {...form.register('position')} placeholder="职位名称" />
            </div>
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
              创建
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}