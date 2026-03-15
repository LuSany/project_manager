import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponder } from "@/lib/api/response";

// 辅助函数：获取认证用户并检查管理员权限
async function checkAdmin(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'ADMIN') return null;

  return user;
}

// DELETE /api/v1/admin/projects/[id] - 管理员删除项目
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 检查管理员权限
    const admin = await checkAdmin(req);
    if (!admin) {
      const userId = req.cookies.get('user-id')?.value;
      if (!userId) {
        return ApiResponder.unauthorized("请先登录");
      }
      return ApiResponder.forbidden("只有管理员可以删除项目");
    }

    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return ApiResponder.notFound("项目不存在");
    }

    // 删除项目（Prisma 会级联删除相关数据）
    await prisma.project.delete({
      where: { id },
    });

    return ApiResponder.success({ id }, "项目已删除");
  } catch (error) {
    console.error("管理员删除项目错误:", error);
    return ApiResponder.serverError("删除项目失败");
  }
}
