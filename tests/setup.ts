import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { prisma } from "../src/lib/prisma";

beforeAll(async () => {
  // 测试数据库初始化
  process.env.DATABASE_URL = "file:./prisma/test.db";
  await prisma.$connect();
});

afterAll(async () => {
  // 清理测试数据库
  await prisma.$disconnect();
});

// 每个测试前清空数据（使用事务回滚）
beforeEach(async () => {
  // 开始事务
  await prisma.$executeRaw`BEGIN`;
});

// 每个测试后回滚
afterEach(async () => {
  try {
    await prisma.$executeRaw`ROLLBACK`;
  } catch (error) {
    console.error('事务回滚失败:', error);
  }
});
