import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { DependencyType } from "@/types/task-dependency";

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

// 任务依赖创建验证 Schema
const createDependencySchema = z.object({
  dependsOnId: z.string().min(1, "依赖任务ID不能为空"),
  dependencyType: z.nativeEnum(DependencyType).optional().default(DependencyType.FINISH_TO_START),
});

// GET /api/v1/tasks/[id]/dependencies - 获取任务依赖列表
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
    const task = await db.task.findFirst({
      where: {
        id: taskId,
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

    // 获取任务依赖列表（包含被依赖任务的信息）
    const dependencies = await db.taskDependency.findMany({
      where: {
        taskId,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 转换数据格式，将被依赖任务信息放在 dependsOnTask 字段中
    const formattedDependencies = dependencies.map((dep: any) => ({
      id: dep.id,
      taskId: dep.taskId,
      dependsOnId: dep.dependsOnId,
      dependencyType: dep.dependencyType,
      createdAt: dep.createdAt,
      dependsOnTask: dep.task,
    }));

    return NextResponse.json({
      success: true,
      data: formattedDependencies,
    });
  } catch (error) {
    console.error("获取任务依赖列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取任务依赖列表失败" },
      { status: 500 }
    );
  }
}

// POST /api/v1/tasks/[id]/dependencies - 添加任务依赖
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
    const validatedData = createDependencySchema.parse(body);

    // 验证任务是否存在且用户有权限访问
    const task = await db.task.findFirst({
      where: {
        id: taskId,
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

    // 不能依赖自己
    if (validatedData.dependsOnId === taskId) {
      return NextResponse.json(
        { success: false, error: "任务不能依赖自己" },
        { status: 400 }
      );
    }

    // 验证被依赖任务是否存在且在同一项目中
    const dependsOnTask = await db.task.findFirst({
      where: {
        id: validatedData.dependsOnId,
        projectId: task.projectId,
      },
    });

    if (!dependsOnTask) {
      return NextResponse.json(
        { success: false, error: "被依赖任务不存在或不在同一项目中" },
        { status: 404 }
      );
    }

    // 检查依赖关系是否已存在
    const existingDependency = await db.taskDependency.findUnique({
      where: {
        id: `${taskId}-${validatedData.dependsOnId}`,
      },
    });

    if (existingDependency) {
      return NextResponse.json(
        { success: false, error: "依赖关系已存在" },
        { status: 400 }
      );
    }

    // 创建依赖关系
    const dependency = await db.taskDependency.create({
      data: {
        taskId,
        dependsOnId: validatedData.dependsOnId,
        dependencyType: validatedData.dependencyType,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: dependency,
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
    console.error("添加任务依赖失败:", error);
    return NextResponse.json(
      { success: false, error: "添加任务依赖失败" },
      { status: 500 }
    );
  }
}
