export interface Member {
  id: string
  userId: string
  projectId: string
  role: string
  joinedAt: string
  users: {
    id: string
    name: string
    email: string
  }
}

export interface Project {
  id: string
  name: string
  description?: string
  status: string
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
  ownerId: string
  users: {
    id: string
    name: string
    email: string
  }
  _count?: {
    project_members: number
    tasks: number
  }
}

export const statusColors: Record<string, string> = {
  PLANNING: 'bg-blue-500/20 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  ACTIVE: 'bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  ON_HOLD: 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
  COMPLETED: 'bg-gray-500/20 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400',
  CANCELLED: 'bg-red-500/20 text-red-700 dark:bg-red-500/10 dark:text-red-400',
}

export const statusLabels: Record<string, string> = {
  PLANNING: '计划中',
  ACTIVE: '进行中',
  ON_HOLD: '暂停',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}