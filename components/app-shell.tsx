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
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground md:flex">
        <AppSidebar onNavigate={onNavigate} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <AppHeader onOpenSidebar={() => setOpen(true)} />
            <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
              <AppSidebar onNavigate={() => { setOpen(false); onNavigate?.(); }} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden md:block">
          <AppHeader />
        </div>

        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
