/**
 * 测试数据工厂
 *
 * 提供类型安全的测试数据创建函数，按照数据模型依赖顺序创建
 * 使用 faker 生成随机数据，确保测试数据唯一性
 */

import { faker } from '@faker-js/faker'
import { testPrisma } from './test-db'
import type { Prisma } from '@prisma/client'

// ============================================
// Level 0: 独立模型（无外部依赖）
// ============================================

/**
 * 创建测试评审类型配置
 */
export async function createTestReviewTypeConfig(
  overrides: Partial<Prisma.ReviewTypeConfigCreateInput> = {}
) {
  return testPrisma.reviewTypeConfig.create({
    data: {
      name: overrides.name ? `${overrides.name}_${Date.now()}` : `${faker.word.noun().toUpperCase()}_${Date.now()}`,
      displayName: overrides.displayName ?? faker.word.words(2),
      description: overrides.description,
      isSystem: overrides.isSystem ?? false,
      isActive: overrides.isActive ?? true,
    },
  })
}

/**
 * 创建测试标签
 */
export async function createTestTag(overrides: Partial<Prisma.TagCreateInput> = {}) {
  return testPrisma.tag.create({
    data: {
      name: overrides.name ?? `tag-${faker.string.alphanumeric(8)}`,
      color: overrides.color ?? faker.color.rgb(),
    },
  })
}

/**
 * 创建测试 AI 配置
 */
export async function createTestAIConfig(overrides: Partial<Prisma.AIConfigCreateInput> = {}) {
  return testPrisma.aIConfig.create({
    data: {
      name: overrides.name ?? `ai-config-${faker.string.alphanumeric(8)}`,
      provider: overrides.provider ?? 'OPENAI',
      apiKey: overrides.apiKey ?? faker.string.alphanumeric(32),
      model: overrides.model ?? 'gpt-4o-mini',
      isActive: overrides.isActive ?? true,
      isDefault: overrides.isDefault ?? false,
    },
  })
}

/**
 * 创建测试邮件配置
 */
export async function createTestEmailConfig(
  overrides: Partial<Prisma.EmailConfigCreateInput> = {}
) {
  return testPrisma.emailConfig.create({
    data: {
      name: overrides.name ?? `email-config-${faker.string.alphanumeric(8)}`,
      provider: overrides.provider ?? 'smtp',
      smtpHost: overrides.smtpHost ?? 'smtp.test.com',
      smtpPort: overrides.smtpPort ?? 587,
      smtpUser: overrides.smtpUser ?? faker.internet.email(),
      smtpPassword: overrides.smtpPassword ?? faker.internet.password(),
      fromAddress: overrides.fromAddress ?? faker.internet.email(),
      fromName: overrides.fromName ?? faker.person.fullName(),
      isActive: overrides.isActive ?? true,
      isDefault: overrides.isDefault ?? false,
    },
  })
}

// ============================================
// Level 1: 用户相关模型
// ============================================

/**
 * 创建测试用户
 */
export async function createTestUser(overrides: Partial<Prisma.UserCreateInput> = {}) {
  const email = overrides.email ?? `test-${Date.now()}-${faker.string.alphanumeric(6)}@example.com`

  return testPrisma.user.create({
    data: {
      email,
      passwordHash: overrides.passwordHash ?? faker.string.alphanumeric(60),
      name: overrides.name ?? faker.person.fullName(),
      avatar: overrides.avatar,
      phone: overrides.phone,
      department: overrides.department,
      position: overrides.position,
      status: overrides.status ?? 'ACTIVE',
      role: overrides.role ?? 'EMPLOYEE',
    },
  })
}

/**
 * 创建测试管理员用户
 */
export async function createTestAdminUser(overrides: Partial<Prisma.UserCreateInput> = {}) {
  return createTestUser({ ...overrides, role: 'ADMIN' })
}

/**
 * 创建待审批用户
 */
export async function createTestPendingUser(overrides: Partial<Prisma.UserCreateInput> = {}) {
  return createTestUser({ ...overrides, status: 'PENDING' })
}

// ============================================
// Level 2: 项目相关模型
// ============================================

/**
 * 创建测试项目
 */
export async function createTestProject(
  ownerId: string,
  overrides: Partial<Prisma.ProjectCreateInput> = {}
) {
  return testPrisma.project.create({
    data: {
      name: overrides.name ?? faker.company.name(),
      description: overrides.description,
      status: overrides.status ?? 'PLANNING',
      startDate: overrides.startDate,
      endDate: overrides.endDate,
      ownerId,
    },
  })
}

/**
 * 创建测试项目成员
 */
export async function createTestProjectMember(
  projectId: string,
  userId: string,
  overrides: Partial<Prisma.ProjectMemberCreateInput> = {}
) {
  return testPrisma.projectMember.create({
    data: {
      projectId,
      userId,
      role: overrides.role ?? 'PROJECT_MEMBER',
    },
  })
}

// ============================================
// Level 3: 核心业务模型
// ============================================

/**
 * 创建测试里程碑
 */
export async function createTestMilestone(
  projectId: string,
  overrides: Partial<Prisma.MilestoneCreateInput> = {}
) {
  return testPrisma.milestone.create({
    data: {
      title: overrides.title ?? faker.word.words(3),
      description: overrides.description,
      status: overrides.status ?? 'NOT_STARTED',
      progress: overrides.progress ?? 0,
      dueDate: overrides.dueDate,
      projectId,
    },
  })
}

/**
 * 创建测试任务
 */
export async function createTestTask(
  projectId: string,
  overrides: Partial<Prisma.TaskCreateInput> & { milestoneId?: string; acceptorId?: string } = {}
) {
  return testPrisma.task.create({
    data: {
      title: overrides.title ?? faker.hacker.phrase(),
      description: overrides.description,
      status: overrides.status ?? 'TODO',
      progress: overrides.progress ?? 0,
      priority: overrides.priority ?? 'MEDIUM',
      startDate: overrides.startDate,
      dueDate: overrides.dueDate,
      estimatedHours: overrides.estimatedHours,
      project: { connect: { id: projectId } },
      ...(overrides.milestoneId ? { milestone: { connect: { id: overrides.milestoneId } } } : {}),
      ...(overrides.acceptorId ? { acceptor: { connect: { id: overrides.acceptorId } } } : {}),
    } as any,
  })
}

/**
 * 创建测试子任务
 */
export async function createTestSubTask(
  taskId: string,
  overrides: Partial<Prisma.SubTaskCreateInput> & { parentId?: string } = {}
) {
  return testPrisma.subTask.create({
    data: {
      title: overrides.title ?? faker.word.words(3),
      description: overrides.description,
      completed: overrides.completed ?? false,
      taskId,
      ...(overrides.parentId ? { parent: { connect: { id: overrides.parentId } } } : {}),
    } as any,
  })
}

/**
 * 创建测试需求
 */
export async function createTestRequirement(
  projectId: string,
  overrides: Partial<Prisma.RequirementCreateInput> & { reviewedBy?: string } = {}
) {
  return testPrisma.requirement.create({
    data: {
      title: overrides.title ?? faker.word.words(4),
      description: overrides.description,
      status: overrides.status ?? 'PENDING',
      priority: overrides.priority ?? 'MEDIUM',
      project: { connect: { id: projectId } },
      ...(overrides.reviewedBy ? { reviewer: { connect: { id: overrides.reviewedBy } } } : {}),
    } as any,
  })
}

/**
 * 创建测试问题
 */
export async function createTestIssue(
  projectId: string,
  overrides: Partial<Prisma.IssueCreateInput> & { requirementId?: string } = {}
) {
  return testPrisma.issue.create({
    data: {
      title: overrides.title ?? faker.word.words(4),
      description: overrides.description,
      status: overrides.status ?? 'OPEN',
      priority: overrides.priority ?? 'MEDIUM',
      project: { connect: { id: projectId } },
      ...(overrides.requirementId ? { requirement: { connect: { id: overrides.requirementId } } } : {}),
    } as any,
  })
}

/**
 * 创建测试评审
 */
export async function createTestReview(
  projectId: string,
  typeId: string,
  authorId?: string,  // 可选作者ID
  overrides: Partial<Prisma.ReviewCreateInput> = {}
) {
  // 如果没有提供作者ID，获取项目所有者
  let reviewAuthorId = authorId;
  if (!reviewAuthorId) {
    const project = await testPrisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    reviewAuthorId = project?.ownerId;
  }

  if (!reviewAuthorId) {
    throw new Error('Cannot determine review author: no authorId provided and project has no owner');
  }

  return testPrisma.review.create({
    data: {
      title: overrides.title ?? faker.word.words(4),
      description: overrides.description,
      projectId,
      typeId,
      authorId: reviewAuthorId,
      scheduledAt: overrides.scheduledAt,
      status: overrides.status ?? 'PENDING',
    },
  })
}

/**
 * 创建测试风险
 */
export async function createTestRisk(
  projectId: string,
  ownerId: string,
  overrides: Partial<Prisma.RiskCreateInput> = {}
) {
  return testPrisma.risk.create({
    data: {
      title: overrides.title ?? faker.word.words(4),
      description: overrides.description,
      projectId,
      ownerId,
      category: overrides.category ?? 'TECHNICAL',
      probability: overrides.probability ?? 3,
      impact: overrides.impact ?? 3,
      riskLevel: overrides.riskLevel ?? 'MEDIUM',
      status: overrides.status ?? 'IDENTIFIED',
    },
  })
}

// ============================================
// Level 4: 关联模型
// ============================================

/**
 * 创建测试通知
 */
export async function createTestNotification(
  userId: string,
  overrides: Partial<Prisma.NotificationCreateInput> = {}
) {
  return testPrisma.notification.create({
    data: {
      type: overrides.type ?? 'TASK_ASSIGNED',
      title: overrides.title ?? faker.word.words(3),
      content: overrides.content ?? faker.lorem.sentence(),
      link: overrides.link,
      isRead: overrides.isRead ?? false,
      userId,
      projectId: overrides.projectId as string | undefined,
    },
  })
}

/**
 * 创建测试评审评论
 */
export async function createTestReviewComment(
  reviewId: string,
  authorId: string,
  overrides: Partial<{ content?: string; status?: string; materialId?: string | null; itemId?: string | null; parentId?: string | null }> = {}
) {
  return testPrisma.reviewComment.create({
    data: {
      reviewId,
      authorId,
      content: overrides.content ?? faker.lorem.sentence(),
      status: overrides.status ?? 'OPEN',
      materialId: overrides.materialId,
      itemId: overrides.itemId,
      parentId: overrides.parentId,
    },
  })
}

/**
 * 创建测试评审投票
 */
export async function createTestReviewVote(
  reviewId: string,
  userId: string,
  overrides: Partial<{ agreed?: boolean }> = {}
) {
  return testPrisma.reviewVote.create({
    data: {
      reviewId,
      userId,
      agreed: overrides.agreed ?? true,
    },
  })
}

/**
 * 创建测试审计日志
 */
export async function createTestAuditLog(
  userId: string,
  overrides: Partial<Prisma.AuditLogCreateInput> = {}
) {
  return testPrisma.auditLog.create({
    data: {
      userId,
      action: overrides.action ?? 'CREATE',
      entityType: overrides.entityType ?? 'Task',
      entityId: overrides.entityId,
      description: overrides.description,
      ipAddress: overrides.ipAddress ?? faker.internet.ipv4(),
      userAgent: overrides.userAgent ?? faker.internet.userAgent(),
    },
  })
}

// ============================================
// 批量创建工具
// ============================================

/**
 * 创建完整的测试项目结构
 * 包含：项目、成员、里程碑、任务
 */
export async function createTestProjectStructure(owner?: { id: string }) {
  const user = owner ?? (await createTestUser())
  const project = await createTestProject(user.id)
  await createTestProjectMember(project.id, user.id, { role: 'PROJECT_OWNER' })

  const milestone = await createTestMilestone(project.id)
  const task = await createTestTask(project.id, { milestoneId: milestone.id })

  return { user, project, milestone, task }
}

/**
 * 创建完整的测试评审结构
 * 包含：评审类型、评审、参与者
 */
export async function createTestReviewStructure(owner?: { id: string }) {
  const { user, project } = await createTestProjectStructure(owner)
  const reviewType = await createTestReviewTypeConfig()
  const review = await createTestReview(project.id, reviewType.id)

  return { user, project, reviewType, review }
}
