'use client';

import { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface EditableTextareaProps {
  value: string | undefined;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  /** Display when empty and not editing */
  emptyDisplay?: React.ReactNode;
  className?: string;
  minRows?: number;
}

export function EditableTextarea({
  value,
  onSave,
  placeholder = 'Enter description...',
  emptyDisplay = <span className="text-muted-foreground italic">No description provided.</span>,
  className,
  minRows = 3,
}: EditableTextareaProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditing]);

  // Update local value when prop changes
  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }
    
    setIsLoading(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
      setEditValue(value || '');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save on Ctrl/Cmd + Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn('space-y-2', className)}>
        <Textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[80px] text-sm resize-none"
          rows={minRows}
          disabled={isLoading}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Save
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
          <span className="text-xs text-muted-foreground ml-auto">Ctrl+Enter to save</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('group relative', className)}>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {value || emptyDisplay}
      </p>
      <button
        onClick={() => setIsEditing(true)}
        className="absolute top-0 right-0 p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
        title="Edit description"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
