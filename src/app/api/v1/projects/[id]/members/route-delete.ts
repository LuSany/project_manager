import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponder } from "@/lib/api/response";
import type { AuthenticatedRequest } from "@/middleware";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = (req as AuthenticatedRequest).user;

  try {
    if (!user) {
      return ApiResponder.unauthorized("未授权访问");
    }

    // 从请求body中获取userId
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return ApiResponder.validationError("userId不能为空");
    }

    // 查找项目
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          where: {
            userId: userId,
            role: {
              in: ["PROJECT_MEMBER", "PROJECT_ADMIN", "PROJECT_OWNER"],
            },
          },
        },
      },
    });

    if (!project) {
      return ApiResponder.notFound("项目不存在");
    }

    // 权限检查
    if (project.ownerId !== user.id && user.role !== "ADMIN") {
      return ApiResponder.forbidden("无权删除成员");
    }

    // 检查成员是否存在
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId: id,
        userId: userId,
        role: { in: ["PROJECT_MEMBER", "PROJECT_ADMIN", "PROJECT_OWNER"] },
      },
    });

    if (!member) {
      return ApiResponder.notFound("成员不存在");
    }

    // 检查是否为最后所有者
    if (member.role === "PROJECT_OWNER") {
      return ApiResponder.forbidden("不能删除项目所有者");
    }

    await prisma.projectMember.deleteMany({
      where: {
        projectId: id,
        userId: userId,
        role: { in: ["PROJECT_MEMBER", "PROJECT_ADMIN", "PROJECT_OWNER"] },
      },
    });

    return ApiResponder.success({
      message: "成员删除成功",
    });
  } catch (error) {
    console.error("删除成员失败:", error);
    return ApiResponder.serverError("删除成员失败");
  }
}
