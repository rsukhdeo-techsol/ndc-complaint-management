'use client';

import { useState } from 'react';
import { format, addDays, addWeeks, nextSaturday, setHours, setMinutes } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerPopoverProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  align?: 'start' | 'center' | 'end';
  showClearButton?: boolean;
  className?: string;
}

interface QuickOption {
  label: string;
  sublabel: string;
  getDate: () => Date;
}

export function DatePickerPopover({
  value,
  onChange,
  placeholder = '—',
  disabled = false,
  align = 'start',
  showClearButton = true,
  className,
}: DatePickerPopoverProps) {
  const [open, setOpen] = useState(false);

  const today = new Date();
  
  const quickOptions: QuickOption[] = [
    {
      label: 'Today',
      sublabel: format(today, 'EEE'),
      getDate: () => today,
    },
    {
      label: 'Later',
      sublabel: format(setHours(setMinutes(today, 0), 18), 'h:mm a'),
      getDate: () => setHours(setMinutes(today, 0), 18),
    },
    {
      label: 'Tomorrow',
      sublabel: format(addDays(today, 1), 'EEE'),
      getDate: () => addDays(today, 1),
    },
    {
      label: 'Next week',
      sublabel: format(addWeeks(today, 1), 'EEE'),
      getDate: () => addWeeks(today, 1),
    },
    {
      label: 'Next weekend',
      sublabel: format(nextSaturday(today), 'EEE'),
      getDate: () => nextSaturday(today),
    },
    {
      label: '2 weeks',
      sublabel: format(addWeeks(today, 2), 'd MMM'),
      getDate: () => addWeeks(today, 2),
    },
    {
      label: '4 weeks',
      sublabel: format(addWeeks(today, 4), 'd MMM'),
      getDate: () => addWeeks(today, 4),
    },
    {
      label: '8 weeks',
      sublabel: format(addWeeks(today, 8), 'd MMM'),
      getDate: () => addWeeks(today, 8),
    },
  ];

  const handleQuickSelect = (option: QuickOption) => {
    onChange(option.getDate());
    setOpen(false);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    onChange(date);
    if (date) setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="h-7 flex-1 justify-start px-2 text-xs font-normal hover:bg-muted"
            disabled={disabled}
          >
            {value ? (
              <span className="text-foreground">{format(value, 'd/M/yy')}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align} sideOffset={4}>
          {/* Selected date header */}
          {value && (
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{format(value, 'd/M/yy')}</span>
                <button
                  onClick={() => onChange(undefined)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            </div>
          )}
          
          <div className="flex">
            {/* Quick options */}
            <div className="border-r py-2 w-[140px]">
              {quickOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleQuickSelect(option)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                >
                  <span>{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.sublabel}</span>
                </button>
              ))}
            </div>
            
            {/* Calendar */}
            <div className="p-2">
              <Calendar
                mode="single"
                selected={value}
                onSelect={handleCalendarSelect}
                initialFocus
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Clear button outside popover */}
      {showClearButton && value && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={handleClear}
          disabled={disabled}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
