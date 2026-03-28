import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GanttDependencyLine } from '../GanttDependencyLine'
import type { TaskBarPosition, GanttDependency } from '../types'
import { DependencyType } from '@/types/task-dependency'

describe('GanttDependencyLine', () => {
  const mockDependency: GanttDependency = {
    id: 'dep-1',
    sourceTaskId: 'task-1',
    targetTaskId: 'task-2',
    dependencyType: DependencyType.FINISH_TO_START,
  }

  const mockSourcePosition: TaskBarPosition = {
    x: 100,
    y: 0,
    width: 120,
    height: 24,
  }

  const mockTargetPosition: TaskBarPosition = {
    x: 300,
    y: 36,
    width: 120,
    height: 24,
  }

  it.todo('FS 依赖连线起点在源任务右端', () => {
    render(
      <svg>
        <GanttDependencyLine
          dependency={mockDependency}
          sourcePosition={mockSourcePosition}
          targetPosition={mockTargetPosition}
          dependencyType={DependencyType.FINISH_TO_START}
        />
      </svg>
    )
    // Should render SVG path element
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it.todo('FS 依赖连线终点在目标任务左端', () => {
    render(
      <svg>
        <GanttDependencyLine
          dependency={mockDependency}
          sourcePosition={mockSourcePosition}
          targetPosition={mockTargetPosition}
          dependencyType={DependencyType.FINISH_TO_START}
        />
      </svg>
    )
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it.todo('连线颜色按依赖类型正确编码', () => {
    const types = [
      { type: DependencyType.FINISH_TO_START, expectedColor: '#3b82f6' },
      { type: DependencyType.START_TO_START, expectedColor: '#22c55e' },
      { type: DependencyType.FINISH_TO_FINISH, expectedColor: '#a855f7' },
      { type: DependencyType.START_TO_FINISH, expectedColor: '#f97316' },
    ]

    types.forEach(({ type, expectedColor }) => {
      render(
        <svg>
          <GanttDependencyLine
            dependency={mockDependency}
            sourcePosition={mockSourcePosition}
            targetPosition={mockTargetPosition}
            dependencyType={type}
          />
        </svg>
      )
      expect(screen.getByRole('img')).toBeInTheDocument()
    })
  })

  it.todo('折线路径包含直角转弯', () => {
    render(
      <svg>
        <GanttDependencyLine
          dependency={mockDependency}
          sourcePosition={mockSourcePosition}
          targetPosition={mockTargetPosition}
          dependencyType={DependencyType.FINISH_TO_START}
        />
      </svg>
    )
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it.todo('实心箭头在终点渲染', () => {
    render(
      <svg>
        <GanttDependencyLine
          dependency={mockDependency}
          sourcePosition={mockSourcePosition}
          targetPosition={mockTargetPosition}
          dependencyType={DependencyType.FINISH_TO_START}
        />
      </svg>
    )
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it.todo('关键路径连线使用橙色', () => {
    render(
      <svg>
        <GanttDependencyLine
          dependency={mockDependency}
          sourcePosition={mockSourcePosition}
          targetPosition={mockTargetPosition}
          dependencyType={DependencyType.FINISH_TO_START}
          isCritical={true}
        />
      </svg>
    )
    expect(screen.getByRole('img')).toBeInTheDocument()
  })
})
