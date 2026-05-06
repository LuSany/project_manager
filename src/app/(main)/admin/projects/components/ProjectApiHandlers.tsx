import { Project, Member } from './types'
import { api } from '@/lib/api/client'
import { toast } from '@/hooks/use-toast'

export interface ProjectApiHandlers {
  fetchProjects: () => Promise<void>
  fetchAllMembers: (projectIds: string[]) => Promise<void>
  handleDeleteProject: (selectedProject: Project | null) => Promise<void>
  handleArchiveProject: (selectedProject: Project | null) => Promise<void>
}

export function createProjectApiHandlers(
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setStats: React.Dispatch<React.SetStateAction<{ total: number; active: number; completed: number }>>,
  setProjectMembers: React.Dispatch<React.SetStateAction<Record<string, Member[]>>>,
  setDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setArchiveDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setSelectedProject: React.Dispatch<React.SetStateAction<Project | null>>,
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>
): ProjectApiHandlers {
  const fetchProjects = async () => {
    setLoading(true)
    try {
      const response = await api.get<Project[]>('/admin/projects')
      const data = (response as { data?: Project[] }).data || []
      setProjects(data)

      const total = data.length
      const active = data.filter((p) => p.status === 'ACTIVE').length
      const completed = data.filter((p) => p.status === 'COMPLETED').length
      setStats({ total, active, completed })

      await fetchAllMembers(data.map((p) => p.id))
    } catch (error) {
      toast({
        title: '获取失败',
        description: '获取项目列表失败，请检查网络连接',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAllMembers = async (projectIds: string[]) => {
    try {
      const membersData: Record<string, Member[]> = {}
      for (const projectId of projectIds) {
        const response = await api.get<Member[]>(`/projects/${projectId}/members`)
        if ((response as { success?: boolean }).success) {
          membersData[projectId] = (response as { data?: Member[] }).data || []
        }
      }
      setProjectMembers(membersData)
    } catch (error) {
      console.error('获取成员列表失败:', error)
    }
  }

  const handleDeleteProject = async (selectedProject: Project | null) => {
    if (!selectedProject) return
    setSubmitting(true)
    try {
      const response = await api.delete('/admin/projects/' + selectedProject.id)
      if ((response as { success?: boolean }).success) {
        toast({ title: '删除成功', description: `项目「${selectedProject.name}」已删除` })
        setDeleteDialogOpen(false)
        setSelectedProject(null)
        await fetchProjects()
      }
    } catch (error) {
      toast({ title: '删除失败', description: '删除项目失败，请重试', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleArchiveProject = async (selectedProject: Project | null) => {
    if (!selectedProject) return
    const isArchived = selectedProject.status === 'COMPLETED'
    const newStatus = isArchived ? 'PLANNING' : 'COMPLETED'
    const action = isArchived ? '取消归档' : '归档'

    setSubmitting(true)
    try {
      const response = await api.put(`/admin/projects/${selectedProject.id}`, {
        status: newStatus,
      })
      if ((response as { success?: boolean }).success) {
        toast({ title: '操作成功', description: `已${action}项目「${selectedProject.name}」` })
        setArchiveDialogOpen(false)
        setSelectedProject(null)
        await fetchProjects()
      }
    } catch (error) {
      toast({
        title: `${action}失败`,
        description: `${action}项目失败，请重试`,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return {
    fetchProjects,
    fetchAllMembers,
    handleDeleteProject,
    handleArchiveProject,
  }
}