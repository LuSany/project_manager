/**
 * Prisma Mock 工厂
 *
 * 提供类型安全的 Prisma Client Mock，用于单元测试
 * 支持链式调用和返回值设置
 *
 * @example
 * const mockPrisma = createPrismaMock()
 * mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@example.com' })
 */

import { vi } from 'vitest'

/**
 * 创建 Mock 函数的类型
 */
type MockFunction<T extends (...args: any[]) => any> = ReturnType<typeof vi.fn<T>>

/**
 * 创建模型 Mock
 */
function createModelMock() {
  return {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  }
}

/**
 * 创建完整的 Prisma Mock
 */
export function createPrismaMock() {
  return {
    // 用户相关
    user: createModelMock(),
    passwordResetToken: createModelMock(),

    // 项目相关
    project: createModelMock(),
    projectMember: createModelMock(),
    milestone: createModelMock(),

    // 任务相关
    task: createModelMock(),
    taskAssignee: createModelMock(),
    taskWatcher: createModelMock(),
    taskDependency: createModelMock(),
    subTask: createModelMock(),
    taskTag: createModelMock(),
    taskTemplate: createModelMock(),

    // 需求相关
    requirement: createModelMock(),
    proposal: createModelMock(),
    requirementImpact: createModelMock(),
    requirementAcceptance: createModelMock(),
    requirementDiscussion: createModelMock(),
    requirementHistory: createModelMock(),

    // 问题相关
    issue: createModelMock(),

    // 评审相关
    reviewTypeConfig: createModelMock(),
    reviewTemplate: createModelMock(),
    reviewTemplateItem: createModelMock(),
    review: createModelMock(),
    reviewMaterial: createModelMock(),
    reviewParticipant: createModelMock(),
    reviewItem: createModelMock(),
    reviewCriterion: createModelMock(),
    reviewAiAnalysis: createModelMock(),

    // 风险相关
    risk: createModelMock(),
    riskTask: createModelMock(),

    // 文件相关
    fileStorage: createModelMock(),
    previewServiceConfig: createModelMock(),

    // 通知相关
    notification: createModelMock(),
    notificationPreference: createModelMock(),
    notificationIgnore: createModelMock(),

    // 邮件相关
    emailConfig: createModelMock(),
    emailLog: createModelMock(),
    emailTemplate: createModelMock(),

    // AI 相关
    aIConfig: createModelMock(),
    aILog: createModelMock(),
    aiResponseCache: createModelMock(),

    // 审计与系统
    auditLog: createModelMock(),
    webhook: createModelMock(),
    webhookDelivery: createModelMock(),
    scheduledJob: createModelMock(),

    // 标签
    tag: createModelMock(),

    // 签名
    signature: createModelMock(),

    // Prisma 客户端方法
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    $transaction: vi.fn(),
    $executeRaw: vi.fn(),
    $executeRawUnsafe: vi.fn(),
    $queryRaw: vi.fn(),
    $queryRawUnsafe: vi.fn(),
  }
}

/**
 * 重置所有 Mock
 */
export function resetAllMocks(mockPrisma: ReturnType<typeof createPrismaMock>) {
  Object.values(mockPrisma).forEach((value) => {
    if (typeof value === 'object' && value !== null) {
      Object.values(value).forEach((fn) => {
        if (typeof fn === 'function' && 'mockClear' in fn) {
          fn.mockClear()
        }
      })
    } else if (typeof value === 'function' && 'mockClear' in value) {
      value.mockClear()
    }
  })
}

/**
 * 设置 Mock 返回值的辅助函数
 */
export function mockResolvedValue<T>(
  mockFn: MockFunction<(...args: any[]) => Promise<T>>,
  value: T
) {
  return mockFn.mockResolvedValue(value as any)
}

export function mockRejectedValue(
  mockFn: MockFunction<(...args: any[]) => Promise<any>>,
  error: Error
) {
  return mockFn.mockRejectedValue(error)
}

/**
 * 创建测试用的 Mock 数据
 */
export const mockTestData = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashed-password',
    status: 'ACTIVE' as const,
    role: 'EMPLOYEE' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  project: {
    id: 'test-project-id',
    name: 'Test Project',
    description: 'Test Description',
    status: 'PLANNING' as const,
    ownerId: 'test-user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  task: {
    id: 'test-task-id',
    title: 'Test Task',
    description: 'Test Description',
    status: 'TODO' as const,
    progress: 0,
    priority: 'MEDIUM' as const,
    projectId: 'test-project-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

export type PrismaMock = ReturnType<typeof createPrismaMock>
