import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { POST, GET, GET_WITH_ID, PUT, DELETE } from '@/app/api/v1/review-templates/route'

// Mock prisma module
const mockFindUnique = vi.fn()
const mockFindMany = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockCount = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    reviewTypeConfig: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
    },
    reviewTemplate: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
      findMany: (...args: any[]) => mockFindMany(...args),
      create: (...args: any[]) => mockCreate(...args),
      update: (...args: any[]) => mockUpdate(...args),
      delete: (...args: any[]) => mockDelete(...args),
    },
    review: {
      count: (...args: any[]) => mockCount(...args),
    },
  },
}))

describe('Review Templates API', () => {
  const mockUserId = 'user-1'
  const mockTemplateId = 'template-1'
  const mockTypeId = 'type-1'

  beforeEach(() => {
    vi.clearAllMocks()

    mockFindUnique.mockResolvedValue({
      id: mockTypeId,
      name: 'Code Review',
      displayName: '代码评审',
    })
  })

  describe('POST - 创建评审模板', () => {
    it('应该成功创建评审模板', async () => {
      const mockRequest = {
        json: async () => ({
          typeId: mockTypeId,
          name: 'Code Review Template',
          description: '代码评审模板',
        }),
      } as any,
      user: { id: mockUserId },
      cookies: { get: vi.fn() },
      url: new URL('http://localhost:3000/api/v1/review-templates'),
      }

      mockCreate.mockResolvedValue({
        id: mockTemplateId,
        typeId: mockTypeId,
        name: 'Code Review Template',
        description: '代码评审模板',
        isActive: true,
        createdAt: new Date(),
      })

      const result = await POST(mockRequest as any)

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          typeId: mockTypeId,
          name: 'Code Review Template',
          description: '代码评审模板',
          isActive: true,
        },
      })

      expect(result).toEqual({
        success: true,
        data: {
          id: mockTemplateId,
          typeId: mockTypeId,
          name: 'Code Review Template',
          description: '代码评审模板',
          isActive: true,
          createdAt: expect.any(Date),
        },
      })
    })

    it('应该在评审类型不存在时返回错误', async () => {
      mockFindUnique.mockResolvedValue(null)

      const mockRequest = {
        json: async () => ({
          typeId: mockTypeId,
          name: 'Test Template',
        }),
      } as any,
      user: { id: mockUserId },
      cookies: { get: vi.fn() },
      url: new URL('http://localhost:3000/api/v1/review-templates'),
      }

      const result = await POST(mockRequest as any)

      expect(result.success).toBe(false)
      expect(result.error).toContain('评审类型不存在')
    })
  })

  describe('GET - 获取所有评审模板', () => {
    it('应该返回所有评审模板', async () => {
      const mockTemplates = [
        {
          id: mockTemplateId,
          typeId: mockTypeId,
          name: 'Template 1',
          isActive: true,
          createdAt: new Date(),
          type: { id: mockTypeId, name: 'Type 1' },
          items: [],
        },
      ]

      mockFindMany.mockResolvedValue(mockTemplates as any)

      const mockRequest = {
        url: new URL('http://localhost:3000/api/v1/review-templates'),
        cookies: { get: vi.fn().mockReturnValue({ value: mockUserId }) },
      } as any,

      const result = await GET(mockRequest as any)

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          type: reviewTypeConfig,
          items: {
            some: {
              template: { isActive: true },
            },
          },
        },
        include: {
          type: true,
          items: { orderBy: { order: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockTemplates)
    })

    it('应该支持搜索功能', async () => {
      const mockRequest = {
        url: new URL('http://localhost:3000/api/v1/review-templates?search=code'),
        cookies: { get: vi.fn().mockReturnValue({ value: mockUserId }) },
      } as any,

      mockFindMany.mockImplementation((args: any[]) => {
        if (args[0]?.where?.OR) {
          return Promise.resolve([{ name: 'Code Template' } as any])
        }
        return Promise.resolve([])
      })

      const result = await GET(mockRequest as any)

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ name: { contains: 'code', mode: 'insensitive' } }],
          }),
        })
      )
    })
  })

  describe('GET_WITH_ID - 获取单个评审模板', () => {
    it('应该返回指定评审模板', async () => {
      const mockTemplate = {
        id: mockTemplateId,
        typeId: mockTypeId,
        name: 'Single Template',
        isActive: true,
        type: { id: mockTypeId, name: 'Type 1' },
        items: [
          { id: 'item-1', title: 'Code Quality', order: 1 },
          { id: 'item-2', title: 'Documentation', order: 2 },
        ],
      }

      mockFindUnique.mockResolvedValue(mockTemplate as any)

      const mockRequest = {
        url: new URL(`http://localhost:3000/api/v1/review-templates/${mockTemplateId}`),
        cookies: { get: vi.fn().mockReturnValue({ value: mockUserId }) },
        params: { id: mockTemplateId },
      } as any,

      const result = await GET_WITH_ID(mockRequest as any)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockTemplate)
    })

    it('应该在模板不存在时返回404', async () => {
      mockFindUnique.mockResolvedValue(null)

      const mockRequest = {
        url: new URL(`http://localhost:3000/api/v1/review-templates/${mockTemplateId}`),
        cookies: { get: vi.fn().mockReturnValue({ value: mockUserId }) },
        params: { id: mockTemplateId },
      } as any,

      const result = await GET_WITH_ID(mockRequest as any)

      expect(result.success).toBe(false)
      expect(result.error).toContain('不存在')
    })
  })

  describe('PUT - 更新评审模板', () => {
    it('应该成功更新评审模板', async () => {
      const mockTemplate = {
        id: mockTemplateId,
        typeId: mockTypeId,
        name: 'Original Name',
        isActive: true,
      }

      mockFindUnique.mockResolvedValue(mockTemplate as any)
      mockUpdate.mockResolvedValue({
        ...mockTemplate,
        name: 'Updated Name',
        description: 'Updated Description',
        isActive: false,
      })

      const mockRequest = {
        json: async () => ({
          name: 'Updated Name',
          description: 'Updated Description',
          isActive: false,
        }),
      } as any,
        url: new URL(`http://localhost:3000/api/v1/review-templates/${mockTemplateId}`),
        cookies: { get: vi.fn().mockReturnValue({ value: mockUserId }) },
        params: { id: mockTemplateId },
      } as any,

      const result = await PUT(mockRequest as any)

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: mockTemplateId },
        data: {
          name: 'Updated Name',
          description: 'Updated Description',
          isActive: false,
        },
      })

      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Updated Name')
    })

    it('应该在修改typeId时检查新typeId是否存在', async () => {
      mockFindUnique
        .mockResolvedValueOnce({ id: mockTemplateId, typeId: 'old-type-id' })
        .mockResolvedValueOnce({
          id: mockTypeId,
          name: 'Type 1',
          displayName: 'Code Review',
        })

      const mockRequest = {
        json: async () => ({
          typeId: mockTypeId,
        }),
      } as any,
        url: new URL(`http://localhost:3000/api/v1/review-templates/${mockTemplateId}`),
        cookies: { get: vi.fn().mockReturnValue({ value: mockUserId }) },
        params: { id: mockTemplateId },
      } as any,

      const result = await PUT(mockRequest as any)

      expect(result.success).toBe(false)
      expect(result.error).toContain('评审类型不存在')
    })

    it('应该在模板不存在时返回错误', async () => {
      mockFindUnique.mockResolvedValue(null)

      const mockRequest = {
        json: async () => ({
          name: 'Updated Name',
        }),
      } as any,
        url: new URL(`http://localhost:3000/api/v1/review-templates/${mockTemplateId}`),
        cookies: { get: vi.fn().mockReturnValue({ value: mockUserId }) },
        params: { id: mockTemplateId },
      } as any,

      const result = await PUT(mockRequest as any)

      expect(result.success).toBe(false)
      expect(result.error).toContain('不存在')
    })
  })

  describe('DELETE - 删除评审模板', () => {
    it('应该成功删除评审模板', async () => {
      const mockTemplate = {
        id: mockTemplateId,
        typeId: mockTypeId,
        name: 'Template to Delete',
        isActive: true,
      }

      mockFindUnique.mockResolvedValue(mockTemplate as any)
      mockCount.mockResolvedValue(0)
      mockDelete.mockResolvedValue(undefined)

      const mockRequest = {
        url: new URL(`http://localhost:3000/api/v1/review-templates/${mockTemplateId}`),
        cookies: { get: vi.fn().mockReturnValue({ value: mockUserId }) },
        params: { id: mockTemplateId },
      } as any,

      const result = await DELETE(mockRequest as any)

      expect(mockDelete).toHaveBeenCalledWith({
        where: { id: mockTemplateId },
      })

      expect(result.success).toBe(true)
      expect(result.message).toBe('删除成功')
    })

    it('应该在模板不存在时返回错误', async () => {
      mockFindUnique.mockResolvedValue(null)

      const mockRequest = {
        url: new URL(`http://localhost:3000/api/v1/review-templates/${mockTemplateId}`),
        cookies: { get: vi.fn().mockReturnValue({ value: mockUserId }) },
        params: { id: mockTemplateId },
      } as any,

      const result = await DELETE(mockRequest as any)

      expect(result.success).toBe(false)
      expect(result.error).toContain('不存在')
    })

    it('应该在模板正在使用时阻止删除', async () => {
      mockFindUnique.mockResolvedValue({
        id: mockTemplateId,
        typeId: mockTypeId,
        name: 'In Use Template',
        isActive: true,
      })

      mockCount.mockResolvedValue(5)

      const mockRequest = {
        url: new URL(`http://localhost:3000/api/v1/review-templates/${mockTemplateId}`),
        cookies: { get: vi.fn().mockReturnValue({ value: mockUserId }) },
        params: { id: mockTemplateId },
      } as any,

      const result = await DELETE(mockRequest as any)

      expect(mockCount).toHaveBeenCalledWith({
        where: {
          typeId: mockTypeId,
          status: { in: ['IN_PROGRESS', 'PENDING'] },
        },
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('正在使用中')
    })
  })
})
