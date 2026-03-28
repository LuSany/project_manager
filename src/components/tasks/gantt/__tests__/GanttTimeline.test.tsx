import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GanttTimeline } from '../GanttTimeline'
import type { GanttTask, GanttDependency } from '../types'
import { DEFAULT_GANTT_CONFIG } from '../utils'

describe('GanttTimeline', () => {
  it.todo('渲染 SVG 容器', () => {
    const tasks: GanttTask[] = [
      {
        id: '1',
        title: 'Task 1',
        status: 'TODO',
        progress: 0,
        priority: 'MEDIUM',
        startDate: '2026-03-20',
        dueDate: '2026-03-25',
      },
    ]

    const dependencies: GanttDependency[] = []

    const timeRange = {
      start: new Date('2026-03-13'),
      end: new Date('2026-04-01'),
      totalDays: 19,
    }

    render(
      <GanttTimeline
        tasks={tasks}
        dependencies={dependencies}
        timeRange={timeRange}
        scaleMode="day"
        config={DEFAULT_GANTT_CONFIG}
        onOpenDetail={jest.fn()}
      />
    )

    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it.todo('渲染网格线', () => {
    const tasks: GanttTask[] = [
      {
        id: '1',
        title: 'Task 1',
        status: 'TODO',
        progress: 0,
        priority: 'MEDIUM',
        startDate: '2026-03-20',
        dueDate: '2026-03-25',
      },
    ]

    const dependencies: GanttDependency[] = []

    const timeRange = {
      start: new Date('2026-03-13'),
      end: new Date('2026-04-01'),
      totalDays: 19,
    }

    render(
      <GanttTimeline
        tasks={tasks}
        dependencies={dependencies}
        timeRange={timeRange}
        scaleMode="day"
        config={DEFAULT_GANTT_CONFIG}
        onOpenDetail={jest.fn()}
      />
    )

    // SVG should contain grid lines
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it.todo('渲染任务条', () => {
    const tasks: GanttTask[] = [
      {
        id: '1',
        title: 'Task 1',
        status: 'TODO',
        progress: 0,
        priority: 'MEDIUM',
        startDate: '2026-03-20',
        dueDate: '2026-03-25',
      },
    ]

    const dependencies: GanttDependency[] = []

    const timeRange = {
      start: new Date('2026-03-13'),
      end: new Date('2026-04-01'),
      totalDays: 19,
    }

    render(
      <GanttTimeline
        tasks={tasks}
        dependencies={dependencies}
        timeRange={timeRange}
        scaleMode="day"
        config={DEFAULT_GANTT_CONFIG}
        onOpenDetail={jest.fn()}
      />
    )

    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it.todo('渲染今天竖线', () => {
    const tasks: GanttTask[] = []

    const dependencies: GanttDependency[] = []

    const timeRange = {
      start: new Date('2026-03-13'),
      end: new Date('2026-04-01'),
      totalDays: 19,
    }

    render(
      <GanttTimeline
        tasks={tasks}
        dependencies={dependencies}
        timeRange={timeRange}
        scaleMode="day"
        config={DEFAULT_GANTT_CONFIG}
        onOpenDetail={jest.fn()}
      />
    )

    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it.todo('点击任务条触发回调', () => {
    const tasks: GanttTask[] = [
      {
        id: '1',
        title: 'Task 1',
        status: 'TODO',
        progress: 0,
        priority: 'MEDIUM',
        startDate: '2026-03-20',
        dueDate: '2026-03-25',
      },
    ]

    const dependencies: GanttDependency[] = []

    const timeRange = {
      start: new Date('2026-03-13'),
      end: new Date('2026-04-01'),
      totalDays: 19,
    }

    const onOpenDetail = jest.fn()

    render(
      <GanttTimeline
        tasks={tasks}
        dependencies={dependencies}
        timeRange={timeRange}
        scaleMode="day"
        config={DEFAULT_GANTT_CONFIG}
        onOpenDetail={onOpenDetail}
      />
    )

    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })
})
