'use client';

import { Settings } from 'lucide-react';
import { useStatusConfig } from '@/lib/contexts/StatusContext';
import { STATUS_CATEGORY_ORDER, STATUS_CATEGORY_LABELS } from '@/types/status';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from '@/components/ui/select';

interface StatusSelectProps {
  value: string;
  onChange: (statusId: string) => void;
  disabled?: boolean;
  /** Display variant: 'compact' for tables, 'default' for detail views */
  variant?: 'default' | 'compact';
  /** Show settings button to open status manager */
  onOpenSettings?: () => void;
}

export function StatusSelect({ 
  value, 
  onChange,
  disabled = false,
  variant = 'default',
  onOpenSettings,
}: StatusSelectProps) {
  const { getAllStatuses, getStatusById, getStatusesByCategory, isLoading } = useStatusConfig();
  const isCompact = variant === 'compact';
  
  const currentStatus = getStatusById(value);
  const allStatuses = getAllStatuses();

  // Fallback for legacy status values - find by name
  const displayStatus = currentStatus || allStatuses.find(s => 
    s.name.toLowerCase().replace(/\s+/g, '_') === value || 
    s.name.toLowerCase() === value.replace(/_/g, ' ')
  );

  if (isLoading) {
    return (
      <div className="h-7 w-24 bg-muted/50 animate-pulse rounded" />
    );
  }
  
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger 
        className={`
          border-0 bg-transparent p-0 focus:ring-0 cursor-pointer
          ${isCompact ? 'h-7 w-full px-1' : 'w-auto h-7'}
        `}
      >
        <span 
          className={`
            inline-flex items-center gap-1.5 rounded font-medium text-white
            ${isCompact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs uppercase'}
          `}
          style={{ backgroundColor: displayStatus?.color || '#6b7280' }}
        >
          {displayStatus?.name || value}
        </span>
      </SelectTrigger>
      <SelectContent>
        {STATUS_CATEGORY_ORDER.map((category, idx) => {
          const categoryStatuses = getStatusesByCategory(category);
          if (categoryStatuses.length === 0) return null;
          
          return (
            <SelectGroup key={category}>
              {idx > 0 && <SelectSeparator />}
              <SelectLabel className="text-xs text-muted-foreground">
                {STATUS_CATEGORY_LABELS[category]}
              </SelectLabel>
              {categoryStatuses.map((status) => (
                <SelectItem key={status.id} value={status.id}>
                  <span className="inline-flex items-center gap-2">
                    <span 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: status.color }}
                    />
                    {status.name}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          );
        })}
        
        {onOpenSettings && (
          <>
            <SelectSeparator />
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenSettings();
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5" />
              Edit statuses...
            </button>
          </>
        )}
      </SelectContent>
    </Select>
  );
}
