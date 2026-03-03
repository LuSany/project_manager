/**
 * Next.js Request Mock 工具
 *
 * 提供 Next.js API 路由测试所需的 Request/Response Mock
 */

import { vi } from 'vitest'

/**
 * Cookie 类型
 */
type Cookies = Record<string, { value: string } | string>

/**
 * Mock Request 类型
 */
export interface MockNextRequest {
  method: string
  url: string
  headers: Headers
  cookies: {
    get: ReturnType<typeof vi.fn>
    getAll: ReturnType<typeof vi.fn>
    has: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
    set: ReturnType<typeof vi.fn>
  }
  json: ReturnType<typeof vi.fn>
  text: ReturnType<typeof vi.fn>
  formData: ReturnType<typeof vi.fn>
  blob: ReturnType<typeof vi.fn>
  arrayBuffer: ReturnType<typeof vi.fn>
  clone: ReturnType<typeof vi.fn>
  signal: AbortSignal
  bodyUsed: boolean
}

/**
 * 创建 Mock NextRequest
 */
export function createMockRequest(options: {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url?: string
  cookies?: Cookies
  headers?: Record<string, string>
  body?: any
  searchParams?: Record<string, string>
}): MockNextRequest {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/v1/test',
    cookies = {},
    headers = {},
    body,
    searchParams = {},
  } = options

  // 构建 URL with search params
  const fullUrl = new URL(url)
  Object.entries(searchParams).forEach(([key, value]) => {
    fullUrl.searchParams.set(key, value)
  })

  // 创建 headers 对象
  const headersMap = new Headers()
  Object.entries(headers).forEach(([key, value]) => {
    headersMap.set(key, value)
  })

  if (body && !headersMap.has('content-type')) {
    headersMap.set('content-type', 'application/json')
  }

  return {
    method,
    url: fullUrl.toString(),
    headers: headersMap,
    cookies: {
      get: vi.fn().mockImplementation((name: string) => {
        const cookie = cookies[name]
        if (typeof cookie === 'string') {
          return { name, value: cookie }
        }
        return cookie || undefined
      }),
      getAll: vi.fn().mockImplementation((name?: string) => {
        if (name) {
          const cookie = cookies[name]
          return cookie ? [typeof cookie === 'string' ? { name, value: cookie } : cookie] : []
        }
        return Object.entries(cookies).map(([key, value]) =>
          typeof value === 'string' ? { name: key, value } : value
        )
      }),
      has: vi.fn().mockImplementation((name: string) => name in cookies),
      delete: vi.fn(),
      set: vi.fn(),
    },
    json: vi.fn().mockResolvedValue(body ?? {}),
    text: vi.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body ?? {})),
    formData: vi.fn().mockResolvedValue(new FormData()),
    blob: vi.fn().mockResolvedValue(new Blob()),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    clone: vi.fn().mockReturnThis(),
    signal: new AbortController().signal,
    bodyUsed: false,
  }
}

/**
 * 创建带认证的 Mock Request
 */
export function createAuthenticatedRequest(
  options: {
    userId?: string
    userRole?: string
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    url?: string
    body?: any
    headers?: Record<string, string>
  } = {}
): MockNextRequest {
  const { userId = 'test-user-id', userRole = 'EMPLOYEE', ...rest } = options

  return createMockRequest({
    ...rest,
    cookies: {
      'user-id': userId,
      'user-role': userRole,
    },
  })
}

/**
 * 创建管理员 Request
 */
export function createAdminRequest(
  options: Omit<Parameters<typeof createMockRequest>[0], 'cookies'> = {}
): MockNextRequest {
  return createAuthenticatedRequest({
    ...options,
    userRole: 'ADMIN',
  })
}

/**
 * Mock Response 类型
 */
export interface MockNextResponse {
  status: number
  json: () => Promise<any>
  ok: boolean
}

/**
 * 创建 Mock Response
 */
export function createMockResponse(data: any, options: { status?: number } = {}): MockNextResponse {
  const { status = 200 } = options

  return {
    status,
    json: async () => data,
    ok: status >= 200 && status < 300,
  }
}

/**
 * 创建成功响应
 */
export function createSuccessResponse(data: any): MockNextResponse {
  return createMockResponse({
    success: true,
    data,
  })
}

/**
 * 创建错误响应
 */
export function createErrorResponse(message: string, status = 400): MockNextResponse {
  return createMockResponse(
    {
      success: false,
      error: message,
    },
    { status }
  )
}
