'use client'

import React, { useState, useMemo } from 'react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
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
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CalendarDayCell } from './CalendarDayCell'
import { CalendarTaskCard } from './CalendarTaskCard'
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
  onCreateTask?: (date: Date) => void
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

  // 传感器配置 - 8px 激活距离防止误触
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // 按日期分组任务 (D-04)
  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, Task[]>()
    tasks.forEach((task) => {
      if (!task.dueDate) return
      const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd')
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

  // 按周分组日期
  const weeks = useMemo(() => {
    const result: Date[][] = []
    let week: Date[] = []

    calendarDays.forEach((day, index) => {
      week.push(day)
      if (index % 7 === 6) {
        result.push(week)
        week = []
      }
    })

    return result
  }, [calendarDays])

  // 月份导航
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  // 拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find((t) => t.id === active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  // 拖拽结束 - 更新截止日期 (D-05)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
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
        collisionDetection={closestCenter}
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
                  onCreateTask={onCreateTask}
                />
              )
            })}
          </div>
        </div>

        {/* 拖拽覆盖层 */}
        <DragOverlay>
          {activeTask ? (
            <div className="scale-105 shadow-lg">
              <CalendarTaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}