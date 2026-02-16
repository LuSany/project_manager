import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiResponder } from "@/lib/api/response";

// 成员验证Schema
const memberSchema = z.object({
  userId: z.string().email("请选择用户"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 认证检查
  const userId = req.cookies.get('user-id')?.value;
  const userRole = req.cookies.get('user-role')?.value;

  if (!userId) {
    return ApiResponder.unauthorized("未授权，请先登录");
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return ApiResponder.notFound("项目不存在");
    }

    // 权限检查 - 修复逻辑错误：权限检查必须在return之前执行
    if (project.ownerId !== userId && userRole !== "ADMIN") {
      return ApiResponder.forbidden("无权管理项目成员");
    }

    return ApiResponder.success({
      members: project.members,
    });
  } catch (error) {
    console.error("获取项目成员失败:", error);
    return ApiResponder.serverError("获取项目成员失败");
  }
}
