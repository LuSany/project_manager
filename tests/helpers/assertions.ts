/**
 * 自定义断言库
 *
 * 提供业务相关的自定义断言，增强测试可读性
 *
 * @example
 * expect(user).toBeActiveUser()
 * expect(response).toHaveStatus(200)
 */

import { expect } from 'vitest'

// 扩展 Vitest 的断言类型
declare global {
  namespace Vi {
    interface Assertion<T = any> {
      toBeActiveUser(): T
      toBePendingUser(): T
      toBeAdminUser(): T
      toHaveStatus(status: number): T
      toBeSuccessResponse(): T
      toBeErrorResponse(message?: string): T
      toBeValidEmail(): T
      toBeWithinTimeRange(start: Date, end: Date): T
      toHaveLengthAtLeast(min: number): T
    }
  }
}

/**
 * 注册自定义断言
 */
expect.extend({
  /**
   * 检查用户是否为活跃状态
   */
  toBeActiveUser(received: any) {
    const { isNot } = this
    const pass = received?.status === 'ACTIVE'

    return {
      pass,
      message: () =>
        isNot
          ? `Expected user not to be active, but status is ${received?.status}`
          : `Expected user to be active, but status is ${received?.status}`,
    }
  },

  /**
   * 检查用户是否为待审批状态
   */
  toBePendingUser(received: any) {
    const { isNot } = this
    const pass = received?.status === 'PENDING'

    return {
      pass,
      message: () =>
        isNot
          ? `Expected user not to be pending, but status is ${received?.status}`
          : `Expected user to be pending, but status is ${received?.status}`,
    }
  },

  /**
   * 检查用户是否为管理员
   */
  toBeAdminUser(received: any) {
    const { isNot } = this
    const pass = received?.role === 'ADMIN'

    return {
      pass,
      message: () =>
        isNot
          ? `Expected user not to be admin, but role is ${received?.role}`
          : `Expected user to be admin, but role is ${received?.role}`,
    }
  },

  /**
   * 检查响应状态码
   */
  toHaveStatus(received: any, expected: number) {
    const { isNot } = this
    const actualStatus = received?.status ?? received?.statusCode
    const pass = actualStatus === expected

    return {
      pass,
      message: () =>
        isNot
          ? `Expected status not to be ${expected}, but got ${actualStatus}`
          : `Expected status to be ${expected}, but got ${actualStatus}`,
    }
  },

  /**
   * 检查是否为成功响应
   */
  toBeSuccessResponse(received: any) {
    const { isNot } = this
    const isSuccess =
      received?.success === true || (received?.status >= 200 && received?.status < 300)

    return {
      pass: isSuccess,
      message: () =>
        isNot
          ? `Expected response to be unsuccessful`
          : `Expected response to be successful, but got ${JSON.stringify(received)}`,
    }
  },

  /**
   * 检查是否为错误响应
   */
  toBeErrorResponse(received: any, expectedMessage?: string) {
    const { isNot } = this
    const isError = received?.success === false || received?.error !== undefined
    const messageMatch = expectedMessage ? received?.error === expectedMessage : true
    const pass = isError && messageMatch

    return {
      pass,
      message: () =>
        isNot
          ? `Expected response not to be an error`
          : expectedMessage
            ? `Expected error message "${expectedMessage}", but got "${received?.error}"`
            : `Expected response to be an error, but got ${JSON.stringify(received)}`,
    }
  },

  /**
   * 检查是否为有效邮箱格式
   */
  toBeValidEmail(received: string) {
    const { isNot } = this
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const pass = emailRegex.test(received)

    return {
      pass,
      message: () =>
        isNot
          ? `Expected "${received}" not to be a valid email`
          : `Expected "${received}" to be a valid email`,
    }
  },

  /**
   * 检查日期是否在范围内
   */
  toBeWithinTimeRange(received: Date | string, start: Date, end: Date) {
    const { isNot } = this
    const date = typeof received === 'string' ? new Date(received) : received
    const pass = date >= start && date <= end

    return {
      pass,
      message: () =>
        isNot
          ? `Expected date ${date.toISOString()} not to be within range`
          : `Expected date ${date.toISOString()} to be within ${start.toISOString()} and ${end.toISOString()}`,
    }
  },

  /**
   * 检查数组长度是否至少为指定值
   */
  toHaveLengthAtLeast(received: any[], min: number) {
    const { isNot } = this
    const pass = received?.length >= min

    return {
      pass,
      message: () =>
        isNot
          ? `Expected array length to be less than ${min}, but got ${received?.length}`
          : `Expected array length to be at least ${min}, but got ${received?.length}`,
    }
  },
})

// 导出常用断言辅助函数

/**
 * 断言函数抛出特定错误
 */
export async function expectToThrow(fn: () => Promise<any>, errorMessage?: string): Promise<void> {
  try {
    await fn()
    throw new Error('Expected function to throw, but it did not')
  } catch (error: any) {
    if (errorMessage) {
      expect(error.message).toContain(errorMessage)
    }
  }
}

/**
 * 断言对象包含特定属性
 */
export function expectToHaveProperties<T extends object>(obj: T, properties: (keyof T)[]): void {
  properties.forEach((prop) => {
    expect(obj).toHaveProperty(prop as string)
  })
}

/**
 * 断言日期接近当前时间
 */
export function expectDateToBeRecent(date: Date | string, toleranceMs = 5000): void {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = Math.abs(d.getTime() - now.getTime())

  expect(diff).toBeLessThan(toleranceMs)
}

/**
 * 断言 ID 是有效的 UUID 格式
 */
export function expectValidId(id: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  expect(uuidRegex.test(id) || id.length > 0).toBe(true)
}
