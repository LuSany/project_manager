'use client'

import React, { useEffect } from 'react'
import { Undo, Redo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useHistoryStore } from '@/stores/historyStore'
import { cn } from '@/lib/utils'

export function UndoRedoToolbar({ className }: { className?: string }) {
  const canUndo = useHistoryStore((state) => state.canUndo())
  const canRedo = useHistoryStore((state) => state.canRedo())
  const undoCount = useHistoryStore((state) => state.getUndoStackSize())

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useHistoryStore.getState().undo()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        useHistoryStore.getState().redo()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => useHistoryStore.getState().undo()}
        disabled={!canUndo}
        title="撤销 (Cmd+Z)"
      >
        <Undo className="h-4 w-4" />
        <span className="sr-only">撤销</span>
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={() => useHistoryStore.getState().redo()}
        disabled={!canRedo}
        title="重做 (Cmd+Shift+Z)"
      >
        <Redo className="h-4 w-4" />
        <span className="sr-only">重做</span>
      </Button>

      {undoCount > 0 && <span className="text-muted-foreground text-sm">{undoCount}</span>}
    </div>
  )
}
