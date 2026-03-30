import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockAdminUser } from './conftest'

describe('Admin AI Configs API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.todo('GET /api/v1/admin/ai/configs returns config list')
  it.todo('POST /api/v1/admin/ai/configs creates config')
  it.todo('PUT /api/v1/admin/ai/configs/:id updates config')
  it.todo('DELETE /api/v1/admin/ai/configs/:id deletes config')

  describe('Connection Testing', () => {
    it.todo('POST /api/v1/admin/ai/configs/test tests connection')
    it.todo('Test connection returns timeout after 10s')
    it.todo('Invalid API key returns failure')
    it.todo('Valid config returns success with model list')
  })
})
