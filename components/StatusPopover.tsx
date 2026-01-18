'use client';

import { useState } from 'react';
import { useStatusConfig } from '@/lib/contexts/StatusContext';
import { STATUS_CATEGORY_ORDER, STATUS_CATEGORY_LABELS } from '@/types/status';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Check, Search } from 'lucide-react';

interface StatusPopoverProps {
  value: string;
  onChange: (statusId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function StatusPopover({ value, onChange, disabled, className }: StatusPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { getAllStatuses, getStatusById, getStatusesByCategory, isLoading } = useStatusConfig();

  const allStatuses = getAllStatuses();
  const currentStatus = getStatusById(value);

  // Fallback for legacy status values
  const displayStatus = currentStatus || allStatuses.find(s => 
    s.name.toLowerCase().replace(/\s+/g, '_') === value || 
    s.name.toLowerCase() === value.replace(/_/g, ' ')
  );

  const handleSelect = (statusId: string) => {
    onChange(statusId);
    setOpen(false);
    setSearch('');
  };

  if (isLoading) {
    return <div className="h-7 w-24 bg-muted/50 animate-pulse rounded" />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'flex items-center justify-start w-full h-full min-h-[32px] px-2 cursor-pointer transition-opacity',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <span
            className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: displayStatus?.color || '#6b7280' }}
          >
            {displayStatus?.name || value}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-56 p-0" 
        align="start" 
        sideOffset={4}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b px-3 py-2">
          <span className="text-sm font-medium">Status</span>
        </div>

        {/* Search */}
        <div className="border-b p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        {/* Status list */}
        <div className="max-h-64 overflow-y-auto p-1">
          {STATUS_CATEGORY_ORDER.map((category) => {
            const categoryStatuses = getStatusesByCategory(category).filter(
              (status) =>
                !search || status.name.toLowerCase().includes(search.toLowerCase())
            );
            
            if (categoryStatuses.length === 0) return null;

            return (
              <div key={category} className="mb-1">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {STATUS_CATEGORY_LABELS[category]}
                </div>
                {categoryStatuses.map((status) => {
                  const isSelected = status.id === value;
                  
                  return (
                    <button
                      key={status.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(status.id);
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                        'hover:bg-accent',
                        isSelected && 'bg-accent'
                      )}
                    >
                      <span
                        className="h-3 w-3 rounded-full border-2"
                        style={{ 
                          backgroundColor: isSelected ? status.color : 'transparent',
                          borderColor: status.color 
                        }}
                      />
                      <span className="flex-1 text-left">{status.name}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
