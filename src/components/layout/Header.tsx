"use client";

import { Bell, Search, User, LogOut, Settings, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "ADMIN": return "系统管理员";
      case "PROJECT_ADMIN": return "项目管理员";
      case "PROJECT_OWNER": return "项目所有者";
      case "PROJECT_MEMBER": return "项目成员";
      default: return "普通员工";
    }
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-blur] sticky top-0 z-50">
      <div className="flex h-14 items-center justify-between px-6">
        {/* 搜索框 */}
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索项目、任务、需求..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </form>
        </div>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-3">
          {/* 通知图标 */}
          <Link
            href="/notifications"
            className="relative rounded-md p-2 hover:bg-accent transition-colors"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive"></span>
          </Link>

          {/* 用户菜单 */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-md p-1.5 hover:bg-accent transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium leading-tight">{user?.name || "用户"}</p>
                <p className="text-xs text-muted-foreground">{getRoleLabel(user?.role)}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
            </button>

            {/* 下拉菜单 */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-popover p-1 shadow-lg">
                <div className="px-2 py-1.5 text-sm font-medium border-b mb-1">
                  {user?.email}
                </div>
                <Link
                  href="/settings/profile"
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="h-4 w-4" />
                  个人设置
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
