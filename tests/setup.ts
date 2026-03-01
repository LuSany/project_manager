import { beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";

beforeAll(async () => {
  // 使用 .env.test 中的 DATABASE_URL (PostgreSQL)
  await prisma.$connect();
});

afterAll(async () => {
  // 清理测试数据库
  await prisma.$disconnect();
});
