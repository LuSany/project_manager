"use client"

import { TagManager } from "@/components/tags/TagManager"

export default function TagsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">标签管理</h1>

      <div className="max-w-4xl">
        <TagManager />
      </div>
    </div>
  )
}
