import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiResponder } from "@/lib/api/response";
import type { AuthenticatedRequest } from "@/middleware";

// 项目更新验证 Schema
const updateProjectSchema = z.object({
  name: z.string().min(2, "项目名称至少 2 位").max(100, "项目名称最多 100 位").optional(),
  description: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// 获取项目详情
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 从 cookie 获取用户 ID
    const userId = req.cookies.get('user-id')?.value;

    if (!userId) {
      return ApiResponder.unauthorized("请先登录");
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return ApiResponder.notFound("用户不存在");
    }

    // 获取项目
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        milestones: {
          orderBy: { createdAt: 'asc' },
        },
        tasks: {
          where: { status: { not: 'CANCELLED' } },
          orderBy: { createdAt: 'desc' },
        },
        requirements: {
          orderBy: { createdAt: 'desc' },
        },
        risks: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return ApiResponder.notFound("项目不存在");
    }

    // 检查权限：项目所有者、项目成员或管理员可以查看
    const isMember = project.members.some(m => m.userId === userId);
    const isOwner = project.ownerId === userId;
    const isAdmin = user.role === 'ADMIN';

    if (!isMember && !isOwner && !isAdmin) {
      return ApiResponder.forbidden("无权查看此项目");
    }

    return ApiResponder.success({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      ownerId: project.ownerId,
      owner: project.owner,
      members: project.members,
      milestones: project.milestones,
      tasks: project.tasks,
      requirements: project.requirements,
      risks: project.risks,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  } catch (error) {
    console.error("获取项目详情错误:", error);
    return ApiResponder.serverError("获取项目详情失败");
  }
}

// 删除项目
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const userId = req.cookies.get('user-id')?.value;

    if (!userId) {
      return ApiResponder.unauthorized("请先登录");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return ApiResponder.notFound("用户不存在");
    }

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return ApiResponder.notFound("项目不存在");
    }

    // 只有项目所有者或管理员可以删除
    if (project.ownerId !== userId && user.role !== 'ADMIN') {
      return ApiResponder.forbidden("只有项目所有者或管理员可以删除项目");
    }

    await prisma.project.delete({
      where: { id },
    });

    return ApiResponder.success({ id }, "项目已删除");
  } catch (error) {
    console.error("删除项目错误:", error);
    return ApiResponder.serverError("删除项目失败");
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = (req as AuthenticatedRequest).user;

  try {
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
      return ApiResponder.forbidden("无权修改此项目");
    }

    const body = await req.json();
    const validatedData = updateProjectSchema.parse(body);

    // 只能更新某些字段
    const updateData: any = {
      name: validatedData.name,
      description: validatedData.description,
    };

    if (validatedData.status) {
      updateData.status = validatedData.status;
    }

    if (validatedData.startDate) {
      updateData.startDate = validatedData.startDate;
    }

    if (validatedData.endDate) {
      updateData.endDate = validatedData.endDate;
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    return ApiResponder.success({
      id: updatedProject.id,
      name: updatedProject.name,
      description: updatedProject.description,
      status: updatedProject.status,
      startDate: updatedProject.startDate,
      endDate: updatedProject.endDate,
    }, "项目更新成功");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError(
        "请求数据验证失败",
        error.issues as any
      );
    }
    console.error("更新项目错误:", error);
    return ApiResponder.serverError("更新项目失败");
  }
}
