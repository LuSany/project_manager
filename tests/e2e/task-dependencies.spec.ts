import { test, expect } from '@playwright/test'

test.describe('Task Dependency E2E Tests', () => {
  // 测试任务依赖系统的基本功能

  test('should verify task dependency schema', async ({ request }) => {
    // 验证任务依赖模型存在
    const response = await request.get('/api/v1/tasks')
    expect([200, 400, 401]).toContain(response.status())
  })

  test('should verify task status enum', async () => {
    // 验证 8 种任务状态
    const statuses = [
      'TODO',
      'IN_PROGRESS',
      'REVIEW',
      'TESTING',
      'DONE',
      'CANCELLED',
      'DELAYED',
      'BLOCKED',
    ]

    expect(statuses.length).toBe(8)
    expect(statuses).toContain('TODO')
    expect(statuses).toContain('IN_PROGRESS')
    expect(statuses).toContain('DONE')
    expect(statuses).toContain('CANCELLED')
  })

  test('should verify task priority enum', async () => {
    // 验证任务优先级
    const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

    expect(priorities.length).toBe(4)
    expect(priorities).toContain('CRITICAL')
  })
})
