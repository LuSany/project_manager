import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 子任务创建验证 Schema
const createSubTaskSchema = z.object({
  title: z.string().min(1, "子任务标题不能为空"),
  description: z.string().optional(),
});

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

// GET /api/v1/tasks/[id]/subtasks - 获取子任务列表
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

  const { id } = await params;

  try {
    // 验证任务是否存在且用户有权限访问
    const task = await db.task.findFirst({
      where: {
        id,
        project: {
          members: {
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

    // 获取子任务列表
    const subTasks = await db.subTask.findMany({
      where: {
        taskId: id,
        parentId: null, // 只获取顶级子任务
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: subTasks,
    });
  } catch (error) {
    console.error("获取子任务列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取子任务列表失败" },
      { status: 500 }
    );
  }
}

// POST /api/v1/tasks/[id]/subtasks - 创建子任务
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

  const { id } = await params;

  try {
    const body = await request.json();
    const validatedData = createSubTaskSchema.parse(body);

    // 验证任务是否存在且用户有权限访问
    const task = await db.task.findFirst({
      where: {
        id,
        project: {
          members: {
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

    // 创建子任务
    const subTask = await db.subTask.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        taskId: id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: subTask,
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
    console.error("创建子任务失败:", error);
    return NextResponse.json(
      { success: false, error: "创建子任务失败" },
      { status: 500 }
    );
  }
}
