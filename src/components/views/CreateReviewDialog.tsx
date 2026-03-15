'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
} from '@/components/ui/select'
import { AlertCircle } from 'lucide-react'

interface CreateReviewDialogProps {
  projectId: string
  onSuccess?: () => void
}

export function CreateReviewDialog({ projectId, onSuccess }: CreateReviewDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [typeId, setTypeId] = useState<string>('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const [types, setTypes] = useState<Array<{ id: string; name: string; displayName: string }>>([])

  // 获取评审类型列表
  useEffect(() => {
    fetch(`/api/v1/reviews/types?isActive=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTypes(data.data || [])
        }
      })
      .catch((err) => {
        console.error('获取评审类型失败:', err)
        setError('获取评审类型失败，请刷新页面重试')
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setValidationError(null)

    // 前端验证
    if (!typeId) {
      setValidationError('请选择评审类型')
      return
    }

    if (!title.trim()) {
      setValidationError('请输入评审标题')
      return
    }

    setLoading(true)

    try {
      // 将 datetime-local 格式转换为 ISO 格式
      const scheduledAtISO = scheduledAt ? new Date(scheduledAt).toISOString() : undefined;

      const response = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          projectId,
          title,
          description,
          typeId,
          scheduledAt: scheduledAtISO,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setOpen(false)
        setTitle('')
        setDescription('')
        setTypeId('')
        setScheduledAt('')
        setError(null)
        onSuccess?.()
        router.refresh()
      } else {
        // 显示 API 返回的错误信息
        // API 返回格式: { success: false, error: { code, message } } 或 { success: false, error: string }
        const errorMessage = typeof data.error === 'object' && data.error !== null
          ? data.error.message
          : (data.error || '创建评审失败')
        setError(errorMessage)
        
        if (data.details) {
          // 如果有详细的验证错误，显示第一个
          const firstError = Object.values(data.details)[0] as string
          if (firstError) {
            setValidationError(firstError)
          }
        }
      }
    } catch (err) {
      console.error('创建评审失败:', err)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 重置表单状态
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setError(null)
      setValidationError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>创建评审</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>创建评审</DialogTitle>
          <DialogDescription>创建一个新的评审会议</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 无评审类型提示 */}
          {types.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">
                暂无可用评审类型，请联系管理员初始化评审类型配置。
              </p>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <div>
              <Label htmlFor="title">标题</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="type">评审类型</Label>
              <Select value={typeId} onValueChange={setTypeId}>
                <SelectTrigger className={validationError && !typeId ? 'border-red-500' : ''}>
                  {types.find((t) => t.id === typeId)?.displayName || '选择类型'}
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationError && !typeId && (
                <p className="text-sm text-red-500 mt-1">{validationError}</p>
              )}
            </div>
            <div>
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="scheduledAt">计划时间</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading || types.length === 0}>
              {loading ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
