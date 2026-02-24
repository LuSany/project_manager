import { describe, it, expect, vi } from 'vitest'
import { NextResponse } from 'next/server'

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, options) => {
      const response = {
        json: () => Promise.resolve(data),
        status: options?.status || 200,
      }
      return response
    }),
  },
}))

describe('ApiResponder', () => {
  it('应该成功导出 success 函数', async () => {
    const { success } = await import('@/lib/api/response')
    expect(success).toBeDefined()
    expect(typeof success).toBe('function')
  })

  it('应该成功导出 error 函数', async () => {
    const { error } = await import('@/lib/api/response')
    expect(error).toBeDefined()
    expect(typeof error).toBe('function')
  })

  it('应该成功导出 created 函数', async () => {
    const { created } = await import('@/lib/api/response')
    expect(created).toBeDefined()
    expect(typeof created).toBe('function')
  })

  it('应该成功导出 unauthorized 函数', async () => {
    const { unauthorized } = await import('@/lib/api/response')
    expect(unauthorized).toBeDefined()
    expect(typeof unauthorized).toBe('function')
  })

  it('应该成功导出 forbidden 函数', async () => {
    const { forbidden } = await import('@/lib/api/response')
    expect(forbidden).toBeDefined()
    expect(typeof forbidden).toBe('function')
  })

  it('应该成功导出 notFound 函数', async () => {
    const { notFound } = await import('@/lib/api/response')
    expect(notFound).toBeDefined()
    expect(typeof notFound).toBe('function')
  })

  it('应该成功导出 serverError 函数', async () => {
    const { serverError } = await import('@/lib/api/response')
    expect(serverError).toBeDefined()
    expect(typeof serverError).toBe('function')
  })

  it('应该成功导出 validationError 函数', async () => {
    const { validationError } = await import('@/lib/api/response')
    expect(validationError).toBeDefined()
    expect(typeof validationError).toBe('function')
  })

  it('success 方法应该返回正确的响应结构', async () => {
    const { success } = await import('@/lib/api/response')
    const response = success({ id: 1, name: 'test' })
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toEqual({ id: 1, name: 'test' })
  })

  it('success 方法应该支持自定义状态码', async () => {
    const { success } = await import('@/lib/api/response')
    const response = success({ id: 1 }, '操作成功', 201)
    expect(response.status).toBe(201)
  })

  it('created 方法应该返回 201 状态码', async () => {
    const { ApiResponder } = await import('@/lib/api/response')
    const response = ApiResponder.created({ id: 1 })
    expect(response.status).toBe(201)
  })

  it('error 方法应该返回 success: false', async () => {
    const { error } = await import('@/lib/api/response')
    const response = error('BAD_REQUEST', '请求错误')
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('BAD_REQUEST')
    expect(data.error.message).toBe('请求错误')
  })

  it('error 方法应该支持 details', async () => {
    const { error } = await import('@/lib/api/response')
    const response = error('VALIDATION_ERROR', '验证失败', { field: 'name' })
    const data = await response.json()
    expect(data.error.details).toEqual({ field: 'name' })
  })

  it('unauthorized 方法应该返回 401 状态码', async () => {
    const { ApiResponder } = await import('@/lib/api/response')
    const response = ApiResponder.unauthorized()
    expect(response.status).toBe(401)
  })

  it('forbidden 方法应该返回 403 状态码', async () => {
    const { ApiResponder } = await import('@/lib/api/response')
    const response = ApiResponder.forbidden()
    expect(response.status).toBe(403)
  })

  it('notFound 方法应该返回 404 状态码', async () => {
    const { ApiResponder } = await import('@/lib/api/response')
    const response = ApiResponder.notFound()
    expect(response.status).toBe(404)
  })

  it('serverError 方法应该返回 500 状态码', async () => {
    const { ApiResponder } = await import('@/lib/api/response')
    const response = ApiResponder.serverError()
    expect(response.status).toBe(500)
  })

  it('validationError 方法应该返回 400 状态码', async () => {
    const { ApiResponder } = await import('@/lib/api/response')
    const response = ApiResponder.validationError('验证失败', { field: 'email' })
    expect(response.status).toBe(400)
  })
})
