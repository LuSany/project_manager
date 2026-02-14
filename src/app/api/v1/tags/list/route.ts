import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/v1/tags/list - 获取所有标签
export async function GET(request: NextRequest) {
  try {
    const tags = await db.tag.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            taskTags: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error("获取标签列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取标签列表失败" },
      { status: 500 }
    );
  }
}
