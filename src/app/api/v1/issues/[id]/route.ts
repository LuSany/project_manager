import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// Issue更新验证 Schema
const updateIssueSchema = z.object({
  title: z.string().min(1, "问题标题不能为空").optional(),
  description: z.string().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

// GET /api/v1/issues/[id] - 获取问题详情
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const issue = await db.issue.findUnique({
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

    if (!issue) {
      return NextResponse.json(
        { success: false, error: "问题不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: issue,
    });
  } catch (error) {
    console.error("获取问题详情失败:", error);
    return NextResponse.json(
      { success: false, error: "获取问题详情失败" },
      { status: 500 }
    );
  }
}

// PUT /api/v1/issues/[id] - 更新问题
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const validatedData = updateIssueSchema.parse(body);

    // 验证问题是否存在
    const existing = await db.issue.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "问题不存在" },
        { status: 404 }
      );
    }

    const issue = await db.issue.update({
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
    });

    return NextResponse.json({
      success: true,
      data: issue,
      message: "问题已更新",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("更新问题失败:", error);
    return NextResponse.json(
      { success: false, error: "更新问题失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/issues/[id] - 删除问题
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    // 验证问题是否存在
    const existing = await db.issue.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "问题不存在" },
        { status: 404 }
      );
    }

    await db.issue.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "问题已删除",
    });
  } catch (error) {
    console.error("删除问题失败:", error);
    return NextResponse.json(
      { success: false, error: "删除问题失败" },
      { status: 500 }
    );
  }
}
