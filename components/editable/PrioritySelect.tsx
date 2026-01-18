'use client';

import { Priority, PRIORITY_LABELS } from '@/types';
import { PRIORITY_COLORS, PRIORITY_TEXT_COLORS, PRIORITY_BADGE_COLORS } from '@/lib/constants';
import { Flag, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';

interface PrioritySelectProps {
  value: Priority | undefined;
  onChange: (priority: Priority) => void;
  disabled?: boolean;
  /** Display variant: 'compact' for tables (badge style), 'default' for detail views (icon style) */
  variant?: 'default' | 'compact';
  /** Placeholder text when no value is set */
  placeholder?: string;
  /** Show chevron indicator */
  showChevron?: boolean;
}

export function PrioritySelect({ 
  value, 
  onChange,
  disabled = false,
  variant = 'default',
  placeholder = 'Set priority',
  showChevron = true,
}: PrioritySelectProps) {
  const isCompact = variant === 'compact';
  
  return (
    <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger 
        className={`
          border-0 bg-transparent p-0 focus:ring-0 cursor-pointer
          ${isCompact ? 'h-7 w-full px-1' : 'w-auto h-auto'}
        `}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {isCompact ? (
          // Compact/badge style for tables
          value ? (
            <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE_COLORS[value]}`}>
              {PRIORITY_LABELS[value]}
              {showChevron && <ChevronDown className="h-3 w-3" />}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              Set...
              {showChevron && <ChevronDown className="h-3 w-3" />}
            </span>
          )
        ) : (
          // Default/icon style for detail views
          <span className={`inline-flex items-center gap-1.5 text-sm ${value ? PRIORITY_TEXT_COLORS[value] : 'text-muted-foreground'}`}>
            <Flag className="h-4 w-4" />
            {value ? PRIORITY_LABELS[value] : placeholder}
          </span>
        )}
      </SelectTrigger>
      <SelectContent>
        {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
          <SelectItem key={key} value={key}>
            <span className={`inline-flex items-center gap-2 ${PRIORITY_TEXT_COLORS[key as Priority]}`}>
              <Flag className="h-3 w-3" />
              {label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
