/**
 * Prisma Mock 定义
 * 用于在测试文件的 vi.mock 中导入
 *
 * 使用方法:
 * import { createPrismaMock } from '../mocks/prisma-mock-def'
 * vi.mock('@/lib/prisma', () => ({ prisma: createPrismaMock() }))
 */

import { vi } from 'vitest'

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
    // 用户管理
    user: createModelMock(),
    passwordResetToken: createModelMock(),

    // 项目管理
    project: createModelMock(),
    projectMember: createModelMock(),
    milestone: createModelMock(),

    // 任务管理
    task: createModelMock(),
    taskAssignee: createModelMock(),
    taskWatcher: createModelMock(),
    taskDependency: createModelMock(),
    subTask: createModelMock(),
    taskTag: createModelMock(),
    taskTemplate: createModelMock(),

    // 需求管理
    requirement: createModelMock(),
    proposal: createModelMock(),
    requirementImpact: createModelMock(),
    requirementAcceptance: createModelMock(),
    requirementDiscussion: createModelMock(),
    requirementHistory: createModelMock(),

    // 问题管理
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
    $extends: vi.fn(),
  }
}

export type PrismaMock = ReturnType<typeof createPrismaMock>