import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiResponder } from "@/lib/api/response";
import { SignJWT } from "jose";
import bcrypt from "bcrypt";
import type { AuthenticatedRequest } from "@/middleware";

// 登录请求验证Schema
const loginSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少6位"),
});

export async function POST(req: NextRequest) {
  try {
    // 解析请求体
    const body = await req.json();

    // 验证请求数据
    const validatedData = loginSchema.parse(body);

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return ApiResponder.unauthorized("邮箱或密码错误");
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash);
    if (!isValidPassword) {
      return ApiResponder.unauthorized("邮箱或密码错误");
    }

    // 检查用户状态
    if (user.status !== "ACTIVE") {
      return ApiResponder.forbidden("账号未激活或已被禁用");
    }

    // 生成JWT Token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) {
      return ApiResponder.serverError("服务器配置错误");
    }

    const secret = new TextEncoder().encode(jwtSecret);
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(secret);

    // 返回成功响应，并设置 cookie
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
    });

    // 设置 user-id cookie 用于后续认证
    response.cookies.set('user-id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // 设置 token cookie（可选，用于双重认证）
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    // 处理验证错误
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError(
        "请求数据验证失败",
        error.issues as any
      );
    }

    // 处理其他错误
    console.error("登录错误:", error);
    return ApiResponder.serverError("登录失败，请稍后重试");
  }
}
