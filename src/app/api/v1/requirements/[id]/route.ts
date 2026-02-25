import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 辅助函数：获取已认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

// 需求更新验证 Schema
const updateRequirementSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "IN_PROGRESS", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

// GET /api/v1/requirements/[id] - 获取需求详情
export async function GET(
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
    const requirement = await db.requirement.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
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

    return NextResponse.json({
      success: true,
      data: requirement,
    });
  } catch (error) {
    console.error("获取需求详情失败:", error);
    return NextResponse.json(
      { success: false, error: "获取需求详情失败" },
      { status: 500 }
    );
  }
}

// PUT /api/v1/requirements/[id] - 更新需求
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
    const validatedData = updateRequirementSchema.parse(body);

    // 验证需求是否存在
    const existing = await db.requirement.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "需求不存在" },
        { status: 404 }
      );
    }

    // 记录变更历史
    const changes: Record<string, any> = {};
    if (validatedData.status && validatedData.status !== existing.status) {
      changes.changeType = "STATUS_CHANGE";
      changes.oldValue = existing.status;
      changes.newValue = validatedData.status;
    } else if (validatedData.priority && validatedData.priority !== existing.priority) {
      changes.changeType = "PRIORITY_CHANGE";
      changes.oldValue = existing.priority;
      changes.newValue = validatedData.priority;
    } else if (validatedData.title && validatedData.title !== existing.title) {
      changes.changeType = "CONTENT_UPDATE";
      changes.oldValue = existing.title;
      changes.newValue = validatedData.title;
    } else if (validatedData.description && validatedData.description !== existing.description) {
      changes.changeType = "CONTENT_UPDATE";
      changes.oldValue = existing.description || "";
      changes.newValue = validatedData.description;
    }

    const [requirement] = await Promise.all([
      db.requirement.update({
        where: { id },
        data: validatedData,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      // 如果有变更，记录到历史
      changes.changeType
        ? db.requirementHistory.create({
            data: {
              requirementId: id,
              changeType: changes.changeType,
              oldValue: changes.oldValue,
              newValue: changes.newValue,
              changedBy: user.id,
            },
          })
        : Promise.resolve(),
    ]);

    return NextResponse.json({
      success: true,
      data: requirement,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("更新需求失败:", error);
    return NextResponse.json(
      { success: false, error: "更新需求失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/requirements/[id] - 删除需求
export async function DELETE(
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
    // 验证需求是否存在
    const existing = await db.requirement.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "需求不存在" },
        { status: 404 }
      );
    }

    await db.requirement.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "需求已删除",
    });
  } catch (error) {
    console.error("删除需求失败:", error);
    return NextResponse.json(
      { success: false, error: "删除需求失败" },
      { status: 500 }
    );
  }
}
