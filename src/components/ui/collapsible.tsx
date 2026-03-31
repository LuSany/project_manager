'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface CollapsibleProps {
  title: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
  contentClassName?: string
}

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  className,
  contentClassName,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <div className={cn('rounded-lg border', className)}>
      <Button
        variant="ghost"
        className="w-full justify-between rounded-none border-b px-4 py-3 font-medium"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </Button>
      {isOpen && <div className={cn('p-4', contentClassName)}>{children}</div>}
    </div>
  )
}

// Simple collapsible section without border
interface CollapsibleSectionProps {
  title: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
  onToggle?: (open: boolean) => void
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  className,
  onToggle,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    onToggle?.(newState)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <button
        type="button"
        onClick={handleToggle}
        className="hover:text-foreground/80 flex w-full items-center justify-between py-2 text-sm font-medium"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </button>
      {isOpen && <div className="pt-2">{children}</div>}
    </div>
  )
}
