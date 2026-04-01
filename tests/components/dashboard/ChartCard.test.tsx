import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ChartCard } from '@/components/dashboard/ChartCard'
import { PieChart } from 'lucide-react'

describe('ChartCard', () => {
  beforeEach(() => {
    cleanup()
  })

  it('renders a Card with 280px height, header with icon and title', () => {
    render(
      <ChartCard icon={PieChart} title="测试图表标题">
        <div data-testid="chart-content">图表内容</div>
      </ChartCard>
    )

    expect(screen.getByText('测试图表标题')).toBeInTheDocument()
    expect(screen.getByTestId('chart-content')).toBeInTheDocument()

    const card = screen.getByText('测试图表标题').closest('[class*="h-[280px]"]')
    expect(card).toBeInTheDocument()
  })

  it('renders loading state with skeleton', () => {
    render(
      <ChartCard icon={PieChart} title="测试图表" loading={true}>
        <div>图表内容</div>
      </ChartCard>
    )

    const skeleton = document.querySelector('[class*="animate-pulse"]')
    expect(skeleton).toBeInTheDocument()

    expect(screen.queryByText('图表内容')).not.toBeInTheDocument()
  })

  it('renders empty state when empty prop is true', () => {
    render(
      <ChartCard icon={PieChart} title="测试图表" empty={true}>
        <div>图表内容</div>
      </ChartCard>
    )

    expect(screen.getByText('暂无数据')).toBeInTheDocument()
    expect(screen.queryByText('图表内容')).not.toBeInTheDocument()
  })

  it('renders custom empty message when provided', () => {
    render(
      <ChartCard icon={PieChart} title="测试图表" empty={true} emptyMessage="自定义空消息">
        <div>图表内容</div>
      </ChartCard>
    )

    expect(screen.getByText('自定义空消息')).toBeInTheDocument()
  })

  it('renders children in the card content area when data is provided', () => {
    render(
      <ChartCard icon={PieChart} title="测试图表">
        <div data-testid="chart-data">图表数据</div>
        <div data-testid="chart-legend">图例</div>
      </ChartCard>
    )

    expect(screen.getByTestId('chart-data')).toBeInTheDocument()
    expect(screen.getByTestId('chart-legend')).toBeInTheDocument()
    expect(screen.getByText('图表数据')).toBeInTheDocument()
    expect(screen.getByText('图例')).toBeInTheDocument()
  })

  it('applies custom icon color when provided', () => {
    render(
      <ChartCard icon={PieChart} title="测试图表" iconColor="text-red-500">
        <div>内容</div>
      </ChartCard>
    )

    const icon = document.querySelector('[class*="text-red-500"]')
    expect(icon).toBeInTheDocument()
  })
})
