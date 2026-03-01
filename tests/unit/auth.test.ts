import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/api/response', () => ({
  error: vi.fn((code, message, details, status) => ({
    success: false,
    error: { code, message, details, status },
  })),
}))

import { getAuthenticatedUser, requireAuth } from '@/lib/auth'

describe('Auth Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAuthenticatedUser', () => {
    it('should return null when no user-id cookie', async () => {
      const request = {
        cookies: {
          get: vi.fn().mockReturnValue(undefined),
        },
      } as any

      const result = await getAuthenticatedUser(request)

      expect(result).toBeNull()
    })

    it('should return null when user not found', async () => {
      const { prisma } = await import('@/lib/prisma')
      ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

      const request = {
        cookies: {
          get: vi.fn().mockReturnValue({ value: 'user-123' }),
        },
      } as any

      const result = await getAuthenticatedUser(request)

      expect(result).toBeNull()
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-123' } })
    })

    it('should return user when found', async () => {
      const { prisma } = await import('@/lib/prisma')
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser as any)

      const request = {
        cookies: {
          get: vi.fn().mockReturnValue({ value: 'user-123' }),
        },
      } as any

      const result = await getAuthenticatedUser(request)

      expect(result).toEqual(mockUser)
    })
  })

  describe('requireAuth', () => {
    it('should return error when no user-id cookie', async () => {
      const request = {
        cookies: {
          get: vi.fn().mockReturnValue(undefined),
        },
      } as any

      const result = await requireAuth(request)

      expect(result).toHaveProperty('success', false)
    })

    it('should return error when user not found', async () => {
      const { prisma } = await import('@/lib/prisma')
      ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

      const request = {
        cookies: {
          get: vi.fn().mockReturnValue({ value: 'user-123' }),
        },
      } as any

      const result = await requireAuth(request)

      expect(result).toHaveProperty('success', false)
    })

    it('should return user when authenticated', async () => {
      const { prisma } = await import('@/lib/prisma')
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser as any)

      const request = {
        cookies: {
          get: vi.fn().mockReturnValue({ value: 'user-123' }),
        },
      } as any

      const result = await requireAuth(request)

      expect(result).toEqual(mockUser)
    })
  })
})
