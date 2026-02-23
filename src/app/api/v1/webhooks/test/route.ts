import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'
import { z } from 'zod'

const testWebhookSchema = z.object({
  url: z.string().url(),
  event: z.string(),
  payload: z.record(z.unknown()),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以测试Webhook')
    }

    const body = await req.json()
    const { url, event, payload } = testWebhookSchema.parse(body)

    const startTime = Date.now()
    let status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' = 'FAILED'
    let statusCode: number | undefined
    let responseText: string | undefined
    let errorMessage: string | undefined

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event,
          'X-Webhook-Test': 'true',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      statusCode = response.status
      responseText = await response.text()

      if (response.ok) {
        status = 'SUCCESS'
      } else {
        status = 'FAILED'
        errorMessage = `HTTP ${response.status}: ${responseText.slice(0, 200)}`
      }
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        status = 'TIMEOUT'
        errorMessage = '请求超时 (10秒)'
      } else {
        status = 'FAILED'
        errorMessage = fetchError instanceof Error ? fetchError.message : '未知错误'
      }
    }

    return ApiResponder.success({
      status,
      statusCode,
      response: responseText?.slice(0, 500),
      error: errorMessage,
      duration: Date.now() - startTime,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError('请求参数无效')
    }
    console.error('测试Webhook失败:', error)
    return ApiResponder.serverError('测试Webhook失败')
  }
}
