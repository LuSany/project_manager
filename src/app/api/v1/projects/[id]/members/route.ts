import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiResponder } from "@/lib/api/response";

// 成员验证Schema
const addMemberSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  role: z.enum(["PROJECT_OWNER", "PROJECT_ADMIN", "PROJECT_MEMBER"]).default("PROJECT_MEMBER"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 认证检查
  const userId = req.cookies.get('user-id')?.value;
  const userRole = req.cookies.get('user-role')?.value;

  if (!userId) {
    return ApiResponder.unauthorized("未授权，请先登录");
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return ApiResponder.notFound("项目不存在");
    }

    // 权限检查 - 项目成员、项目所有者或管理员可以查看
    const isProjectOwner = project.ownerId === userId;
    const isProjectMember = project.members.some(m => m.userId === userId);
    const isAdmin = userRole === "ADMIN";

    if (!isProjectOwner && !isProjectMember && !isAdmin) {
      return ApiResponder.forbidden("无权查看项目成员");
    }

    // 格式化成员数据
    const formattedMembers = project.members.map(m => ({
      userId: m.userId,
      userName: m.user.name,
      userEmail: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return ApiResponder.success(formattedMembers);
  } catch (error) {
    console.error("获取项目成员失败:", error);
    return ApiResponder.serverError("获取项目成员失败");
  }
}

// POST - 添加项目成员
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 认证检查
  const currentUserId = req.cookies.get('user-id')?.value;
  const currentUserRole = req.cookies.get('user-role')?.value;

  if (!currentUserId) {
    return ApiResponder.unauthorized("未授权，请先登录");
  }

  try {
    // 验证项目存在
    const project = await prisma.project.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!project) {
      return ApiResponder.notFound("项目不存在");
    }

    // 权限检查 - 只有项目所有者、项目管理员或系统管理员可以添加成员
    const isProjectOwner = project.ownerId === currentUserId;
    const isProjectAdmin = project.members.some(
      m => m.userId === currentUserId && m.role === "PROJECT_ADMIN"
    );
    const isAdmin = currentUserRole === "ADMIN";

    if (!isProjectOwner && !isProjectAdmin && !isAdmin) {
      return ApiResponder.forbidden("无权添加项目成员");
    }

    // 解析请求体
    const body = await req.json();
    const validatedData = addMemberSchema.parse(body);

    // 查找要添加的用户
    const userToAdd = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!userToAdd) {
      return ApiResponder.notFound("用户不存在，请确认邮箱地址正确");
    }

    // 检查用户是否已是项目成员
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: userToAdd.id,
        },
      },
    });

    if (existingMember) {
      return ApiResponder.error("该用户已是项目成员", 400);
    }

    // 添加成员
    const newMember = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: userToAdd.id,
        role: validatedData.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return ApiResponder.success({
      userId: newMember.userId,
      userName: newMember.user.name,
      userEmail: newMember.user.email,
      role: newMember.role,
      joinedAt: newMember.joinedAt,
    }, "成员添加成功");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError("数据验证失败", error.issues as any);
    }
    console.error("添加项目成员失败:", error);
    return ApiResponder.serverError("添加项目成员失败");
  }
}

// DELETE - 移除项目成员
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 认证检查
  const currentUserId = req.cookies.get('user-id')?.value;
  const currentUserRole = req.cookies.get('user-role')?.value;

  if (!currentUserId) {
    return ApiResponder.unauthorized("未授权，请先登录");
  }

  try {
    // 解析请求体获取要移除的用户ID
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return ApiResponder.error("缺少用户ID", 400);
    }

    // 验证项目存在
    const project = await prisma.project.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!project) {
      return ApiResponder.notFound("项目不存在");
    }

    // 权限检查 - 只有项目所有者、项目管理员或系统管理员可以移除成员
    const isProjectOwner = project.ownerId === currentUserId;
    const isProjectAdmin = project.members.some(
      m => m.userId === currentUserId && m.role === "PROJECT_ADMIN"
    );
    const isAdmin = currentUserRole === "ADMIN";

    if (!isProjectOwner && !isProjectAdmin && !isAdmin) {
      return ApiResponder.forbidden("无权移除项目成员");
    }

    // 不能移除项目所有者
    if (project.ownerId === userId) {
      return ApiResponder.error("不能移除项目所有者", 400);
    }

    // 删除成员关系
    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId: id,
          userId: userId,
        },
      },
    });

    return ApiResponder.success(null, "成员已移除");
  } catch (error) {
    console.error("移除项目成员失败:", error);
    return ApiResponder.serverError("移除项目成员失败");
  }
}
