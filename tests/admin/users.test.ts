import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockAdminUser, mockUserFactory } from './conftest'

describe('Admin Users API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.todo('GET /api/v1/admin/users returns user list')
  it.todo('POST /api/v1/admin/users creates a new user')
  it.todo('PUT /api/v1/admin/users/:id updates user')
  it.todo('DELETE /api/v1/admin/users/:id deletes user')

  describe('Bulk Operations', () => {
    it.todo('POST /api/v1/admin/users/import imports CSV users')
    it.todo('PATCH /api/v1/admin/users/bulk/status bulk updates status')
    it.todo('PATCH /api/v1/admin/users/bulk/role bulk updates role')
  })

  describe('Access Control', () => {
    it.todo('Non-admin user gets 403')
    it.todo('Unauthenticated user gets 401')
  })

  describe('Validation', () => {
    it.todo('POST with invalid email returns 400')
    it.todo('POST with duplicate email returns 409')
    it.todo('PUT with invalid role returns 400')
  })
})
