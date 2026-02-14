import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiResponder } from "@/lib/api/response";
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

    // 验证密码（占位，实际实现需要bcrypt）
    if (user.passwordHash !== `HASH_${validatedData.password}`) {
      return ApiResponder.unauthorized("邮箱或密码错误");
    }

    // 检查用户状态
    if (user.status !== "ACTIVE") {
      return ApiResponder.forbidden("账号未激活或已被禁用");
    }

    // 生成JWT Token（占位，实际实现需要jose）
    const token = `JWT_TOKEN_${user.id}_${user.email}_${user.role}`;

    // 返回成功响应
    return ApiResponder.success({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
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
