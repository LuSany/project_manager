import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ApiResponder } from '@/lib/api/response'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

// 请求验证Schema
const forgotPasswordSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
})

// 生成随机token
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = forgotPasswordSchema.parse(body)

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (!user) {
      return ApiResponder.notFound('该邮箱未注册')
    }

    // 生成重置token
    const resetToken = generateResetToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1小时后过期

    // 存储重置令牌到数据库
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt,
        used: false,
      },
    })

    // 通过邮件服务发送密码重置邮件
    const emailResult = await sendPasswordResetEmail(user.email, resetToken, expiresAt)

    if (!emailResult.success) {
      console.error('发送密码重置邮件失败:', emailResult.error)
    }

    return ApiResponder.success({
      message: '密码重置邮件已发送，请检查您的邮箱',
      data: {
        email: user.email,
        expiresAt: expiresAt.toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError('请求数据验证失败', error.issues as any)
    }
    console.error('密码重置错误:', error)
    return ApiResponder.serverError('发送失败，请稍后重试')
  }
}
