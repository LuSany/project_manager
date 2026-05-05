import { jwtVerify } from 'jose'

export interface AuthUser {
  userId: string
  email: string
  role: string
}

/**
 * 从请求的 Authorization header 中提取并验证 JWT，返回用户信息
 *
 * @param request - Next.js Request 对象
 * @returns 用户信息，如果认证失败则抛出错误
 * @throws {Error} 当缺少 token 或 token 无效时抛出
 */
export async function getAuthUser(request: Request): Promise<AuthUser> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED')
  }

  const token = authHeader.substring(7)
  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('INTERNAL_ERROR')
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret))

    return {
      userId: (payload as any).userId,
      email: (payload as any).email,
      role: (payload as any).role,
    }
  } catch (error) {
    throw new Error('INVALID_TOKEN')
  }
}

/**
 * 从请求的 Authorization header 中提取并验证 JWT，返回用户信息
 * 如果认证失败，返回 null
 *
 * @param request - Next.js Request 对象
 * @returns 用户信息，如果认证失败则返回 null
 */
export async function getAuthUserSafe(
  request: Request
): Promise<AuthUser | null> {
  try {
    return await getAuthUser(request)
  } catch (error) {
    return null
  }
}