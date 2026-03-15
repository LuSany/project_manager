'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PreviewServiceConfigProps {
  onSuccess?: () => void
}

export function PreviewServiceConfig({ onSuccess }: PreviewServiceConfigProps) {
  const [open, setOpen] = useState(false)
  const [serviceType, setServiceType] = useState<'ONLYOFFICE' | 'KKFILEVIEW' | 'NATIVE'>('NATIVE')
  const [endpoint, setEndpoint] = useState('')
  const [config, setConfig] = useState('{}')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/v1/preview/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          serviceType,
          endpoint,
          isEnabled: true,
          config: config ? JSON.stringify(config) : undefined,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setOpen(false)
        setServiceType('NATIVE')
        setEndpoint('')
        setConfig('{}')
        onSuccess?.()
      }
    } catch (err) {
      console.error('创建预览服务配置失败:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          添加预览服务
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>添加预览服务配置</DialogTitle>
          <DialogDescription>配置新的文件预览服务</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div>
              <Label htmlFor="serviceType">服务类型</Label>
              <Select
                value={serviceType}
                onValueChange={(value: string) =>
                  setServiceType(value as 'ONLYOFFICE' | 'KKFILEVIEW' | 'NATIVE')
                }
                required
              >
                <SelectTrigger>
                  {serviceType === 'ONLYOFFICE' && 'OnlyOffice'}
                  {serviceType === 'KKFILEVIEW' && 'KKFileView'}
                  {serviceType === 'NATIVE' && '原生预览'}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLYOFFICE">OnlyOffice</SelectItem>
                  <SelectItem value="KKFILEVIEW">KKFileView</SelectItem>
                  <SelectItem value="NATIVE">原生预览</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="endpoint">服务端点</Label>
              <Input
                id="endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="例如：http://localhost:8080/preview"
                required
              />
            </div>
            <div>
              <Label htmlFor="config">服务配置（JSON）</Label>
              <Textarea
                id="config"
                value={config}
                onChange={(e) => setConfig(e.target.value)}
                placeholder='{"apiKey": "xxx", "timeout": 30000}'
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading || !endpoint}>
              {loading ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
