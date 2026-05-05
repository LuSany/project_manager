import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ApiResponder } from '@/lib/api/response'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'
import { authRateLimit } from '@/lib/rate-limiter'

// 请求验证Schema
const forgotPasswordSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
})

// 生成随机token
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

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
    const validatedData = forgotPasswordSchema.parse(body)

    // 查找用户
    const user = await prisma.users.findUnique({
      where: { email: validatedData.email },
    })

    if (!user) {
      return ApiResponder.notFound('该邮箱未注册')
    }

    // 生成重置token
    const resetToken = generateResetToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1小时后过期

    // 存储重置令牌到数据库
    await prisma.password_reset_tokens.create({
      data: {
        id: crypto.randomUUID(),
        token: resetToken,
        users: { connect: { id: user.id } },
        expiresAt,
        used: false,
      },
    })

    // 通过邮件服务发送密码重置邮件
    const emailResult = await sendPasswordResetEmail(user.email, resetToken, expiresAt)

    if (!emailResult.success) {
      console.error('发送密码重置邮件失败:', emailResult.error)
    }

    const response = ApiResponder.success({
      message: '密码重置邮件已发送，请检查您的邮箱',
      data: {
        email: user.email,
        expiresAt: expiresAt.toISOString(),
      },
    })

    response.headers.set('X-RateLimit-Limit', '10')
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError('请求数据验证失败', error.issues as any)
    }
    console.error('密码重置错误:', error)
    return ApiResponder.serverError('发送失败，请稍后重试')
  }
}
