import { describe, it, expect } from 'vitest'
import { calculateCriticalPath } from '../GanttCriticalPath'
import type { GanttTask, GanttDependency } from '../types'
import { DependencyType } from '@/types/task-dependency'

describe('GanttCriticalPath', () => {
  it('线性依赖 A→B→C 的关键路径为 {A,B,C}', () => {
    const tasks: GanttTask[] = [
      {
        id: 'A',
        title: 'Task A',
        status: 'TODO',
        progress: 0,
        priority: 'HIGH',
        startDate: '2026-03-20',
        dueDate: '2026-03-22',
      },
      {
        id: 'B',
        title: 'Task B',
        status: 'TODO',
        progress: 0,
        priority: 'HIGH',
        startDate: '2026-03-22',
        dueDate: '2026-03-24',
      },
      {
        id: 'C',
        title: 'Task C',
        status: 'TODO',
        progress: 0,
        priority: 'HIGH',
        startDate: '2026-03-24',
        dueDate: '2026-03-26',
      },
    ]

    const dependencies: GanttDependency[] = [
      {
        id: '1',
        sourceTaskId: 'A',
        targetTaskId: 'B',
        dependencyType: DependencyType.FINISH_TO_START,
      },
      {
        id: '2',
        sourceTaskId: 'B',
        targetTaskId: 'C',
        dependencyType: DependencyType.FINISH_TO_START,
      },
    ]

    const result = calculateCriticalPath(tasks, dependencies)
    expect(result.has('A')).toBe(true)
    expect(result.has('B')).toBe(true)
    expect(result.has('C')).toBe(true)
  })

  it('分叉依赖取最长路径', () => {
    const tasks: GanttTask[] = [
      {
        id: 'A',
        title: 'Task A',
        status: 'TODO',
        progress: 0,
        priority: 'HIGH',
        startDate: '2026-03-20',
        dueDate: '2026-03-22',
      },
      {
        id: 'B',
        title: 'Task B',
        status: 'TODO',
        progress: 0,
        priority: 'HIGH',
        startDate: '2026-03-22',
        dueDate: '2026-03-25',
      },
      {
        id: 'C',
        title: 'Task C',
        status: 'TODO',
        progress: 0,
        priority: 'HIGH',
        startDate: '2026-03-22',
        dueDate: '2026-03-28',
      },
    ]

    const dependencies: GanttDependency[] = [
      {
        id: '1',
        sourceTaskId: 'A',
        targetTaskId: 'B',
        dependencyType: DependencyType.FINISH_TO_START,
      },
      {
        id: '2',
        sourceTaskId: 'A',
        targetTaskId: 'C',
        dependencyType: DependencyType.FINISH_TO_START,
      },
    ]

    const result = calculateCriticalPath(tasks, dependencies)
    expect(result.has('A')).toBe(true)
    expect(result.has('C')).toBe(true)
  })

  it('无依赖时返回空 Set', () => {
    const tasks: GanttTask[] = [
      {
        id: 'A',
        title: 'Task A',
        status: 'TODO',
        progress: 0,
        priority: 'HIGH',
        startDate: '2026-03-20',
        dueDate: '2026-03-22',
      },
      {
        id: 'B',
        title: 'Task B',
        status: 'TODO',
        progress: 0,
        priority: 'HIGH',
        startDate: '2026-03-22',
        dueDate: '2026-03-24',
      },
    ]

    const result = calculateCriticalPath(tasks, [])
    expect(result.size).toBe(0)
  })

  it('单任务无依赖不在关键路径上', () => {
    const tasks: GanttTask[] = [
      {
        id: 'A',
        title: 'Task A',
        status: 'TODO',
        progress: 0,
        priority: 'HIGH',
        startDate: '2026-03-20',
        dueDate: '2026-03-22',
      },
    ]

    const result = calculateCriticalPath(tasks, [])
    expect(result.size).toBe(0)
  })

  it('钻石依赖（A→B, A→C, B→D, C→D）取最长分支', () => {
    const tasks: GanttTask[] = [
      {
        id: 'A',
        title: 'Task A',
        status: 'TODO',
        progress: 0,
        priority: 'HIGH',
        startDate: '2026-03-20',
        dueDate: '2026-03-21',
      },
      {
        id: 'B',
        title: 'Task B',
        status: 'TODO',
        progress: 0,
        priority: 'HIGH',
        startDate: '2026-03-21',
        dueDate: '2026-03-23',
      },
      {
        id: 'C',
        title: 'Task C',
        status: 'TODO',
        progress: 0,
        priority: 'HIGH',
        startDate: '2026-03-21',
        dueDate: '2026-03-26',
      },
      {
        id: 'D',
        title: 'Task D',
        status: 'TODO',
        progress: 0,
        priority: 'HIGH',
        startDate: '2026-03-26',
        dueDate: '2026-03-28',
      },
    ]

    const dependencies: GanttDependency[] = [
      {
        id: '1',
        sourceTaskId: 'A',
        targetTaskId: 'B',
        dependencyType: DependencyType.FINISH_TO_START,
      },
      {
        id: '2',
        sourceTaskId: 'A',
        targetTaskId: 'C',
        dependencyType: DependencyType.FINISH_TO_START,
      },
      {
        id: '3',
        sourceTaskId: 'B',
        targetTaskId: 'D',
        dependencyType: DependencyType.FINISH_TO_START,
      },
      {
        id: '4',
        sourceTaskId: 'C',
        targetTaskId: 'D',
        dependencyType: DependencyType.FINISH_TO_START,
      },
    ]

    const result = calculateCriticalPath(tasks, dependencies)
    expect(result.has('A')).toBe(true)
    expect(result.has('C')).toBe(true)
    expect(result.has('D')).toBe(true)
  })
})
