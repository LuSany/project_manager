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
import { TestConnectionButton } from './TestConnectionButton'

const aiConfigFormSchema = z.object({
  name: z.string().min(1, '配置名称不能为空'),
  provider: z.enum(['OPENAI', 'ANTHROPIC', 'CUSTOM']),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string().min(1, '模型名称不能为空'),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  config: z.string().optional(),
})

type AIConfigFormData = z.infer<typeof aiConfigFormSchema>

interface AIConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config?: {
    id: string
    name: string
    provider: string
    model: string
    isActive: boolean
    isDefault: boolean
    baseUrl?: string
    config?: string
  } | null
  onSuccess: () => void
}

export function AIConfigDialog({ open, onOpenChange, config, onSuccess }: AIConfigDialogProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<AIConfigFormData>({
    resolver: zodResolver(aiConfigFormSchema),
    defaultValues: {
      name: '',
      provider: 'OPENAI',
      model: '',
      isActive: true,
      isDefault: false,
      baseUrl: '',
      apiKey: '',
      config: '',
    },
  })

  const isEdit = !!config
  const provider = form.watch('provider')

  useEffect(() => {
    if (config) {
      form.reset({
        name: config.name,
        provider: config.provider as 'OPENAI' | 'ANTHROPIC' | 'CUSTOM',
        model: config.model,
        isActive: config.isActive,
        isDefault: config.isDefault,
        baseUrl: config.baseUrl || '',
        apiKey: '',
        config: config.config || '',
      })
    } else {
      form.reset()
    }
  }, [config, form])

  const onSubmit = async (data: AIConfigFormData) => {
    // OpenAI和Anthropic必须提供API Key
    if (provider !== 'CUSTOM' && !data.apiKey) {
      alert('请输入 API Key')
      return
    }

    // 自定义服务商必须提供Base URL，API Key可选
    if (provider === 'CUSTOM' && !data.baseUrl) {
      alert('请输入 Base URL')
      return
    }

    setLoading(true)
    try {
      if (isEdit && config) {
        const response = await api.put(`/admin/ai/configs/${config.id}`, data)
        if ((response as { success?: boolean }).success) {
          onSuccess()
          onOpenChange(false)
        }
      } else {
        const response = await api.post('/admin/ai/configs', data)
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
          <DialogTitle>{isEdit ? '编辑 AI 配置' : '创建 AI 配置'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改 AI 服务配置' : '配置 AI 服务提供商'}
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
                placeholder="例如: OpenAI GPT-4"
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
                onValueChange={(value: 'OPENAI' | 'ANTHROPIC' | 'CUSTOM') =>
                  form.setValue('provider', value)
                }
                disabled={loading}
              >
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPENAI">OpenAI</SelectItem>
                  <SelectItem value="ANTHROPIC">Anthropic</SelectItem>
                  <SelectItem value="CUSTOM">自定义服务</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(provider === 'OPENAI' || provider === 'ANTHROPIC') && (
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

            {provider === 'CUSTOM' && (
              <div className="grid gap-2">
                <Label htmlFor="baseUrl">
                  Base URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="baseUrl"
                  {...form.register('baseUrl')}
                  placeholder="https://api.example.com 或 http://localhost:11434"
                  disabled={loading}
                />
                <p className="text-muted-foreground text-xs">
                  支持 OpenAI 兼容的 API 端点，如 Ollama、LocalAI、vLLM 等
                </p>
                {form.formState.errors.baseUrl && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.baseUrl.message}
                  </p>
                )}
              </div>
            )}

            {provider === 'CUSTOM' && (
              <div className="grid gap-2">
                <Label htmlFor="customApiKey">
                  API Key <span className="text-muted-foreground">(可选)</span>
                </Label>
                <Input
                  id="customApiKey"
                  type="password"
                  {...form.register('apiKey')}
                  placeholder="可选，部分自定义服务需要"
                  disabled={loading}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="model">
                模型名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="model"
                {...form.register('model')}
                placeholder={
                  provider === 'OPENAI'
                    ? 'gpt-4'
                    : provider === 'ANTHROPIC'
                      ? 'claude-3-opus'
                      : 'llama2'
                }
                disabled={loading}
              />
              {form.formState.errors.model && (
                <p className="text-destructive text-sm">{form.formState.errors.model.message}</p>
              )}
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
                  设置为默认后，其他默认配置将被取消
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

          <DialogFooter className="flex-row justify-between">
            <TestConnectionButton
              provider={provider}
              apiKey={form.watch('apiKey')}
              model={form.watch('model')}
              baseUrl={form.watch('baseUrl')}
              disabled={loading}
            />
            <div className="flex gap-2">
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
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
