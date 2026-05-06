/**
 * 认证相关类型定义
 */

/**
 * JWT Payload 类型
 * 定义 JWT token 中包含的用户信息
 */
export interface JWTPayload {
  /** 用户 ID */
  userId: string
  /** 用户邮箱 */
  email: string
  /** 用户角色 */
  role: string
}

/**
 * 认证用户信息
 */
export interface AuthUser {
  /** 用户 ID */
  userId: string
  /** 用户邮箱 */
  email: string
  /** 用户角色 */
  role: string
}

/**
 * 用户角色枚举
 */
export type UserRole = 'ADMIN' | 'REGULAR' | 'PROJECT_ADMIN' | 'PROJECT_MEMBER'

/**
 * 权限级别
 */
export type PermissionLevel = 'READ' | 'WRITE' | 'ADMIN'