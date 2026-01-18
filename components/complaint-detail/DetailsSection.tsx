'use client';

import { useState } from 'react';
import type { DetailsSectionProps } from './types';
import { SOURCE_LABELS } from '@/types';
import { formatDate } from '@/lib/utils';
import { DatePickerPopover } from '@/components/DatePickerPopover';
import { PrioritySelect, EditableText, EditableTextarea, CategorySelect } from '@/components/editable';
import {
  Calendar,
  CalendarCheck,
  Phone,
  MapPin,
  User,
  Tag,
  Clock,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

// Field row component
function FieldRow({ 
  icon: Icon, 
  label, 
  children 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 w-36 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex-1 text-sm">{children}</div>
    </div>
  );
}

export function DetailsSection({
  complaint,
  onFieldUpdate,
  onPriorityChange,
  onDueDateChange,
  onClosedAtChange,
}: DetailsSectionProps) {
  const [showDetails, setShowDetails] = useState(true);

  return (
    <div className="p-6 max-w-3xl">
      {/* Quick Info Row */}
      <div className="flex items-center gap-6 mb-6 text-sm text-muted-foreground">
        <PrioritySelect 
          value={complaint.priority} 
          onChange={onPriorityChange}
        />
      </div>

      {/* Description */}
      <div className="mb-8 p-4 rounded-lg bg-muted/30 border">
        <EditableTextarea
          value={complaint.description}
          onSave={(value) => onFieldUpdate('description', value)}
          placeholder="Enter complaint description..."
        />
      </div>

      {/* Details Section */}
      <div className="mb-8">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 text-sm font-medium mb-3 hover:text-primary transition-colors cursor-pointer w-full text-left"
        >
          {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Details
        </button>
        {showDetails && <div className="space-y-0">
          <FieldRow icon={Phone} label="Phone">
            <EditableText
              value={complaint.complainantPhone}
              onSave={(value) => onFieldUpdate('complainantPhone', value)}
              placeholder="Enter phone number..."
            />
          </FieldRow>
          <FieldRow icon={Tag} label="Source">
            <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              {SOURCE_LABELS[complaint.source]}
            </span>
          </FieldRow>
          <FieldRow icon={Tag} label="Category">
            <CategorySelect
              value={complaint.category}
              onSave={(value) => onFieldUpdate('category', value)}
            />
          </FieldRow>
          <FieldRow icon={MapPin} label="Location">
            <EditableText
              value={complaint.location}
              onSave={(value) => onFieldUpdate('location', value)}
              placeholder="Enter location..."
            />
          </FieldRow>
          <FieldRow icon={User} label="Respondent">
            <EditableText
              value={complaint.respondentName}
              onSave={(value) => onFieldUpdate('respondentName', value)}
              placeholder="Enter respondent name..."
            />
          </FieldRow>
          <FieldRow icon={Clock} label="Created">
            {formatDate(complaint.createdAt.toDate())}
          </FieldRow>
          
          {/* Due Date with Calendar Picker */}
          <div className="flex items-center gap-3 py-2.5 border-b border-border/50">
            <div className="flex items-center gap-2 w-36 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Due Date</span>
            </div>
            <div className="flex-1 text-sm">
              <DatePickerPopover
                value={complaint.dueDate?.toDate()}
                onChange={onDueDateChange}
              />
            </div>
          </div>

          {/* Date Closed with Calendar Picker */}
          <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
            <div className="flex items-center gap-2 w-36 text-muted-foreground">
              <CalendarCheck className="h-4 w-4" />
              <span className="text-sm">Date Closed</span>
            </div>
            <div className="flex-1 text-sm">
              <DatePickerPopover
                value={complaint.closedAt?.toDate()}
                onChange={onClosedAtChange}
              />
            </div>
          </div>
        </div>}
      </div>
    </div>
  );
}
