import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 辅助函数：获取已认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

// 波及影响分析创建验证 Schema
const createImpactSchema = z.object({
  description: z.string().min(1, "影响描述不能为空"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

// POST /api/v1/requirements/[id]/impacts - 创建影响分析记录
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
    const validatedData = createImpactSchema.parse(body);

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

    // 创建波及影响分析记录
    const impact = await db.requirementImpact.create({
      data: {
        requirementId: id,
        description: validatedData.description,
        severity: validatedData.severity,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: impact,
        message: "波及影响分析记录已创建",
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
    console.error("创建波及影响分析失败:", error);
    return NextResponse.json(
      { success: false, error: "创建波及影响分析失败" },
      { status: 500 }
    );
  }
}
