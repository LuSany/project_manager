import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    risk: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
    },
    task: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// Mock DB (alternative import used in some routes)
vi.mock('@/lib/db', () => ({
  db: {
    risk: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
    },
    task: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// Mock Auth
vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: vi.fn(),
}))

// Mock API Response
vi.mock('@/lib/api/response', () => ({
  ApiResponder: {
    success: vi.fn((data, message) => ({ success: true, data, message })),
    created: vi.fn((data, message) => ({ success: true, data, message })),
    unauthorized: vi.fn((message) => ({ success: false, error: message })),
    forbidden: vi.fn((message) => ({ success: false, error: message })),
    notFound: vi.fn((message) => ({ success: false, error: message })),
    validationError: vi.fn((message, details) => ({ success: false, error: message, details })),
    serverError: vi.fn((message) => ({ success: false, error: message })),
    error: vi.fn((code, message, details, status) => ({ success: false, error: { code, message, details } })),
  },
  success: vi.fn((data, message) => ({ success: true, data, message })),
  error: vi.fn((code, message, details, status) => ({ success: false, error: { code, message, details } })),
}))

// Mock data factories
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'REGULAR',
  passwordHash: 'hash',
  avatar: null,
  phone: null,
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockProject = {
  id: 'project-123',
  name: 'Test Project',
  description: 'Test Description',
  ownerId: 'owner-123',
  status: 'ACTIVE',
  startDate: null,
  endDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  members: [{ userId: 'user-123', role: 'PROJECT_MEMBER' }],
}

const mockRisk = {
  id: 'risk-123',
  title: 'API Rate Limiting Risk',
  description: 'Third-party API may hit rate limits during peak usage',
  probability: 'HIGH' as const,
  impact: 'HIGH' as const,
  status: 'OPEN' as const,
  mitigation: 'Implement caching and request queueing',
  projectId: 'project-123',
  taskId: 'task-123',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('Risk API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/v1/risks', () => {
    it('should create risk when authenticated user is project member', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      // Mock authenticated user
      vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser as any)

      // Mock project with user as member
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as any)

      // Mock created risk
      vi.mocked(prisma.risk.create).mockResolvedValue(mockRisk as any)

      // Import and test the route handler
      const { POST } = await import('@/app/api/v1/risks/route')

      const request = {
        json: async () => ({
          title: 'API Rate Limiting Risk',
          description: 'Third-party API may hit rate limits during peak usage',
          probability: 'HIGH',
          impact: 'HIGH',
          mitigation: 'Implement caching and request queueing',
          projectId: 'project-123',
          taskId: 'task-123',
        }),
        cookies: { get: vi.fn() },
      } as any

      const response = await POST(request)

      expect(prisma.risk.create).toHaveBeenCalledWith({
        data: {
          title: 'API Rate Limiting Risk',
          description: 'Third-party API may hit rate limits during peak usage',
          probability: 'HIGH',
          impact: 'HIGH',
          status: 'OPEN',
          mitigation: 'Implement caching and request queueing',
          projectId: 'project-123',
          taskId: 'task-123',
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      })
    })

    it('should return unauthorized when user not authenticated', async () => {
      const { getAuthenticatedUser } = await import('@/lib/auth')
      vi.mocked(getAuthenticatedUser).mockResolvedValue(null)

      const { POST } = await import('@/app/api/v1/risks/route')

      const request = {
        json: async () => ({
          title: 'Test Risk',
          projectId: 'project-123',
        }),
        cookies: { get: vi.fn() },
      } as any

      const response = await POST(request)

      expect(response).toEqual(
        expect.objectContaining({
          success: false,
        })
      )
    })

    it('should return forbidden when user is not project member', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser as any)

      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        ...mockProject,
        members: [], // User is not a member
      } as any)

      const { POST } = await import('@/app/api/v1/risks/route')

      const request = {
        json: async () => ({
          title: 'Test Risk',
          projectId: 'project-123',
        }),
        cookies: { get: vi.fn() },
      } as any

      const response = await POST(request)

      expect(response).toEqual(
        expect.objectContaining({
          success: false,
        })
      )
    })

    it('should return validation error for invalid probability value', async () => {
      const { getAuthenticatedUser } = await import('@/lib/auth')
      vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser as any)

      const { POST } = await import('@/app/api/v1/risks/route')

      const request = {
        json: async () => ({
          title: 'Test Risk',
          projectId: 'project-123',
          probability: 'INVALID', // Invalid value
          impact: 'HIGH',
        }),
        cookies: { get: vi.fn() },
      } as any

      const response = await POST(request)

      expect(response).toEqual(
        expect.objectContaining({
          success: false,
        })
      )
    })
  })

  describe('GET /api/v1/risks', () => {
    it('should return risks with filters for authenticated user', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser as any)

      const mockRisks = [
        mockRisk,
        {
          ...mockRisk,
          id: 'risk-456',
          title: 'Database Migration Risk',
          probability: 'MEDIUM' as const,
          impact: 'MEDIUM' as const,
        },
      ]

      vi.mocked(prisma.risk.findMany).mockResolvedValue(mockRisks as any)
      vi.mocked(prisma.risk.findUnique).mockResolvedValue({ _count: { tasks: 1 } } as any)

      // Mock URL search params
      const mockSearchParams = new URLSearchParams()
      mockSearchParams.append('projectId', 'project-123')
      mockSearchParams.append('status', 'OPEN')
      mockSearchParams.append('probability', 'HIGH')
      mockSearchParams.append('impact', 'HIGH')

      const { GET } = await import('@/app/api/v1/risks/route')

      const request = {
        url: 'http://localhost:3000/api/v1/risks?projectId=project-123&status=OPEN&probability=HIGH&impact=HIGH',
        cookies: { get: vi.fn() },
      } as any

      const response = await GET(request)

      expect(prisma.risk.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: 'project-123',
            status: 'OPEN',
            probability: 'HIGH',
            impact: 'HIGH',
          }),
        })
      )
    })

    it('should return unauthorized when user not authenticated', async () => {
      const { getAuthenticatedUser } = await import('@/lib/auth')
      vi.mocked(getAuthenticatedUser).mockResolvedValue(null)

      const { GET } = await import('@/app/api/v1/risks/route')

      const request = {
        url: 'http://localhost:3000/api/v1/risks',
        cookies: { get: vi.fn() },
      } as any

      const response = await GET(request)

      expect(response).toEqual(
        expect.objectContaining({
          success: false,
        })
      )
    })

    it('should support pagination', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.risk.findMany).mockResolvedValue([mockRisk] as any)

      const { GET } = await import('@/app/api/v1/risks/route')

      const request = {
        url: 'http://localhost:3000/api/v1/risks?page=2&pageSize=20',
        cookies: { get: vi.fn() },
      } as any

      const response = await GET(request)

      expect(prisma.risk.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (page - 1) * pageSize
          take: 20,
        })
      )
    })
  })

  describe('GET /api/v1/projects/[id]/risks', () => {
    it('should return project risks for authenticated member', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser as any)

      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as any)

      const mockRisks = [
        {
          ...mockRisk,
          task: {
            id: 'task-123',
            title: 'Implement API Integration',
          },
        },
      ]

      vi.mocked(prisma.risk.findMany).mockResolvedValue(mockRisks as any)

      const { GET } = await import('@/app/api/v1/projects/[id]/risks/route')

      const request = {
        cookies: { get: vi.fn() },
      } as any

      const params = Promise.resolve({ id: 'project-123' })

      const response = await GET(request, { params } as any)

      expect(prisma.risk.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-123' },
        orderBy: [{ probability: 'desc' }, { impact: 'desc' }, { createdAt: 'desc' }],
        include: {
          task: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      })
    })

    it('should filter risks by status in project context', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as any)
      vi.mocked(prisma.risk.findMany).mockResolvedValue([mockRisk] as any)

      const { GET } = await import('@/app/api/v1/projects/[id]/risks/route')

      const request = {
        url: 'http://localhost:3000/api/v1/projects/project-123/risks?status=MITIGATED',
        cookies: { get: vi.fn() },
      } as any

      const params = Promise.resolve({ id: 'project-123' })

      const response = await GET(request, { params } as any)

      expect(prisma.risk.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: 'project-123',
            status: 'MITIGATED',
          }),
        })
      )
    })
  })

  describe('PUT /api/v1/risks/[id]', () => {
    it('should update risk when user is project owner', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      const ownerUser = { ...mockUser, id: 'owner-123' }
      vi.mocked(getAuthenticatedUser).mockResolvedValue(ownerUser as any)

      vi.mocked(prisma.risk.findUnique).mockResolvedValue({
        ...mockRisk,
        project: {
          id: 'project-123',
          ownerId: 'owner-123',
          members: [],
        },
      } as any)

      vi.mocked(prisma.risk.update).mockResolvedValue({
        ...mockRisk,
        status: 'MITIGATED' as const,
        probability: 'LOW' as const,
      } as any)

      const { PUT } = await import('@/app/api/v1/risks/[id]/route')

      const request = {
        json: async () => ({
          status: 'MITIGATED',
          probability: 'LOW',
          mitigation: 'Implemented caching layer',
        }),
        cookies: { get: vi.fn() },
      } as any

      const params = Promise.resolve({ id: 'risk-123' })

      const response = await PUT(request, { params } as any)

      expect(prisma.risk.update).toHaveBeenCalledWith({
        where: { id: 'risk-123' },
        data: expect.objectContaining({
          status: 'MITIGATED',
          probability: 'LOW',
          mitigation: 'Implemented caching layer',
        }),
        include: expect.anything(),
      })
    })

    it('should return forbidden when user is not project owner', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser as any)

      vi.mocked(prisma.risk.findUnique).mockResolvedValue({
        ...mockRisk,
        project: {
          id: 'project-123',
          ownerId: 'owner-123', // Different user
          members: [],
        },
      } as any)

      const { PUT } = await import('@/app/api/v1/risks/[id]/route')

      const request = {
        json: async () => ({
          status: 'MITIGATED',
        }),
        cookies: { get: vi.fn() },
      } as any

      const params = Promise.resolve({ id: 'risk-123' })

      const response = await PUT(request, { params } as any)

      expect(response).toEqual(
        expect.objectContaining({
          success: false,
        })
      )
    })

    it('should return not found when risk does not exist', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.risk.findUnique).mockResolvedValue(null)

      const { PUT } = await import('@/app/api/v1/risks/[id]/route')

      const request = {
        json: async () => ({
          status: 'MITIGATED',
        }),
        cookies: { get: vi.fn() },
      } as any

      const params = Promise.resolve({ id: 'nonexistent-risk' })

      const response = await PUT(request, { params } as any)

      expect(response).toEqual(
        expect.objectContaining({
          success: false,
        })
      )
    })
  })

  describe('DELETE /api/v1/risks/[id]', () => {
    it('should delete risk when user is project owner', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      const ownerUser = { ...mockUser, id: 'owner-123' }
      vi.mocked(getAuthenticatedUser).mockResolvedValue(ownerUser as any)

      vi.mocked(prisma.risk.findUnique).mockResolvedValue({
        ...mockRisk,
        project: {
          id: 'project-123',
          ownerId: 'owner-123',
          members: [],
        },
      } as any)

      vi.mocked(prisma.risk.delete).mockResolvedValue({} as any)

      const { DELETE } = await import('@/app/api/v1/risks/[id]/route')

      const request = {
        cookies: { get: vi.fn() },
      } as any

      const params = Promise.resolve({ id: 'risk-123' })

      const response = await DELETE(request, { params } as any)

      expect(prisma.risk.delete).toHaveBeenCalledWith({
        where: { id: 'risk-123' },
      })
    })

    it('should return forbidden when user is not project owner', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser as any)

      vi.mocked(prisma.risk.findUnique).mockResolvedValue({
        ...mockRisk,
        project: {
          id: 'project-123',
          ownerId: 'owner-123', // Different user
          members: [],
        },
      } as any)

      const { DELETE } = await import('@/app/api/v1/risks/[id]/route')

      const request = {
        cookies: { get: vi.fn() },
      } as any

      const params = Promise.resolve({ id: 'risk-123' })

      const response = await DELETE(request, { params } as any)

      expect(response).toEqual(
        expect.objectContaining({
          success: false,
        })
      )
    })

    it('should return not found when risk does not exist', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.risk.findUnique).mockResolvedValue(null)

      const { DELETE } = await import('@/app/api/v1/risks/[id]/route')

      const request = {
        cookies: { get: vi.fn() },
      } as any

      const params = Promise.resolve({ id: 'nonexistent-risk' })

      const response = await DELETE(request, { params } as any)

      expect(response).toEqual(
        expect.objectContaining({
          success: false,
        })
      )
    })
  })

  describe('Risk-Task Association', () => {
    describe('POST /api/v1/risks/[id]/tasks', () => {
      it('should associate risk with task', async () => {
        const { prisma } = await import('@/lib/prisma')
        const { getAuthenticatedUser } = await import('@/lib/auth')

        vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser as any)

        vi.mocked(prisma.risk.findUnique).mockResolvedValue({
          ...mockRisk,
          project: {
            id: 'project-123',
            ownerId: 'owner-123',
            members: [{ userId: 'user-123', role: 'PROJECT_MEMBER' }],
          },
        } as any)

        vi.mocked(prisma.task.findUnique).mockResolvedValue({
          id: 'task-456',
          title: 'New Task',
          projectId: 'project-123',
        } as any)

        vi.mocked(prisma.risk.update).mockResolvedValue({
          ...mockRisk,
          taskId: 'task-456',
        } as any)

        const { POST } = await import('@/app/api/v1/risks/[id]/tasks/route')

        const request = {
          json: async () => ({
            taskId: 'task-456',
          }),
          cookies: { get: vi.fn() },
        } as any

        const params = Promise.resolve({ id: 'risk-123' })

        const response = await POST(request, { params } as any)

        expect(prisma.risk.update).toHaveBeenCalledWith({
          where: { id: 'risk-123' },
          data: { taskId: 'task-456' },
          include: expect.anything(),
        })
      })

      it('should return not found when task does not exist', async () => {
        const { prisma } = await import('@/lib/prisma')
        const { getAuthenticatedUser } = await import('@/lib/auth')

        vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser as any)

        vi.mocked(prisma.risk.findUnique).mockResolvedValue({
          ...mockRisk,
          project: {
            id: 'project-123',
            ownerId: 'owner-123',
            members: [{ userId: 'user-123', role: 'PROJECT_MEMBER' }],
          },
        } as any)

        vi.mocked(prisma.task.findUnique).mockResolvedValue(null)

        const { POST } = await import('@/app/api/v1/risks/[id]/tasks/route')

        const request = {
          json: async () => ({
            taskId: 'nonexistent-task',
          }),
          cookies: { get: vi.fn() },
        } as any

        const params = Promise.resolve({ id: 'risk-123' })

        const response = await POST(request, { params } as any)

        expect(response).toEqual(
          expect.objectContaining({
            success: false,
          })
        )
      })

      it('should return forbidden when task belongs to different project', async () => {
        const { prisma } = await import('@/lib/prisma')
        const { getAuthenticatedUser } = await import('@/lib/auth')

        vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser as any)

        vi.mocked(prisma.risk.findUnique).mockResolvedValue({
          ...mockRisk,
          project: {
            id: 'project-123',
            ownerId: 'owner-123',
            members: [{ userId: 'user-123', role: 'PROJECT_MEMBER' }],
          },
        } as any)

        vi.mocked(prisma.task.findUnique).mockResolvedValue({
          id: 'task-456',
          title: 'Task from different project',
          projectId: 'project-456', // Different project
        } as any)

        const { POST } = await import('@/app/api/v1/risks/[id]/tasks/route')

        const request = {
          json: async () => ({
            taskId: 'task-456',
          }),
          cookies: { get: vi.fn() },
        } as any

        const params = Promise.resolve({ id: 'risk-123' })

        const response = await POST(request, { params } as any)

        expect(response).toEqual(
          expect.objectContaining({
            success: false,
          })
        )
      })
    })

    describe('DELETE /api/v1/risks/[id]/tasks', () => {
      it('should disassociate risk from task', async () => {
        const { prisma } = await import('@/lib/prisma')
        const { getAuthenticatedUser } = await import('@/lib/auth')

        const ownerUser = { ...mockUser, id: 'owner-123' }
        vi.mocked(getAuthenticatedUser).mockResolvedValue(ownerUser as any)

        vi.mocked(prisma.risk.findUnique).mockResolvedValue({
          ...mockRisk,
          taskId: 'task-123',
          project: {
            id: 'project-123',
            ownerId: 'owner-123',
            members: [],
          },
        } as any)

        vi.mocked(prisma.risk.update).mockResolvedValue({
          ...mockRisk,
          taskId: null,
        } as any)

        const { DELETE } = await import('@/app/api/v1/risks/[id]/tasks/route')

        const request = {
          cookies: { get: vi.fn() },
        } as any

        const params = Promise.resolve({ id: 'risk-123' })

        const response = await DELETE(request, { params } as any)

        expect(prisma.risk.update).toHaveBeenCalledWith({
          where: { id: 'risk-123' },
          data: { taskId: null },
          include: expect.anything(),
        })
      })
    })
  })

  describe('Authorization Checks', () => {
    it('should allow project owner to perform all operations', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      const ownerUser = { ...mockUser, id: 'owner-123' }
      vi.mocked(getAuthenticatedUser).mockResolvedValue(ownerUser as any)

      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        ...mockProject,
        ownerId: 'owner-123',
      } as any)

      vi.mocked(prisma.risk.findUnique).mockResolvedValue({
        ...mockRisk,
        project: {
          id: 'project-123',
          ownerId: 'owner-123',
          members: [],
        },
      } as any)

      vi.mocked(prisma.risk.update).mockResolvedValue(mockRisk as any)
      vi.mocked(prisma.risk.delete).mockResolvedValue({} as any)

      // Test PUT
      const { PUT } = await import('@/app/api/v1/risks/[id]/route')
      const putRequest = {
        json: async () => ({ status: 'MITIGATED' }),
        cookies: { get: vi.fn() },
      } as any
      await PUT(putRequest, { params: Promise.resolve({ id: 'risk-123' }) } as any)

      expect(prisma.risk.update).toHaveBeenCalled()

      // Test DELETE
      const { DELETE } = await import('@/app/api/v1/risks/[id]/route')
      const deleteRequest = {
        cookies: { get: vi.fn() },
      } as any
      await DELETE(deleteRequest, { params: Promise.resolve({ id: 'risk-123' }) } as any)

      expect(prisma.risk.delete).toHaveBeenCalled()
    })

    it('should allow project admin to update risks', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      const adminUser = { ...mockUser, id: 'admin-123' }
      vi.mocked(getAuthenticatedUser).mockResolvedValue(adminUser as any)

      vi.mocked(prisma.risk.findUnique).mockResolvedValue({
        ...mockRisk,
        project: {
          id: 'project-123',
          ownerId: 'owner-123',
          members: [{ userId: 'admin-123', role: 'PROJECT_ADMIN' }],
        },
      } as any)

      vi.mocked(prisma.risk.update).mockResolvedValue(mockRisk as any)

      const { PUT } = await import('@/app/api/v1/risks/[id]/route')

      const request = {
        json: async () => ({ status: 'MITIGATED' }),
        cookies: { get: vi.fn() },
      } as any

      const params = Promise.resolve({ id: 'risk-123' })

      const response = await PUT(request, { params } as any)

      expect(prisma.risk.update).toHaveBeenCalled()
    })

    it('should deny project member from deleting risks', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser as any)

      vi.mocked(prisma.risk.findUnique).mockResolvedValue({
        ...mockRisk,
        project: {
          id: 'project-123',
          ownerId: 'owner-123',
          members: [{ userId: 'user-123', role: 'PROJECT_MEMBER' }],
        },
      } as any)

      const { DELETE } = await import('@/app/api/v1/risks/[id]/route')

      const request = {
        cookies: { get: vi.fn() },
      } as any

      const params = Promise.resolve({ id: 'risk-123' })

      const response = await DELETE(request, { params } as any)

      expect(response).toEqual(
        expect.objectContaining({
          success: false,
        })
      )
      expect(prisma.risk.delete).not.toHaveBeenCalled()
    })

    it('should allow system admin to access any risk', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      const systemAdmin = { ...mockUser, id: 'sysadmin-123', role: 'ADMIN' }
      vi.mocked(getAuthenticatedUser).mockResolvedValue(systemAdmin as any)

      vi.mocked(prisma.risk.findMany).mockResolvedValue([mockRisk] as any)

      const { GET } = await import('@/app/api/v1/risks/route')

      const request = {
        url: 'http://localhost:3000/api/v1/risks',
        cookies: { get: vi.fn() },
      } as any

      const response = await GET(request)

      expect(prisma.risk.findMany).toHaveBeenCalled()
    })
  })

  describe('Risk Status Transitions', () => {
    it('should allow transition from OPEN to MITIGATED', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      const ownerUser = { ...mockUser, id: 'owner-123' }
      vi.mocked(getAuthenticatedUser).mockResolvedValue(ownerUser as any)

      vi.mocked(prisma.risk.findUnique).mockResolvedValue({
        ...mockRisk,
        status: 'OPEN' as const,
        project: {
          id: 'project-123',
          ownerId: 'owner-123',
          members: [],
        },
      } as any)

      vi.mocked(prisma.risk.update).mockResolvedValue({
        ...mockRisk,
        status: 'MITIGATED' as const,
      } as any)

      const { PUT } = await import('@/app/api/v1/risks/[id]/route')

      const request = {
        json: async () => ({ status: 'MITIGATED' }),
        cookies: { get: vi.fn() },
      } as any

      const params = Promise.resolve({ id: 'risk-123' })

      const response = await PUT(request, { params } as any)

      expect(prisma.risk.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'MITIGATED',
          }),
        })
      )
    })

    it('should allow transition from MITIGATED to CLOSED', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      const ownerUser = { ...mockUser, id: 'owner-123' }
      vi.mocked(getAuthenticatedUser).mockResolvedValue(ownerUser as any)

      vi.mocked(prisma.risk.findUnique).mockResolvedValue({
        ...mockRisk,
        status: 'MITIGATED' as const,
        project: {
          id: 'project-123',
          ownerId: 'owner-123',
          members: [],
        },
      } as any)

      vi.mocked(prisma.risk.update).mockResolvedValue({
        ...mockRisk,
        status: 'CLOSED' as const,
      } as any)

      const { PUT } = await import('@/app/api/v1/risks/[id]/route')

      const request = {
        json: async () => ({ status: 'CLOSED' }),
        cookies: { get: vi.fn() },
      } as any

      const params = Promise.resolve({ id: 'risk-123' })

      const response = await PUT(request, { params } as any)

      expect(prisma.risk.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'CLOSED',
          }),
        })
      )
    })
  })
})
