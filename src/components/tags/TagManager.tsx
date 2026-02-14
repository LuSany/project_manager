"use client"

import { useState } from "react"
import { Plus, Trash2, Tag as TagIcon, X } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useTags, useCreateTag, useDeleteTag } from "@/hooks/useTags"
import type { Tag } from "@/types/tag"

export interface TagManagerProps {
  /**
   * 任务ID，用于显示任务标签管理
   */
  taskId?: string
  /**
   * 当前任务的标签ID列表
   */
  taskTagIds?: string[]
  /**
   * 当为任务添加标签时触发
   */
  onAddTag?: (tagId: string) => void
  /**
   * 当从任务移除标签时触发
   */
  onRemoveTag?: (tagId: string) => void
  /**
   * 是否只读模式（仅显示标签）
   */
  readOnly?: boolean
}

export function TagManager({
  taskId,
  taskTagIds = [],
  onAddTag,
  onRemoveTag,
  readOnly = false,
}: TagManagerProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState("#3B82F6")

  const { data: tags = [], isLoading } = useTags()
  const createTagMutation = useCreateTag()
  const deleteTagMutation = useDeleteTag()

  // 过滤出当前任务的标签
  const taskTags = tags.filter((tag) => taskTagIds.includes(tag.id))
  // 过滤出未添加到任务的标签
  const availableTags = tags.filter((tag) => !taskTagIds.includes(tag.id))

  // 创建标签
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    try {
      await createTagMutation.mutateAsync({
        name: newTagName.trim(),
        color: newTagColor,
      })

      setCreateDialogOpen(false)
      setNewTagName("")
      setNewTagColor("#3B82F6")
    } catch (error) {
      console.error("创建标签失败:", error)
    }
  }

  // 删除标签
  const handleDeleteTag = async (tagId: string) => {
    if (!confirm("确定要删除此标签吗？")) return

    try {
      await deleteTagMutation.mutateAsync(tagId)
    } catch (error) {
      console.error("删除标签失败:", error)
    }
  }

  // 为任务添加标签
  const handleAddTagToTask = (tagId: string) => {
    if (onAddTag) {
      onAddTag(tagId)
    }
  }

  // 从任务移除标签
  const handleRemoveTagFromTask = (tagId: string) => {
    if (onRemoveTag) {
      onRemoveTag(tagId)
    }
  }

  return (
    <div className="space-y-4">
      {/* 任务标签显示 */}
      {taskId && (
        <div className="space-y-2">
          <Label>任务标签</Label>
          <div className="flex flex-wrap gap-2">
            {taskTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无标签</p>
            ) : (
              taskTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                  style={{
                    backgroundColor: tag.color + "20",
                    borderColor: tag.color,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                  {!readOnly && (
                    <button
                      onClick={() => handleRemoveTagFromTask(tag.id)}
                      className="ml-1 hover:opacity-70"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))
            )}
          </div>
        </div>
      )}

      {/* 标签管理 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <TagIcon className="h-4 w-4" />
            标签管理
          </Label>
          {!readOnly && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  新建标签
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>创建新标签</DialogTitle>
                  <DialogDescription>
                    为项目创建新的标签，用于分类和标记任务
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="tag-name">标签名称</Label>
                    <Input
                      id="tag-name"
                      placeholder="输入标签名称"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tag-color">标签颜色</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="tag-color"
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="h-10 w-20 cursor-pointer"
                      />
                      <div
                        className="flex-1 h-10 rounded-md border"
                        style={{ backgroundColor: newTagColor }}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim() || createTagMutation.isPending}
                  >
                    {createTagMutation.isPending ? "创建中..." : "创建"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* 标签列表 */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">加载中...</p>
        ) : tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无标签</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div key={tag.id} className="group relative">
                <Badge
                  variant="outline"
                  className="flex items-center gap-2"
                  style={{
                    borderColor: tag.color,
                    color: tag.color,
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}

                  {/* 任务标签管理按钮 */}
                  {taskId && !readOnly && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                      onClick={() => handleAddTagToTask(tag.id)}
                      disabled={taskTagIds.includes(tag.id)}
                      type="button"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}

                  {/* 删除按钮 */}
                  {!readOnly && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => handleDeleteTag(tag.id)}
                      disabled={deleteTagMutation.isPending}
                      type="button"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
