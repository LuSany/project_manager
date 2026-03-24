import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Breadcrumb } from '@/components/ui/breadcrumb'

describe('Breadcrumb', () => {
  it('renders home link', () => {
    const { unmount } = render(<Breadcrumb items={[]} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/dashboard')
    unmount()
  })

  it('renders home icon', () => {
    const { container, unmount } = render(<Breadcrumb items={[]} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
    unmount()
  })

  it('renders single breadcrumb item', () => {
    const { unmount } = render(<Breadcrumb items={[{ label: '项目' }]} />)
    expect(screen.getByText('项目')).toBeInTheDocument()
    unmount()
  })

  it('renders multiple breadcrumb items', () => {
    const { unmount } = render(
      <Breadcrumb items={[{ label: '项目', href: '/projects' }, { label: '新建' }]} />
    )
    expect(screen.getByText('项目')).toBeInTheDocument()
    expect(screen.getByText('新建')).toBeInTheDocument()
    unmount()
  })

  it('renders link for non-last item with href', () => {
    const { unmount } = render(
      <Breadcrumb items={[{ label: '项目', href: '/projects' }, { label: '新建' }]} />
    )
    const links = screen.getAllByRole('link')
    const projectLink = links.find((link) => link.textContent?.includes('项目'))
    expect(projectLink).toHaveAttribute('href', '/projects')
    unmount()
  })

  it('has multiple links for nested paths', () => {
    const { unmount } = render(
      <Breadcrumb items={[{ label: '项目', href: '/projects' }, { label: '新建' }]} />
    )
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(1)
    unmount()
  })

  it('applies custom className', () => {
    const { container, unmount } = render(<Breadcrumb items={[]} className="custom-class" />)
    expect(container.querySelector('nav')).toHaveClass('custom-class')
    unmount()
  })
})
