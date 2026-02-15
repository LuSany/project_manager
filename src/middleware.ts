import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

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

// 实际的 middleware 导出
export function middleware(request: NextRequest) {
  // 对 API 路由启用认证检查
  if (request.nextUrl.pathname.startsWith('/api/v1/')) {
    // 排除登录和注册路由
    const publicRoutes = ['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/forgot-password', '/api/v1/auth/reset-password']
    const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))

    if (!isPublicRoute) {
      const authHeader = request.headers.get('authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: '请提供有效的认证令牌' } },
          { status: 401 }
        )
      }
    }
  }

  return NextResponse.next()
}
