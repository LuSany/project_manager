'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'

interface QuickCreatePopoverProps {
  date: Date
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (title: string, dueDate: Date) => void
  children?: React.ReactNode
}

export function QuickCreatePopover({
  date,
  open,
  onOpenChange,
  onCreate,
  children,
}: QuickCreatePopoverProps) {
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      onCreate(title.trim(), date)
      setTitle('')
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children || <div />}
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <form onSubmit={handleSubmit}>
          {/* 日期显示 */}
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(date, 'yyyy年M月d日', { locale: zhCN })}</span>
          </div>

          {/* 标题输入 */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入任务标题..."
            autoFocus
            className="mb-3"
          />

          {/* 提交按钮 */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!title.trim() || isSubmitting}
            >
              创建任务
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}