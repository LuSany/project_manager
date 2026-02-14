"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, isBefore, isPast } from "date-fns"
import { zhCN } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DateRangePickerProps {
  startDate?: Date
  dueDate?: Date
  onStartDateChange: (date: Date | undefined) => void
  onDueDateChange: (date: Date | undefined) => void
  disabled?: boolean
  status?: string
}

export function DateRangePicker({
  startDate,
  dueDate,
  onStartDateChange,
  onDueDateChange,
  disabled = false,
  status,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  // 超期判断逻辑：dueDate < new Date() && status !== 'DONE'
  const isOverdue = React.useMemo(() => {
    if (!dueDate || status === "DONE") return false
    return isBefore(dueDate, new Date())
  }, [dueDate, status])

  const formatDate = (date: Date | undefined) => {
    if (!date) return "未设置"
    return format(date, "yyyy-MM-dd", { locale: zhCN })
  }

  const handleStartDateSelect = (date: Date | undefined) => {
    onStartDateChange(date)
    // 如果选择的开始日期晚于截止日期，自动调整截止日期
    if (date && dueDate && isBefore(dueDate, date)) {
      onDueDateChange(undefined)
    }
  }

  const handleDueDateSelect = (date: Date | undefined) => {
    onDueDateChange(date)
    // 如果选择的截止日期早于开始日期，自动调整开始日期
    if (date && startDate && isBefore(date, startDate)) {
      onStartDateChange(undefined)
    }
  }

  return (
    <div className="flex gap-2">
      {/* 开始日期选择器 */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[200px] justify-start text-left font-normal",
              !startDate && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDate(startDate)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={handleStartDateSelect}
            initialFocus
            disabled={(date) =>
              dueDate ? isBefore(date, dueDate) : false
            }
          />
        </PopoverContent>
      </Popover>

      {/* 截止日期选择器 */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[200px] justify-start text-left font-normal",
              !dueDate && "text-muted-foreground",
              isOverdue && "border-destructive text-destructive"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDate(dueDate)}
            {isOverdue && <span className="ml-1 text-xs">(已超期)</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dueDate}
            onSelect={handleDueDateSelect}
            initialFocus
            disabled={(date) =>
              startDate ? isBefore(date, startDate) : false
            }
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export { isOverdue as checkIsOverdue }

// 导出超期判断工具函数
export function isOverdue(dueDate: Date | undefined, status: string | undefined): boolean {
  if (!dueDate || status === "DONE") return false
  return isBefore(dueDate, new Date())
}
