import { useState } from "react";
import {
  LayoutDashboard,
  LayoutList,
  Folder,
  Calendar,
  Settings,
  Users,
  FileText,
  CheckSquare,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
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
];

export interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* 侧边栏头部 */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-xl font-bold">PM</span>
          </div>
          <span className="font-semibold text-foreground">项目管理</span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-md hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 flex-col gap-1 p-4 overflow-y-auto">
        {navItems.map((item) => (
          <a
            key={item.path}
            href={item.path}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-sm transition-colors"
          >
            <item.icon className="h-5 w-5" />
            <span className={collapsed ? "hidden" : "block"}>
              {item.title}
            </span>
            {item.badge && (
              <span className="ml-auto bg-destructive text-white text-xs px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </a>
        ))}
      </nav>

      {/* 侧边栏底部 */}
      <div className="mt-auto border-t p-4">
        <a
          href="/settings"
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-sm transition-colors"
        >
          <Settings className="h-5 w-5" />
          <span className={collapsed ? "hidden" : "block"}>设置</span>
        </a>
      </div>
    </aside>
  );
}
