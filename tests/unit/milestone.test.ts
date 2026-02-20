import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    milestone: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
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
    unauthorized: vi.fn((message) => ({ success: false, error: message })),
    forbidden: vi.fn((message) => ({ success: false, error: message })),
    notFound: vi.fn((message) => ({ success: false, error: message })),
    validationError: vi.fn((message, details) => ({ success: false, error: message, details })),
    serverError: vi.fn((message) => ({ success: false, error: message })),
  },
}))

describe('Milestone API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/v1/milestones', () => {
    it('should create milestone when authenticated user is project member', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      // Mock authenticated user
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
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
      } as any)

      // Mock project with user as member
      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        id: 'project-123',
        name: 'Test Project',
        ownerId: 'owner-123',
        members: [{ userId: 'user-123' }],
      } as any)

      // Mock created milestone
      vi.mocked(prisma.milestone.create).mockResolvedValue({
        id: 'milestone-123',
        title: 'Test Milestone',
        description: 'Test Description',
        status: 'NOT_STARTED',
        progress: 0,
        projectId: 'project-123',
        dueDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      // Import and test the route handler
      const { POST } = await import('@/app/api/v1/milestones/route')

      const request = {
        json: async () => ({
          title: 'Test Milestone',
          description: 'Test Description',
          projectId: 'project-123',
        }),
        cookies: { get: vi.fn() },
      } as any

      const response = await POST(request)

      expect(prisma.milestone.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Milestone',
          description: 'Test Description',
          dueDate: undefined,
          projectId: 'project-123',
          status: 'NOT_STARTED',
          progress: 0,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    })

    it('should return unauthorized when user not authenticated', async () => {
      const { getAuthenticatedUser } = await import('@/lib/auth')
      vi.mocked(getAuthenticatedUser).mockResolvedValue(null)

      const { POST } = await import('@/app/api/v1/milestones/route')

      const request = {
        json: async () => ({
          title: 'Test Milestone',
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

      vi.mocked(getAuthenticatedUser).mockResolvedValue({
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
      } as any)

      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        id: 'project-123',
        name: 'Test Project',
        ownerId: 'owner-123',
        members: [], // User is not a member
      } as any)

      const { POST } = await import('@/app/api/v1/milestones/route')

      const request = {
        json: async () => ({
          title: 'Test Milestone',
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
  })

  describe('GET /api/v1/projects/[id]/milestones', () => {
    it('should return project milestones for authenticated member', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      vi.mocked(getAuthenticatedUser).mockResolvedValue({
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
      } as any)

      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        id: 'project-123',
        name: 'Test Project',
        ownerId: 'owner-123',
        members: [{ userId: 'user-123' }],
      } as any)

      const mockMilestones = [
        {
          id: 'milestone-1',
          title: 'Milestone 1',
          status: 'NOT_STARTED',
          progress: 0,
          dueDate: new Date('2025-12-31'),
          projectId: 'project-123',
          tasks: [],
          _count: { tasks: 0 },
        },
      ]

      vi.mocked(prisma.milestone.findMany).mockResolvedValue(mockMilestones as any)

      const { GET } = await import('@/app/api/v1/projects/[id]/milestones/route')

      const request = {
        cookies: { get: vi.fn() },
      } as any

      const params = Promise.resolve({ id: 'project-123' })

      const response = await GET(request, { params } as any)

      expect(prisma.milestone.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-123' },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        include: {
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
              progress: true,
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      })
    })
  })

  describe('PUT /api/v1/milestones/[id]', () => {
    it('should update milestone when user is project owner', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        id: 'owner-123',
        email: 'owner@example.com',
        name: 'Owner',
        role: 'REGULAR',
        passwordHash: 'hash',
        avatar: null,
        phone: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      vi.mocked(prisma.milestone.findUnique).mockResolvedValue({
        id: 'milestone-123',
        title: 'Old Title',
        projectId: 'project-123',
        project: {
          id: 'project-123',
          ownerId: 'owner-123',
          members: [],
        },
      } as any)

      vi.mocked(prisma.milestone.update).mockResolvedValue({
        id: 'milestone-123',
        title: 'New Title',
        status: 'IN_PROGRESS',
        progress: 50,
        projectId: 'project-123',
      } as any)

      const { PUT } = await import('@/app/api/v1/milestones/[id]/route')

      const request = {
        json: async () => ({
          title: 'New Title',
          status: 'IN_PROGRESS',
          progress: 50,
        }),
        cookies: { get: vi.fn() },
      } as any

      const params = Promise.resolve({ id: 'milestone-123' })

      const response = await PUT(request, { params } as any)

      expect(prisma.milestone.update).toHaveBeenCalled()
    })
  })

  describe('DELETE /api/v1/milestones/[id]', () => {
    it('should delete milestone when user is project owner', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        id: 'owner-123',
        email: 'owner@example.com',
        name: 'Owner',
        role: 'REGULAR',
        passwordHash: 'hash',
        avatar: null,
        phone: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      vi.mocked(prisma.milestone.findUnique).mockResolvedValue({
        id: 'milestone-123',
        title: 'Test Milestone',
        projectId: 'project-123',
        project: {
          id: 'project-123',
          ownerId: 'owner-123',
        },
      } as any)

      vi.mocked(prisma.milestone.delete).mockResolvedValue({} as any)

      const { DELETE } = await import('@/app/api/v1/milestones/[id]/route')

      const request = {
        cookies: { get: vi.fn() },
      } as any

      const params = Promise.resolve({ id: 'milestone-123' })

      const response = await DELETE(request, { params } as any)

      expect(prisma.milestone.delete).toHaveBeenCalledWith({
        where: { id: 'milestone-123' },
      })
    })

    it('should return forbidden when user is not project owner', async () => {
      const { prisma } = await import('@/lib/prisma')
      const { getAuthenticatedUser } = await import('@/lib/auth')

      vi.mocked(getAuthenticatedUser).mockResolvedValue({
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
      } as any)

      vi.mocked(prisma.milestone.findUnique).mockResolvedValue({
        id: 'milestone-123',
        title: 'Test Milestone',
        projectId: 'project-123',
        project: {
          id: 'project-123',
          ownerId: 'owner-123', // Different user
        },
      } as any)

      const { DELETE } = await import('@/app/api/v1/milestones/[id]/route')

      const request = {
        cookies: { get: vi.fn() },
      } as any

      const params = Promise.resolve({ id: 'milestone-123' })

      const response = await DELETE(request, { params } as any)

      expect(response).toEqual(
        expect.objectContaining({
          success: false,
        })
      )
    })
  })
})
