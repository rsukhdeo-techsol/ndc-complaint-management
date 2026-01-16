'use client';

import { useState } from 'react';
import { ComplaintCategory, CATEGORY_LABELS, COMPLAINT_CATEGORIES } from '@/types';
import { Pencil, Check, X, Loader2, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface CategorySelectProps {
  value: ComplaintCategory | undefined;
  onSave: (category: ComplaintCategory) => Promise<void>;
  className?: string;
}

export function CategorySelect({ 
  value, 
  onSave,
  className,
}: CategorySelectProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<ComplaintCategory | undefined>(value);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!editValue || editValue === value) {
      setIsEditing(false);
      return;
    }
    
    setIsLoading(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
      setEditValue(value);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Select 
          value={editValue} 
          onValueChange={(val) => setEditValue(val as ComplaintCategory)}
          disabled={isLoading}
        >
          <SelectTrigger className="h-7 w-[200px] text-sm">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {COMPLAINT_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn('group flex items-center gap-2', className)}>
      <span className="flex-1">
        {value ? CATEGORY_LABELS[value] : <span className="text-muted-foreground">—</span>}
      </span>
      <button
        onClick={() => setIsEditing(true)}
        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
