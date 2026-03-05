import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../../src/lib/prisma';

// 简化测试数据创建
async function createTestUser(data: Partial<any>) {
  return prisma.user.create({
    data: {
      email: data.email || `test-${Date.now()}@test.com`,
      passwordHash: 'hashed-password',
      name: data.name || 'Test User',
      role: data.role || 'EMPLOYEE',
      status: data.status || 'PENDING',
    },
  });
}

// 模拟管理员请求头
function createAdminRequest(userId: string) {
  return {
    'cookie': `user-id=${userId}`,
  };
}

// 模拟认证请求头
function createAuthenticatedRequest(userId: string) {
  return {
    'cookie': `user-id=${userId}`,
  };
}

describe('Admin Users API', () => {
  let adminUser: any;
  let regularUser: any;

  beforeAll(async () => {
    // 创建管理员用户
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        passwordHash: 'hashed-password',
        name: 'Admin User',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // 创建普通用户
    regularUser = await prisma.user.create({
      data: {
        email: 'user@test.com',
        passwordHash: 'hashed-password',
        name: 'Regular User',
        role: 'EMPLOYEE',
        status: 'PENDING',
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ['admin@test.com', 'user@test.com'] } },
    });
  });

  describe('GET /api/v1/admin/users', () => {
    it('管理员应能获取用户列表', async () => {
      const response = await fetch('http://localhost:3000/api/v1/admin/users', {
        headers: createAdminRequest(adminUser.id),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('非管理员应被拒绝访问', async () => {
      const response = await fetch('http://localhost:3000/api/v1/admin/users', {
        headers: createAuthenticatedRequest(regularUser.id),
      });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/v1/admin/users/[id]/status', () => {
    it('管理员应能更新用户状态', async () => {
      const testUser = await createTestUser({
        email: 'test-status@test.com',
        status: 'PENDING',
      });

      const response = await fetch(`http://localhost:3000/api/v1/admin/users/${testUser.id}/status`, {
        method: 'PUT',
        headers: createAdminRequest(adminUser.id),
        body: JSON.stringify({ status: 'ACTIVE' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('ACTIVE');

      // 清理
      await prisma.user.delete({ where: { id: testUser.id } });
    });

    it('应拒绝无效的状态值', async () => {
      const testUser = await createTestUser({
        email: 'test-invalid@test.com',
        status: 'PENDING',
      });

      const response = await fetch(`http://localhost:3000/api/v1/admin/users/${testUser.id}/status`, {
        method: 'PUT',
        headers: createAdminRequest(adminUser.id),
        body: JSON.stringify({ status: 'INVALID_STATUS' }),
      });

      expect(response.status).toBe(400);

      // 清理
      await prisma.user.delete({ where: { id: testUser.id } });
    });
  });

  describe('PUT /api/v1/admin/users/[id]/role', () => {
    it('管理员应能更新用户角色', async () => {
      const testUser = await createTestUser({
        email: 'test-role@test.com',
        role: 'EMPLOYEE',
      });

      const response = await fetch(`http://localhost:3000/api/v1/admin/users/${testUser.id}/role`, {
        method: 'PUT',
        headers: createAdminRequest(adminUser.id),
        body: JSON.stringify({ role: 'PROJECT_ADMIN' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.role).toBe('PROJECT_ADMIN');

      // 清理
      await prisma.user.delete({ where: { id: testUser.id } });
    });

    it('管理员不能降级自己的管理员角色', async () => {
      const response = await fetch(`http://localhost:3000/api/v1/admin/users/${adminUser.id}/role`, {
        method: 'PUT',
        headers: createAdminRequest(adminUser.id),
        body: JSON.stringify({ role: 'EMPLOYEE' }),
      });

      expect(response.status).toBe(400);
    });
  });
});
