import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiResponder } from "@/lib/api/response";
import bcrypt from "bcrypt";

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
  try {
    const body = await req.json();
    const validatedData = resetPasswordSchema.parse(body);

    // 查找有效的重置token
    const resetToken = await prisma.passwordResetToken.findFirst({
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
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // 标记token为已使用
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    return ApiResponder.success({
      message: "密码重置成功，请使用新密码登录",
    });
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
