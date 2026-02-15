'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface NotificationIconProps {
  unreadCount?: number;
  onClick?: () => void;
}

export function NotificationIcon({ unreadCount = 0, onClick }: NotificationIconProps) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="relative">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M15 17h5l-1.293-1.293A2 2 0 012.858 0 2 2 2.858 0 6a2 2 0 012.858-2 2A2 2 0 014.142 0zm0 0V4a2 2 0 012-2 2-2-2-2.858 0-6 2-2 2zm0 0a2 2 0 012.858 2 2 2.858 0 6a2 2 0 012.858-2 2A2 2 0 014.142 0zm0 0a2 2 0 012.858 2 2 2.858 0 6a2 2 0 012.858-2 2A2 2 0 014.142 0z" />
      </svg>
      {unreadCount > 0 && (
        <Badge className="absolute -top-1 -right-1" variant="destructive">
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}
