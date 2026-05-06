'use client'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, UserPlus, Upload, Users } from 'lucide-react'

interface UserPageHeaderProps {
  onBack: () => void
  onImportClick: () => void
  onAddClick: () => void
}

export function UserPageHeader({ onBack, onImportClick, onAddClick }: UserPageHeaderProps) {
  return (
    <>
      <Button variant="ghost" onClick={onBack} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                用户管理
              </CardTitle>
              <CardDescription>
                管理系统用户，包括查看、新增、编辑和删除用户
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onImportClick}>
                <Upload className="mr-2 h-4 w-4" />
                导入用户
              </Button>
              <Button onClick={onAddClick}>
                <UserPlus className="mr-2 h-4 w-4" />
                新增用户
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    </>
  )
}