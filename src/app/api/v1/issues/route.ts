import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 辅助函数：获取已认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.users.findUnique({ where: { id: userId } });
}

// 辅助函数：获取用户有权限访问的项目ID列表
async function getUserProjectIds(userId: string) {
  const userProjects = await db.projects.findMany({
    where: {
      OR: [{ ownerId: userId }, { project_members: { some: { userId: userId } } }],
    },
    select: { id: true },
  });
  return userProjects.map((p) => p.id);
}

// Issue创建验证 Schema
const createIssueSchema = z.object({
  title: z.string().min(1, "问题标题不能为空"),
  description: z.string().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).default("OPEN"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  projectId: z.string().min(1, "项目ID不能为空"),
  requirementId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
});

// Issue更新验证 Schema
const updateIssueSchema = z.object({
  title: z.string().min(1, "问题标题不能为空").optional(),
  description: z.string().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  requirementId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
});

// GET /api/v1/issues - 获取问题列表
export async function GET(request: NextRequest) {
  // 认证检查
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const skip = (page - 1) * pageSize;

    const where: any = {};

    // 权限过滤：非管理员只能看到自己有权限的项目的问题
    if (user.role !== "ADMIN") {
      const projectIds = await getUserProjectIds(user.id);

      if (projectId) {
        // 检查用户是否有权限访问该项目
        if (!projectIds.includes(projectId)) {
          return NextResponse.json(
            { success: false, error: "无权访问此项目" },
            { status: 403 }
          );
        }
        where.projectId = projectId;
      } else {
        // 未指定项目时，只显示用户有权限的项目问题
        if (projectIds.length === 0) {
          return NextResponse.json({
            success: true,
            data: {
              items: [],
              total: 0,
              page,
              pageSize,
              totalPages: 0,
            },
          });
        }
        where.projectId = { in: projectIds };
      }
    } else {
      // 管理员可以看到所有问题
      if (projectId) {
        where.projectId = projectId;
      }
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    const [issues, total] = await Promise.all([
      db.issues.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          projects: {
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
      db.issues.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: issues,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("获取问题列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取问题列表失败" },
      { status: 500 }
    );
  }
}

// POST /api/v1/issues - 创建问题
export async function POST(request: NextRequest) {
  // 认证检查
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = createIssueSchema.parse(body);

    // 验证项目是否存在
    const project = await db.projects.findUnique({
      where: { id: validatedData.projectId },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "项目不存在" },
        { status: 404 }
      );
    }

    // 权限检查：验证用户是否有权限在该项目创建问题
    if (user.role !== "ADMIN") {
      const projectIds = await getUserProjectIds(user.id);
      if (!projectIds.includes(validatedData.projectId)) {
        return NextResponse.json(
          { success: false, error: "无权在此项目创建问题" },
          { status: 403 }
        );
      }
    }

    const issue = await db.issues.create({
      data: {
        id: crypto.randomUUID(),
        title: validatedData.title,
        description: validatedData.description,
        status: validatedData.status,
        priority: validatedData.priority,
        projects: { connect: { id: validatedData.projectId } },
        requirements: validatedData.requirementId ? { connect: { id: validatedData.requirementId } } : undefined,
        updatedAt: new Date(),
      },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: issue,
        message: "问题已创建",
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
    console.error("创建问题失败:", error);
    return NextResponse.json(
      { success: false, error: "创建问题失败" },
      { status: 500 }
    );
  }
}
