import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 需求创建验证 Schema
const createRequirementSchema = z.object({
  title: z.string().min(1, "需求标题不能为空"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  projectId: z.string(),
});

// GET /api/v1/requirements - 获取需求列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    const [requirements, total] = await Promise.all([
      db.requirement.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      db.requirement.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: requirements,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("获取需求列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取需求列表失败" },
      { status: 500 }
    );
  }
}

// POST /api/v1/requirements - 创建需求
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createRequirementSchema.parse(body);

    const requirement = await db.requirement.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        status: "PENDING",
        priority: validatedData.priority || "MEDIUM",
        projectId: validatedData.projectId,
      },
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
      data: requirement,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("创建需求失败:", error);
    return NextResponse.json(
      { success: false, error: "创建需求失败" },
      { status: 500 }
    );
  }
}
