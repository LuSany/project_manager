import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiResponder } from "@/lib/api/response";
import type { AuthenticatedRequest } from "@/middleware";

// 成员验证Schema
const memberSchema = z.object({
  userId: z.string().email("请选择用户"),
});

export async function GET(req: NextRequest) {
  try {
    const { id } = req;
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

    // 权限检查
    const user = (req as AuthenticatedRequest).user;
    if (!user || project.ownerId !== user.id && user.role !== "ADMIN") {
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
