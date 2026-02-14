import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiResponder } from "@/lib/api/response";
import type { AuthenticatedRequest } from "@/middleware";

// 项目更新验证Schema
const updateProjectSchema = z.object({
  name: z.string().min(2, "项目名称至少2位").max(100, "项目名称最多100位").optional(),
  description: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

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
