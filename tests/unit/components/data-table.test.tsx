import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'

interface TestUser {
  id: string
  name: string
  email: string
}

const columns: ColumnDef<TestUser>[] = [
  {
    accessorKey: 'name',
    header: '姓名',
  },
  {
    accessorKey: 'email',
    header: '邮箱',
  },
]

const mockData: TestUser[] = [
  { id: '1', name: '张三', email: 'zhang@example.com' },
  { id: '2', name: '李四', email: 'li@example.com' },
  { id: '3', name: '王五', email: 'wang@example.com' },
]

describe('DataTable', () => {
  it('renders table with data', () => {
    render(<DataTable columns={columns} data={mockData} />)

    expect(screen.getByText('姓名')).toBeInTheDocument()
    expect(screen.getByText('邮箱')).toBeInTheDocument()
    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText('李四')).toBeInTheDocument()
  })

  it('renders empty state when no data', () => {
    render(<DataTable columns={columns} data={[]} />)

    expect(screen.getByText('暂无数据')).toBeInTheDocument()
  })

  it('renders pagination controls', () => {
    render(<DataTable columns={columns} data={mockData} />)

    const prevButtons = screen.getAllByText('上一页')
    const nextButtons = screen.getAllByText('下一页')
    expect(prevButtons.length).toBeGreaterThan(0)
    expect(nextButtons.length).toBeGreaterThan(0)
  })

  it('shows row selection info', () => {
    render(<DataTable columns={columns} data={mockData} />)

    const selectionInfo = screen.getAllByText(/已选择/)
    expect(selectionInfo.length).toBeGreaterThan(0)
  })

  it('disables previous page button on first page', () => {
    render(<DataTable columns={columns} data={mockData} />)

    const prevButtons = screen.getAllByText('上一页')
    expect(prevButtons[0]).toBeDisabled()
  })

  it('renders table rows for each data item', () => {
    const { container } = render(<DataTable columns={columns} data={mockData} />)

    const rows = container.querySelectorAll('tr')
    expect(rows.length).toBeGreaterThan(1)
  })
})
