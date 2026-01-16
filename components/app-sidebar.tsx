'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  BarChart3,
  ChevronDown,
  MoreHorizontal,
  CircleDot,
  Palette,
  Copy,
  Pencil,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { StatusManagerDialog } from '@/components/StatusManagerDialog';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hasMenu?: boolean;
};

interface AppSidebarProps {
  onNavigate?: () => void;
}

const mainNav: NavItem[] = [
  { href: '/', label: 'Complaints', icon: FileText, hasMenu: true },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
];

function NavLink({ 
  item, 
  onClick,
  onOpenStatusManager,
}: { 
  item: NavItem; 
  onClick?: () => void;
  onOpenStatusManager?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
  const Icon = item.icon;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group relative flex items-center">
      <Link
        href={item.href}
        onClick={onClick}
        className={cn(
          'flex-1 flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors',
          'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          isActive && 'bg-accent text-accent-foreground'
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="truncate flex-1">{item.label}</span>
      </Link>
      
      {/* 3-dot menu for items with hasMenu */}
      {item.hasMenu && (
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'absolute right-1 p-1 rounded hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-all cursor-pointer',
                menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="start" side="right">
            <div className="space-y-0.5">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenStatusManager?.();
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer"
              >
                <CircleDot className="h-4 w-4 text-muted-foreground" />
                <span>Task statuses</span>
              </button>
              <button
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer text-muted-foreground"
                disabled
              >
                <Pencil className="h-4 w-4" />
                <span>Rename</span>
              </button>
              <button
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer text-muted-foreground"
                disabled
              >
                <Copy className="h-4 w-4" />
                <span>Copy link</span>
              </button>
              <button
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer text-muted-foreground"
                disabled
              >
                <Palette className="h-4 w-4" />
                <span>Color & Icon</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const [statusManagerOpen, setStatusManagerOpen] = useState(false);

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Header */}
      <div className="p-3">
        <button className="flex w-full items-center gap-2 rounded-lg bg-sidebar-accent px-3 py-2 text-left transition-colors hover:bg-sidebar-accent/80 cursor-pointer">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-violet-500 to-purple-600">
            <span className="text-xs font-bold text-white">E</span>
          </div>
          <span className="flex-1 truncate text-sm font-medium text-sidebar-foreground">
            Enmore NDC
          </span>
          <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
        </button>
      </div>

      <ScrollArea className="flex-1 px-2">
        {/* Main nav */}
        <nav className="space-y-0.5 pb-4">
          {mainNav.map((item) => (
            <NavLink 
              key={item.label} 
              item={item} 
              onClick={onNavigate}
              onOpenStatusManager={() => setStatusManagerOpen(true)}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Status Manager Dialog */}
      <StatusManagerDialog 
        open={statusManagerOpen} 
        onOpenChange={setStatusManagerOpen} 
      />
    </div>
  );
}
