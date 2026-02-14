import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 子任务创建验证 Schema
const createSubTaskSchema = z.object({
  title: z.string().min(1, "子任务标题不能为空"),
  description: z.string().optional(),
});

// GET /api/v1/tasks/[id]/subtasks - 获取子任务列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 验证任务是否存在
    const task = await db.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
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
  const { id } = await params;

  try {
    const body = await request.json();
    const validatedData = createSubTaskSchema.parse(body);

    // 验证任务是否存在
    const task = await db.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
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
        { success: false, error: error.errors[0].message },
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
