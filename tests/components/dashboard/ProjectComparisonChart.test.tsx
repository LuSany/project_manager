import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectComparisonChart } from '@/components/dashboard/ProjectComparisonChart'

describe('ProjectComparisonChart', () => {
  it.todo('renders horizontal bar chart for project completion rates comparison')
  it.todo(
    'fetches from /api/v1/dashboard/project-comparison and returns completion rates per project'
  )
  it.todo('renders loading and empty states correctly')
  it.todo('renders "No projects found" message when no project data available')
})
