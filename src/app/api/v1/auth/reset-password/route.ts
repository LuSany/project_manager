import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiResponder } from "@/lib/api/response";
import bcrypt from "bcrypt";
import { authRateLimit } from "@/lib/rate-limiter";

// 请求验证Schema
const resetPasswordSchema = z.object({
  token: z.string().min(1, "重置token不能为空"),
  password: z.string().min(6, "密码至少6位").max(100, "密码最多100位"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次密码输入不一致",
  path: ["confirmPassword"],
});

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
    const body = await req.json();
    const validatedData = resetPasswordSchema.parse(body);

    // 查找有效的重置token
    const resetToken = await prisma.password_reset_tokens.findFirst({
      where: {
        token: validatedData.token,
        expiresAt: { gte: new Date() },
        used: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!resetToken) {
      return ApiResponder.notFound("重置链接无效或已过期");
    }

    // 使用 bcrypt 进行密码哈希
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // 更新用户密码
    await prisma.users.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // 标记token为已使用
    await prisma.password_reset_tokens.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    const response = ApiResponder.success({
      message: "密码重置成功，请使用新密码登录",
    });

    response.headers.set('X-RateLimit-Limit', '10')
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError(
        "请求数据验证失败",
        error.issues as any
      );
    }
    console.error("密码重置错误:", error);
    return ApiResponder.serverError("重置失败，请稍后重试");
  }
}
