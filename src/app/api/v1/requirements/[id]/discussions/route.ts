import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

// 创建讨论验证 Schema
const createDiscussionSchema = z.object({
  content: z.string().min(1, "讨论内容不能为空"),
  taskId: z.string().optional(),
});

// GET /api/v1/requirements/[id]/discussions - 获取需求讨论列表
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: requirementId } = await context.params;

  // 认证检查
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    const discussions = await db.requirementDiscussion.findMany({
      where: { requirementId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: discussions,
    });
  } catch (error) {
    console.error("获取需求讨论失败:", error);
    return NextResponse.json(
      { success: false, error: "获取需求讨论失败" },
      { status: 500 }
    );
  }
}

// POST /api/v1/requirements/[id]/discussions - 创建需求讨论
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: requirementId } = await context.params;

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
    const validatedData = createDiscussionSchema.parse(body);

    // 验证需求是否存在
    const requirement = await db.requirement.findUnique({
      where: { id: requirementId },
    });

    if (!requirement) {
      return NextResponse.json(
        { success: false, error: "需求不存在" },
        { status: 404 }
      );
    }

    // 验证任务是否存在（如果提供了 taskId）
    if (validatedData.taskId) {
      const task = await db.task.findUnique({
        where: { id: validatedData.taskId },
      });

      if (!task) {
        return NextResponse.json(
          { success: false, error: "关联的任务不存在" },
          { status: 404 }
        );
      }
    }

    const discussion = await db.requirementDiscussion.create({
      data: {
        ...validatedData,
        requirementId,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // 自动记录到变更历史
    await db.requirementHistory.create({
      data: {
        requirementId,
        changeType: "DISCUSSION_ADDED",
        oldValue: null,
        newValue: `添加了新讨论`,
        changedBy: user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: discussion,
        message: "讨论已创建",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("创建需求讨论失败:", error);
    return NextResponse.json(
      { success: false, error: "创建需求讨论失败" },
      { status: 500 }
    );
  }
}
