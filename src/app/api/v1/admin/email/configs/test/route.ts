import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

const testSMTPConnectionSchema = z.object({
  smtpHost: z.string().min(1, 'SMTP 主机不能为空'),
  smtpPort: z.number().min(1, 'SMTP 端口不能为空'),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以测试SMTP连接')
    }

    const body = await req.json()
    const { smtpHost, smtpPort, smtpUser, smtpPassword } = testSMTPConnectionSchema.parse(body)

    const net = await import('net')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    let status: 'SUCCESS' | 'FAILED' = 'FAILED'
    let errorMessage: string | undefined

    try {
      await new Promise<void>((resolve, reject) => {
        const socket = net.createConnection({
          host: smtpHost,
          port: smtpPort,
          timeout: 5000,
        })

        socket.on('connect', () => {
          status = 'SUCCESS'
          socket.destroy()
          resolve()
        })

        socket.on('error', (err) => {
          status = 'FAILED'
          errorMessage = err.message
          socket.destroy()
          reject(err)
        })

        socket.on('timeout', () => {
          status = 'FAILED'
          errorMessage = '连接超时 (5秒)'
          socket.destroy()
          reject(new Error('Connection timeout'))
        })

        controller.signal.addEventListener('abort', () => {
          socket.destroy()
          reject(new Error('Aborted'))
        })
      })

      clearTimeout(timeoutId)
    } catch (error) {
      clearTimeout(timeoutId)
      if (!errorMessage && error instanceof Error) {
        errorMessage = error.message
      }
      status = 'FAILED'
    }

    return ApiResponder.success({
      status,
      error: errorMessage,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError('请求参数无效', error.issues as any)
    }
    console.error('测试SMTP连接失败:', error)
    return ApiResponder.serverError('测试失败')
  }
}
