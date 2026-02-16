import { describe, it, expect } from 'vitest'
import { z } from 'zod'

describe('API响应测试', () => {
  const successResponseSchema = z.object({
    success: z.literal(true),
    data: z.any(),
    message: z.string().optional(),
  })

  const errorResponseSchema = z.object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
    }),
  })

  describe('成功响应', () => {
    it('应该符合成功响应Schema', () => {
      const response = {
        success: true,
        data: { id: '1', name: '测试' },
        message: '操作成功',
      }
      const result = successResponseSchema.safeParse(response)
      expect(result.success).toBe(true)
    })

    it('应该支持无message的成功响应', () => {
      const response = {
        success: true,
        data: { id: '1' },
      }
      const result = successResponseSchema.safeParse(response)
      expect(result.success).toBe(true)
    })
  })

  describe('错误响应', () => {
    it('应该符合错误响应Schema', () => {
      const response = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '数据验证失败',
          details: { field: 'email' },
        },
      }
      const result = errorResponseSchema.safeParse(response)
      expect(result.success).toBe(true)
    })

    it('应该支持无details的错误响应', () => {
      const response = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '资源不存在',
        },
      }
      const result = errorResponseSchema.safeParse(response)
      expect(result.success).toBe(true)
    })
  })
})

describe('业务逻辑测试', () => {
  describe('任务状态转换', () => {
    const validTransitions: Record<string, string[]> = {
      TODO: ['IN_PROGRESS'],
      IN_PROGRESS: ['REVIEW', 'TODO'],
      REVIEW: ['TESTING', 'IN_PROGRESS'],
      TESTING: ['DONE', 'REVIEW'],
      DONE: [],
    }

    function canTransition(from: string, to: string): boolean {
      return validTransitions[from]?.includes(to) ?? false
    }

    it('应该允许 TODO -> IN_PROGRESS', () => {
      expect(canTransition('TODO', 'IN_PROGRESS')).toBe(true)
    })

    it('应该允许 IN_PROGRESS -> REVIEW', () => {
      expect(canTransition('IN_PROGRESS', 'REVIEW')).toBe(true)
    })

    it('应该允许 TESTING -> DONE', () => {
      expect(canTransition('TESTING', 'DONE')).toBe(true)
    })

    it('不应该允许 TODO -> DONE', () => {
      expect(canTransition('TODO', 'DONE')).toBe(false)
    })

    it('不应该允许 DONE -> TODO', () => {
      expect(canTransition('DONE', 'TODO')).toBe(false)
    })
  })

  describe('任务进度计算', () => {
    function calculateProgress(subtasks: Array<{ completed: boolean }>): number {
      if (subtasks.length === 0) return 0
      const completed = subtasks.filter((s) => s.completed).length
      return Math.round((completed / subtasks.length) * 100)
    }

    it('无子任务应返回0', () => {
      expect(calculateProgress([])).toBe(0)
    })

    it('应该正确计算进度', () => {
      const subtasks = [
        { completed: true },
        { completed: true },
        { completed: false },
        { completed: false },
      ]
      expect(calculateProgress(subtasks)).toBe(50)
    })

    it('全部完成应返回100', () => {
      const subtasks = [{ completed: true }, { completed: true }]
      expect(calculateProgress(subtasks)).toBe(100)
    })
  })

  describe('项目成员角色权限', () => {
    type Role = 'OWNER' | 'ADMIN' | 'MEMBER'
    type Permission = 'read' | 'write' | 'delete' | 'manage'

    const rolePermissions: Record<Role, Permission[]> = {
      OWNER: ['read', 'write', 'delete', 'manage'],
      ADMIN: ['read', 'write', 'manage'],
      MEMBER: ['read', 'write'],
    }

    function hasPermission(role: Role, permission: Permission): boolean {
      return rolePermissions[role]?.includes(permission) ?? false
    }

    it('OWNER应有所有权限', () => {
      expect(hasPermission('OWNER', 'read')).toBe(true)
      expect(hasPermission('OWNER', 'write')).toBe(true)
      expect(hasPermission('OWNER', 'delete')).toBe(true)
      expect(hasPermission('OWNER', 'manage')).toBe(true)
    })

    it('MEMBER应只有读写权限', () => {
      expect(hasPermission('MEMBER', 'read')).toBe(true)
      expect(hasPermission('MEMBER', 'write')).toBe(true)
      expect(hasPermission('MEMBER', 'delete')).toBe(false)
      expect(hasPermission('MEMBER', 'manage')).toBe(false)
    })
  })

  describe('日期计算', () => {
    function isOverdue(dueDate: string): boolean {
      return new Date(dueDate) < new Date()
    }

    function daysUntil(date: string): number {
      const diff = new Date(date).getTime() - Date.now()
      return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    it('过去的日期应该标记为逾期', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      expect(isOverdue(pastDate)).toBe(true)
    })

    it('未来的日期应该标记为未逾期', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      expect(isOverdue(futureDate)).toBe(false)
    })

    it('应该计算正确的天数差', () => {
      const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      expect(daysUntil(futureDate)).toBeGreaterThanOrEqual(2)
    })
  })
})
