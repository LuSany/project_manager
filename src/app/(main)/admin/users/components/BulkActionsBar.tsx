'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface BulkActionsBarProps {
  selectedCount: number
  onBulkStatus: (status: 'ACTIVE' | 'DISABLED') => Promise<void>
  onBulkRole: (role: string) => Promise<void>
  onClearSelection: () => void
}

export function BulkActionsBar({
  selectedCount,
  onBulkStatus,
  onBulkRole,
  onClearSelection,
}: BulkActionsBarProps) {
  const { toast } = useToast()
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'DISABLED' | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleBulkStatus = async (status: 'ACTIVE' | 'DISABLED') => {
    if (status === 'DISABLED') {
      setActionType('DISABLED')
      setConfirmDialogOpen(true)
    } else {
      setLoading(true)
      try {
        await onBulkStatus(status)
        toast({
          title: '操作成功',
          description: `已批量激活 ${selectedCount} 个用户`,
          variant: 'success',
        })
      } catch (error) {
        toast({
          title: '操作失败',
          description: '批量激活失败',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const confirmDisable = async () => {
    setConfirmDialogOpen(false)
    setLoading(true)
    try {
      await onBulkStatus('DISABLED')
      toast({
        title: '操作成功',
        description: `已批量禁用 ${selectedCount} 个用户`,
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: '操作失败',
        description: '批量禁用失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBulkRole = async () => {
    if (!selectedRole) return

    setLoading(true)
    try {
      await onBulkRole(selectedRole)
      toast({
        title: '操作成功',
        description: `已批量修改 ${selectedCount} 个用户的角色`,
        variant: 'success',
      })
      setSelectedRole('')
    } catch (error) {
      toast({
        title: '操作失败',
        description: '批量修改角色失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (selectedCount === 0) {
    return null
  }

  return (
    <>
      <div className="bg-muted/50 flex items-center gap-4 rounded-lg border p-4">
        <span className="text-sm font-medium">已选择 {selectedCount} 项</span>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={() => handleBulkStatus('ACTIVE')}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            批量激活
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleBulkStatus('DISABLED')}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            批量禁用
          </Button>

          <div className="flex gap-2">
            <Select value={selectedRole} onValueChange={setSelectedRole} disabled={loading}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="修改角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">系统管理员</SelectItem>
                <SelectItem value="PROJECT_ADMIN">项目管理员</SelectItem>
                <SelectItem value="PROJECT_OWNER">项目所有者</SelectItem>
                <SelectItem value="PROJECT_MEMBER">项目成员</SelectItem>
                <SelectItem value="EMPLOYEE">普通员工</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkRole}
              disabled={!selectedRole || loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              应用
            </Button>
          </div>

          <Button size="sm" variant="ghost" onClick={onClearSelection} disabled={loading}>
            取消选择
          </Button>
        </div>
      </div>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认禁用</DialogTitle>
            <DialogDescription>
              确定要批量禁用选中的 {selectedCount} 个用户吗？这些用户将无法登录系统。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDisable} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              确认禁用
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
