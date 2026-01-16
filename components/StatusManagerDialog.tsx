'use client';

import { useState, useEffect } from 'react';
import type { CustomStatus, StatusCategory } from '@/types/status';
import { STATUS_CATEGORY_LABELS, STATUS_CATEGORY_ORDER, STATUS_PRESET_COLORS } from '@/types/status';
import { useStatusConfig } from '@/lib/contexts/StatusContext';
import { saveStatusConfig } from '@/lib/services/statusConfig';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  GripVertical, 
  MoreHorizontal, 
  Trash2, 
  Loader2,
  Check,
  Circle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Generate unique ID
function generateId(): string {
  return `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Category icon mapping
const CategoryIcon: Record<StatusCategory, React.ComponentType<{ className?: string }>> = {
  active: Circle,
  done: CheckCircle2,
  closed: XCircle,
};

// Status Item Component
function StatusItem({
  status,
  onUpdate,
  onDelete,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragOver,
}: {
  status: CustomStatus;
  onUpdate: (updates: Partial<CustomStatus>) => void;
  onDelete: () => void;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(status.name);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const handleSaveName = () => {
    if (editName.trim() && editName !== status.name) {
      onUpdate({ name: editName.trim() });
    }
    setIsEditing(false);
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      className={cn(
        'flex items-center gap-2 px-3 py-2 bg-background border rounded-md group transition-all',
        isDragging && 'opacity-50 border-dashed',
        'hover:border-primary/50'
      )}
    >
      {/* Drag Handle */}
      <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Color Picker */}
      <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
        <PopoverTrigger asChild>
          <button
            className="w-5 h-5 rounded-full border-2 border-background shadow-sm cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: status.color }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="grid grid-cols-5 gap-2">
            {STATUS_PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => {
                  onUpdate({ color });
                  setColorPickerOpen(false);
                }}
                className={cn(
                  'w-7 h-7 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform',
                  status.color === color ? 'border-primary' : 'border-transparent'
                )}
                style={{ backgroundColor: color }}
              >
                {status.color === color && (
                  <Check className="h-4 w-4 text-white mx-auto" />
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Status Name */}
      {isEditing ? (
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleSaveName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveName();
            if (e.key === 'Escape') {
              setEditName(status.name);
              setIsEditing(false);
            }
          }}
          className="h-7 flex-1 text-sm"
          autoFocus
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className="flex-1 text-sm font-medium cursor-text hover:bg-muted/50 px-2 py-1 rounded -mx-2"
        >
          {status.name}
        </span>
      )}

      {/* Actions Menu */}
      <AlertDialog>
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-1" align="end">
            <AlertDialogTrigger asChild>
              <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded cursor-pointer">
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </AlertDialogTrigger>
          </PopoverContent>
        </Popover>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{status.name}"? Complaints with this status will need to be updated manually.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Category Section Component
function CategorySection({
  category,
  statuses,
  onAddStatus,
  onUpdateStatus,
  onDeleteStatus,
  onReorder,
}: {
  category: StatusCategory;
  statuses: CustomStatus[];
  onAddStatus: (category: StatusCategory) => void;
  onUpdateStatus: (id: string, updates: Partial<CustomStatus>) => void;
  onDeleteStatus: (id: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const Icon = CategoryIcon[category];

  return (
    <div className="space-y-2">
      {/* Category Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className="h-4 w-4" />
          {STATUS_CATEGORY_LABELS[category]}
        </div>
        <button
          onClick={() => onAddStatus(category)}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Status List */}
      <div className="space-y-1.5 pl-1">
        {statuses.map((status) => (
          <StatusItem
            key={status.id}
            status={status}
            onUpdate={(updates) => onUpdateStatus(status.id, updates)}
            onDelete={() => onDeleteStatus(status.id)}
            isDragging={draggedId === status.id}
            onDragStart={() => setDraggedId(status.id)}
            onDragEnd={() => setDraggedId(null)}
            onDragOver={() => {
              if (draggedId && draggedId !== status.id) {
                onReorder(draggedId, status.id);
              }
            }}
          />
        ))}

        {/* Add Status Button */}
        <button
          onClick={() => onAddStatus(category)}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-dashed rounded-md transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add status
        </button>
      </div>
    </div>
  );
}

export function StatusManagerDialog({ open, onOpenChange }: StatusManagerDialogProps) {
  const { config, refresh } = useStatusConfig();
  const [localStatuses, setLocalStatuses] = useState<CustomStatus[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local state from config
  useEffect(() => {
    if (config) {
      setLocalStatuses([...config.statuses]);
      setHasChanges(false);
    }
  }, [config, open]);

  const getStatusesByCategory = (category: StatusCategory): CustomStatus[] => {
    return localStatuses
      .filter((s) => s.category === category)
      .sort((a, b) => a.order - b.order);
  };

  const handleAddStatus = (category: StatusCategory) => {
    const categoryStatuses = getStatusesByCategory(category);
    const newStatus: CustomStatus = {
      id: generateId(),
      name: 'New Status',
      color: STATUS_PRESET_COLORS[Math.floor(Math.random() * STATUS_PRESET_COLORS.length)],
      category,
      order: categoryStatuses.length,
    };
    setLocalStatuses([...localStatuses, newStatus]);
    setHasChanges(true);
  };

  const handleUpdateStatus = (id: string, updates: Partial<CustomStatus>) => {
    setLocalStatuses(localStatuses.map((s) => 
      s.id === id ? { ...s, ...updates } : s
    ));
    setHasChanges(true);
  };

  const handleDeleteStatus = (id: string) => {
    setLocalStatuses(localStatuses.filter((s) => s.id !== id));
    setHasChanges(true);
  };

  const handleReorder = (draggedId: string, targetId: string) => {
    const draggedStatus = localStatuses.find((s) => s.id === draggedId);
    const targetStatus = localStatuses.find((s) => s.id === targetId);
    
    if (!draggedStatus || !targetStatus || draggedStatus.category !== targetStatus.category) {
      return;
    }

    const categoryStatuses = getStatusesByCategory(draggedStatus.category);
    const draggedIndex = categoryStatuses.findIndex((s) => s.id === draggedId);
    const targetIndex = categoryStatuses.findIndex((s) => s.id === targetId);

    // Reorder within category
    const reordered = [...categoryStatuses];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Update order values
    const updatedStatuses = localStatuses.map((s) => {
      if (s.category === draggedStatus.category) {
        const newOrder = reordered.findIndex((r) => r.id === s.id);
        return { ...s, order: newOrder };
      }
      return s;
    });

    setLocalStatuses(updatedStatuses);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveStatusConfig(localStatuses);
      await refresh();
      setHasChanges(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save status config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Complaint Statuses</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {STATUS_CATEGORY_ORDER.map((category) => (
            <CategorySection
              key={category}
              category={category}
              statuses={getStatusesByCategory(category)}
              onAddStatus={handleAddStatus}
              onUpdateStatus={handleUpdateStatus}
              onDeleteStatus={handleDeleteStatus}
              onReorder={handleReorder}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Apply changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
