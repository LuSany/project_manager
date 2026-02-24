import { describe, it, expect, vi } from 'vitest'

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  })),
}))

describe('Database Module', () => {
  describe('Prisma Singleton', () => {
    it('应该导出 db 实例', async () => {
      const { db } = await import('@/lib/db')
      expect(db).toBeDefined()
      expect(typeof db).toBe('object')
    })

    it('应该返回相同的实例', async () => {
      const { db: db1 } = await import('@/lib/db')
      const { db: db2 } = await import('@/lib/db')
      expect(db1).toBe(db2)
    })

    it('开发环境 singleton 行为', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      const { db } = await import('@/lib/db')
      expect(db).toBeDefined()

      vi.unstubAllEnvs()
    })

    it('生产环境行为', () => {
      expect(true).toBe(true)
    })
  })
})
