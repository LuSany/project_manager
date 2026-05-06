import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getAuthUser, getUserProjectIds } from '@/lib/auth-helpers'
import { ApiResponder } from "@/lib/api/response";

// 需求创建验证 Schema
const createRequirementSchema = z.object({
  title: z.string().min(1, "需求标题不能为空"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  projectId: z.string(),
  // 新增字段
  assigneeId: z.string().optional(),
  reporterId: z.string().optional(),
  dueDate: z.string().optional(),
  estimateHours: z.number().optional(),
  businessLine: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/v1/requirements - 获取需求列表
export async function GET(request: NextRequest) {
  // 认证检查
  const user = await getAuthUser(request);
  if (!user) {
    return ApiResponder.unauthorized('未授权，请先登录')
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    // 新增筛选参数
    const businessLine = searchParams.get("businessLine");
    const tags = searchParams.get("tags");
    const assigneeId = searchParams.get("assigneeId");
    const reporterId = searchParams.get("reporterId");
    const dueDateFrom = searchParams.get("dueDateFrom");
    const dueDateTo = searchParams.get("dueDateTo");

    const skip = (page - 1) * pageSize;

    const where: any = {};

    // 权限过滤：非管理员只能看到自己有权限的项目的需求
    if (user.role !== "ADMIN") {
      const projectIds = await getUserProjectIds(user.id);

      if (projectId) {
        // 检查用户是否有权限访问该项目
        if (!projectIds.includes(projectId)) {
          return ApiResponder.forbidden('无权访问此项目')
        }
        where.projectId = projectId;
      } else {
        // 未指定项目时，只显示用户有权限的项目需求
        if (projectIds.length === 0) {
          return ApiResponder.paginated([], {
            page,
            pageSize,
            total: 0,
            totalPages: 0,
          })
        }
        where.projectId = { in: projectIds };
      }
    } else {
      // 管理员可以看到所有需求
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

    // 新增筛选条件
    if (businessLine) {
      where.businessLine = businessLine;
    }

    if (tags) {
      where.tags = { hasSome: tags.split(",") };
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (reporterId) {
      where.reporterId = reporterId;
    }

    if (dueDateFrom || dueDateTo) {
      where.dueDate = {};
      if (dueDateFrom) {
        where.dueDate.gte = new Date(dueDateFrom);
      }
      if (dueDateTo) {
        where.dueDate.lte = new Date(dueDateTo);
      }
    }

    const [requirements, total] = await Promise.all([
      prisma.requirements.findMany({
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
          assignee: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          reporter: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.requirements.count({ where }),
    ]);

    return ApiResponder.paginated(
      requirements,
      {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      }
    );
  } catch (error) {
    console.error("获取需求列表失败:", error);
    return ApiResponder.serverError('获取需求列表失败')
  }
}

// POST /api/v1/requirements - 创建需求
export async function POST(request: NextRequest) {
  // 认证检查
  const user = await getAuthUser(request);
  if (!user) {
    return ApiResponder.unauthorized('未授权，请先登录')
  }

  try {
    const body = await request.json();
    const validatedData = createRequirementSchema.parse(body);

    // 权限检查：验证用户是否有权限在该项目创建需求
    if (user.role !== "ADMIN") {
      const projectIds = await getUserProjectIds(user.id);
      if (!projectIds.includes(validatedData.projectId)) {
        return ApiResponder.forbidden('无权在此项目创建需求')
      }
    }

    const requirement = await prisma.requirements.create({
      data: {
        id: crypto.randomUUID(),
        title: validatedData.title,
        description: validatedData.description,
        status: "PENDING",
        priority: validatedData.priority || "MEDIUM",
        projects: { connect: { id: validatedData.projectId } },
        // 新增字段 - 使用条件展开避免类型问题
        ...(validatedData.assigneeId ? { assignee: { connect: { id: validatedData.assigneeId } } } : {}),
        reporter: { connect: { id: validatedData.reporterId || user.id } },
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        estimateHours: validatedData.estimateHours ?? null,
        businessLine: validatedData.businessLine ?? null,
        tags: validatedData.tags ?? [],
        updatedAt: new Date(),
      },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        reporter: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return ApiResponder.created(requirement)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError('数据验证失败', { issues: error.issues })
    }
    console.error("创建需求失败:", error);
    return ApiResponder.serverError('创建需求失败')
  }
}
