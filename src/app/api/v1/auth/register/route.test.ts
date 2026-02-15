import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { prisma } from '@/lib/prisma'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

describe('POST /api/v1/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该成功注册新用户', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      status: 'PENDING',
      role: 'REGULAR',
    }

    ;(prisma.user.findUnique as any).mockResolvedValue(null)
    ;(prisma.user.create as any).mockResolvedValue(mockUser)

    const request = new Request('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      status: 'PENDING',
    })
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        passwordHash: 'HASH_password123',
        name: 'Test User',
        phone: null,
        status: 'PENDING',
        role: 'REGULAR',
      },
    })
  })

  it('应该拒绝重复的邮箱', async () => {
    const existingUser = {
      id: 'existing-user',
      email: 'test@example.com',
    }

    ;(prisma.user.findUnique as any).mockResolvedValue(existingUser)

    const request = new Request('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.success).toBe(false)
    expect(data.error).toEqual({
      code: 'EMAIL_EXISTS',
      message: '该邮箱已被注册',
    })
  })

  it('应该验证邮箱格式', async () => {
    const request = new Request('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
    expect(data.error.message).toBe('请求数据验证失败')
  })
})
