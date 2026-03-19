import { prisma } from '@/lib/prisma';

/**
 * 检查用户是否有权限访问文件
 * 权限规则：
 * 1. 用户是文件上传者
 * 2. 用户是评审参与者（通过评审材料关联）
 * 3. 用户是项目成员（文件关联的项目）
 * 4. 用户是管理员
 */
export async function checkFileAccess(fileId: string, userId: string): Promise<{
  hasAccess: boolean;
  reason?: string;
}> {
  // 获取文件信息
  const file = await prisma.file_storage.findUnique({
    where: { id: fileId },
    include: {
      users_file_storage_uploadedByTousers: {
        select: { id: true, role: true },
      },
    },
  });

  if (!file) {
    return { hasAccess: false, reason: '文件不存在' };
  }

  // 1. 用户是文件上传者
  if (file.uploadedBy === userId) {
    return { hasAccess: true };
  }

  // 获取用户信息
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    return { hasAccess: false, reason: '用户不存在' };
  }

  // 2. 用户是管理员
  if (user.role === 'ADMIN') {
    return { hasAccess: true };
  }

  // 3. 检查用户是否是评审参与者（通过评审材料关联）
  const review_materials = await prisma.review_materials.findFirst({
    where: { fileId },
    include: {
      reviews: {
        include: {
          review_participants: {
            where: { userId },
          },
          projects: {
            include: {
              project_members: {
                where: { userId },
              },
            },
          },
        },
      },
    },
  });

  if (review_materials) {
    // 用户是该评审的参与者
    if (review_materials.reviews.review_participants.length > 0) {
      return { hasAccess: true };
    }
    // 用户是该评审所属项目的成员
    if (review_materials.reviews.projects.project_members.length > 0) {
      return { hasAccess: true };
    }
    // 用户是该评审所属项目的所有者
    if (review_materials.reviews.projects.ownerId === userId) {
      return { hasAccess: true };
    }
  }

  // 4. 检查文件是否关联到其他项目资源（任务、需求等）
  // 这里可以扩展更多文件关联检查

  return { hasAccess: false, reason: '无权访问此文件' };
}

/**
 * 检查用户是否有权限预览文件（用于OnlyOffice等预览服务）
 * 与文件访问权限相同，但返回更多信息用于预览配置
 */
export async function checkFilePreviewAccess(
  fileId: string,
  userId: string
): Promise<{
  hasAccess: boolean;
  reason?: string;
  file?: {
    id: string;
    fileName: string;
    mimeType: string;
    filePath: string;
    uploadedBy: string;
  };
  user?: {
    id: string;
    name: string;
  };
}> {
  // 获取文件信息
  const file = await prisma.file_storage.findUnique({
    where: { id: fileId },
    include: {
      users_file_storage_uploadedByTousers: {
        select: { id: true, name: true, role: true },
      },
    },
  });

  if (!file) {
    return { hasAccess: false, reason: '文件不存在' };
  }

  // 获取当前用户信息
  const currentUser = await prisma.users.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true },
  });

  if (!currentUser) {
    return { hasAccess: false, reason: '用户不存在' };
  }

  // 检查访问权限
  const accessCheck = await checkFileAccess(fileId, userId);

  if (!accessCheck.hasAccess) {
    return { hasAccess: false, reason: accessCheck.reason };
  }

  return {
    hasAccess: true,
    file: {
      id: file.id,
      fileName: file.fileName,
      mimeType: file.mimeType,
      filePath: file.filePath,
      uploadedBy: file.uploadedBy,
    },
    user: {
      id: currentUser.id,
      name: currentUser.name,
    },
  };
}