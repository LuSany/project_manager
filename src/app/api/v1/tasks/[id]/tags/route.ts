import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.users.findUnique({ where: { id: userId } });
}

// 任务标签关联验证 Schema
const addTagSchema = z.object({
  tagId: z.string().min(1, "标签ID不能为空"),
});

// POST /api/v1/tasks/[id]/tags - 为任务添加标签
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    const { id: taskId } = await params;
    const body = await request.json();
    const { tagId } = addTagSchema.parse(body);

    // 验证任务是否存在且用户有权限访问
    const task = await db.tasks.findFirst({
      where: {
        id: taskId,
        projects: {
          project_members: {
            some: {
              userId: user.id
            }
          }
        }
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在或无权访问" },
        { status: 404 }
      );
    }

    // 验证标签是否存在
    const tag = await db.tags.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      return NextResponse.json(
        { success: false, error: "标签不存在" },
        { status: 404 }
      );
    }

    // 检查是否已经关联
    const existingRelation = await db.task_tags.findUnique({
      where: {
        taskId_tagId: {
          taskId,
          tagId,
        },
      },
    });

    if (existingRelation) {
      return NextResponse.json(
        { success: false, error: "任务已关联该标签" },
        { status: 400 }
      );
    }

    // 创建关联
    const task_tags = await db.task_tags.create({
      data: {
        taskId,
        tagId,
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: task_tags,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("为任务添加标签失败:", error);
    return NextResponse.json(
      { success: false, error: "为任务添加标签失败" },
      { status: 500 }
    );
  }
}

// GET /api/v1/tasks/[id]/tags - 获取任务的所有标签
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    const { id: taskId } = await params;

    // 验证任务是否存在且用户有权限访问
    const task = await db.tasks.findFirst({
      where: {
        id: taskId,
        projects: {
          project_members: {
            some: {
              userId: user.id
            }
          }
        }
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在或无权访问" },
        { status: 404 }
      );
    }

    const task_tags = await db.task_tags.findMany({
      where: { taskId },
      include: {
        tags: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: task_tags.map((tt) => tt.tags),
    });
  } catch (error) {
    console.error("获取任务标签失败:", error);
    return NextResponse.json(
      { success: false, error: "获取任务标签失败" },
      { status: 500 }
    );
  }
}
