export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public data?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }

  static unauthorized(message: string = '未授权') {
    return new AppError('UNAUTHORIZED', message, 401)
  }

  static forbidden(message: string = '禁止访问') {
    return new AppError('FORBIDDEN', message, 403)
  }

  static notFound(message: string = '资源不存在') {
    return new AppError('NOT_FOUND', message, 404)
  }

  static badRequest(message: string, data?: unknown) {
    return new AppError('BAD_REQUEST', message, 400, data)
  }

  static internal(message: string = '服务器内部错误') {
    return new AppError('INTERNAL_ERROR', message, 500)
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        data: error.data,
      },
    }
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error.message,
      },
    }
  }

  return {
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: '未知错误',
    },
  }
}
