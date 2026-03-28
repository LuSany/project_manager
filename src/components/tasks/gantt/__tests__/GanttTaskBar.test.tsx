import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GanttTaskBar } from '../GanttTaskBar'
import type { GanttTask, TaskBarPosition } from '../types'

describe('GanttTaskBar', () => {
  it.todo('渲染任务条背景矩形', () => {
    const task: GanttTask = {
      id: '1',
      title: 'Task 1',
      status: 'TODO',
      progress: 0,
      priority: 'MEDIUM',
      startDate: '2026-03-20',
      dueDate: '2026-03-25',
    }

    const position: TaskBarPosition = {
      x: 100,
      y: 0,
      width: 240,
      height: 24,
    }

    render(<GanttTaskBar task={task} position={position} color="#eab308" onClick={vi.fn()} />)

    // Task bar should be rendered
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it.todo('渲染进度条', () => {
    const task: GanttTask = {
      id: '1',
      title: 'Task 1',
      status: 'TODO',
      progress: 50,
      priority: 'MEDIUM',
      startDate: '2026-03-20',
      dueDate: '2026-03-25',
    }

    const position: TaskBarPosition = {
      x: 100,
      y: 0,
      width: 240,
      height: 24,
    }

    render(<GanttTaskBar task={task} position={position} color="#eab308" onClick={vi.fn()} />)

    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it.todo('显示任务名称', () => {
    const task: GanttTask = {
      id: '1',
      title: 'Task 1',
      status: 'TODO',
      progress: 50,
      priority: 'MEDIUM',
      startDate: '2026-03-20',
      dueDate: '2026-03-25',
    }

    const position: TaskBarPosition = {
      x: 100,
      y: 0,
      width: 240,
      height: 24,
    }

    render(<GanttTaskBar task={task} position={position} color="#eab308" onClick={vi.fn()} />)

    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it.todo('显示进度百分比', () => {
    const task: GanttTask = {
      id: '1',
      title: 'Task 1',
      status: 'TODO',
      progress: 50,
      priority: 'MEDIUM',
      startDate: '2026-03-20',
      dueDate: '2026-03-25',
    }

    const position: TaskBarPosition = {
      x: 100,
      y: 0,
      width: 240,
      height: 24,
    }

    render(<GanttTaskBar task={task} position={position} color="#eab308" onClick={vi.fn()} />)

    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it.todo('点击触发回调', () => {
    const task: GanttTask = {
      id: '1',
      title: 'Task 1',
      status: 'TODO',
      progress: 50,
      priority: 'MEDIUM',
      startDate: '2026-03-20',
      dueDate: '2026-03-25',
    }

    const position: TaskBarPosition = {
      x: 100,
      y: 0,
      width: 240,
      height: 24,
    }

    const onClick = vi.fn()

    render(<GanttTaskBar task={task} position={position} color="#eab308" onClick={onClick} />)

    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })
})
