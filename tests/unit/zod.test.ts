import { describe, it, expect } from 'vitest'
import { z } from 'zod'

describe('Zod验证测试', () => {
  describe('用户注册Schema', () => {
    const registerSchema = z.object({
      email: z.string().email('邮箱格式不正确'),
      password: z.string().min(8, '密码至少8位'),
      name: z.string().min(1, '用户名不能为空'),
    })

    it('应该验证有效数据', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        name: '测试用户',
      })
      expect(result.success).toBe(true)
    })

    it('应该拒绝无效邮箱', () => {
      const result = registerSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
        name: '测试用户',
      })
      expect(result.success).toBe(false)
    })

    it('应该拒绝短密码', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'short',
        name: '测试用户',
      })
      expect(result.success).toBe(false)
    })

    it('应该拒绝空用户名', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        name: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('登录Schema', () => {
    const loginSchema = z.object({
      email: z.string().email('邮箱格式不正确'),
      password: z.string().min(1, '密码不能为空'),
    })

    it('应该验证有效登录数据', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result.success).toBe(true)
    })

    it('应该拒绝无效邮箱格式', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('任务创建Schema', () => {
    const taskSchema = z.object({
      title: z.string().min(1, '任务标题不能为空'),
      description: z.string().optional(),
      status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'TESTING', 'DONE']).optional(),
      progress: z.number().min(0).max(100).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
      projectId: z.string().min(1, '项目ID不能为空'),
      assigneeIds: z.array(z.string()).optional(),
    })

    it('应该验证完整任务数据', () => {
      const result = taskSchema.safeParse({
        title: '测试任务',
        description: '描述',
        status: 'TODO',
        progress: 0,
        priority: 'HIGH',
        projectId: 'project-1',
        assigneeIds: ['user-1', 'user-2'],
      })
      expect(result.success).toBe(true)
    })

    it('应该验证最小任务数据', () => {
      const result = taskSchema.safeParse({
        title: '测试任务',
        projectId: 'project-1',
      })
      expect(result.success).toBe(true)
    })

    it('应该拒绝无效状态', () => {
      const result = taskSchema.safeParse({
        title: '测试任务',
        projectId: 'project-1',
        status: 'INVALID',
      })
      expect(result.success).toBe(false)
    })

    it('应该拒绝无效进度', () => {
      const result = taskSchema.safeParse({
        title: '测试任务',
        projectId: 'project-1',
        progress: 150,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('项目创建Schema', () => {
    const projectSchema = z.object({
      name: z.string().min(1, '项目名称不能为空'),
      description: z.string().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    })

    it('应该验证有效项目数据', () => {
      const result = projectSchema.safeParse({
        name: '测试项目',
        description: '项目描述',
      })
      expect(result.success).toBe(true)
    })

    it('应该拒绝空项目名称', () => {
      const result = projectSchema.safeParse({
        name: '',
      })
      expect(result.success).toBe(false)
    })

    it('应该验证日期格式', () => {
      const result = projectSchema.safeParse({
        name: '测试项目',
        startDate: '2024-01-01T00:00:00Z',
      })
      expect(result.success).toBe(true)
    })

    it('应该拒绝无效日期格式', () => {
      const result = projectSchema.safeParse({
        name: '测试项目',
        startDate: 'invalid-date',
      })
      expect(result.success).toBe(false)
    })
  })
})
