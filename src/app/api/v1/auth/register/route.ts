import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ApiResponder } from '@/lib/api/response'
import bcrypt from 'bcrypt'
import type { AuthenticatedRequest } from '@/middleware'
import { randomUUID } from 'crypto'
import { authRateLimit } from '@/lib/rate-limiter'

// 注册请求验证Schema
const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位').max(100, '密码最多100位'),
  name: z.string().min(2, '姓名至少2位').max(50, '姓名最多50位'),
  phone: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown'

  const rateLimitResult = authRateLimit(ip)

  if (!rateLimitResult.allowed) {
    const response = NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: '请求过于频繁，请稍后再试',
          data: {
            resetTime: new Date(rateLimitResult.resetTime).toISOString(),
          },
        },
      },
      { status: 429 }
    )
    response.headers.set('X-RateLimit-Limit', '10')
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())
    return response
  }

  try {
    const body = await req.json()

    // 验证请求数据
    const validatedData = registerSchema.parse(body)

    // 检查邮箱是否已存在
    const existingUser = await prisma.users.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return ApiResponder.error('EMAIL_EXISTS', '该邮箱已被注册', undefined, 409)
    }

    // 使用 bcrypt 进行密码哈希
    const passwordHash = await bcrypt.hash(validatedData.password, 10)

    // 创建用户（状态为PENDING，需要管理员审批）
    const newUser = await prisma.users.create({
      data: {
        id: randomUUID(),
        email: validatedData.email,
        passwordHash,
        name: validatedData.name,
        phone: validatedData.phone || null,
        status: 'PENDING',
        role: 'EMPLOYEE',
        updatedAt: new Date(),
      },
    })

    // 返回成功响应（201 Created）
    const response = ApiResponder.created(
      {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        status: newUser.status,
      },
      '注册成功，请等待管理员审批'
    )

    response.headers.set('X-RateLimit-Limit', '10')
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())

    return response
  } catch (error) {
    // 处理验证错误
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError('请求数据验证失败', error.issues as any)
    }

    // 处理其他错误
    console.error('注册错误:', error)
    return ApiResponder.serverError('注册失败，请稍后重试')
  }
}
