import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../../src/lib/prisma';

// 简化测试数据创建
async function createTestUser(data: Partial<any>) {
  return prisma.user.create({
    data: {
      email: data.email || `test-${Date.now()}-${Math.random()}@test.com`,
      passwordHash: 'hashed-password',
      name: data.name || 'Test User',
      role: data.role || 'EMPLOYEE',
      status: data.status || 'ACTIVE',
    },
  });
}

// 模拟认证请求头
function createAuthenticatedRequest(userId: string) {
  return {
    'cookie': `user-id=${userId}`,
  };
}

describe('Notifications API', () => {
  let testUser: any;

  beforeAll(async () => {
    testUser = await createTestUser({ email: `notifications-test-${Date.now()}@test.com` });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
  });

  describe('GET /api/v1/notifications', () => {
    it('用户应能获取自己的通知列表', async () => {
      // 创建测试通知
      await prisma.notification.create({
        data: {
          userId: testUser.id,
          type: 'TASK_ASSIGNED',
          title: '测试通知',
          content: '这是一条测试通知',
        },
      });

      const response = await fetch('http://localhost:3000/api/v1/notifications', {
        headers: createAuthenticatedRequest(testUser.id),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe('Notification Preferences', () => {
    it('用户应能获取通知偏好', async () => {
      const response = await fetch('http://localhost:3000/api/v1/notifications/preferences', {
        headers: createAuthenticatedRequest(testUser.id),
      });

      expect(response.status).toBe(200);
    });
  });
});
