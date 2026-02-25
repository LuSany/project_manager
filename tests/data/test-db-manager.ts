// 测试数据库管理器
// 用于测试环境的数据库 CRUD 操作

import { PrismaClient } from '@prisma/client'

export class TestDatabaseManager {
  private prisma: PrismaClient

  constructor(databaseUrl: string) {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    })
  }

  // 重置数据库
  async reset() {
    // 清空测试数据
  }

  // 插入 fixture 数据
  async seedFromFixture(fixturePath: string) {
    // 实现 fixture 数据加载和插入
  }

  // 清理所有测试数据
  async cleanup() {
    // 实现数据清理逻辑
  }

  // 关闭连接
  async close() {
    await this.prisma.$disconnect()
  }
}
