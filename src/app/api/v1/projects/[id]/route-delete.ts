import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponder } from "@/lib/api/response";
import type { AuthenticatedRequest } from "@/middleware";

export async function DELETE(req: NextRequest) {
  try {
    const { id } = req;
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return ApiResponder.unauthorized("未授权访问");
    }

    // 检查权限
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return ApiResponder.notFound("项目不存在");
    }

    if (project.ownerId !== user.id && user.role !== "ADMIN") {
      return ApiResponder.forbidden("无权删除此项目");
    }

    await prisma.project.delete({
      where: { id },
    });

    return ApiResponder.success({
      message: "项目删除成功",
    });
  } catch (error) {
    console.error("删除项目错误:", error);
    return ApiResponder.serverError("删除项目失败");
  }
}
