// ============================================
// 测试环境设置
// ============================================

import { beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import { cleanupAllData, resetSequences } from "./helpers/test-db";
import "./helpers/assertions"; // 加载自定义断言

// ============================================
// 全局测试环境初始化
// ============================================

beforeAll(async () => {
  // 使用 .env.test 中的 DATABASE_URL (PostgreSQL)
  await prisma.$connect();
  
  // Seed ReviewTypeConfig for review tests
  const reviewTypes = [
    { id: '1', name: 'FEASIBILITY', displayName: '可行性评审' },
    { id: '2', name: 'MILESTONE', displayName: '里程碑评审' },
    { id: '3', name: 'TEST_PLAN', displayName: '测试计划评审' },
    { id: '4', name: 'TEST_REPORT', displayName: '测试报告评审' },
    { id: '5', name: 'TEST_RELEASE', displayName: '发布评审' },
    { id: '6', name: 'REQUIREMENT', displayName: '需求评审' },
    { id: '7', name: 'DESIGN', displayName: '设计评审' },
    { id: '8', name: 'CODE', displayName: '代码评审' },
  ];
  
  for (const rt of reviewTypes) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "ReviewTypeConfig" (id, name, "displayName", "isSystem", "isActive", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, true, true, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      rt.id, rt.name, rt.displayName
    );
  }
}, 30000);

afterAll(async () => {
  // 清理测试数据库
  await prisma.$disconnect();
});

// ============================================
// 导出测试工具（便于测试文件直接使用）
// ============================================

export { testPrisma, setupTestDatabase } from "./helpers/test-db";
export * from "./helpers/test-data-factory";
export { createPrismaMock, mockTestData } from "./mocks/prisma-mock";
export { createMockRequest, createAuthenticatedRequest, createAdminRequest } from "./mocks/request-mock";
