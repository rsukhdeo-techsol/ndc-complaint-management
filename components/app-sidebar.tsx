'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Inbox,
  FileText,
  Settings,
  Users,
  Calendar,
  BarChart3,
  FolderKanban,
  ChevronDown,
  Plus,
  Search,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

const mainNav: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/inbox', label: 'Inbox', icon: Inbox, badge: 3 },
];

const favoritesNav: NavItem[] = [
  { href: '/', label: 'All Complaints', icon: FileText },
];

const spacesNav: NavItem[] = [
  { href: '/', label: 'Complaints', icon: FolderKanban },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/team', label: 'Team', icon: Users },
];

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors',
        'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        isActive && 'bg-accent text-accent-foreground'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="truncate flex-1">{item.label}</span>
      {item.badge && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function AppSidebar() {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Header */}
      <div className="p-3">
        <button className="flex w-full items-center gap-2 rounded-lg bg-sidebar-accent px-3 py-2 text-left transition-colors hover:bg-sidebar-accent/80">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-violet-500 to-purple-600">
            <span className="text-xs font-bold text-white">N</span>
          </div>
          <span className="flex-1 truncate text-sm font-medium text-sidebar-foreground">
            NDC Guyana
          </span>
          <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 text-muted-foreground"
          size="sm"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        {/* Main nav */}
        <nav className="space-y-0.5 pb-4">
          {mainNav.map((item) => (
            <NavLink key={item.label} item={item} />
          ))}
        </nav>

        {/* Favorites */}
        <div className="pb-4">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Favorites
            </span>
            <button className="rounded p-0.5 text-muted-foreground/60 hover:bg-accent hover:text-accent-foreground">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <nav className="space-y-0.5">
            {favoritesNav.map((item) => (
              <NavLink key={item.label} item={item} />
            ))}
          </nav>
        </div>

        {/* Spaces */}
        <div className="pb-4">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Spaces
            </span>
            <button className="rounded p-0.5 text-muted-foreground/60 hover:bg-accent hover:text-accent-foreground">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <nav className="space-y-0.5">
            {spacesNav.map((item) => (
              <NavLink key={item.label} item={item} />
            ))}
          </nav>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground"
          size="sm"
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Button>
      </div>
    </div>
  );
}
