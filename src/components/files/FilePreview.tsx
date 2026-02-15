'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface FilePreviewProps {
  fileId: string
  fileName: string
}

export function FilePreview({ fileId, fileName }: FilePreviewProps) {
  const [open, setOpen] = useState(false)
  const [service, setService] = useState<'onlyoffice' | 'kkfileview' | 'native'>('native')
  const [loading, setLoading] = useState(false)

  const handlePreview = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/v1/files/preview?fileId=${fileId}&service=${service}`)
      const data = await response.json()
      if (data.success) {
        if (service === 'native' || data.data.previewUrl.startsWith('/api/v1/files/')) {
          // 原生预览：直接下载或新标签页打开
          window.open(data.data.previewUrl, '_blank')
        } else {
          // OnlyOffice/KKFileView预览：在iframe中打开
          setOpen(true)
        }
      }
    } catch (err) {
      console.error('预览文件失败:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          预览
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>文件预览</DialogTitle>
          <DialogDescription>选择预览服务并打开文件</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="service">预览服务</Label>
            <Select
              value={service}
              onValueChange={(value: string) =>
                setService(value as 'onlyoffice' | 'kkfileview' | 'native')
              }
            >
              <SelectTrigger>
                {service === 'onlyoffice' && 'OnlyOffice'}
                {service === 'kkfileview' && 'KKFileView'}
                {service === 'native' && '原生预览'}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="onlyoffice">OnlyOffice</SelectItem>
                <SelectItem value="kkfileview">KKFileView</SelectItem>
                <SelectItem value="native">原生预览</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button type="button" disabled={loading} onClick={handlePreview}>
            {loading ? '预览中...' : service === 'native' ? '下载' : '打开'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
