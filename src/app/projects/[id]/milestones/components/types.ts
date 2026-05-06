export interface Task {
  id: string
  title: string
  status: string
  progress: number
}

export interface Milestone {
  id: string
  title: string
  description?: string
  status: string
  progress: number
  dueDate?: string
  createdAt: string
  tasks?: Task[]
  _count?: {
    tasks: number
  }
}

export interface ProjectTask {
  id: string
  title: string
  status: string
  milestoneId?: string | null
}

export const statusColors: Record<string, string> = {
  NOT_STARTED: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export const statusLabels: Record<string, string> = {
  NOT_STARTED: '未开始',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}

export const taskStatusLabels: Record<string, string> = {
  TODO: '待办',
  IN_PROGRESS: '进行中',
  REVIEW: '待审核',
  TESTING: '测试中',
  DONE: '已完成',
  CANCELLED: '已取消',
}

export type CreateMilestoneFormData = {
  title: string
  description: string
  dueDate: string
}

export type EditMilestoneFormData = {
  title: string
  description: string
  status: string
  progress: number
  dueDate: string
}