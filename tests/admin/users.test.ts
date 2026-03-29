import { describe, it } from 'vitest'

describe('Admin Users API', () => {
  it.todo('GET /api/v1/admin/users returns user list')
  it.todo('POST /api/v1/admin/users creates a new user')
  it.todo('PUT /api/v1/admin/users/:id updates user')
  it.todo('DELETE /api/v1/admin/users/:id deletes user')
  it.todo('POST /api/v1/admin/users/import imports CSV users')
  it.todo('PATCH /api/v1/admin/users/bulk/status bulk updates status')
  it.todo('PATCH /api/v1/admin/users/bulk/role bulk updates role')
  it.todo('Non-admin user gets 403')
})
