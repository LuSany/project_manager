'use client'

import { useState, useEffect, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Loader2,
  Search,
  FileText,
  CheckSquare,
  AlertTriangle,
  ShieldAlert,
  FolderKanban,
} from 'lucide-react'
import Link from 'next/link'
import type { SearchResult, SearchResultItem } from '@/types/search'
import { SearchType } from '@/types/search'

const typeLabels: Record<string, string> = {
  [SearchType.PROJECT]: '项目',
  [SearchType.TASK]: '任务',
  [SearchType.REQUIREMENT]: '需求',
  [SearchType.ISSUE]: '问题',
  [SearchType.RISK]: '风险',
}

const typeIcons: Record<string, React.ReactNode> = {
  [SearchType.PROJECT]: <FolderKanban className="h-4 w-4" />,
  [SearchType.TASK]: <CheckSquare className="h-4 w-4" />,
  [SearchType.REQUIREMENT]: <FileText className="h-4 w-4" />,
  [SearchType.ISSUE]: <AlertTriangle className="h-4 w-4" />,
  [SearchType.RISK]: <ShieldAlert className="h-4 w-4" />,
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  BLOCKED: 'bg-red-100 text-red-800 border-red-200',
  OPEN: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
  REVIEWED: 'bg-purple-100 text-purple-800 border-purple-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  IDENTIFIED: 'bg-orange-100 text-orange-800 border-orange-200',
  ANALYZING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  MITIGATING: 'bg-blue-100 text-blue-800 border-blue-200',
  MONITORING: 'bg-purple-100 text-purple-800 border-purple-200',
  RESOLVED: 'bg-green-100 text-green-800 border-green-200',
}

const statusLabels: Record<string, string> = {
  ACTIVE: '进行中',
  PENDING: '待处理',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  IN_PROGRESS: '进行中',
  BLOCKED: '已阻塞',
  OPEN: '开启',
  CLOSED: '已关闭',
  REVIEWED: '已评审',
  APPROVED: '已批准',
  REJECTED: '已拒绝',
  IDENTIFIED: '已识别',
  ANALYZING: '分析中',
  MITIGATING: '缓解中',
  MONITORING: '监控中',
  RESOLVED: '已解决',
}

interface SearchPageProps {
  searchParams: {
    q?: string
    page?: string
    types?: string
  }
}

function SearchResultsContent({ searchParams }: SearchPageProps) {
  const query = searchParams.q || ''
  const page = parseInt(searchParams.page || '1')
  const typesParam = searchParams.types || ''

  const [loading, setLoading] = useState(true)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [selectedType, setSelectedType] = useState<string>('all')

  useEffect(() => {
    if (!query.trim()) {
      setSearchResult({
        results: {},
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      })
      setLoading(false)
      return
    }

    fetchResults()
  }, [query, page, typesParam])

  const fetchResults = async () => {
    try {
      const params = new URLSearchParams({
        q: query,
        page: page.toString(),
      })
      if (typesParam) {
        params.append('types', typesParam)
      }

      const response = await fetch(`/api/v1/search?${params.toString()}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('搜索请求失败')
      }

      const data = await response.json()
      if (data.success) {
        setSearchResult(data.data)
      }
    } catch (error) {
      console.error('获取搜索结果失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto flex min-h-[400px] items-center justify-center py-6">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  const results = searchResult?.results || {}
  const totalResults = searchResult?.total || 0
  const totalPages = searchResult?.totalPages || 0

  const filteredResults =
    selectedType === 'all'
      ? results
      : { [selectedType]: results[selectedType as keyof typeof results] }

  const availableTypes = Object.keys(results).filter(
    (key) =>
      results[key as keyof typeof results] && results[key as keyof typeof results]!.length > 0
  )

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Search className="text-primary h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold">{query ? `搜索: "${query}"` : '搜索'}</h1>
          {totalResults > 0 && (
            <p className="text-muted-foreground text-sm">找到 {totalResults} 个结果</p>
          )}
        </div>
      </div>

      {!query.trim() || (totalResults === 0 && !loading) ? (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 opacity-50" />
            {!query.trim() ? <p>请输入搜索关键词</p> : <p>未找到与 "{query}" 相关的结果</p>}
          </CardContent>
        </Card>
      ) : (
        <>
          {availableTypes.length > 0 && (
            <Tabs value={selectedType} onValueChange={setSelectedType}>
              <TabsList>
                <TabsTrigger value="all">全部 ({totalResults})</TabsTrigger>
                {availableTypes.map((type) => (
                  <TabsTrigger key={type} value={type}>
                    {typeLabels[type] || type}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={selectedType === 'all' ? 'all' : selectedType} className="mt-4">
                <div className="space-y-4">
                  {Object.entries(filteredResults).map(([type, items]) => {
                    if (!items || items.length === 0) return null

                    return (
                      <div key={type} className="space-y-3">
                        <div className="flex items-center gap-2">
                          {typeIcons[type]}
                          <h2 className="font-semibold">
                            {typeLabels[type] || type} ({items.length})
                          </h2>
                        </div>

                        {items.map((item: SearchResultItem) => (
                          <Link key={item.id} href={item.url}>
                            <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
                              <CardContent className="py-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0 flex-1">
                                    <div className="mb-2 flex items-center gap-2">
                                      <Badge variant="outline">
                                        {typeLabels[item.type] || item.type}
                                      </Badge>
                                      {item.status && (
                                        <Badge
                                          className={
                                            statusColors[item.status] ||
                                            'border-gray-200 bg-gray-100 text-gray-800'
                                          }
                                        >
                                          {statusLabels[item.status] || item.status}
                                        </Badge>
                                      )}
                                    </div>
                                    <h3 className="font-medium">{item.title}</h3>
                                    {item.description && (
                                      <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                                        {item.description}
                                      </p>
                                    )}
                                    <div className="text-muted-foreground mt-2 text-xs">
                                      创建时间: {new Date(item.createdAt).toLocaleString('zh-CN')}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </TabsContent>
            </Tabs>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => {
                  const params = new URLSearchParams()
                  params.set('q', query)
                  params.set('page', (page - 1).toString())
                  if (typesParam) params.set('types', typesParam)
                  window.location.href = `/search?${params.toString()}`
                }}
              >
                上一页
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                  .map((p, index, array) => {
                    const prev = array[index - 1]
                    if (prev && p - prev > 1) {
                      return (
                        <span key={`ellipsis-${p}`} className="text-muted-foreground px-2">
                          ...
                        </span>
                      )
                    }

                    return (
                      <Button
                        key={p}
                        variant={p === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const params = new URLSearchParams()
                          params.set('q', query)
                          params.set('page', p.toString())
                          if (typesParam) params.set('types', typesParam)
                          window.location.href = `/search?${params.toString()}`
                        }}
                      >
                        {p}
                      </Button>
                    )
                  })}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => {
                  const params = new URLSearchParams()
                  params.set('q', query)
                  params.set('page', (page + 1).toString())
                  if (typesParam) params.set('types', typesParam)
                  window.location.href = `/search?${params.toString()}`
                }}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto flex min-h-[400px] items-center justify-center py-6">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SearchResultsContent searchParams={searchParams} />
    </Suspense>
  )
}
