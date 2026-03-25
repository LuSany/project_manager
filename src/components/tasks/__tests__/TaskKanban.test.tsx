import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { SortableTaskCard } from '../TaskKanban'

interface MockTask {
  id: string
  title: string
  status: string
  priority: string
  progress: number
  dueDate: string | null
  assignees?: Array<{
    user: {
      id: string
      name: string
      email: string
    }
  }>
}

describe('SortableTaskCard - Drag Animation', () => {
  const mockTask: MockTask = {
    id: 'task-1',
    title: 'Test Task',
    status: 'TODO',
    priority: 'MEDIUM',
    progress: 50,
    dueDate: '2026-03-30',
    assignees: [
      {
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    ],
  }

  it('should apply correct styles when dragging', () => {
    const { container } = render(
      <DndContext>
        <SortableTaskCard task={mockTask} isDragging={true} />
      </DndContext>
    )

    const card = container.querySelector('[class*="cursor-grab"]')
    expect(card).toHaveClass('scale-95', 'rotate-2', 'opacity-50', 'shadow-xl')
  })

  it('should not apply drag styles when not dragging', () => {
    const { container } = render(
      <DndContext>
        <SortableTaskCard task={mockTask} isDragging={false} />
      </DndContext>
    )

    const card = container.querySelector('[class*="cursor-grab"]')
    expect(card).not.toHaveClass('scale-95', 'rotate-2', 'opacity-50', 'shadow-xl')
    expect(card).toHaveClass('cursor-grab')
  })

  it('should have proper hover effects', () => {
    const { container } = render(
      <DndContext>
        <SortableTaskCard task={mockTask} isDragging={false} />
      </DndContext>
    )

    const card = container.querySelector('[class*="cursor-grab"]')
    expect(card).toHaveClass('hover:border-primary/50', 'hover:shadow-md')
  })

  it('should show transition effects', () => {
    const { container } = render(
      <DndContext>
        <SortableTaskCard task={mockTask} isDragging={false} />
      </DndContext>
    )

    const card = container.querySelector('[class*="cursor-grab"]')
    expect(card).toHaveClass('transition-all')
  })

  it('should change cursor to grabbing when dragging', () => {
    const { container } = render(
      <DndContext>
        <SortableTaskCard task={mockTask} isDragging={true} />
      </DndContext>
    )

    const card = container.querySelector('[class*="cursor-grab"]')
    expect(card).toHaveClass('active:cursor-grabbing')
  })
})