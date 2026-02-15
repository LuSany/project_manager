import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('用户注册和登录流程', () => {
  it('应该能够注册新用户', async () => {
    const response = await fetch('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123456',
        name: '测试用户'
      })
    });

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
  });

  it('应该能够登录', async () => {
    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123456'
      })
    });

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('token');
  });

  it('应该能够创建项目', async () => {
    const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123456'
      })
    });

    const { data: loginData } = await loginResponse.json();
    const token = loginData.data.token;

    const response = await fetch('http://localhost:3000/api/v1/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: '测试项目',
        description: '这是一个测试项目'
      })
    });

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('id');
  });
});
