'use client';

import { useStatusConfig } from '@/lib/contexts/StatusContext';
import { STATUS_CATEGORY_ORDER } from '@/types/status';
import { cn } from '@/lib/utils';

interface StatusTabsProps {
  value: string | null;
  onChange: (statusId: string | null) => void;
  counts?: Record<string, number>;
}

export function StatusTabs({ value, onChange, counts = {} }: StatusTabsProps) {
  const { getAllStatuses, getStatusesByCategory, isLoading } = useStatusConfig();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-8 w-20 animate-pulse rounded-md bg-muted"
          />
        ))}
      </div>
    );
  }

  const allStatuses = getAllStatuses();
  const totalCount = Object.values(counts).reduce((sum, c) => sum + c, 0);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {/* All tab */}
      <button
        onClick={() => onChange(null)}
        className={cn(
          'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          value === null
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        All
        <span
          className={cn(
            'inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-xs',
            value === null
              ? 'bg-primary-foreground/20 text-primary-foreground'
              : 'bg-muted-foreground/20'
          )}
        >
          {totalCount}
        </span>
      </button>

      {/* Separator */}
      <div className="mx-1 h-5 w-px bg-border" />

      {/* Status tabs grouped by category */}
      {STATUS_CATEGORY_ORDER.map((category) => {
        const categoryStatuses = getStatusesByCategory(category);
        if (categoryStatuses.length === 0) return null;

        return categoryStatuses.map((status) => {
          const count = counts[status.id] || 0;
          const isActive = value === status.id;

          return (
            <button
              key={status.id}
              onClick={() => onChange(status.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
                isActive
                  ? 'text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              style={{
                backgroundColor: isActive ? status.color : undefined,
              }}
            >
              {!isActive && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
              )}
              {status.name}
              <span
                className={cn(
                  'inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-xs',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-muted-foreground/20'
                )}
              >
                {count}
              </span>
            </button>
          );
        });
      })}
    </div>
  );
}
