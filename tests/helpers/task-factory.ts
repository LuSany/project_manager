/**
 * 任务测试数据工厂
 *
 * 提供类型安全的测试数据创建函数，用于生成 MockTask 数据
 * 参考 test-data-factory.ts 模式
 */

import { faker } from '@faker-js/faker'

// ============================================
// 类型定义
// ============================================

/**
 * 任务状态类型
 */
export type MockTaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'TESTING'
  | 'DONE'
  | 'CANCELLED'
  | 'DELAYED'
  | 'BLOCKED'

/**
 * 任务优先级类型
 */
export type MockTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

/**
 * 模拟任务数据接口
 * 与 TaskKanban.tsx 中的 Task 接口保持一致
 */
export interface MockTask {
  id: string
  title: string
  description: string | null
  status: MockTaskStatus
  progress: number
  priority: MockTaskPriority
  startDate: string | null
  dueDate: string | null
  createdAt: string
  assignees?: Array<{
    user: {
      id: string
      name: string
      email: string
    }
  }>
}

/**
 * 任务工厂创建选项
 */
export interface MockTaskOverrides extends Partial<MockTask> {
  assigneeCount?: number
}

// ============================================
// 默认值
// ============================================

const DEFAULT_STATUS: MockTaskStatus = 'TODO'
const DEFAULT_PRIORITY: MockTaskPriority = 'MEDIUM'
const DEFAULT_PROGRESS = 0

// ============================================
// TaskFactory 类
// ============================================

/**
 * 任务测试数据工厂
 *
 * Usage:
 * ```typescript
 * // 创建单个任务
 * const task = taskFactory.create()
 *
 * // 创建带覆盖的任务
 * const highPriorityTask = taskFactory.create({ priority: 'HIGH' })
 *
 * // 创建任务列表
 * const tasks = taskFactory.createList(5)
 *
 * // 创建带分配者的任务
 * const taskWithAssignees = taskFactory.create({ assigneeCount: 3 })
 * ```
 */
class TaskFactory {
  /**
   * 创建单个任务
   * @param overrides - 覆盖默认值的属性
   * @returns MockTask 对象
   */
  create(overrides: MockTaskOverrides = {}): MockTask {
    const { assigneeCount = 0, ...taskOverrides } = overrides

    const now = new Date().toISOString()
    const id = taskOverrides.id ?? crypto.randomUUID()

    // 生成分配者列表
    let assignees: MockTask['assignees'] | undefined
    if (assigneeCount > 0) {
      assignees = Array.from({ length: assigneeCount }, (_, index) => ({
        user: {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          email: faker.internet.email(),
        },
      }))
    }

    return {
      id,
      title: taskOverrides.title ?? faker.hacker.phrase(),
      description: taskOverrides.description ?? null,
      status: taskOverrides.status ?? DEFAULT_STATUS,
      progress: taskOverrides.progress ?? DEFAULT_PROGRESS,
      priority: taskOverrides.priority ?? DEFAULT_PRIORITY,
      startDate: taskOverrides.startDate ?? null,
      dueDate: taskOverrides.dueDate ?? null,
      createdAt: taskOverrides.createdAt ?? now,
      assignees: taskOverrides.assignees ?? assignees,
    }
  }

  /**
   * 创建任务列表
   * @param count - 任务数量
   * @param overrides - 应用于所有任务的覆盖属性
   * @returns MockTask 数组
   */
  createList(count: number, overrides: MockTaskOverrides = {}): MockTask[] {
    return Array.from({ length: count }, () => this.create(overrides))
  }

  /**
   * 创建特定状态的任务
   * @param status - 任务状态
   * @param overrides - 其他覆盖属性
   * @returns MockTask 对象
   */
  createWithStatus(status: MockTaskStatus, overrides: MockTaskOverrides = {}): MockTask {
    return this.create({ ...overrides, status })
  }

  /**
   * 创建特定优先级的任务
   * @param priority - 任务优先级
   * @param overrides - 其他覆盖属性
   * @returns MockTask 对象
   */
  createWithPriority(priority: MockTaskPriority, overrides: MockTaskOverrides = {}): MockTask {
    return this.create({ ...overrides, priority })
  }

  /**
   * 创建已完成任务
   * @param overrides - 其他覆盖属性
   * @returns MockTask 对象
   */
  createCompleted(overrides: MockTaskOverrides = {}): MockTask {
    return this.create({
      ...overrides,
      status: 'DONE',
      progress: 100,
    })
  }

  /**
   * 创建进行中任务
   * @param progress - 进度百分比 (0-100)
   * @param overrides - 其他覆盖属性
   * @returns MockTask 对象
   */
  createInProgress(progress = 50, overrides: MockTaskOverrides = {}): MockTask {
    return this.create({
      ...overrides,
      status: 'IN_PROGRESS',
      progress,
    })
  }

  /**
   * 创建高优先级任务
   * @param overrides - 其他覆盖属性
   * @returns MockTask 对象
   */
  createHighPriority(overrides: MockTaskOverrides = {}): MockTask {
    return this.create({
      ...overrides,
      priority: 'HIGH',
    })
  }

  /**
   * 创建紧急任务
   * @param overrides - 其他覆盖属性
   * @returns MockTask 对象
   */
  createCritical(overrides: MockTaskOverrides = {}): MockTask {
    return this.create({
      ...overrides,
      priority: 'CRITICAL',
    })
  }

  /**
   * 创建带截止日期的任务
   * @param daysFromNow - 距今天数
   * @param overrides - 其他覆盖属性
   * @returns MockTask 对象
   */
  createWithDueDate(daysFromNow: number, overrides: MockTaskOverrides = {}): MockTask {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + daysFromNow)

    return this.create({
      ...overrides,
      dueDate: dueDate.toISOString(),
    })
  }

  /**
   * 创建过期任务
   * @param overrides - 其他覆盖属性
   * @returns MockTask 对象
   */
  createOverdue(overrides: MockTaskOverrides = {}): MockTask {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 7)

    return this.create({
      ...overrides,
      dueDate: pastDate.toISOString(),
      status: overrides.status ?? 'DELAYED',
    })
  }

  /**
   * 创建各状态的任务列表（每个状态一个）
   * @param overrides - 应用于所有任务的覆盖属性
   * @returns 各状态的 MockTask 数组
   */
  createAllStatuses(overrides: MockTaskOverrides = {}): MockTask[] {
    const statuses: MockTaskStatus[] = [
      'TODO',
      'IN_PROGRESS',
      'REVIEW',
      'TESTING',
      'DONE',
      'CANCELLED',
      'DELAYED',
      'BLOCKED',
    ]

    return statuses.map((status) => this.create({ ...overrides, status }))
  }
}

// ============================================
// 导出
// ============================================

/**
 * 任务工厂实例
 */
export const taskFactory = new TaskFactory()

/**
 * 便捷函数：创建单个任务
 */
export const createMockTask = (overrides?: MockTaskOverrides): MockTask =>
  taskFactory.create(overrides)

/**
 * 便捷函数：创建任务列表
 */
export const createMockTasks = (count: number, overrides?: MockTaskOverrides): MockTask[] =>
  taskFactory.createList(count, overrides)