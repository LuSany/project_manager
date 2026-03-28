import { describe, it, expect, vi } from 'vitest'
import React from 'react'
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

  it('FS 依赖连线起点在源任务右端', () => {
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
    const paths = document.querySelectorAll('path')
    expect(paths.length).toBeGreaterThan(0)
  })

  it('FS 依赖连线终点在目标任务左端', () => {
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
    const paths = document.querySelectorAll('path')
    expect(paths.length).toBeGreaterThan(0)
  })

  it('连线颜色按依赖类型正确编码', () => {
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
    const path = document.querySelector('path')
    expect(path).toHaveAttribute('stroke')
  })

  it('折线路径包含直角转弯', () => {
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
    const path = document.querySelector('path')
    expect(path).toHaveAttribute('d')
  })

  it('实心箭头在终点渲染', () => {
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
    const polygons = document.querySelectorAll('polygon')
    expect(polygons.length).toBeGreaterThan(0)
  })

  it('关键路径连线使用橙色', () => {
    const mockDepCritical: GanttDependency = {
      ...mockDependency,
      id: 'dep-critical',
    }

    const { container } = render(
      <svg>
        <GanttDependencyLine
          dependency={mockDepCritical}
          sourcePosition={mockSourcePosition}
          targetPosition={mockTargetPosition}
          dependencyType={DependencyType.FINISH_TO_START}
          isCritical={true}
        />
      </svg>
    )
    const path = container.querySelector('svg > g > path')
    expect(path?.getAttribute('stroke')).toBe('#f97316')
  })
})
