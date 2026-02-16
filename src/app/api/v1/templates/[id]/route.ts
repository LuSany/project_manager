import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiResponder } from "@/lib/api/response";

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

// 模板更新验证Schema
const updateTemplateSchema = z.object({
  title: z.string().min(1, "模板标题不能为空").optional(),
  description: z.string().optional(),
  templateData: z.record(z.any()).refine((val) => {
    try {
      JSON.stringify(val);
      return true;
    } catch {
      return false;
    }
  }, "templateData必须是有效的JSON对象").optional(),
  isPublic: z.boolean().optional(),
});

// PUT /api/v1/templates/[id] - 更新模板
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 认证检查
  const user = await getAuthUser(req);
  if (!user) {
    return ApiResponder.unauthorized("未授权，请先登录");
  }

  try {
    const body = await req.json();
    const validatedData = updateTemplateSchema.parse(body);

    // 检查模板是否存在
    const existingTemplate = await db.taskTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return ApiResponder.notFound("模板不存在");
    }

    // 构建更新数据
    const updateData: any = {};
    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title;
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }
    if (validatedData.templateData !== undefined) {
      updateData.templateData = JSON.stringify(validatedData.templateData);
    }
    if (validatedData.isPublic !== undefined) {
      updateData.isPublic = validatedData.isPublic;
    }

    const template = await db.taskTemplate.update({
      where: { id },
      data: updateData,
    });

    return ApiResponder.success(
      {
        ...template,
        templateData: JSON.parse(template.templateData),
      },
      "模板更新成功"
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError(
        "请求数据验证失败",
        error.format() as any
      );
    }
    console.error("更新模板失败:", error);
    return ApiResponder.serverError("更新模板失败");
  }
}

// DELETE /api/v1/templates/[id] - 删除模板
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 认证检查
  const user = await getAuthUser(req);
  if (!user) {
    return ApiResponder.unauthorized("未授权，请先登录");
  }

  try {
    // 检查模板是否存在
    const existingTemplate = await db.taskTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return ApiResponder.notFound("模板不存在");
    }

    await db.taskTemplate.delete({
      where: { id },
    });

    return ApiResponder.success(null, "模板删除成功");
  } catch (error) {
    console.error("删除模板失败:", error);
    return ApiResponder.serverError("删除模板失败");
  }
}
