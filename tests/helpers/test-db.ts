/**
 * 测试数据库隔离工具
 * 
 * 提供事务级别的数据库隔离，确保测试间数据不污染
 * 使用方式：在测试文件中调用 setupTestDatabase()
 * 
 * @example
 * import { setupTestDatabase, testPrisma } from './test-db'
 * 
 * describe('My Test', () => {
 *   setupTestDatabase()
 *   
 *   it('should work', async () => {
 *     const user = await testPrisma.user.create({...})
 *   })
 * })
 */

import { PrismaClient } from '@prisma/client'
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

// 创建独立的测试 Prisma 客户端
const testPrismaClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.TEST_DATABASE_URL
    }
  },
  log: process.env.DEBUG_TESTS ? ['query', 'error', 'warn'] : ['error']
})

/**
 * 设置测试数据库隔离
 * 
 * 使用事务回滚机制：
 * - beforeEach: 开启事务
 * - afterEach: 回滚事务
 * 
 * 这样每个测试都在独立的事务中运行，测试结束后自动回滚，
 * 不会污染数据库，也不需要手动清理数据
 */
export function setupTestDatabase() {
  beforeAll(async () => {
    await testPrismaClient.$connect()
  })

  beforeEach(async () => {
    // 开启事务
    await testPrismaClient.$executeRaw`BEGIN`
  })

  afterEach(async () => {
    // 回滚事务，确保数据隔离
    await testPrismaClient.$executeRaw`ROLLBACK`
  })

  afterAll(async () => {
    await testPrismaClient.$disconnect()
  })
}

/**
 * 设置测试数据库（使用保存点，支持嵌套事务）
 * 
 * 适用于需要在测试中测试事务行为的场景
 */
export function setupTestDatabaseWithSavepoint() {
  let savepointId = 0

  beforeAll(async () => {
    await testPrismaClient.$connect()
  })

  beforeEach(async () => {
    await testPrismaClient.$executeRaw`BEGIN`
    savepointId = 0
  })

  afterEach(async () => {
    await testPrismaClient.$executeRaw`ROLLBACK`
  })

  afterAll(async () => {
    await testPrismaClient.$disconnect()
  })

  return {
    createSavepoint: async () => {
      const id = ++savepointId
      await testPrismaClient.$executeRawUnsafe(`SAVEPOINT sp_${id}`)
      return id
    },
    rollbackToSavepoint: async (id: number) => {
      await testPrismaClient.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT sp_${id}`)
    },
    releaseSavepoint: async (id: number) => {
      await testPrismaClient.$executeRawUnsafe(`RELEASE SAVEPOINT sp_${id}`)
    }
  }
}

/**
 * 清理所有测试数据
 * 
 * 按照外键依赖关系的逆序删除，确保不会出现外键约束错误
 * 仅在需要完全清理数据库时使用（如 CI 环境初始化）
 */
export async function cleanupAllData(prisma: PrismaClient) {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter(name => name !== '_prisma_migrations')
    .map(name => `"public"."${name}"`)
    .join(', ')

  if (tables.length > 0) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
  }
}

/**
 * 重置自增序列
 * 
 * 清理数据后重置自增 ID，确保测试数据的 ID 从 1 开始
 */
export async function resetSequences(prisma: PrismaClient) {
  const sequences = await prisma.$queryRaw<
    Array<{ sequencename: string }>
  >`SELECT sequencename FROM pg_sequences WHERE schemaname='public'`

  for (const { sequencename } of sequences) {
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "${sequencename}" RESTART WITH 1;`)
  }
}

// 导出测试用的 Prisma 客户端
export { testPrismaClient as testPrisma }

// 类型导出
export type TestPrismaClient = typeof testPrismaClient