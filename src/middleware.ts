import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { validateCSRFToken } from '@/lib/security'
import { apiRateLimit, authRateLimit } from '@/lib/rate-limiter'

export type AuthenticatedRequest = NextRequest & {
  user: {
    id: string
    email: string
    role: string
  }
}

export type MiddlewareContext = {
  req: NextRequest
  res: NextResponse
}

export async function requireAuth(context: MiddlewareContext): Promise<NextResponse | void> {
  const authHeader = context.req.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: '请提供有效的认证令牌' } },
      { status: 401 }
    )
  }

  const token = authHeader.substring(7)
  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret || jwtSecret.length < 32) {
    console.error('JWT_SECRET must be at least 32 characters')
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器配置错误' } },
      { status: 500 }
    )
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret))
    ;(context.req as AuthenticatedRequest).user = {
      id: (payload as any).userId,
      email: (payload as any).email,
      role: (payload as any).role,
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: '令牌无效或已过期' } },
      { status: 401 }
    )
  }
}

export async function requireAdmin(context: MiddlewareContext): Promise<NextResponse | void> {
  const req = context.req as AuthenticatedRequest

  if (!req.user || req.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '需要管理员权限' } },
      { status: 403 }
    )
  }
}

// 验证 CSRF Token
export async function requireCSRF(request: NextRequest): Promise<NextResponse | void> {
  const method = request.method

  // 只对非安全的 HTTP 方法进行 CSRF 验证
  const unsafeMethods = ['POST', 'PUT', 'DELETE', 'PATCH']
  if (!unsafeMethods.includes(method)) {
    return NextResponse.next()
  }

  // 从 cookie 或 header 获取 CSRF token
  const cookieToken = request.cookies.get('csrf-token')?.value
  const headerToken = request.headers.get('X-CSRF-Token')

  const token = headerToken || cookieToken

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'CSRF token 缺失，请刷新页面重试',
        },
      },
      { status: 403 }
    )
  }

  // 验证 CSRF token
  if (!validateCSRFToken(token)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'CSRF token 无效或已过期，请刷新页面重试',
        },
      },
      { status: 403 }
    )
  }

  return NextResponse.next()
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return request.ip || 'unknown'
}

function getIdentifier(request: NextRequest, userId?: string): string {
  const ip = getClientIp(request)
  return userId ? `${ip}:${userId}` : ip
}

// 实际的 middleware 导出
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 对 API 路由启用认证检查和限流
  if (pathname.startsWith('/api/v1/')) {
    let userId: string | undefined

    // 先提取用户 ID（用于限流标识符）
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const jwtSecret = process.env.JWT_SECRET

      if (jwtSecret && jwtSecret.length >= 32) {
        try {
          const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret))
          userId = (payload as any).userId
        } catch {
          // Token 无效，继续使用 IP 限流
        }
      }
    }

    // 应用限流
    const identifier = getIdentifier(request, userId)
    const isAuthRoute = pathname.startsWith('/api/v1/auth/')
    const limitResult = isAuthRoute ? authRateLimit(identifier) : apiRateLimit(identifier)

    if (!limitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: '请求过于频繁，请稍后再试',
          },
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': limitResult.remaining.toString(),
            'X-RateLimit-Reset': limitResult.resetTime.toString(),
          },
        }
      )
    }

    // 排除公开路由
    const publicRoutes = [
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/forgot-password',
      '/api/v1/auth/reset-password',
      '/api/v1/files/onlyoffice-callback',
    ]

    // 精确匹配公开路由，不拦截登录请求
    if (publicRoutes.includes(pathname)) {
      const response = NextResponse.next()
      response.headers.set('X-RateLimit-Remaining', limitResult.remaining.toString())
      response.headers.set('X-RateLimit-Reset', limitResult.resetTime.toString())
      response.headers.set('X-XSS-Protection', '1; mode=block')
      return response
    }

    // 文件下载 API 支持 document key 认证（OnlyOffice 服务访问）
    if (pathname.match(/\/api\/v1\/files\/[^/]+\/download/)) {
      const documentKey = request.nextUrl.searchParams.get('key')
      if (documentKey) {
        const response = NextResponse.next()
        response.headers.set('X-RateLimit-Remaining', limitResult.remaining.toString())
        response.headers.set('X-RateLimit-Reset', limitResult.resetTime.toString())
        response.headers.set('X-XSS-Protection', '1; mode=block')
        return response
      }
    }

    // 验证认证令牌
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请提供有效的认证令牌' } },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const jwtSecret = process.env.JWT_SECRET

    if (!jwtSecret || jwtSecret.length < 32) {
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器配置错误' } },
        { status: 500 }
      )
    }

    try {
      await jwtVerify(token, new TextEncoder().encode(jwtSecret))
      const response = NextResponse.next()
      response.headers.set('X-RateLimit-Remaining', limitResult.remaining.toString())
      response.headers.set('X-RateLimit-Reset', limitResult.resetTime.toString())
      response.headers.set('X-XSS-Protection', '1; mode=block')
      return response
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '令牌无效或已过期' } },
        { status: 401 }
      )
    }
  }

  const response = NextResponse.next()
  response.headers.set('X-XSS-Protection', '1; mode=block')
  return response
}
