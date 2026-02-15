import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('API 集成测试', () => {
  beforeAll(() => {
    // 设置测试环境变量
    process.env.DATABASE_URL = 'file:./test.db';
  });

  afterAll(() => {
    // 清理测试环境
  });

  describe('任务管理 API', () => {
    it('应该能够创建任务', async () => {
      const response = await fetch('http://localhost:3000/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '测试任务',
          projectId: 'test-project-id',
          priority: 'HIGH'
        })
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
    });

    it('应该能够更新任务状态', async () => {
      const response = await fetch('http://localhost:3000/api/v1/tasks/test-task-id/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'IN_PROGRESS'
        })
      });

      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('项目管理 API', () => {
    it('应该能够创建项目', async () => {
      const response = await fetch('http://localhost:3000/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'API测试项目',
          description: '用于API集成测试的项目'
        })
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
    });

    it('应该能够获取项目列表', async () => {
      const response = await fetch('http://localhost:3000/api/v1/projects');
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });
});
