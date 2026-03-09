import { useState, useEffect } from "react";
import {
  Folder,
  Calendar,
  Settings,
  Users,
  FileText,
  CheckSquare,
  AlertCircle,
  Menu,
  Clock,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    title: "工作台",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    title: "我的任务",
    icon: CheckSquare,
    path: "/tasks",
    badge: 5,
  },
  {
    title: "项目",
    icon: Folder,
    path: "/projects",
  },
  {
    title: "里程碑",
    icon: Calendar,
    path: "/milestones",
  },
  {
    title: "需求",
    icon: FileText,
    path: "/requirements",
  },
  {
    title: "问题",
    icon: AlertCircle,
    path: "/issues",
  },
  {
    title: "机时管理",
    icon: Clock,
    path: "/timesheet",
  },
  {
    title: "用户管理",
    icon: Users,
    path: "/admin/users",
    adminOnly: true,
  },
];

export interface SidebarProps {
  className?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ className, collapsed: controlledCollapsed, onCollapsedChange }: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const pathname = usePathname();

  // 获取当前用户角色
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/v1/users/me');
        const data = await response.json();
        if (data.success) {
          setUserRole(data.data.role);
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
    };
    fetchUserRole();
  }, []);

  const isAdmin = userRole === 'ADMIN';

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        "bg-card border-r border-border transition-all duration-300 flex flex-col h-screen",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* 侧边栏头部 */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-xl font-bold">PM</span>
          </div>
          {!collapsed && <span className="font-semibold text-foreground">项目管理</span>}
        </Link>
        <button
          onClick={() => {
            const newCollapsed = !collapsed;
            setInternalCollapsed(newCollapsed);
            onCollapsedChange?.(newCollapsed);
          }}
          className="p-2 rounded-md hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive(item.path)
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-accent"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className={collapsed ? "hidden" : "block"}>
                {item.title}
              </span>
              {item.badge && !collapsed && (
                <span className="ml-auto bg-destructive text-white text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
      </nav>

      {/* 侧边栏底部 */}
      <div className="mt-auto border-t p-4">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
            pathname.startsWith('/settings')
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-accent"
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          <span className={collapsed ? "hidden" : "block"}>设置</span>
        </Link>
      </div>
    </aside>
  );
}
