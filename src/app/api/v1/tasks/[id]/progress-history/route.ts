import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getAuthUser } from '@/lib/auth-helpers'

// GET /api/v1/tasks/[id]/progress-history - 获取任务进展历史
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    // 验证任务是否存在
    const task = await prisma.tasks.findUnique({
      where: { id },
      select: { id: true, projectId: true },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    // 获取进展历史
    const history = await prisma.task_progress_history.findMany({
      where: { taskId: id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("获取进展历史失败:", error);
    return NextResponse.json(
      { success: false, error: "获取进展历史失败" },
      { status: 500 }
    );
  }
}

// POST /api/v1/tasks/[id]/progress-history - 添加进展记录
const createProgressSchema = z.object({
  progress: z.number().min(0).max(100),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'TESTING', 'DONE', 'CANCELLED', 'DELAYED', 'BLOCKED']).optional(),
  comment: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = createProgressSchema.parse(body);

    // 获取当前任务
    const task = await prisma.tasks.findUnique({
      where: { id },
      select: { id: true, progress: true, status: true, projectId: true },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    // 创建进展历史记录并更新任务
    const [historyRecord] = await prisma.$transaction([
      prisma.task_progress_history.create({
        data: {
          id: crypto.randomUUID(),
          tasks: { connect: { id } },
          users: { connect: { id: user.id } },
          progress: validatedData.progress,
          status: validatedData.status || null,
          comment: validatedData.comment || null,
          previousProgress: task.progress,
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.tasks.update({
        where: { id },
        data: {
          progress: validatedData.progress,
          ...(validatedData.status && { status: validatedData.status }),
          ...(validatedData.progress === 100 && { completedAt: new Date() }),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: historyRecord,
      message: "进展记录已添加",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "数据验证失败", details: error.issues },
        { status: 400 }
      );
    }
    console.error("添加进展记录失败:", error);
    return NextResponse.json(
      { success: false, error: "添加进展记录失败" },
      { status: 500 }
    );
  }
}