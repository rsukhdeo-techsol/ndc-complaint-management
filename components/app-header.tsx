'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PanelLeft, Bell, HelpCircle } from 'lucide-react';

import { getUnreadNotificationCount } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function AppHeader({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadUnreadCount() {
      try {
        const count = await getUnreadNotificationCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    }

    loadUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b bg-background px-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden h-8 w-8"
        onClick={onOpenSidebar}
        aria-label="Open sidebar"
      >
        <PanelLeft className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Complaints</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm text-muted-foreground">All Complaints</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <HelpCircle className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative" asChild>
          <Link href="/inbox">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </Button>
        <ThemeToggle />
        <Avatar className="h-7 w-7 ml-1">
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-xs text-white">
            AD
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
