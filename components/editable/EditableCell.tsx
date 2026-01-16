'use client';

import { useState, useCallback, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableCellProps<T> {
  /** The current value */
  value: T;
  /** Callback when value changes - should return a promise */
  onSave: (value: T) => Promise<void>;
  /** Render function for displaying the editable content */
  children: (props: {
    value: T;
    onChange: (newValue: T) => void;
    isLoading: boolean;
    disabled: boolean;
  }) => ReactNode;
  /** Additional class names */
  className?: string;
  /** Whether editing is disabled */
  disabled?: boolean;
}

/**
 * A wrapper component for editable table cells that handles loading states
 * and optimistic updates.
 */
export function EditableCell<T>({
  value,
  onSave,
  children,
  className,
  disabled = false,
}: EditableCellProps<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleChange = useCallback(async (newValue: T) => {
    if (disabled || isLoading) return;
    
    // Optimistic update
    setLocalValue(newValue);
    setIsLoading(true);
    
    try {
      await onSave(newValue);
    } catch (error) {
      // Revert on error
      setLocalValue(value);
      console.error('Failed to save:', error);
    } finally {
      setIsLoading(false);
    }
  }, [disabled, isLoading, onSave, value]);

  return (
    <div className={cn('relative', className)}>
      {children({
        value: localValue,
        onChange: handleChange,
        isLoading,
        disabled: disabled || isLoading,
      })}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
