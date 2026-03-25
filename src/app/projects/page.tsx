'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        pageSize: '10',
      })

      const response = await fetch('/api/v1/projects?' + searchParams, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        // 替换列表而不是追加，避免重复显示
        setProjects(data.data.items)
      }
    } catch (error) {
      console.error('获取项目列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个项目吗？')) {
      return
    }

    try {
      const response = await fetch('/api/v1/projects/' + id, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        setProjects((prev) => prev.filter((p) => p.id !== id))
      }
    } catch (error) {
      console.error('删除项目失败:', error)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [page])

  return (
    <div className="space-y-6 pb-8">
      {/* 页面头部 */}
      <div className="via-background rounded-lg border-none bg-gradient-to-br from-[var(--brand-50)] to-[color-mix(in_oklch,var(--brand-100),transparent_50%)] p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">项目管理</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">查看和管理所有项目</p>
          </div>
          <button
            onClick={() => router.push('/projects/new')}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
          >
            <span className="text-lg">+</span>
            新建项目
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="mb-2 text-lg font-medium text-slate-600 dark:text-slate-300">暂无项目</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">开始创建您的第一个项目</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 transition-all hover:border-blue-200 hover:shadow-lg dark:border-slate-700 dark:from-slate-800 dark:to-slate-900 dark:hover:border-blue-800"
            >
              <div className="mb-4 flex items-start justify-between">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {project.name}
                </h3>
                <span
                  className={
                    'rounded-full px-2.5 py-1 text-xs font-medium ' +
                    (project.status === 'PLANNING'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      : project.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : project.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300')
                  }
                >
                  {project.status === 'PLANNING' ? '计划中' : ''}
                  {project.status === 'ACTIVE' ? '进行中' : ''}
                  {project.status === 'COMPLETED' ? '已完成' : ''}
                  {project.status === 'CANCELED' ? '已取消' : ''}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Link
                  href={'/projects/' + project.id}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                >
                  查看详情 →
                </Link>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="text-sm text-red-600 hover:text-red-700 hover:underline dark:text-red-400 dark:hover:text-red-300"
                >
                  删除
                </button>
              </div>

              <div className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                创建于 {new Date(project.createdAt).toLocaleDateString('zh-CN')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
