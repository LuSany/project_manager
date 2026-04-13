'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Check, X, ArrowRightCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  name: string
}

interface ApprovalActionsProps {
  recordId: string
  onActionComplete?: () => void
}

export function ApprovalActions({ recordId, onActionComplete }: ApprovalActionsProps) {
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [forwardOpen, setForwardOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [forwardTo, setForwardTo] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const { data: usersData } = useQuery({
    queryKey: ['users-for-forward'],
    queryFn: async () => {
      const res = await fetch('/api/v1/users')
      const json = await res.json()
      if (!json.success) throw new Error('获取用户列表失败')
      return json.data.data as User[]
    },
    enabled: forwardOpen,
  })

  const handleApprove = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/approval-records/${recordId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVED', comment: comment || undefined }),
      })
      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error || '操作失败')
      }
      toast({ title: '审批通过', variant: 'success' })
      setApproveOpen(false)
      setComment('')
      onActionComplete?.()
    } catch (err) {
      toast({ title: '操作失败', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!comment || comment.length < 5) {
      toast({ title: '请输入至少5个字符的驳回理由', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/approval-records/${recordId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECTED', comment }),
      })
      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error || '操作失败')
      }
      toast({ title: '已驳回', variant: 'success' })
      setRejectOpen(false)
      setComment('')
      onActionComplete?.()
    } catch (err) {
      toast({ title: '操作失败', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleForward = async () => {
    if (!forwardTo) {
      toast({ title: '请选择转交目标', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/approval-records/${recordId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'FORWARDED', forwardTo, comment: comment || undefined }),
      })
      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error || '操作失败')
      }
      toast({ title: '已转交', variant: 'success' })
      setForwardOpen(false)
      setForwardTo('')
      setComment('')
      onActionComplete?.()
    } catch (err) {
      toast({ title: '操作失败', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-green-600 hover:bg-green-50 hover:text-green-700"
          onClick={() => setApproveOpen(true)}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => setRejectOpen(true)}
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
          onClick={() => setForwardOpen(true)}
        >
          <ArrowRightCircle className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>审批通过</DialogTitle>
            <DialogDescription>确认通过该预定申请</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="添加审批备注（可选）"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              取消
            </Button>
            <Button onClick={handleApprove} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认通过
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驳回申请</DialogTitle>
            <DialogDescription>请输入驳回理由（至少5个字符）</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="请输入驳回理由"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={loading || !comment || comment.length < 5}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认驳回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={forwardOpen} onOpenChange={setForwardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>转交审批</DialogTitle>
            <DialogDescription>选择转交目标审批人</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={forwardTo} onValueChange={setForwardTo}>
              <SelectTrigger>
                <SelectValue placeholder="选择转交目标" />
              </SelectTrigger>
              <SelectContent>
                {usersData?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="添加转交说明（可选）"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForwardOpen(false)}>
              取消
            </Button>
            <Button onClick={handleForward} disabled={loading || !forwardTo}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认转交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
