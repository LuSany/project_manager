'use client'

import * as React from 'react'
import { Command } from 'cmdk'
import { cn } from '@/lib/utils'
import { useCommandPalette } from '@/hooks/useCommandPalette'
import type { CommandItem } from '@/types/command'
import { Search, ArrowRight, FileText, Settings, Plus, Star, Clock, Sparkles } from 'lucide-react'

// 分组图标映射
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  navigation: ArrowRight,
  create: Plus,
  settings: Settings,
  favorite: Star,
  recent: Clock,
  action: Plus,
  ai: Sparkles,
  default: FileText,
}

// 分组显示顺序
const GROUP_ORDER = ['收藏项目', '最近访问', '快捷操作', 'AI 助手', '导航', '创建', '设置', '其他']

function CommandItemRow({ item, onSelect }: { item: CommandItem; onSelect: () => void }) {
  const Icon = item.icon || iconMap[item.type || item.group?.toLowerCase() || 'default'] || FileText

  return (
    <Command.Item
      value={`${item.title} ${item.description || ''}`}
      onSelect={() => {
        item.action()
        onSelect()
      }}
      className="aria-selected:bg-accent aria-selected:text-accent-foreground flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5"
    >
      <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-md">
        <Icon className="text-muted-foreground h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium">{item.title}</div>
        {item.description && (
          <div className="text-muted-foreground truncate text-xs">{item.description}</div>
        )}
      </div>
      {item.shortcut && (
        <kbd className="bg-muted text-muted-foreground hidden h-5 items-center gap-1 rounded border px-1.5 text-[10px] sm:inline-flex">
          {item.shortcut}
        </kbd>
      )}
    </Command.Item>
  )
}

export function CommandPalette() {
  const { open, close, commands } = useCommandPalette()

  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    commands.forEach((cmd) => {
      const group = cmd.group || '其他'
      if (!groups[group]) groups[group] = []
      groups[group].push(cmd)
    })
    // 按 GROUP_ORDER 排序
    return Object.fromEntries(
      GROUP_ORDER
        .filter((g) => groups[g])
        .map((g) => [g, groups[g]])
    )
  }, [commands])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />

      <div className="fixed top-[20%] left-1/2 z-50 w-full max-w-lg -translate-x-1/2">
        <Command className="bg-popover overflow-hidden rounded-xl border shadow-2xl" loop>
          <div className="flex items-center border-b px-3">
            <Search className="text-muted-foreground mr-2 h-4 w-4" />
            <Command.Input
              placeholder="搜索命令或页面..."
              className="placeholder:text-muted-foreground h-12 flex-1 bg-transparent text-sm outline-none"
              autoFocus
            />
            <kbd className="bg-muted text-muted-foreground pointer-events-none hidden h-5 items-center gap-1 rounded border px-1.5 text-[10px] sm:inline-flex">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="text-muted-foreground py-6 text-center text-sm">
              未找到相关命令
            </Command.Empty>

            {Object.entries(groupedCommands).map(([group, items]) => (
              <Command.Group
                key={group}
                heading={group}
                className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium"
              >
                <div className="space-y-1">
                  {items.map((item) => (
                    <CommandItemRow key={item.id} item={item} onSelect={close} />
                  ))}
                </div>
              </Command.Group>
            ))}
          </Command.List>

          <div className="text-muted-foreground flex items-center justify-between border-t px-3 py-2 text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="bg-muted rounded border px-1">↑</kbd>
                <kbd className="bg-muted rounded border px-1">↓</kbd>
                选择
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-muted rounded border px-1">↵</kbd>
                确认
              </span>
            </div>
            <span>⌘K 打开/关闭</span>
          </div>
        </Command>
      </div>
    </div>
  )
}