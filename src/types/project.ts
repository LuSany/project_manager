// ============================================================================
// 项目相关类型定义
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "REGULAR" | "ADMIN";

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  ownerId: string;
  startDate?: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  members?: ProjectMember[];
}

export type ProjectStatus = "PLANNING" | "ACTIVE" | "COMPLETED" | "CANCELED";

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  user: User;
  role: ProjectMemberRole;
  joinedAt: string;
}

export type ProjectMemberRole = "PROJECT_OWNER" | "PROJECT_ADMIN" | "PROJECT_MEMBER";

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: MilestoneStatus;
  targetDate: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type MilestoneStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";
