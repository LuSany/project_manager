import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

// 需求拒绝验证 Schema
const rejectRequirementSchema = z.object({
  rejectReason: z.string().min(1, "拒绝原因不能为空"),
});

// PUT /api/v1/requirements/[id]/reject - 拒绝需求
export async function PUT(
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
    const { rejectReason } = rejectRequirementSchema.parse(body);
    const userId = user.id; // 使用认证用户的ID

    // 验证需求是否存在
    const requirement = await db.requirement.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              where: {
                userId,
              },
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

    // 验证权限：必须是PROJECT_OWNER或PROJECT_ADMIN
    const member = requirement.project.members.find(
      (m) => m.role === "PROJECT_OWNER" || m.role === "PROJECT_ADMIN"
    );

    if (!member && requirement.project.ownerId !== userId) {
      return NextResponse.json(
        { success: false, error: "无权限拒绝需求" },
        { status: 403 }
      );
    }

    // 更新需求状态为REJECTED
    const updatedRequirement = await db.requirement.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedBy: userId,
        reviewedAt: new Date(),
        rejectReason,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRequirement,
      message: "需求已拒绝",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("拒绝需求失败:", error);
    return NextResponse.json(
      { success: false, error: "拒绝需求失败" },
      { status: 500 }
    );
  }
}
