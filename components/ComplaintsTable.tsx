'use client';

import { Timestamp } from 'firebase/firestore';
import { Complaint, Priority, SOURCE_LABELS } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import { updateComplaint } from '@/lib/services';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusSelect, PrioritySelect, EditableCell } from '@/components/editable';
import { DatePickerPopover } from '@/components/DatePickerPopover';
import { FileText, Loader2, MessageSquare, Image } from 'lucide-react';

interface ComplaintsTableProps {
  complaints: Complaint[];
  onRowClick: (complaint: Complaint) => void;
  onUpdate?: () => void;
  selectedId?: string;
  isLoading?: boolean;
}

export function ComplaintsTable({
  complaints,
  onRowClick,
  onUpdate,
  selectedId,
  isLoading,
}: ComplaintsTableProps) {
  // Handler factories for each editable field
  const handleStatusChange = async (complaintId: string, newStatusId: string) => {
    await updateComplaint(complaintId, { status: newStatusId } as any);
    onUpdate?.();
  };

  const handlePriorityChange = async (complaintId: string, newPriority: Priority) => {
    await updateComplaint(complaintId, { priority: newPriority });
    onUpdate?.();
  };

  const handleDueDateChange = async (complaintId: string, date: Date | undefined) => {
    await updateComplaint(complaintId, { 
      dueDate: date ? Timestamp.fromDate(date) : null 
    });
    onUpdate?.();
  };

  const handleClosedAtChange = async (complaintId: string, date: Date | undefined) => {
    await updateComplaint(complaintId, { 
      closedAt: date ? Timestamp.fromDate(date) : null 
    });
    onUpdate?.();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading complaints...</span>
        </div>
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <FileText className="h-12 w-12 mb-4 stroke-1" />
        <p className="text-lg font-medium">No complaints yet</p>
        <p className="text-sm">Click "New" to create one</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b">
            <TableHead className="w-[180px] text-xs border-r">Complainant</TableHead>
            <TableHead className="w-[90px] text-xs border-r">Method</TableHead>
            <TableHead className="w-[100px] text-xs border-r">Date created</TableHead>
            <TableHead className="w-[120px] text-xs border-r">Status</TableHead>
            <TableHead className="w-[100px] text-xs border-r">Priority</TableHead>
            <TableHead className="w-[70px] text-xs text-center border-r">Comments</TableHead>
            <TableHead className="w-[120px] text-xs border-r">Phone number</TableHead>
            <TableHead className="w-[120px] text-xs border-r">Date closed</TableHead>
            <TableHead className="w-[120px] text-xs border-r">Due Date</TableHead>
            <TableHead className="w-[80px] text-xs">Photos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {complaints.map((complaint) => (
            <TableRow
              key={complaint.id}
              className={cn(
                'border-b',
                selectedId === complaint.id && 'bg-accent'
              )}
            >
              {/* Complainant - clickable to open panel */}
              <TableCell className="border-r">
                <button
                  onClick={() => onRowClick(complaint)}
                  className="font-medium text-sm text-blue-500 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  {complaint.complainantName}
                </button>
              </TableCell>

              {/* Method/Source - read only */}
              <TableCell className="border-r">
                <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  {SOURCE_LABELS[complaint.source]}
                </span>
              </TableCell>

              {/* Date created - read only */}
              <TableCell className="text-muted-foreground text-sm border-r">
                {formatDate(complaint.createdAt.toDate())}
              </TableCell>

              {/* Status - editable */}
              <TableCell className="border-r p-1">
                <EditableCell<string>
                  value={complaint.status}
                  onSave={(status) => handleStatusChange(complaint.id, status)}
                >
                  {({ value, onChange, disabled }) => (
                    <StatusSelect
                      value={value}
                      onChange={onChange}
                      disabled={disabled}
                      variant="compact"
                    />
                  )}
                </EditableCell>
              </TableCell>

              {/* Priority - editable */}
              <TableCell className="border-r p-1">
                <EditableCell
                  value={complaint.priority}
                  onSave={(priority) => handlePriorityChange(complaint.id, priority!)}
                >
                  {({ value, onChange, disabled }) => (
                    <PrioritySelect
                      value={value}
                      onChange={onChange}
                      disabled={disabled}
                      variant="compact"
                    />
                  )}
                </EditableCell>
              </TableCell>

              {/* Comments - read only */}
              <TableCell className="text-center border-r">
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="text-xs">{complaint.commentCount || 0}</span>
                </span>
              </TableCell>

              {/* Phone number - read only */}
              <TableCell className="text-muted-foreground text-sm border-r">
                {complaint.complainantPhone || '—'}
              </TableCell>

              {/* Date closed - editable */}
              <TableCell className="border-r p-1">
                <DatePickerPopover
                  value={complaint.closedAt?.toDate()}
                  onChange={(date) => handleClosedAtChange(complaint.id, date)}
                />
              </TableCell>

              {/* Due Date - editable */}
              <TableCell className="border-r p-1">
                <DatePickerPopover
                  value={complaint.dueDate?.toDate()}
                  onChange={(date) => handleDueDateChange(complaint.id, date)}
                />
              </TableCell>

              {/* Photos - read only */}
              <TableCell>
                {complaint.attachments && complaint.attachments.length > 0 ? (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Image className="h-3.5 w-3.5" />
                    <span className="text-xs">{complaint.attachments.length}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
