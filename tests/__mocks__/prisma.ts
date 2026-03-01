/**
 * Prisma Client Mock
 * 提供完整的 Prisma Client Mock 实现，支持所有 Model 操作
 */

import { vi } from 'vitest'

// ============================================================================
// 类型定义
// ============================================================================

// 基础类型
type ID = string
type DateTime = Date

// 枚举类型（从 schema.prisma 映射）
export type UserStatus = 'PENDING' | 'ACTIVE' | 'DISABLED'
export type SystemRole = 'ADMIN' | 'PROJECT_ADMIN' | 'PROJECT_OWNER' | 'PROJECT_MEMBER' | 'EMPLOYEE'
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
export type ProjectMemberRole = 'PROJECT_OWNER' | 'PROJECT_ADMIN' | 'PROJECT_MEMBER'
export type MilestoneStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type TaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'TESTING'
  | 'DONE'
  | 'CANCELLED'
  | 'DELAYED'
  | 'BLOCKED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type DependencyType =
  | 'FINISH_TO_START'
  | 'START_TO_START'
  | 'FINISH_TO_FINISH'
  | 'START_TO_FINISH'
export type RequirementStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED'
export type RequirementPriority = 'LOW' | 'MEDIUM' | 'HIGH'
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REOPENED'
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type ReviewStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type ReviewParticipantRole = 'REVIEWER' | 'OBSERVER' | 'SECRETARY'
export type NotificationType =
  | 'RISK_ALERT'
  | 'REVIEW_INVITE'
  | 'URGENT_TASK'
  | 'TASK_DUE_REMINDER'
  | 'TASK_ASSIGNED'
  | 'COMMENT_MENTION'
  | 'DAILY_DIGEST'
export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS'
export type AcceptanceResult = 'PENDING' | 'PASSED' | 'FAILED' | 'CONDITIONAL'
export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'
export type ImpactSeverity = 'LOW' | 'MEDIUM' | 'HIGH'
export type RiskCategory =
  | 'TECHNICAL'
  | 'SCHEDULE'
  | 'RESOURCE'
  | 'BUDGET'
  | 'EXTERNAL'
  | 'MANAGEMENT'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type RiskStatus =
  | 'IDENTIFIED'
  | 'ANALYZING'
  | 'MITIGATING'
  | 'MONITORING'
  | 'RESOLVED'
  | 'CLOSED'
export type EmailStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED'

// Model 类型
export interface MockUser {
  id: ID
  email: string
  passwordHash: string
  name: string
  avatar?: string | null
  phone?: string | null
  department?: string | null
  position?: string | null
  status: UserStatus
  role: SystemRole
  createdAt: DateTime
  updatedAt: DateTime
}

export interface MockProject {
  id: ID
  name: string
  description?: string | null
  status: ProjectStatus
  startDate?: DateTime | null
  endDate?: DateTime | null
  ownerId: string
  createdAt: DateTime
  updatedAt: DateTime
}

export interface MockProjectMember {
  projectId: string
  userId: string
  role: ProjectMemberRole
  joinedAt: DateTime
}

export interface MockMilestone {
  id: ID
  title: string
  description?: string | null
  status: MilestoneStatus
  progress: number
  dueDate?: DateTime | null
  projectId: string
  createdAt: DateTime
  updatedAt: DateTime
}

export interface MockTask {
  id: ID
  title: string
  description?: string | null
  status: TaskStatus
  progress: number
  priority: TaskPriority
  startDate?: DateTime | null
  dueDate?: DateTime | null
  estimatedHours?: number | null
  projectId: string
  milestoneId?: string | null
  issueId?: string | null
  acceptorId?: string | null
  createdAt: DateTime
  updatedAt: DateTime
}

export interface MockTaskAssignee {
  taskId: string
  userId: string
  assignedAt: DateTime
}

export interface MockTaskWatcher {
  taskId: string
  userId: string
  createdAt: DateTime
}

export interface MockTaskDependency {
  id: ID
  taskId: string
  dependsOnId: string
  dependencyType: DependencyType
  createdAt: DateTime
}

export interface MockSubTask {
  id: ID
  title: string
  description?: string | null
  completed: boolean
  taskId: string
  parentId?: string | null
  createdAt: DateTime
  updatedAt: DateTime
}

export interface MockTag {
  id: ID
  name: string
  color: string
  createdAt: DateTime
  updatedAt: DateTime
}

export interface MockTaskTag {
  taskId: string
  tagId: string
  createdAt: DateTime
}

export interface MockRequirement {
  id: ID
  title: string
  description?: string | null
  status: RequirementStatus
  priority: RequirementPriority
  projectId: string
  reviewedBy?: string | null
  reviewedAt?: DateTime | null
  rejectReason?: string | null
  createdAt: DateTime
  updatedAt: DateTime
}

export interface MockProposal {
  id: ID
  requirementId: string
  userId: string
  content: string
  estimatedHours?: number | null
  estimatedCost?: number | null
  status: ProposalStatus
  createdAt: DateTime
  updatedAt: DateTime
}

export interface MockRequirementImpact {
  id: ID
  requirementId: string
  description: string
  severity: ImpactSeverity
  createdAt: DateTime
}

export interface MockRequirementAcceptance {
  id: ID
  requirementId: string
  userId: string
  result: AcceptanceResult
  notes?: string | null
  createdAt: DateTime
}

export interface MockRequirementDiscussion {
  id: ID
  requirementId: string
  userId: string
  content: string
  taskId?: string | null
  createdAt: DateTime
  updatedAt: DateTime
}

export interface MockRequirementHistory {
  id: ID
  requirementId: string
  changeType: string
  oldValue?: string | null
  newValue?: string | null
  changedBy: string
  changeReason?: string | null
  createdAt: DateTime
}

export interface MockIssue {
  id: ID
  title: string
  description?: string | null
  status: IssueStatus
  priority: IssuePriority
  projectId: string
  requirementId?: string | null
  autoClose: boolean
  resolvedAt?: DateTime | null
  createdAt: DateTime
  updatedAt: DateTime
}

export interface MockReviewTypeConfig {
  id: ID
  name: string
  displayName: string
  description?: string | null
  isSystem: boolean
  isActive: boolean
  createdAt: DateTime
  updatedAt: DateTime
}

export interface MockReviewTemplate {
  id: ID
  typeId: string
  name: string
  description?: string | null
  isActive: boolean
  createdAt: DateTime
  updatedAt: DateTime
}

export interface MockReviewTemplateItem {
  id: ID
  templateId: string
  title: string
  content?: string | null
  order: number
  required: boolean
  createdAt: DateTime
}

export interface MockReview {
  id: ID
  title: string
  description?: string | null
  projectId: string
  typeId: string
  scheduledAt?: DateTime | null
  status: ReviewStatus
  passedCriteria: number
  totalScore?: number | null
  createdAt: DateTime
  updatedAt: DateTime
}

export interface MockReviewMaterial {
  id: ID
  reviewId: string
  fileId: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: DateTime
}

export interface MockReviewParticipant {
  reviewId: string
  userId: string
  role: ReviewParticipantRole
  joinedAt: DateTime
}

export interface MockReviewItem {
  id: ID
  reviewId: string
  title: string
  description?: string | null
  category?: string | null
  isRequired: boolean
  order: number
  createdAt: DateTime
}

export interface MockReviewCriterion {
  id: ID
  reviewId: string
  title: string
  description?: string | null
  weight: number
  maxScore: number
  order: number
  createdAt: DateTime
}

export interface MockFileStorage {
  id: ID
  fileName: string
  originalName: string
  filePath: string
  fileSize: number
  mimeType: string
  uploadedBy: string
  createdAt: DateTime
}

export interface MockNotification {
  id: ID
  type: NotificationType
  title: string
  content: string
  link?: string | null
  isRead: boolean
  userId: string
  projectId?: string | null
  createdAt: DateTime
}

export interface MockNotificationPreference {
  userId: string
  type: NotificationType
  enabled: boolean
  channel: NotificationChannel
  createdAt: DateTime
}

export interface MockNotificationIgnore {
  userId: string
  projectId: string
  createdAt: DateTime
}

export interface MockPasswordResetToken {
  id: ID
  token: string
  userId: string
  expiresAt: DateTime
  used: boolean
  createdAt: DateTime
}

export interface MockEmailConfig {
  id: ID
  name: string
  provider: string
  apiKey?: string | null
  smtpHost?: string | null
  smtpPort?: number | null
  smtpUser?: string | null
  smtpPassword?: string | null
  fromAddress: string
  fromName?: string | null
  isActive: boolean
  isDefault: boolean
  createdAt: DateTime
  updatedAt: DateTime
}

export interface MockEmailLog {
  id: ID
  userId?: string | null
  projectId?: string | null
  to: string
  subject: string
  content: string
  templateType?: string | null
  status: EmailStatus
  errorMessage?: string | null
  externalId?: string | null
  sentAt?: DateTime | null
  createdAt: DateTime
}

export interface MockEmailTemplate {
  id: ID
  name: string
  type: string
  subject: string
  body: string
  variables?: string | null
  isActive: boolean
  createdAt: DateTime
  updatedAt: DateTime
}

export interface MockRisk {
  id: ID
  projectId: string
  title: string
  description?: string | null
  category: RiskCategory
  probability: number
  impact: number
  riskLevel: RiskLevel
  status: RiskStatus
  progress: number
  mitigation?: string | null
  contingency?: string | null
  ownerId: string
  isAiIdentified: boolean
  aiRiskScore?: number | null
  aiSuggestion?: string | null
  identifiedDate: DateTime
  dueDate?: DateTime | null
  resolvedDate?: DateTime | null
  createdAt: DateTime
  updatedAt: DateTime
}

export interface MockRiskTask {
  id: ID
  riskId: string
  taskId: string
  relationType: string
  createdAt: DateTime
}

export interface MockAuditLog {
  id: ID
  userId: string
  action: string
  entityType: string
  entityId?: string | null
  description?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: DateTime
}

// ============================================================================
// 数据存储
// ============================================================================

interface MockDatabase {
  users: Map<ID, MockUser>
  projects: Map<ID, MockProject>
  projectMembers: Map<string, MockProjectMember>
  milestones: Map<ID, MockMilestone>
  tasks: Map<ID, MockTask>
  taskAssignees: Map<string, MockTaskAssignee>
  taskWatchers: Map<string, MockTaskWatcher>
  taskDependencies: Map<ID, MockTaskDependency>
  subTasks: Map<ID, MockSubTask>
  tags: Map<ID, MockTag>
  taskTags: Map<string, MockTaskTag>
  requirements: Map<ID, MockRequirement>
  proposals: Map<ID, MockProposal>
  requirementImpacts: Map<ID, MockRequirementImpact>
  requirementAcceptances: Map<ID, MockRequirementAcceptance>
  requirementDiscussions: Map<ID, MockRequirementDiscussion>
  requirementHistories: Map<ID, MockRequirementHistory>
  issues: Map<ID, MockIssue>
  reviewTypeConfigs: Map<ID, MockReviewTypeConfig>
  reviewTemplates: Map<ID, MockReviewTemplate>
  reviewTemplateItems: Map<ID, MockReviewTemplateItem>
  reviews: Map<ID, MockReview>
  reviewMaterials: Map<ID, MockReviewMaterial>
  reviewParticipants: Map<string, MockReviewParticipant>
  reviewItems: Map<ID, MockReviewItem>
  reviewCriteria: Map<ID, MockReviewCriterion>
  fileStorage: Map<ID, MockFileStorage>
  notifications: Map<ID, MockNotification>
  notificationPreferences: Map<string, MockNotificationPreference>
  notificationIgnores: Map<string, MockNotificationIgnore>
  passwordResetTokens: Map<ID, MockPasswordResetToken>
  emailConfigs: Map<ID, MockEmailConfig>
  emailLogs: Map<ID, MockEmailLog>
  emailTemplates: Map<ID, MockEmailTemplate>
  risks: Map<ID, MockRisk>
  riskTasks: Map<ID, MockRiskTask>
  auditLogs: Map<ID, MockAuditLog>
}

// 创建数据库实例
function createMockDatabase(): MockDatabase {
  return {
    users: new Map(),
    projects: new Map(),
    projectMembers: new Map(),
    milestones: new Map(),
    tasks: new Map(),
    taskAssignees: new Map(),
    taskWatchers: new Map(),
    taskDependencies: new Map(),
    subTasks: new Map(),
    tags: new Map(),
    taskTags: new Map(),
    requirements: new Map(),
    proposals: new Map(),
    requirementImpacts: new Map(),
    requirementAcceptances: new Map(),
    requirementDiscussions: new Map(),
    requirementHistories: new Map(),
    issues: new Map(),
    reviewTypeConfigs: new Map(),
    reviewTemplates: new Map(),
    reviewTemplateItems: new Map(),
    reviews: new Map(),
    reviewMaterials: new Map(),
    reviewParticipants: new Map(),
    reviewItems: new Map(),
    reviewCriteria: new Map(),
    fileStorage: new Map(),
    notifications: new Map(),
    notificationPreferences: new Map(),
    notificationIgnores: new Map(),
    passwordResetTokens: new Map(),
    emailConfigs: new Map(),
    emailLogs: new Map(),
    emailTemplates: new Map(),
    risks: new Map(),
    riskTasks: new Map(),
    auditLogs: new Map(),
  }
}

// 全局数据库实例
let db = createMockDatabase()

// ============================================================================
// 工具函数
// ============================================================================

function generateId(): string {
  return `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

function resetDatabase(): void {
  db = createMockDatabase()
}

function getDatabase(): MockDatabase {
  return db
}

// ============================================================================
// Mock Model 实现
// ============================================================================

function createMockModel<T extends { id?: string }>(
  store: Map<string, T>,
  defaultValues: Partial<T> = {}
) {
  return {
    create: vi.fn(
      async ({ data }: { data: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & Partial<T> }) => {
        const id = (data as any).id || generateId()
        const now = new Date()
        const record = {
          ...defaultValues,
          ...data,
          id,
          createdAt: (data as any).createdAt || now,
          updatedAt: (data as any).updatedAt || now,
        } as T
        store.set(id, record)
        return record
      }
    ),

    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
      return store.get(where.id) || null
    }),

    findFirst: vi.fn(async ({ where, orderBy, include }: any) => {
      const records = Array.from(store.values())
      let filtered = records

      if (where) {
        filtered = records.filter((record) => {
          return Object.entries(where).every(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              // 处理操作符
              const operators = value as Record<string, any>
              if (operators.in && !operators.in.includes((record as any)[key])) return false
              if (operators.not && (record as any)[key] === operators.not) return false
              if (operators.gt && !((record as any)[key] > operators.gt)) return false
              if (operators.gte && !((record as any)[key] >= operators.gte)) return false
              if (operators.lt && !((record as any)[key] < operators.lt)) return false
              if (operators.lte && !((record as any)[key] <= operators.lte)) return false
              return true
            }
            return (record as any)[key] === value
          })
        })
      }

      if (orderBy) {
        const [field, direction] = Object.entries(orderBy)[0]
        filtered.sort((a, b) => {
          const aVal = (a as any)[field]
          const bVal = (b as any)[field]
          if (direction === 'desc') return aVal < bVal ? 1 : -1
          return aVal > bVal ? 1 : -1
        })
      }

      return filtered[0] || null
    }),

    findMany: vi.fn(async ({ where, orderBy, skip, take, include }: any = {}) => {
      let records = Array.from(store.values())

      if (where) {
        records = records.filter((record) => {
          return Object.entries(where).every(([key, value]) => {
            if (key === 'OR') {
              return (value as any[]).some((condition: any) =>
                Object.entries(condition).every(([k, v]) => {
                  if (typeof v === 'object' && v !== null && 'in' in v) {
                    return (v as any).in.includes((record as any)[k])
                  }
                  return (record as any)[k] === v
                })
              )
            }
            if (typeof value === 'object' && value !== null) {
              const operators = value as Record<string, any>
              if ('in' in operators && !operators.in.includes((record as any)[key])) return false
              if ('not' in operators && (record as any)[key] === operators.not) return false
              if ('gt' in operators && !((record as any)[key] > operators.gt)) return false
              if ('gte' in operators && !((record as any)[key] >= operators.gte)) return false
              if ('lt' in operators && !((record as any)[key] < operators.lt)) return false
              if ('lte' in operators && !((record as any)[key] <= operators.lte)) return false
              if ('contains' in operators && typeof (record as any)[key] === 'string') {
                return (record as any)[key].includes(operators.contains)
              }
              return true
            }
            return (record as any)[key] === value
          })
        })
      }

      if (orderBy) {
        const entries = Object.entries(orderBy)
        for (const [field, direction] of entries.reverse()) {
          records.sort((a, b) => {
            const aVal = (a as any)[field]
            const bVal = (b as any)[field]
            if (direction === 'desc') return aVal < bVal ? 1 : -1
            return aVal > bVal ? 1 : -1
          })
        }
      }

      if (skip) records = records.slice(skip)
      if (take) records = records.slice(0, take)

      return records
    }),

    update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<T> }) => {
      const record = store.get(where.id)
      if (!record) throw new Error(`Record not found: ${where.id}`)
      const updated = { ...record, ...data, updatedAt: new Date() } as T
      store.set(where.id, updated)
      return updated
    }),

    delete: vi.fn(async ({ where }: { where: { id: string } }) => {
      const record = store.get(where.id)
      if (!record) throw new Error(`Record not found: ${where.id}`)
      store.delete(where.id)
      return record
    }),

    deleteMany: vi.fn(async ({ where }: { where?: Partial<T> } = {}) => {
      if (!where) {
        const count = store.size
        store.clear()
        return { count }
      }
      const keysToDelete: string[] = []
      store.forEach((record, key) => {
        const matches = Object.entries(where).every(([k, v]) => (record as any)[k] === v)
        if (matches) keysToDelete.push(key)
      })
      keysToDelete.forEach((key) => store.delete(key))
      return { count: keysToDelete.length }
    }),

    count: vi.fn(async ({ where }: { where?: Partial<T> } = {}) => {
      if (!where) return store.size
      let count = 0
      store.forEach((record) => {
        const matches = Object.entries(where).every(([k, v]) => {
          if (typeof v === 'object' && v !== null && 'in' in v) {
            return (v as any).in.includes((record as any)[k])
          }
          return (record as any)[k] === v
        })
        if (matches) count++
      })
      return count
    }),

    upsert: vi.fn(
      async ({
        where,
        create,
        update,
      }: {
        where: { id: string }
        create: T
        update: Partial<T>
      }) => {
        const existing = store.get(where.id)
        if (existing) {
          const updated = { ...existing, ...update, updatedAt: new Date() } as T
          store.set(where.id, updated)
          return updated
        }
        const id = where.id || generateId()
        const now = new Date()
        const record = {
          ...create,
          id,
          createdAt: (create as any).createdAt || now,
          updatedAt: now,
        } as T
        store.set(id, record)
        return record
      }
    ),
  }
}

// 复合主键 Model 实现
function createCompositeKeyModel<T extends Record<string, any>>(
  store: Map<string, T>,
  getKey: (record: T) => string,
  defaultValues: Partial<T> = {}
) {
  return {
    create: vi.fn(async ({ data }: { data: Omit<T, 'createdAt'> & Partial<T> }) => {
      const now = new Date()
      const record = {
        ...defaultValues,
        ...data,
        createdAt: (data as any).createdAt || now,
      } as T
      const key = getKey(record)
      store.set(key, record)
      return record
    }),

    findUnique: vi.fn(async ({ where }: { where: Record<string, any> }) => {
      const key = Object.values(where).join('_')
      return store.get(key) || null
    }),

    findMany: vi.fn(async ({ where }: { where?: Partial<T> } = {}) => {
      let records = Array.from(store.values())
      if (where) {
        records = records.filter((record) => {
          return Object.entries(where).every(([key, value]) => {
            return (record as any)[key] === value
          })
        })
      }
      return records
    }),

    delete: vi.fn(async ({ where }: { where: Record<string, any> }) => {
      const key = Object.values(where).join('_')
      const record = store.get(key)
      if (!record) throw new Error(`Record not found: ${key}`)
      store.delete(key)
      return record
    }),

    deleteMany: vi.fn(async ({ where }: { where?: Partial<T> } = {}) => {
      if (!where) {
        const count = store.size
        store.clear()
        return { count }
      }
      const keysToDelete: string[] = []
      store.forEach((record, key) => {
        const matches = Object.entries(where).every(([k, v]) => (record as any)[k] === v)
        if (matches) keysToDelete.push(key)
      })
      keysToDelete.forEach((key) => store.delete(key))
      return { count: keysToDelete.length }
    }),

    update: vi.fn(async ({ where, data }: { where: Record<string, any>; data: Partial<T> }) => {
      const key = Object.values(where).join('_')
      const record = store.get(key)
      if (!record) throw new Error(`Record not found: ${key}`)
      const updated = { ...record, ...data } as T
      store.set(key, updated)
      return updated
    }),
  }
}

// ============================================================================
// 导出 Mock Prisma Client
// ============================================================================

export const mockPrisma = {
  // 用户管理
  user: createMockModel<MockUser>(db.users, { status: 'PENDING', role: 'EMPLOYEE' }),

  // 项目管理
  project: createMockModel<MockProject>(db.projects, { status: 'PLANNING' }),
  projectMember: createCompositeKeyModel<MockProjectMember>(
    db.projectMembers,
    (r) => `${r.projectId}_${r.userId}`,
    { role: 'PROJECT_MEMBER' }
  ),

  // 里程碑
  milestone: createMockModel<MockMilestone>(db.milestones, { status: 'NOT_STARTED', progress: 0 }),

  // 任务管理
  task: createMockModel<MockTask>(db.tasks, { status: 'TODO', progress: 0, priority: 'MEDIUM' }),
  taskAssignee: createCompositeKeyModel<MockTaskAssignee>(
    db.taskAssignees,
    (r) => `${r.taskId}_${r.userId}`
  ),
  taskWatcher: createCompositeKeyModel<MockTaskWatcher>(
    db.taskWatchers,
    (r) => `${r.taskId}_${r.userId}`
  ),
  taskDependency: createMockModel<MockTaskDependency>(db.taskDependencies, {
    dependencyType: 'FINISH_TO_START',
  }),

  // 子任务
  subTask: createMockModel<MockSubTask>(db.subTasks, { completed: false }),

  // 标签
  tag: createMockModel<MockTag>(db.tags, { color: '#3B82F6' }),
  taskTag: createCompositeKeyModel<MockTaskTag>(db.taskTags, (r) => `${r.taskId}_${r.tagId}`),

  // 需求管理
  requirement: createMockModel<MockRequirement>(db.requirements, {
    status: 'PENDING',
    priority: 'MEDIUM',
  }),
  proposal: createMockModel<MockProposal>(db.proposals, { status: 'PENDING' }),
  requirementImpact: createMockModel<MockRequirementImpact>(db.requirementImpacts, {
    severity: 'MEDIUM',
  }),
  requirementAcceptance: createMockModel<MockRequirementAcceptance>(db.requirementAcceptances, {
    result: 'PENDING',
  }),
  requirementDiscussion: createMockModel<MockRequirementDiscussion>(db.requirementDiscussions),
  requirementHistory: createMockModel<MockRequirementHistory>(db.requirementHistories),

  // 问题管理
  issue: createMockModel<MockIssue>(db.issues, {
    status: 'OPEN',
    priority: 'MEDIUM',
    autoClose: true,
  }),

  // 评审管理
  reviewTypeConfig: createMockModel<MockReviewTypeConfig>(db.reviewTypeConfigs, {
    isSystem: false,
    isActive: true,
  }),
  reviewTemplate: createMockModel<MockReviewTemplate>(db.reviewTemplates, { isActive: true }),
  reviewTemplateItem: createMockModel<MockReviewTemplateItem>(db.reviewTemplateItems, {
    order: 0,
    required: false,
  }),
  review: createMockModel<MockReview>(db.reviews, { status: 'PENDING', passedCriteria: 0 }),
  reviewMaterial: createMockModel<MockReviewMaterial>(db.reviewMaterials),
  reviewParticipant: createCompositeKeyModel<MockReviewParticipant>(
    db.reviewParticipants,
    (r) => `${r.reviewId}_${r.userId}`
  ),
  reviewItem: createMockModel<MockReviewItem>(db.reviewItems, { isRequired: false, order: 0 }),
  reviewCriterion: createMockModel<MockReviewCriterion>(db.reviewCriteria, {
    weight: 1.0,
    maxScore: 10,
    order: 0,
  }),

  // 文件存储
  fileStorage: createMockModel<MockFileStorage>(db.fileStorage),

  // 通知系统
  notification: createMockModel<MockNotification>(db.notifications, { isRead: false }),
  notificationPreference: createCompositeKeyModel<MockNotificationPreference>(
    db.notificationPreferences,
    (r) => `${r.userId}_${r.type}_${r.channel}`,
    { enabled: true, channel: 'IN_APP' }
  ),
  notificationIgnore: createCompositeKeyModel<MockNotificationIgnore>(
    db.notificationIgnores,
    (r) => `${r.userId}_${r.projectId}`
  ),

  // 密码重置
  passwordResetToken: createMockModel<MockPasswordResetToken>(db.passwordResetTokens, {
    used: false,
  }),

  // 邮件服务
  emailConfig: createMockModel<MockEmailConfig>(db.emailConfigs, {
    isActive: true,
    isDefault: false,
  }),
  emailLog: createMockModel<MockEmailLog>(db.emailLogs, { status: 'PENDING' }),
  emailTemplate: createMockModel<MockEmailTemplate>(db.emailTemplates, { isActive: true }),

  // 风险管理
  risk: createMockModel<MockRisk>(db.risks, {
    category: 'TECHNICAL',
    probability: 1,
    impact: 1,
    riskLevel: 'LOW',
    status: 'IDENTIFIED',
    progress: 0,
    isAiIdentified: false,
  }),
  riskTask: createMockModel<MockRiskTask>(db.riskTasks, { relationType: 'RELATED' }),

  // 审计日志
  auditLog: createMockModel<MockAuditLog>(db.auditLogs),

  // 连接管理
  $connect: vi.fn(async () => {}),
  $disconnect: vi.fn(async () => {}),
  $transaction: vi.fn(async (fn: any) => fn(mockPrisma)),
  $extends: vi.fn(() => mockPrisma),
}

// 导出工具函数
export { resetDatabase, getDatabase, generateId }

// 默认导出
export default mockPrisma
