import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TaskStatusDonut } from '@/components/dashboard/TaskStatusDonut'

describe('TaskStatusDonut', () => {
  it.todo('renders task status donut with correct slice colors')
  it.todo('renders task status donut with value-based Cell colors')
  it.todo('renders center label with total count')
  it.todo(
    'fetches from /api/v1/dashboard/stats and returns taskStatusDistribution and priorityDistribution'
  )
})
