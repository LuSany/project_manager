import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 任务标签关联验证 Schema
const addTagSchema = z.object({
  tagId: z.string().min(1, "标签ID不能为空"),
});

// POST /api/v1/tasks/[id]/tags - 为任务添加标签
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();
    const { tagId } = addTagSchema.parse(body);

    // 验证任务是否存在
    const task = await db.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    // 验证标签是否存在
    const tag = await db.tag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      return NextResponse.json(
        { success: false, error: "标签不存在" },
        { status: 404 }
      );
    }

    // 检查是否已经关联
    const existingRelation = await db.taskTag.findUnique({
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
    const taskTag = await db.taskTag.create({
      data: {
        taskId,
        tagId,
      },
      include: {
        tag: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: taskTag,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
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
  try {
    const { id: taskId } = await params;

    // 验证任务是否存在
    const task = await db.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    const taskTags = await db.taskTag.findMany({
      where: { taskId },
      include: {
        tag: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: taskTags.map((tt) => tt.tag),
    });
  } catch (error) {
    console.error("获取任务标签失败:", error);
    return NextResponse.json(
      { success: false, error: "获取任务标签失败" },
      { status: 500 }
    );
  }
}
