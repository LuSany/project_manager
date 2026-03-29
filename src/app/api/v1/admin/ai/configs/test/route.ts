import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

const testAIConnectionSchema = z.object({
  provider: z.enum(['OPENAI', 'ANTHROPIC', 'CUSTOM']),
  apiKey: z.string().optional(),
  model: z.string().min(1, '模型名称不能为空'),
  baseUrl: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以测试AI连接')
    }

    const body = await req.json()
    const { provider, apiKey, model, baseUrl } = testAIConnectionSchema.parse(body)

    const startTime = Date.now()
    let status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' = 'FAILED'
    let statusCode: number | undefined
    let errorMessage: string | undefined
    let duration = 0

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      let url: string
      let headers: HeadersInit
      let requestBody: unknown

      if (provider === 'OPENAI') {
        url = `${baseUrl || 'https://api.openai.com'}/v1/chat/completions`
        headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        }
        requestBody = {
          model,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5,
        }
      } else if (provider === 'ANTHROPIC') {
        url = `${baseUrl || 'https://api.anthropic.com'}/v1/messages`
        headers = {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        }
        requestBody = {
          model,
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Hi' }],
        }
      } else {
        url = `${baseUrl}/api/chat`
        headers = {
          'Content-Type': 'application/json',
        }
        requestBody = {
          model,
          messages: [{ role: 'user', content: 'Hi' }],
          stream: false,
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      statusCode = response.status

      if (response.ok) {
        status = 'SUCCESS'
      } else {
        status = 'FAILED'
        const errorText = await response.text()
        errorMessage = `HTTP ${response.status}: ${errorText.slice(0, 200)}`
      }

      duration = Date.now() - startTime
    } catch (fetchError) {
      clearTimeout(timeoutId)
      duration = Date.now() - startTime

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
      duration,
      error: errorMessage,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError('请求参数无效', error.issues as any)
    }
    console.error('测试AI连接失败:', error)
    return ApiResponder.serverError('测试失败')
  }
}
