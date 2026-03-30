/**
 * 设备管理测试数据工厂
 *
 * 提供类型安全的测试数据创建函数
 * 使用 faker 生成随机数据，确保测试数据唯一性
 */

import { faker } from '@faker-js/faker'
import { testPrisma } from './test-db'
import { createTestUser, createTestProject } from './test-data-factory'

/**
 * 创建测试设备类型
 */
export async function createTestDeviceType(overrides = {}) {
  return testPrisma.device_types.create({
    data: {
      id: faker.string.uuid(),
      name: overrides.name ?? `type-${faker.string.alphanumeric(8)}`,
      modelName: overrides.modelName ?? faker.product.name(),
      location: overrides.location ?? faker.location.buildingNumber(),
      description: overrides.description,
      owner: overrides.owner,
      updatedAt: new Date(),
    },
  })
}

/**
 * 创建测试设备
 */
export async function createTestDevice(typeId: string, overrides = {}) {
  return testPrisma.devices.create({
    data: {
      id: faker.string.uuid(),
      name: overrides.name ?? `device-${faker.string.alphanumeric(8)}`,
      typeId,
      status: overrides.status ?? 'AVAILABLE',
      updatedAt: new Date(),
    },
  })
}

/**
 * 创建测试预定
 */
export async function createTestBooking(deviceId: string, userId: string, overrides = {}) {
  const startTime = overrides.startTime ?? new Date()
  const endTime = overrides.endTime ?? new Date(Date.now() + 3600000)

  return testPrisma.bookings.create({
    data: {
      id: faker.string.uuid(),
      deviceId,
      userId,
      projectId: overrides.projectId,
      startTime,
      endTime,
      status: overrides.status ?? 'RESERVED',
      updatedAt: new Date(),
    },
  })
}
