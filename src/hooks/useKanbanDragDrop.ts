'use client'

import {
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useState } from 'react'

interface Task {
  id: string
  status: string
  [key: string]: any
}

interface UseKanbanDragDropResult {
  sensors: ReturnType<typeof useSensors>
  handleDragEnd: (event: DragEndEvent) => void
  handleDragOver: (event: DragOverEvent) => void
}

export function useKanbanDragDrop(
  tasks: Task[],
  onReorder?: (tasks: Task[]) => void
): UseKanbanDragDropResult {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    setActiveId(activeId)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const activeIndex = tasks.findIndex((task) => task.id === activeId)
    const overIndex = tasks.findIndex((task) => task.id === overId)

    if (activeIndex === -1 || overIndex === -1) return

    const activeTask = tasks[activeIndex]
    const overTask = tasks[overIndex]

    let newTasks: Task[]

    if (activeTask.status === overTask.status) {
      newTasks = arrayMove(tasks, activeIndex, overIndex)
    } else {
      newTasks = tasks.map((task) =>
        task.id === activeId ? { ...task, status: overTask.status } : task
      )
      const movedTaskIndex = newTasks.findIndex((task) => task.id === activeId)
      if (overIndex > activeIndex) {
        newTasks = arrayMove(newTasks, movedTaskIndex, overIndex - 1)
      } else {
        newTasks = arrayMove(newTasks, movedTaskIndex, overIndex)
      }
    }

    onReorder?.(newTasks)
  }

  return {
    sensors,
    handleDragEnd,
    handleDragOver,
  }
}
