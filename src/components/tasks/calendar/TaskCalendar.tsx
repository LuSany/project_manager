'use client'

import React, { useState, useMemo } from 'react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CalendarDayCell } from './CalendarDayCell'
import { CalendarTaskCard } from './CalendarTaskCard'
import { QuickCreatePopover } from './QuickCreatePopover'
import { UnscheduledTaskList } from './UnscheduledTaskList'
import type { Task } from '@/components/tasks/kanban/SortableTaskCard'

// ============================================================================
// 类型定义
// ============================================================================

interface TaskCalendarProps {
  projectId: string
  tasks: Task[]
  isLoading?: boolean
  onOpenDetail?: (taskId: string) => void
  onUpdateDueDate?: (taskId: string, dueDate: Date) => void
  onCreateTask?: (title: string, dueDate: Date) => void
}

// ============================================================================
// 星期标题
// ============================================================================

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

// ============================================================================
// TaskCalendar 组件
// ============================================================================

export function TaskCalendar({
  projectId,
  tasks,
  isLoading,
  onOpenDetail,
  onUpdateDueDate,
  onCreateTask,
}: TaskCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [quickCreateDate, setQuickCreateDate] = useState<Date | null>(null)

  // 传感器配置 - 8px 激活距离防止误触
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // 按日期分组任务 (D-04)
  // 修复：直接从 ISO 字符串提取日期，避免时区转换导致的日期偏移
  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, Task[]>()
    tasks.forEach((task) => {
      if (!task.dueDate) return
      // task.dueDate 格式："2026-03-28T00:00:00.000Z"
      // 直接提取前 10 个字符 "2026-03-28" 作为 dateKey，避免时区转换
      const dateKey = task.dueDate.slice(0, 10)
      if (!grouped.has(dateKey)) grouped.set(dateKey, [])
      grouped.get(dateKey)!.push(task)
    })
    return grouped
  }, [tasks])

  // 生成日历日期 (包含上月和下月的填充日期)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentMonth])

  // 月份导航
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  // 拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    // 从拖拽数据中获取任务，或从任务列表中查找
    let task = active.data.current?.task as Task | undefined

    if (!task) {
      // 处理来自 UnscheduledTaskList 的任务（ID 格式为 "unscheduled-${task.id}"）
      const activeId = active.id as string
      const taskId = activeId.startsWith('unscheduled-')
        ? activeId.replace('unscheduled-', '')
        : activeId
      task = tasks.find((t) => t.id === taskId)
    }

    if (task) {
      setActiveTask(task)
    }
  }

  // 拖拽结束 - 更新截止日期 (D-05)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    // 从拖拽数据中获取任务，或从任务列表中查找
    let task = active.data.current?.task as Task | undefined
    const activeId = active.id as string

    if (!task) {
      // 处理来自 UnscheduledTaskList 的任务（ID 格式为 "unscheduled-${task.id}"）
      const taskId = activeId.startsWith('unscheduled-')
        ? activeId.replace('unscheduled-', '')
        : activeId
      task = tasks.find((t) => t.id === taskId)
    }

    const taskId = task?.id || (activeId.startsWith('unscheduled-')
      ? activeId.replace('unscheduled-', '')
      : activeId)
    const targetDateStr = over.id as string

    // 检查目标是否是日期单元格
    if (over.data.current?.type === 'calendar-day') {
      const targetDate = over.data.current.date as Date
      onUpdateDueDate?.(taskId, targetDate)
    } else {
      // 尝试解析日期字符串
      const targetDate = new Date(targetDateStr)
      if (!isNaN(targetDate.getTime())) {
        onUpdateDueDate?.(taskId, targetDate)
      }
    }
  }

  // 处理日期双击创建任务 (D-06)
  const handleDateDoubleClick = (date: Date) => {
    setQuickCreateDate(date)
  }

  // 处理快速创建任务
  const handleQuickCreate = (title: string, date: Date) => {
    onCreateTask?.(title, date)
    setQuickCreateDate(null)
  }

  return (
    <div className="flex h-full flex-col">
      {/* 月份导航头 */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'yyyy年M月', { locale: zhCN })}
        </h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 日历主体 */}
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-auto p-4">
          {/* 星期标题行 */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {WEEKDAYS.map((day, index) => (
              <div
                key={day}
                className={cn(
                  'text-center text-xs font-medium text-muted-foreground py-2',
                  index >= 5 && 'text-primary/70' // 周末高亮
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日历网格 */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((date) => {
              const dateKey = format(date, 'yyyy-MM-dd')
              const dayTasks = tasksByDate.get(dateKey) || []

              return (
                <CalendarDayCell
                  key={dateKey}
                  date={date}
                  currentMonth={currentMonth}
                  tasks={dayTasks}
                  onOpenDetail={onOpenDetail}
                  onCreateTask={handleDateDoubleClick}
                />
              )
            })}
          </div>
        </div>

        {/* 无日期任务列表 (D-07) */}
        <UnscheduledTaskList tasks={tasks} onOpenDetail={onOpenDetail} />

        {/* 拖拽覆盖层 */}
        <DragOverlay>
          {activeTask ? (
            <div className="scale-105 shadow-lg">
              <CalendarTaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* 快速创建任务弹窗 (D-06) */}
      {quickCreateDate && (
        <QuickCreatePopover
          date={quickCreateDate}
          open={true}
          onOpenChange={(open) => !open && setQuickCreateDate(null)}
          onCreate={handleQuickCreate}
        />
      )}
    </div>
  )
}