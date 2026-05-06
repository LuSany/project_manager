export interface User {
  id: string
  email: string
  name: string
  department?: string
  position?: string
  role: string
  status: string
  phone?: string
  avatar?: string
  createdAt: string
  updatedAt?: string
}

export const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
  ACTIVE: 'bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  DISABLED: 'bg-red-500/20 text-red-700 dark:bg-red-500/10 dark:text-red-400',
}

export const statusLabels: Record<string, string> = {
  PENDING: '待审批',
  ACTIVE: '已激活',
  DISABLED: '已禁用',
}

export const roleLabels: Record<string, string> = {
  ADMIN: '系统管理员',
  PROJECT_ADMIN: '项目管理员',
  PROJECT_OWNER: '项目所有者',
  PROJECT_MEMBER: '项目成员',
  EMPLOYEE: '普通员工',
}