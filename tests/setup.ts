import { beforeAll, afterEach } from "vitest/globals";
import { prisma } from "../src/lib/prisma";

beforeAll(async () => {
  // 测试数据库初始化
  process.env.DATABASE_URL = "file:./test.db";
  await prisma.$connect();
});

afterAll(async () => {
  // 清理测试数据库
  await prisma.$disconnect();
});
