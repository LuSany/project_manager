import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockAdminUser, mockProjectFactory } from './conftest'

describe('Admin Projects API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.todo('GET /api/v1/admin/projects returns project list')
  it.todo('POST /api/v1/admin/projects creates a project')
  it.todo('PUT /api/v1/admin/projects/:id updates project')
  it.todo('DELETE /api/v1/admin/projects/:id deletes project')

  describe('Member Management', () => {
    it.todo('POST /api/v1/admin/projects/:id/members adds member')
    it.todo('DELETE /api/v1/admin/projects/:id/members removes member')
  })

  describe('Project Status', () => {
    it.todo('PATCH /api/v1/admin/projects/:id/archive archives project')
    it.todo('PATCH /api/v1/admin/projects/:id/restore restores archived project')
  })
})
