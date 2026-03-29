import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriorityDonut } from '@/components/dashboard/PriorityDonut'

describe('PriorityDonut', () => {
  it.todo('renders task status donut with value-based Cell colors')
  it.todo('renders center label with total count')
  it.todo('fetches from /api/v1/dashboard/stats and returns priorityDistribution')
  it.todo('renders priority donut chart for horizontal bars showing completion rate per project')
  it.todo('renders empty state when no data')
})
