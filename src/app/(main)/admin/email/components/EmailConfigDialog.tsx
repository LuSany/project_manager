'use client'

import { useEffect, useState } from 'react'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api/client'
import { Loader2 } from 'lucide-react'

const emailConfigFormSchema = z.object({
  name: z.string().min(1, '配置名称不能为空'),
  provider: z.enum(['COMPANY', 'SMTP', 'SENDGRID']),
  apiKey: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().min(1, '端口必须大于0').max(65535, '端口必须小于65536').optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  fromAddress: z.string().email('发件人地址格式不正确'),
  fromName: z.string().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
})

type EmailConfigFormData = z.infer<typeof emailConfigFormSchema>

interface EmailConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config?: {
    id: string
    name: string
    provider: string
    fromAddress: string
    fromName?: string
    isActive: boolean
    isDefault: boolean
    apiKey?: string
    smtpHost?: string
    smtpPort?: number
    smtpUser?: string
  } | null
  onSuccess: () => void
}

export function EmailConfigDialog({
  open,
  onOpenChange,
  config,
  onSuccess,
}: EmailConfigDialogProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<EmailConfigFormData>({
    resolver: zodResolver(emailConfigFormSchema),
    defaultValues: {
      name: '',
      provider: 'SMTP',
      fromAddress: '',
      fromName: '',
      isActive: true,
      isDefault: false,
      apiKey: '',
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
    },
  })

  const isEdit = !!config
  const provider = form.watch('provider')

  useEffect(() => {
    if (config) {
      form.reset({
        name: config.name,
        provider: config.provider as 'COMPANY' | 'SMTP' | 'SENDGRID',
        fromAddress: config.fromAddress,
        fromName: config.fromName || '',
        isActive: config.isActive,
        isDefault: config.isDefault,
        apiKey: config.apiKey || '',
        smtpHost: config.smtpHost || '',
        smtpPort: config.smtpPort || 587,
        smtpUser: config.smtpUser || '',
        smtpPassword: '',
      })
    } else {
      form.reset()
    }
  }, [config, form])

  const onSubmit = async (data: EmailConfigFormData) => {
    if (provider === 'SMTP' && (!data.smtpHost || !data.smtpPort)) {
      alert('请输入 SMTP 主机和端口')
      return
    }

    if ((provider === 'SENDGRID' || provider === 'COMPANY') && !data.apiKey) {
      alert('请输入 API Key')
      return
    }

    setLoading(true)
    try {
      if (isEdit && config) {
        const response = await api.put(`/admin/email/configs/${config.id}`, data)
        if ((response as { success?: boolean }).success) {
          onSuccess()
          onOpenChange(false)
        }
      } else {
        const response = await api.post('/admin/email/configs', data)
        if ((response as { success?: boolean }).success) {
          onSuccess()
          onOpenChange(false)
        }
      }
    } catch (error) {
      console.error(isEdit ? '更新配置失败:' : '创建配置失败:', error)
      alert(isEdit ? '更新配置失败，请重试' : '创建配置失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑邮件配置' : '创建邮件配置'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改邮件服务配置' : '配置邮件服务提供商'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                配置名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="例如: 公司邮箱"
                disabled={loading}
              />
              {form.formState.errors.name && (
                <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="provider">
                服务提供商 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch('provider')}
                onValueChange={(value: 'COMPANY' | 'SMTP' | 'SENDGRID') =>
                  form.setValue('provider', value)
                }
                disabled={loading}
              >
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPANY">公司邮箱</SelectItem>
                  <SelectItem value="SMTP">SMTP</SelectItem>
                  <SelectItem value="SENDGRID">SendGrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(provider === 'SENDGRID' || provider === 'COMPANY') && (
              <div className="grid gap-2">
                <Label htmlFor="apiKey">
                  API Key <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  {...form.register('apiKey')}
                  placeholder="请输入 API Key"
                  disabled={loading}
                />
              </div>
            )}

            {provider === 'SMTP' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="smtpHost">
                    SMTP 主机 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="smtpHost"
                    {...form.register('smtpHost')}
                    placeholder="smtp.gmail.com"
                    disabled={loading}
                  />
                  {form.formState.errors.smtpHost && (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.smtpHost.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="smtpPort">
                    SMTP 端口 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    {...form.register('smtpPort', { valueAsNumber: true })}
                    placeholder="587"
                    disabled={loading}
                  />
                  {form.formState.errors.smtpPort && (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.smtpPort.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="smtpUser">SMTP 用户名</Label>
                  <Input
                    id="smtpUser"
                    {...form.register('smtpUser')}
                    placeholder="请输入用户名"
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="smtpPassword">SMTP 密码</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    {...form.register('smtpPassword')}
                    placeholder="请输入密码"
                    disabled={loading}
                  />
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label htmlFor="fromAddress">
                发件人地址 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fromAddress"
                type="email"
                {...form.register('fromAddress')}
                placeholder="noreply@example.com"
                disabled={loading}
              />
              {form.formState.errors.fromAddress && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.fromAddress.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fromName">发件人名称</Label>
              <Input
                id="fromName"
                {...form.register('fromName')}
                placeholder="项目管理系统"
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="isActive" className="flex flex-col space-y-1">
                <span>启用配置</span>
                <span className="text-muted-foreground text-xs">禁用的配置不会被使用</span>
              </Label>
              <Switch
                id="isActive"
                checked={form.watch('isActive')}
                onCheckedChange={(checked) => form.setValue('isActive', checked)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="isDefault" className="flex flex-col space-y-1">
                <span>默认配置</span>
                <span className="text-muted-foreground text-xs">
                  设置为默认后,其他默认配置将被取消
                </span>
              </Label>
              <Switch
                id="isDefault"
                checked={form.watch('isDefault')}
                onCheckedChange={(checked) => form.setValue('isDefault', checked)}
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
      </DialogContent>
    </Dialog>
  )
}
