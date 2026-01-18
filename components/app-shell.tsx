'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface AppShellProps {
  children: ReactNode;
  onNavigate?: () => void;
}

export function AppShell({ children, onNavigate }: AppShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-background text-foreground">
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <AppSidebar onNavigate={onNavigate} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <AppHeader onOpenSidebar={() => setOpen(true)} />
            <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
              <AppSidebar onNavigate={() => { setOpen(false); onNavigate?.(); }} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden md:flex flex-none">
          <AppHeader />
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="h-full min-h-0 overflow-y-auto p-4 md:p-6 custom-scrollbar">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
