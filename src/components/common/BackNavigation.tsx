'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'

interface BackNavigationProps {
  backHref?: string
  backLabel?: string
  showHome?: boolean
}

export function BackNavigation({ backHref, backLabel = '返回', showHome = true }: BackNavigationProps) {
  const router = useRouter()

  if (backHref) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <Link href={backHref}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>
        </Link>
        {showHome && (
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              <Home className="h-4 w-4" />
              工作台
            </Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 mb-4">
      <Button variant="ghost" size="sm" className="gap-1" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Button>
      {showHome && (
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-1">
            <Home className="h-4 w-4" />
            工作台
          </Button>
        </Link>
      )}
    </div>
  )
}