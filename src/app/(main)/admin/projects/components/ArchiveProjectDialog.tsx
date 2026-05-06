'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

interface ArchiveProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectStatus: string | undefined
  projectName: string | undefined
  onConfirm: () => void
  submitting: boolean
}

export function ArchiveProjectDialog({
  open,
  onOpenChange,
  projectStatus,
  projectName,
  onConfirm,
  submitting,
}: ArchiveProjectDialogProps) {
  const isArchived = projectStatus === 'COMPLETED'
  const title = isArchived ? '取消归档' : '归档'
  const description = isArchived
    ? `确定要将项目「${projectName}」取消归档吗？`
    : `确定要归档项目「${projectName}」吗？归档后项目将标记为已完成。`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}项目</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            取消
          </Button>
          <Button onClick={onConfirm} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}