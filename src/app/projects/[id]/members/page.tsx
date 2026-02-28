"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoleSelect } from "@/components/users/role-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";

interface Member {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  joinedAt: string;
}

interface Project {
  id: string;
  name: string;
  ownerId: string;
}

export default function ProjectMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("PROJECT_MEMBER");

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const [projectRes, membersRes] = await Promise.all([
        fetch(`/api/v1/projects/${projectId}`),
        fetch(`/api/v1/projects/${projectId}/members`),
      ]);

      const projectData = await projectRes.json();
      const membersData = await membersRes.json();

      if (projectData.success) {
        setProject(projectData.data);
      }

      if (membersData.success) {
        setMembers(membersData.data || []);
      }
    } catch (err) {
      console.error("获取成员列表失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingMember(true);

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newMemberEmail,
          role: newMemberRole,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchMembers();
        setAddDialogOpen(false);
        setNewMemberEmail("");
        setNewMemberRole("PROJECT_MEMBER");
      } else {
        alert(data.error || "添加成员失败");
      }
    } catch (error) {
      console.error("添加成员失败:", error);
      alert("添加成员失败，请重试");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("确定要移除此成员吗？")) return;

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        fetchMembers();
      } else {
        alert(data.error || "移除成员失败");
      }
    } catch (error) {
      console.error("移除成员失败:", error);
      alert("移除成员失败，请重试");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "PROJECT_OWNER":
        return <Badge className="bg-purple-500">项目所有者</Badge>;
      case "PROJECT_ADMIN":
        return <Badge className="bg-blue-500">项目管理员</Badge>;
      case "PROJECT_MEMBER":
        return <Badge variant="outline">项目成员</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (loading) {
    return <div className="p-6 text-center">加载中...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      {/* 返回按钮 */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回
      </Button>

      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">项目成员管理</h1>
          <p className="text-muted-foreground">
            管理项目成员和权限
          </p>
        </div>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              添加成员
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加项目成员</DialogTitle>
              <DialogDescription>
                添加新成员到项目并分配角色
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <Label htmlFor="email">用户邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="请输入用户邮箱"
                  required
                />
              </div>
              <div>
                <Label>角色</Label>
                <RoleSelect
                  value={newMemberRole}
                  onValueChange={(value) => setNewMemberRole(value)}
                  showDescription={false}
                />
              </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                  disabled={addingMember}
                >
                  取消
                </Button>
                <Button type="submit" disabled={addingMember}>
                  {addingMember && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {addingMember ? "添加中..." : "添加"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 项目信息 */}
      {project && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{project.name}</CardTitle>
            <CardDescription>管理此项目的成员和权限</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* 成员列表 */}
      <Card>
        <CardHeader>
          <CardTitle>成员列表</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              暂无成员
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium">{member.userName || member.userEmail}</span>
                      {getRoleBadge(member.role)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {member.userEmail}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      加入时间：{new Date(member.joinedAt).toLocaleDateString("zh-CN")}
                    </div>
                  </div>
                  {member.role !== "PROJECT_OWNER" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.userId)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      移除
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
