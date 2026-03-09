"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft, Plus, Trash2, Loader2, Search, User, Users } from "lucide-react";

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

interface SystemUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  department?: string;
  position?: string;
}

export default function ProjectMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  // 用户选择相关状态
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
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

  const fetchSystemUsers = async (search: string = "") => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      params.append("excludeProjectId", projectId);
      params.append("pageSize", "50");

      const response = await fetch(`/api/v1/users?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setSystemUsers(data.data?.data || data.data || []);
      } else {
        setSystemUsers([]);
      }
    } catch (err) {
      console.error("获取用户列表失败:", err);
      setSystemUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  // 当对话框打开时加载用户列表
  useEffect(() => {
    if (addDialogOpen) {
      setSelectedUserId("");
      setUserSearch("");
      setNewMemberRole("PROJECT_MEMBER");
      fetchSystemUsers("");
    }
  }, [addDialogOpen]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      if (addDialogOpen) {
        fetchSystemUsers(userSearch);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearch]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      alert("请选择要添加的用户");
      return;
    }

    setAddingMember(true);

    try {
      const selectedUser = systemUsers.find(u => u.id === selectedUserId);

      const response = await fetch(`/api/v1/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedUser?.email,
          role: newMemberRole,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchMembers();
        setAddDialogOpen(false);
        setSelectedUserId("");
        setUserSearch("");
        setNewMemberRole("PROJECT_MEMBER");
      } else {
        alert(data.error?.message || data.error || "添加成员失败");
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
        alert(data.error?.message || data.error || "移除成员失败");
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
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>添加项目成员</DialogTitle>
              <DialogDescription>
                从系统已注册用户中选择成员并分配角色
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddMember} className="space-y-4">
              {/* 用户搜索 */}
              <div className="space-y-2">
                <Label htmlFor="user-search">搜索用户</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="user-search"
                    placeholder="输入姓名或邮箱搜索..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* 用户选择列表 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>选择用户 *</Label>
                  {!loadingUsers && systemUsers.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      共 {systemUsers.length} 个可选用户
                    </span>
                  )}
                </div>

                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8 border rounded-md bg-muted/30">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">加载用户列表...</span>
                  </div>
                ) : systemUsers.length === 0 ? (
                  <div className="text-center py-8 border rounded-md bg-muted/30">
                    <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">
                      {userSearch ? "未找到匹配的用户" : "暂无可添加的用户"}
                    </p>
                    {!userSearch && (
                      <p className="text-xs text-muted-foreground mt-1">
                        所有用户可能已在此项目中
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      {systemUsers.map((user) => (
                        <div
                          key={user.id}
                          className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b last:border-b-0 ${
                            selectedUserId === user.id
                              ? "bg-primary/10 border-l-2 border-l-primary"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => setSelectedUserId(user.id)}
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <User className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{user.name || "未设置姓名"}</div>
                            <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                            {(user.department || user.position) && (
                              <div className="text-xs text-muted-foreground truncate mt-0.5">
                                {[user.department, user.position].filter(Boolean).join(" · ")}
                              </div>
                            )}
                          </div>
                          {selectedUserId === user.id && (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 已选择的用户显示 */}
              {selectedUserId && (
                <div className="p-3 bg-muted/50 rounded-md">
                  <div className="text-xs text-muted-foreground mb-1">已选择：</div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">
                      {systemUsers.find(u => u.id === selectedUserId)?.name}
                    </span>
                    <span className="text-muted-foreground">
                      ({systemUsers.find(u => u.id === selectedUserId)?.email})
                    </span>
                  </div>
                </div>
              )}

              {/* 角色选择 */}
              <div className="space-y-2">
                <Label>角色</Label>
                <RoleSelect
                  value={newMemberRole}
                  onValueChange={(value) => setNewMemberRole(value)}
                  excludeRoles={["ADMIN"]}
                  showDescription={false}
                />
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
                <Button type="submit" disabled={addingMember || !selectedUserId}>
                  {addingMember && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {addingMember ? "添加中..." : "添加成员"}
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
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            成员列表
            {members.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {members.length} 人
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p>暂无成员</p>
              <p className="text-sm mt-1">点击"添加成员"按钮添加项目成员</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
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