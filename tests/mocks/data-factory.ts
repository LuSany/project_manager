// 测试数据生成工厂
// 使用 @faker-js/faker 生成真实的测试数据

import { faker } from '@faker-js/faker'

// 用户角色枚举
export type UserRole = 'ADMIN' | 'OWNER' | 'PROJECT_MANAGER' | 'EMPLOYEE' | 'GUEST'

// 用户 Mock 生成器
export class MockUserFactory {
  static createAdmin(overrides?: Partial<{ email: string; name: string }>) {
    return {
      id: faker.string.uuid(),
      email: overrides?.email || 'admin@test.com',
      password: 'AdminPass123!',
      passwordHash: this.hashPassword('AdminPass123!'),
      name: overrides?.name || 'Test Admin',
      role: 'ADMIN' as UserRole,
      status: 'ACTIVE',
      department: 'Engineering',
      position: 'System Administrator',
      avatar: faker.image.avatar(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  static createOwner(overrides?: Partial<{ email: string; name: string }>) {
    return {
      id: faker.string.uuid(),
      email: overrides?.email || 'owner@test.com',
      password: 'OwnerPass123!',
      passwordHash: this.hashPassword('OwnerPass123!'),
      name: overrides?.name || 'Project Owner',
      role: 'OWNER' as UserRole,
      status: 'ACTIVE',
      department: 'Engineering',
      position: 'Project Owner',
      avatar: faker.image.avatar(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  static createProjectManager(overrides?: Partial<{ email: string; name: string }>) {
    return {
      id: faker.string.uuid(),
      email: overrides?.email || 'pm@test.com',
      password: 'PmPass123!',
      passwordHash: this.hashPassword('PmPass123!'),
      name: overrides?.name || 'Project Manager',
      role: 'PROJECT_MANAGER' as UserRole,
      status: 'ACTIVE',
      department: 'Engineering',
      position: 'Project Manager',
      avatar: faker.image.avatar(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  static createEmployee(overrides?: Partial<{ email: string; name: string }>) {
    return {
      id: faker.string.uuid(),
      email: overrides?.email || `employee${Date.now()}@test.com`,
      password: 'EmployeePass123!',
      passwordHash: this.hashPassword('EmployeePass123!'),
      name: overrides?.name || faker.person.fullName(),
      role: 'EMPLOYEE' as UserRole,
      status: 'ACTIVE',
      department: faker.company.name(),
      position: faker.person.jobTitle(),
      avatar: faker.image.avatar(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  static generateBatch(count: number, role: UserRole = 'EMPLOYEE') {
    return Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: 'EmployeePass123!',
      passwordHash: this.hashPassword('EmployeePass123!'),
      name: faker.person.fullName(),
      role,
      status: 'ACTIVE',
      department: faker.company.name(),
      position: faker.person.jobTitle(),
      avatar: faker.image.avatar(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  }

  private static hashPassword(password: string): string {
    // 模拟密码哈希 - 实际应使用 bcrypt
    return `hashed_${Buffer.from(password).toString('base64')}`
  }
}

// 项目 Mock 生成器
export class MockProjectFactory {
  static create(active: boolean = true) {
    return {
      id: faker.string.uuid(),
      name: faker.company.name(),
      description: faker.lorem.paragraph(3),
      status: active ? 'ACTIVE' : 'ARCHIVED',
      ownerId: faker.string.uuid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  static generateBatch(count: number) {
    return Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      name: faker.company.name(),
      description: faker.lorem.paragraph(3),
      status: 'ACTIVE',
      ownerId: faker.string.uuid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  }
}

// 任务 Mock 生成器
export class MockTaskFactory {
  static create(overrides?: Partial<{ projectId: string; title: string }>) {
    return {
      id: faker.string.uuid(),
      projectId: overrides?.projectId || faker.string.uuid(),
      title: overrides?.title || faker.hacker.phrase(),
      description: faker.lorem.sentence(),
      status: 'TODO' as const,
      priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      progress: 0,
      startDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedHours: faker.number.int({ min: 1, max: 40 }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  static generateBatch(projectId: string, count: number) {
    return Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      projectId,
      title: faker.hacker.phrase(),
      description: faker.lorem.sentence(),
      status: 'TODO',
      priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      progress: 0,
      startDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedHours: faker.number.int({ min: 1, max: 40 }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  }
}

// 需求 Mock 生成器
export class MockRequirementFactory {
  static create(overrides?: Partial<{ projectId: string; title: string }>) {
    return {
      id: faker.string.uuid(),
      projectId: overrides?.projectId || faker.string.uuid(),
      title: overrides?.title || faker.hacker.phrase(),
      description: faker.lorem.paragraph(2),
      status: 'PENDING' as const,
      priority: faker.helpers.arrayElement(['P0', 'P1', 'P2', 'P3']),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  static generateBatch(projectId: string, count: number) {
    return Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      projectId,
      title: faker.hacker.phrase(),
      description: faker.lorem.paragraph(2),
      status: 'PENDING',
      priority: faker.helpers.arrayElement(['P0', 'P1', 'P2', 'P3']),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  }
}

// 评审 Mock 生成器
export class MockReviewFactory {
  static create(overrides?: Partial<{ projectId: string; title: string }>) {
    return {
      id: faker.string.uuid(),
      projectId: overrides?.projectId || faker.string.uuid(),
      title: overrides?.title || faker.hacker.phrase(),
      type: 'FEASIBILITY' as const,
      status: 'DRAFT' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  static generateBatch(projectId: string, count: number) {
    return Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      projectId,
      title: faker.hacker.phrase(),
      type: 'FEASIBILITY',
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  }
}
