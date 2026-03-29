'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/api/client'
import { useToast } from '@/hooks/use-toast'

interface TestConnectionButtonProps {
  provider: string
  apiKey?: string
  model: string
  baseUrl?: string
  disabled?: boolean
}

export function TestConnectionButton({
  provider,
  apiKey,
  model,
  baseUrl,
  disabled,
}: TestConnectionButtonProps) {
  const { toast } = useToast()
  const [testing, setTesting] = useState(false)

  const handleTest = async () => {
    if (!model) {
      toast({
        title: '请先输入模型名称',
        variant: 'destructive',
      })
      return
    }

    if ((provider === 'OPENAI' || provider === 'ANTHROPIC') && !apiKey) {
      toast({
        title: '请先输入 API Key',
        variant: 'destructive',
      })
      return
    }

    if (provider === 'CUSTOM' && !baseUrl) {
      toast({
        title: '请先输入 Base URL',
        variant: 'destructive',
      })
      return
    }

    setTesting(true)

    try {
      const response = await api.post('/admin/ai/configs/test', {
        provider,
        apiKey,
        model,
        baseUrl,
      })

      const result = response as any
      const { status, statusCode, duration, error } = result.data

      if (status === 'SUCCESS') {
        toast({
          title: '连接成功',
          description: `响应时间: ${duration}ms`,
          variant: 'success',
        })
      } else if (status === 'TIMEOUT') {
        toast({
          title: '连接超时',
          description: error || '请求超时 (10秒)',
          variant: 'destructive',
        })
      } else {
        toast({
          title: '连接失败',
          description: error || `HTTP ${statusCode || '未知错误'}`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('测试连接失败:', error)
      toast({
        title: '测试失败',
        description: '请检查网络连接和配置信息',
        variant: 'destructive',
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleTest}
      disabled={disabled || testing}
    >
      {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      测试连接
    </Button>
  )
}
