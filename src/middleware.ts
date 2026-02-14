import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ApiResponder } from "@/lib/api/response";
import type { ApiResponse } from "@/types/api";

export type AuthenticatedRequest = NextRequest & {
  user: {
    id: string;
    email: string;
    role: string;
  };
};

export type MiddlewareContext = {
  req: NextRequest;
  res: NextResponse;
};

export async function requireAuth(
  context: MiddlewareContext
): Promise<void> {
  const authHeader = context.req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return ApiResponder.unauthorized("请提供有效的认证令牌");
  }

  const token = authHeader.substring(7);
  const jwtSecret = process.env.JWT_SECRET || "dev-secret-key";

  try {
    const { payload } = await jwtVerify(token, jwtSecret);
    (context.req as AuthenticatedRequest).user = {
      id: (payload as any).userId,
      email: (payload as any).email,
      role: (payload as any).role,
    };
  } catch (error) {
    return ApiResponder.unauthorized("令牌无效或已过期");
  }
}

export async function requireAdmin(
  context: MiddlewareContext
): Promise<void> {
  const req = context.req as AuthenticatedRequest;

  if (!req.user || req.user.role !== "ADMIN") {
    return ApiResponder.forbidden("需要管理员权限");
  }
}

// 简化的JWT验证函数
async function jwtVerify(
  token: string,
  secret: string
): Promise<{ payload: unknown }> {
  // 这里使用jose库，实际实现会在认证模块中完成
  // 目前仅做基本验证
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }

  const payload = JSON.parse(
    Buffer.from(parts[1], "base64").toString()
  );

  return { payload };
}
