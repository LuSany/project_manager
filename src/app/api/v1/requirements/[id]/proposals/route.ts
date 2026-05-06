import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getAuthUser } from '@/lib/auth-helpers'

// 方案创建验证 Schema
const createProposalSchema = z.object({
  content: z.string().min(1, "方案内容不能为空"),
  estimatedHours: z.number().positive().optional(),
  estimatedCost: z.number().positive().optional(),
});

// POST /api/v1/requirements/[id]/proposalss - 创建方案
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

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
    const validatedData = createProposalSchema.parse(body);

    // 验证需求是否存在并检查项目成员权限
    const requirement = await prisma.requirements.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            project_members: {
              where: { userId: user.id },
            },
          },
        },
      },
    });

    if (!requirement) {
      return NextResponse.json(
        { success: false, error: "需求不存在" },
        { status: 404 }
      );
    }

    // 检查用户是否为项目成员或管理员
    if (requirement.projects.ownerId !== user.id && requirement.projects.project_members.length === 0 && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: "无权访问此需求" },
        { status: 403 }
      );
    }

    // 创建方案（使用认证用户的ID）
    const proposals = await prisma.proposals.create({
      data: {
        id: crypto.randomUUID(),
        requirements: { connect: { id } },
        users: { connect: { id: user.id } },
        content: validatedData.content,
        estimatedHours: validatedData.estimatedHours,
        estimatedCost: validatedData.estimatedCost,
        status: "PENDING",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: proposals,
        message: "方案已创建",
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
    console.error("创建方案失败:", error);
    return NextResponse.json(
      { success: false, error: "创建方案失败" },
      { status: 500 }
    );
  }
}
