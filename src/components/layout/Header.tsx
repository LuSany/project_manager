import { Bell, Menu, Search, User } from "lucide-react";

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-blur] sticky top-0 z-50">
      {/* 顶部工具栏 */}
      <div className="flex h-16 items-center gap-4 border-b px-6">
        {/* 搜索框 */}
        <div className="relative flex-1">
          <Search className="h-10 w-10" />
          <kbd className="pointer-events-none absolute right-3 top-3 h-6 rounded bg-muted px-2 py-1 text-xs text-muted-foreground opacity-50">
            <span className="text-lg">⌘</span>K
          </kbd>
        </div>

        {/* 通知图标 */}
        <button className="relative rounded-full p-2 hover:bg-accent">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive text-xs text-white flex items-center justify-center">
            3
          </span>
        </button>

        {/* 用户信息 */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary-foreground">
            <User className="h-6 w-6" />
          </div>
          <div className="text-sm">
            <p className="font-medium">张三</p>
            <p className="text-muted-foreground text-xs">管理员</p>
          </div>
        </div>

        {/* 菜单按钮 */}
        <button className="rounded p-2 hover:bg-accent">
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
