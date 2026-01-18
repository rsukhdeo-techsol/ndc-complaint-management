'use client';

import { useState } from 'react';
import { Priority, PRIORITY_LABELS } from '@/types';
import { PRIORITY_BADGE_COLORS, PRIORITY_TEXT_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronDown, Flag } from 'lucide-react';

interface PriorityPopoverProps {
  value: Priority | undefined;
  onChange: (priority: Priority) => void;
  disabled?: boolean;
  className?: string;
}

const PRIORITY_ORDER: Priority[] = ['urgent', 'high', 'medium', 'low'];

export function PriorityPopover({ value, onChange, disabled, className }: PriorityPopoverProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (priority: Priority) => {
    onChange(priority);
    setOpen(false);
  };

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
            className={cn(
              'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap',
              value ? PRIORITY_BADGE_COLORS[value] : 'text-muted-foreground bg-muted'
            )}
          >
            {value ? PRIORITY_LABELS[value] : 'Set priority'}
            <ChevronDown className="h-3 w-3" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-40 p-1" 
        align="start" 
        sideOffset={4}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">
          Priority
        </div>
        {PRIORITY_ORDER.map((priority) => {
          const isSelected = priority === value;
          
          return (
            <button
              key={priority}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(priority);
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                'hover:bg-accent',
                isSelected && 'bg-accent'
              )}
            >
              <Flag className={cn('h-3.5 w-3.5', PRIORITY_TEXT_COLORS[priority])} />
              <span className="flex-1 text-left">{PRIORITY_LABELS[priority]}</span>
              {isSelected && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
