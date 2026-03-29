import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MilestoneProgressList } from '@/components/dashboard/MilestoneProgressList'

describe('MilestoneProgressList', () => {
  it.todo('renders milestone progress items with status colors and progress bars')
  it.todo(
    'fetches from /api/v1/dashboard/progress (without projectId) and returns global milestones'
  )
  it.todo('renders loading and empty states correctly')
  it.todo('formats due date correctly as MM/dd or yyyy')
})
