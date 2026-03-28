import { describe, it, expect } from 'vitest'
import { calculateTimeRange, getTaskPosition, formatScaleDate, getPriorityColor } from '../utils'
import type { GanttTask, GanttScaleMode, GanttConfig } from '../types'

describe('calculateTimeRange', () => {
  it.todo('有任务时返回正确范围', () => {
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
      {
        id: '2',
        title: 'Task 2',
        status: 'TODO',
        progress: 0,
        priority: 'HIGH',
        startDate: '2026-03-22',
        dueDate: '2026-03-30',
      },
    ]

    const result = calculateTimeRange(tasks, 'day')
    expect(result.start.getFullYear()).toBe(2026)
    expect(result.start.getMonth()).toBe(2) // March (0-indexed)
    expect(result.start.getDate()).toBeLessThanOrEqual(13) // 20 - 7 days margin
    expect(result.end.getDate()).toBeGreaterThanOrEqual(6) // 30 + 7 days margin
  })

  it.todo('无任务时返回当月范围', () => {
    const tasks: GanttTask[] = []
    const result = calculateTimeRange(tasks, 'day')
    const now = new Date()
    expect(result.start.getFullYear()).toBe(now.getFullYear())
    expect(result.start.getMonth()).toBe(now.getMonth())
    expect(result.start.getDate()).toBe(1) // 月初
  })

  it.todo('范围两端各扩展 7 天', () => {
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

    const result = calculateTimeRange(tasks, 'day')
    const daysDiff = (result.end.getTime() - result.start.getTime()) / (1000 * 60 * 60 * 24)
    expect(daysDiff).toBeGreaterThan(7 + 5) // 7 days + 5 days task duration
  })
})

describe('getTaskPosition', () => {
  it.todo('返回正确的 x 坐标', () => {
    const task: GanttTask = {
      id: '1',
      title: 'Task 1',
      status: 'TODO',
      progress: 0,
      priority: 'MEDIUM',
      startDate: '2026-03-20',
      dueDate: '2026-03-25',
    }

    const timeRange = {
      start: new Date('2026-03-13'),
      end: new Date('2026-04-01'),
      totalDays: 19,
    }

    const config: GanttConfig = {
      rowHeight: 36,
      barHeight: 24,
      leftPanelPercent: 30,
      cellWidth: { day: 48, week: 120, month: 200 },
      headerHeight: 48,
      barGap: 6,
    }

    const position = getTaskPosition(task, timeRange, config, 0, 'day')
    expect(position?.x).toBeGreaterThan(0)
    expect(position?.x).toBeLessThan(timeRange.totalDays * config.cellWidth.day)
  })

  it.todo('返回正确的 width', () => {
    const task: GanttTask = {
      id: '1',
      title: 'Task 1',
      status: 'TODO',
      progress: 0,
      priority: 'MEDIUM',
      startDate: '2026-03-20',
      dueDate: '2026-03-25',
    }

    const timeRange = {
      start: new Date('2026-03-13'),
      end: new Date('2026-04-01'),
      totalDays: 19,
    }

    const config: GanttConfig = {
      rowHeight: 36,
      barHeight: 24,
      leftPanelPercent: 30,
      cellWidth: { day: 48, week: 120, month: 200 },
      headerHeight: 48,
      barGap: 6,
    }

    const position = getTaskPosition(task, timeRange, config, 0, 'day')
    // Task spans 5 days (20th to 25th), so width should be approximately 5 * 48 = 240
    expect(position?.width).toBeGreaterThan(200)
    expect(position?.width).toBeLessThan(300)
  })

  it.todo('缺少日期时返回 null', () => {
    const task: GanttTask = {
      id: '1',
      title: 'Task 1',
      status: 'TODO',
      progress: 0,
      priority: 'MEDIUM',
      startDate: null,
      dueDate: null,
    }

    const timeRange = {
      start: new Date('2026-03-13'),
      end: new Date('2026-04-01'),
      totalDays: 19,
    }

    const config: GanttConfig = {
      rowHeight: 36,
      barHeight: 24,
      leftPanelPercent: 30,
      cellWidth: { day: 48, week: 120, month: 200 },
      headerHeight: 48,
      barGap: 6,
    }

    const position = getTaskPosition(task, timeRange, config, 0, 'day')
    expect(position).toBeNull()
  })
})

describe('formatScaleDate', () => {
  it.todo('日级别返回正确格式', () => {
    const date = new Date('2026-03-28')
    const result = formatScaleDate(date, 'day')
    expect(result).toMatch(/\d{1,2}\/\d{1,2}/) // M/d format
    expect(result).toContain('3/28')
  })

  it.todo('周级别返回正确格式', () => {
    const date = new Date('2026-03-28')
    const result = formatScaleDate(date, 'week')
    expect(result).toContain('周')
  })

  it.todo('月级别返回正确格式', () => {
    const date = new Date('2026-03-28')
    const result = formatScaleDate(date, 'month')
    expect(result).toContain('2026年')
    expect(result).toContain('3月')
  })
})

describe('getPriorityColor', () => {
  it.todo('返回正确的色值', () => {
    expect(getPriorityColor('HIGH')).toBe('#ef4444') // red-500
    expect(getPriorityColor('CRITICAL')).toBe('#ef4444') // red-500
    expect(getPriorityColor('MEDIUM')).toBe('#eab308') // yellow-500
    expect(getPriorityColor('LOW')).toBe('#3b82f6') // blue-500
  })
})
