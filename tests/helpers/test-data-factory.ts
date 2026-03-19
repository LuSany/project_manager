/**
 * 测试数据工厂
 *
 * 提供类型安全的测试数据创建函数，按照数据模型依赖顺序创建
 * 使用 faker 生成随机数据，确保测试数据唯一性
 */

import { faker } from '@faker-js/faker'
import { testPrisma } from './test-db'
import type { Prisma } from '@prisma/client'
import { CommentStatus } from '@prisma/client'

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
      id: crypto.randomUUID(),
      name: overrides.name ? `${overrides.name}_${Date.now()}` : `${faker.word.noun().toUpperCase()}_${Date.now()}`,
      displayName: overrides.displayName ?? faker.word.words(2),
      description: overrides.description,
      isSystem: overrides.isSystem ?? false,
      isActive: overrides.isActive ?? true,
      updatedAt: new Date(),
    },
  })
}

/**
 * 创建测试标签
 */
export async function createTestTag(overrides: Partial<Prisma.tagsCreateInput> = {}) {
  return testPrisma.tags.create({
    data: {
      id: faker.string.uuid(),
      name: overrides.name ?? `tag-${faker.string.alphanumeric(8)}`,
      color: overrides.color ?? faker.color.rgb(),
      updatedAt: new Date(),
    },
  })
}

/**
 * 创建测试 AI 配置
 */
export async function createTestAIConfig(overrides: Partial<Prisma.ai_configsCreateInput> = {}) {
  return testPrisma.ai_configs.create({
    data: {
      id: faker.string.uuid(),
      name: overrides.name ?? `ai-config-${faker.string.alphanumeric(8)}`,
      provider: overrides.provider ?? 'OPENAI',
      apiKey: overrides.apiKey ?? faker.string.alphanumeric(32),
      model: overrides.model ?? 'gpt-4o-mini',
      isActive: overrides.isActive ?? true,
      isDefault: overrides.isDefault ?? false,
      updatedAt: new Date(),
    },
  })
}

/**
 * 创建测试邮件配置
 */
export async function createTestEmailConfig(
  overrides: Partial<Prisma.email_configsCreateInput> = {}
) {
  return testPrisma.email_configs.create({
    data: {
      id: faker.string.uuid(),
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
      updatedAt: new Date(),
    },
  })
}

// ============================================
// Level 1: 用户相关模型
// ============================================

/**
 * 创建测试用户
 */
export async function createTestUser(overrides: Partial<Prisma.usersCreateInput> = {}) {
  const email = overrides.email ?? `test-${Date.now()}-${faker.string.alphanumeric(6)}@example.com`

  return testPrisma.users.create({
    data: {
      id: faker.string.uuid(),
      email,
      passwordHash: overrides.passwordHash ?? faker.string.alphanumeric(60),
      name: overrides.name ?? faker.person.fullName(),
      avatar: overrides.avatar,
      phone: overrides.phone,
      department: overrides.department,
      position: overrides.position,
      status: overrides.status ?? 'ACTIVE',
      role: overrides.role ?? 'EMPLOYEE',
      updatedAt: new Date(),
    },
  })
}

/**
 * 创建测试管理员用户
 */
export async function createTestAdminUser(overrides: Partial<Prisma.usersCreateInput> = {}) {
  return createTestUser({ ...overrides, role: 'ADMIN' })
}

/**
 * 创建待审批用户
 */
export async function createTestPendingUser(overrides: Partial<Prisma.usersCreateInput> = {}) {
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
  overrides: Partial<Prisma.projectsCreateInput> = {}
) {
  return testPrisma.projects.create({
    data: {
      id: faker.string.uuid(),
      name: overrides.name ?? faker.company.name(),
      description: overrides.description,
      status: overrides.status ?? 'PLANNING',
      startDate: overrides.startDate,
      endDate: overrides.endDate,
      users: { connect: { id: ownerId } },
      updatedAt: new Date(),
    },
  })
}

/**
 * 创建测试项目成员
 */
export async function createTestProjectMember(
  projectId: string,
  userId: string,
  overrides: Partial<Prisma.project_membersCreateInput> = {}
) {
  return testPrisma.project_members.create({
    data: {
      projects: { connect: { id: projectId } },
      users: { connect: { id: userId } },
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
  overrides: Partial<Prisma.milestonesCreateInput> = {}
) {
  return testPrisma.milestones.create({
    data: {
      id: faker.string.uuid(),
      title: overrides.title ?? faker.word.words(3),
      description: overrides.description,
      status: overrides.status ?? 'NOT_STARTED',
      progress: overrides.progress ?? 0,
      dueDate: overrides.dueDate,
      projects: { connect: { id: projectId } },
      updatedAt: new Date(),
    },
  })
}

/**
 * 创建测试任务
 */
export async function createTestTask(
  projectId: string,
  overrides: Partial<Prisma.tasksCreateInput> & { milestoneId?: string; acceptorId?: string } = {}
) {
  return testPrisma.tasks.create({
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
  overrides: Partial<Prisma.subtasksCreateInput> & { parentId?: string } = {}
) {
  return testPrisma.subtasks.create({
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
  overrides: Partial<Prisma.requirementsCreateInput> & { reviewedBy?: string } = {}
) {
  return testPrisma.requirements.create({
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
  overrides: Partial<Prisma.issuesCreateInput> & { requirementId?: string } = {}
) {
  return testPrisma.issues.create({
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
  overrides: Partial<Prisma.reviewsCreateInput> = {}
) {
  // 如果没有提供作者ID，获取项目所有者
  let reviewAuthorId = authorId;
  if (!reviewAuthorId) {
    const project = await testPrisma.projects.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    reviewAuthorId = project?.ownerId;
  }

  if (!reviewAuthorId) {
    throw new Error('Cannot determine review author: no authorId provided and project has no owner');
  }

  return testPrisma.reviews.create({
    data: {
      id: faker.string.uuid(),
      title: overrides.title ?? faker.word.words(4),
      description: overrides.description,
      projects: { connect: { id: projectId } },
      ReviewTypeConfig: { connect: { id: typeId } },
      users: { connect: { id: reviewAuthorId } },
      scheduledAt: overrides.scheduledAt,
      status: overrides.status ?? 'PENDING',
      updatedAt: new Date(),
    },
  })
}

/**
 * 创建测试风险
 */
export async function createTestRisk(
  projectId: string,
  ownerId: string,
  overrides: Partial<Prisma.risksCreateInput> = {}
) {
  return testPrisma.risks.create({
    data: {
      id: faker.string.uuid(),
      title: overrides.title ?? faker.word.words(4),
      description: overrides.description,
      projects: { connect: { id: projectId } },
      users: { connect: { id: ownerId } },
      category: overrides.category ?? 'TECHNICAL',
      probability: overrides.probability ?? 3,
      impact: overrides.impact ?? 3,
      riskLevel: overrides.riskLevel ?? 'MEDIUM',
      status: overrides.status ?? 'IDENTIFIED',
      updatedAt: new Date(),
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
  overrides: Partial<Prisma.notificationsCreateInput> = {}
) {
  return testPrisma.notifications.create({
    data: {
      id: faker.string.uuid(),
      type: overrides.type ?? 'TASK_ASSIGNED',
      title: overrides.title ?? faker.word.words(3),
      content: overrides.content ?? faker.lorem.sentence(),
      link: overrides.link,
      isRead: overrides.isRead ?? false,
      users: { connect: { id: userId } },
      projectId: overrides.projectId as string | undefined,
      createdAt: new Date(),
    },
  })
}

/**
 * 创建测试评审评论
 */
export async function createTestReviewComment(
  reviewId: string,
  authorId: string,
  overrides: Partial<{ content?: string; status?: CommentStatus; materialId?: string | null; itemId?: string | null; parentId?: string | null }> = {}
) {
  return testPrisma.review_comments.create({
    data: {
      id: faker.string.uuid(),
      reviews: { connect: { id: reviewId } },
      users: { connect: { id: authorId } },
      content: overrides.content ?? faker.lorem.sentence(),
      status: overrides.status ?? CommentStatus.OPEN,
      review_materials: overrides.materialId ? { connect: { id: overrides.materialId } } : undefined,
      review_items: overrides.itemId ? { connect: { id: overrides.itemId } } : undefined,
      other_review_comments: overrides.parentId ? { connect: { id: overrides.parentId } } : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
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
  return testPrisma.review_votes.create({
    data: {
      reviews: { connect: { id: reviewId } },
      users: { connect: { id: userId } },
      agreed: overrides.agreed ?? true,
      votedAt: new Date(),
    },
  })
}

/**
 * 创建测试审计日志
 */
export async function createTestAuditLog(
  userId: string,
  overrides: Partial<Prisma.audit_logsCreateInput> = {}
) {
  return testPrisma.audit_logs.create({
    data: {
      id: faker.string.uuid(),
      userId,
      action: overrides.action ?? 'CREATE',
      entityType: overrides.entityType ?? 'Task',
      entityId: overrides.entityId,
      description: overrides.description,
      ipAddress: overrides.ipAddress ?? faker.internet.ipv4(),
      userAgent: overrides.userAgent ?? faker.internet.userAgent(),
      createdAt: new Date(),
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
