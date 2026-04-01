import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ChartsGrid } from '@/components/dashboard/ChartsGrid'

vi.mock('@/components/dashboard/TaskStatusDonut', () => ({
  TaskStatusDonut: () => <div data-testid="task-status-donut">TaskStatusDonut</div>,
}))

vi.mock('@/components/dashboard/PriorityDonut', () => ({
  PriorityDonut: () => <div data-testid="priority-donut">PriorityDonut</div>,
}))

vi.mock('@/components/dashboard/ProjectComparisonChart', () => ({
  ProjectComparisonChart: () => (
    <div data-testid="project-comparison-chart">ProjectComparisonChart</div>
  ),
}))

vi.mock('@/components/dashboard/MilestoneProgressList', () => ({
  MilestoneProgressList: () => (
    <div data-testid="milestone-progress-list">MilestoneProgressList</div>
  ),
}))

describe('ChartsGrid', () => {
  beforeEach(() => {
    cleanup()
  })

  it('renders 2x2 grid of chart components', () => {
    render(<ChartsGrid />)

    const grid = document.querySelector('[class*="grid-cols-1"]')
    expect(grid).toBeInTheDocument()
    expect(grid).toHaveClass('md:grid-cols-2')
    expect(grid).toHaveClass('gap-6')
  })

  it('renders TaskStatusDonut, PriorityDonut, ProjectComparisonChart, and MilestoneProgressList', () => {
    render(<ChartsGrid />)

    expect(screen.getByTestId('task-status-donut')).toBeInTheDocument()
    expect(screen.getByTestId('priority-donut')).toBeInTheDocument()
    expect(screen.getByTestId('project-comparison-chart')).toBeInTheDocument()
    expect(screen.getByTestId('milestone-progress-list')).toBeInTheDocument()
  })

  it('renders charts in correct order per D-09', () => {
    const { container } = render(<ChartsGrid />)

    const grid = container.querySelector('[class*="grid"]')
    const children = grid?.children

    expect(children).toHaveLength(4)
    expect(children?.[0]).toContainElement(screen.getByTestId('task-status-donut'))
    expect(children?.[1]).toContainElement(screen.getByTestId('priority-donut'))
    expect(children?.[2]).toContainElement(screen.getByTestId('project-comparison-chart'))
    expect(children?.[3]).toContainElement(screen.getByTestId('milestone-progress-list'))
  })

  it('applies responsive layout classes for mobile stacking', () => {
    render(<ChartsGrid />)

    const grid = document.querySelector('[class*="grid-cols-1"]')

    expect(grid).toHaveClass('grid-cols-1')
    expect(grid).toHaveClass('md:grid-cols-2')
  })
})
