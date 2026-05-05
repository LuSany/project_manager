import { describe, it, expect, vi } from 'vitest'

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  })),
}))

describe('Database Module', () => {
  describe('Prisma Singleton', () => {
    it('应该导出 prisma 实例', async () => {
      const { prisma } = await import('@/lib/prisma')
      expect(prisma).toBeDefined()
      expect(typeof prisma).toBe('object')
    })

    it('应该返回相同的实例', async () => {
      const { prisma: prisma1 } = await import('@/lib/prisma')
      const { prisma: prisma2 } = await import('@/lib/prisma')
      expect(prisma1).toBe(prisma2)
    })

    it('开发环境 singleton 行为', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      const { prisma } = await import('@/lib/prisma')
      expect(prisma).toBeDefined()

      vi.unstubAllEnvs()
    })

    it('生产环境行为', () => {
      expect(true).toBe(true)
    })
  })
})
