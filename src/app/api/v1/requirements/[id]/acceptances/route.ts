import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 辅助函数：获取已认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

// 需求验收创建验证 Schema
const createAcceptanceSchema = z.object({
  result: z.enum(["PENDING", "PASSED", "FAILED", "CONDITIONAL"]).default("PENDING"),
  notes: z.string().optional(),
});

// POST /api/v1/requirements/[id]/acceptances - 创建验收记录
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // 认证检查
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = createAcceptanceSchema.parse(body);

    // 验证需求是否存在并检查项目成员权限
    const requirement = await db.requirement.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              where: { userId: user.id },
            },
          },
        },
      },
    });

    if (!requirement) {
      return NextResponse.json(
        { success: false, error: "需求不存在" },
        { status: 404 }
      );
    }

    // 检查用户是否为项目成员或管理员
    if (requirement.project.ownerId !== user.id && requirement.project.members.length === 0 && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: "无权访问此需求" },
        { status: 403 }
      );
    }

    // 创建验收记录（使用认证用户的ID）
    const acceptance = await db.requirementAcceptance.create({
      data: {
        requirementId: id,
        userId: user.id,
        result: validatedData.result,
        notes: validatedData.notes,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: acceptance,
        message: "验收记录已创建",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("创建验收记录失败:", error);
    return NextResponse.json(
      { success: false, error: "创建验收记录失败" },
      { status: 500 }
    );
  }
}
