import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 任务创建验证 Schema
const createTaskSchema = z.object({
  title: z.string().min(1, "任务标题不能为空"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "TESTING", "DONE"]).optional(),
  progress: z.number().min(0).max(100).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
  projectId: z.string(),
  assigneeIds: z.array(z.string()).optional(),
});

// GET /api/v1/tasks - 获取任务列表
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

    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          assignees: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      db.task.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: tasks,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("获取任务列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取任务列表失败" },
      { status: 500 }
    );
  }
}

// POST /api/v1/tasks - 创建任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

    const task = await db.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        status: validatedData.status || "TODO",
        progress: validatedData.progress || 0,
        priority: validatedData.priority || "MEDIUM",
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        estimatedHours: validatedData.estimatedHours,
        projectId: validatedData.projectId,
        assignees: validatedData.assigneeIds
          ? {
              create: validatedData.assigneeIds.map((userId) => ({
                userId,
              })),
            }
          : undefined,
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("创建任务失败:", error);
    return NextResponse.json(
      { success: false, error: "创建任务失败" },
      { status: 500 }
    );
  }
}
