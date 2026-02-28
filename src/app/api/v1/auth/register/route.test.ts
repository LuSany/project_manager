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
      role: 'EMPLOYEE',
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
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      status: 'PENDING',
      role: 'EMPLOYEE',
    })
    // 验证 prisma.user.create 被调用（bcrypt 哈希每次结果不同，只验证调用）
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'test@example.com',
          name: 'Test User',
          phone: null,
          status: 'PENDING',
          role: 'EMPLOYEE',
          // passwordHash 由 bcrypt 生成，每次结果不同，不验证具体值
          passwordHash: expect.any(String),
        }),
      })
    )
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
  })

  it('应该拒绝无效密码', async () => {
    const request = new Request('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: '123', // 密码太短
        name: 'Test User',
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })
})
