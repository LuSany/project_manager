import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonTable,
  SkeletonMetric,
  SkeletonRiskOverview,
} from '@/components/ui/skeleton'

describe('Skeleton Components', () => {
  describe('Skeleton', () => {
    it('renders with default variant', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('bg-muted', 'rounded-md', 'animate-pulse')
    })

    it('renders with circular variant', () => {
      const { container } = render(<Skeleton variant="circular" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('rounded-full')
    })

    it('renders with text variant', () => {
      const { container } = render(<Skeleton variant="text" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('rounded', 'h-4')
    })

    it('renders with rectangular variant', () => {
      const { container } = render(<Skeleton variant="rectangular" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('rounded-lg')
    })

    it('applies pulse animation by default', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('animate-pulse')
    })

    it('applies wave animation when specified', () => {
      const { container } = render(<Skeleton animation="wave" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('animate-shimmer')
    })

    it('renders without animation when specified', () => {
      const { container } = render(<Skeleton animation="none" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).not.toHaveClass('animate-pulse')
      expect(skeleton).not.toHaveClass('animate-shimmer')
    })

    it('applies custom width and height', () => {
      const { container } = render(<Skeleton width={100} height={50} />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveStyle({ width: '100px', height: '50px' })
    })

    it('applies custom className', () => {
      const { container } = render(<Skeleton className="custom-class" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('custom-class')
    })
  })

  describe('SkeletonCard', () => {
    it('renders card skeleton structure', () => {
      const { container } = render(<SkeletonCard />)
      expect(container.querySelector('.space-y-3')).toBeInTheDocument()
      expect(container.querySelectorAll('.bg-muted')).toHaveLength(3)
    })

    it('applies custom className', () => {
      const { container } = render(<SkeletonCard className="test-class" />)
      expect(container.firstChild).toHaveClass('test-class')
    })
  })

  describe('SkeletonList', () => {
    it('renders default 3 list items', () => {
      const { container } = render(<SkeletonList />)
      const items = container.querySelectorAll('.flex.items-center.gap-3')
      expect(items).toHaveLength(3)
    })

    it('renders specified count of items', () => {
      const { container } = render(<SkeletonList count={5} />)
      const items = container.querySelectorAll('.flex.items-center.gap-3')
      expect(items).toHaveLength(5)
    })

    it('renders circular avatar placeholder', () => {
      const { container } = render(<SkeletonList />)
      const circles = container.querySelectorAll('.rounded-full')
      expect(circles.length).toBeGreaterThan(0)
    })
  })

  describe('SkeletonTable', () => {
    it('renders table with default rows and cols', () => {
      const { container } = render(<SkeletonTable />)
      const rows = container.querySelectorAll('.flex.gap-4.border-t')
      expect(rows).toHaveLength(5)
    })

    it('renders table with custom rows and cols', () => {
      const { container } = render(<SkeletonTable rows={3} cols={6} />)
      const headerCells = container.querySelectorAll('.bg-muted\\/50 .h-4')
      expect(headerCells).toHaveLength(6)
      const rows = container.querySelectorAll('.flex.gap-4.border-t')
      expect(rows).toHaveLength(3)
    })
  })

  describe('SkeletonMetric', () => {
    it('renders metric card structure', () => {
      const { container } = render(<SkeletonMetric />)
      expect(container.querySelector('.rounded-xl.border')).toBeInTheDocument()
      expect(container.querySelector('.rounded-full')).toBeInTheDocument()
    })

    it('renders title, value, and description placeholders', () => {
      const { container } = render(<SkeletonMetric />)
      const skeletons = container.querySelectorAll('.bg-muted')
      expect(skeletons.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('SkeletonRiskOverview', () => {
    it('renders risk overview structure', () => {
      const { container } = render(<SkeletonRiskOverview />)
      expect(container.querySelector('.grid.grid-cols-4')).toBeInTheDocument()
      expect(container.querySelector('.grid.grid-cols-5')).toBeInTheDocument()
    })
  })
})
