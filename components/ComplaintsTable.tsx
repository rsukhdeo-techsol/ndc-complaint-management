'use client';

import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Complaint, ComplaintStatus, Priority, SOURCE_LABELS, STATUS_LABELS, PRIORITY_LABELS } from '@/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { DatePickerPopover } from '@/components/DatePickerPopover';
import { FileText, Loader2, MessageSquare, Image, ChevronDown } from 'lucide-react';

interface ComplaintsTableProps {
  complaints: Complaint[];
  onRowClick: (complaint: Complaint) => void;
  onUpdate?: () => void;
  selectedId?: string;
  isLoading?: boolean;
}

// Status colors for inline display
const statusColors: Record<ComplaintStatus, string> = {
  submitted: 'bg-gray-500',
  acknowledged: 'bg-blue-500',
  under_review: 'bg-purple-500',
  assigned: 'bg-indigo-500',
  in_progress: 'bg-yellow-500',
  pending_external_action: 'bg-orange-500',
  resolved: 'bg-green-500',
  closed: 'bg-gray-400',
};

// Priority colors for inline display
const priorityColors: Record<Priority, string> = {
  low: 'bg-gray-400 text-white',
  medium: 'bg-blue-500 text-white',
  high: 'bg-orange-500 text-white',
  urgent: 'bg-red-500 text-white',
};

export function ComplaintsTable({
  complaints,
  onRowClick,
  onUpdate,
  selectedId,
  isLoading,
}: ComplaintsTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (complaintId: string, newStatus: ComplaintStatus) => {
    setUpdatingId(complaintId);
    try {
      await updateComplaint(complaintId, { status: newStatus } as any);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePriorityChange = async (complaintId: string, newPriority: Priority) => {
    setUpdatingId(complaintId);
    try {
      await updateComplaint(complaintId, { priority: newPriority });
      onUpdate?.();
    } catch (error) {
      console.error('Error updating priority:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDueDateChange = async (complaintId: string, date: Date | undefined) => {
    setUpdatingId(complaintId);
    try {
      await updateComplaint(complaintId, { 
        dueDate: date ? Timestamp.fromDate(date) : null 
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error updating due date:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClosedAtChange = async (complaintId: string, date: Date | undefined) => {
    setUpdatingId(complaintId);
    try {
      await updateComplaint(complaintId, { 
        closedAt: date ? Timestamp.fromDate(date) : null 
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error updating closed date:', error);
    } finally {
      setUpdatingId(null);
    }
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
            <TableHead className="w-[130px] text-xs border-r">Complaint #</TableHead>
            <TableHead className="w-[150px] text-xs border-r">Complainant</TableHead>
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
              {/* Complaint # - clickable to open panel */}
              <TableCell className="border-r">
                <button
                  onClick={() => onRowClick(complaint)}
                  className="font-mono text-sm text-blue-500 hover:text-blue-700 hover:underline"
                >
                  {complaint.referenceNumber}
                </button>
              </TableCell>

              {/* Complainant - read only for now */}
              <TableCell className="font-medium text-sm border-r">
                {complaint.complainantName}
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

              {/* Status - inline dropdown */}
              <TableCell className="border-r p-1">
                <Select 
                  value={complaint.status} 
                  onValueChange={(value) => handleStatusChange(complaint.id, value as ComplaintStatus)}
                  disabled={updatingId === complaint.id}
                >
                  <SelectTrigger className="h-7 w-full border-0 bg-transparent p-0 px-1 focus:ring-0">
                    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-white ${statusColors[complaint.status]}`}>
                      {STATUS_LABELS[complaint.status]}
                      <ChevronDown className="h-3 w-3" />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <span className="inline-flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${statusColors[key as ComplaintStatus]}`} />
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>

              {/* Priority - inline dropdown */}
              <TableCell className="border-r p-1">
                <Select 
                  value={complaint.priority || ''} 
                  onValueChange={(value) => handlePriorityChange(complaint.id, value as Priority)}
                  disabled={updatingId === complaint.id}
                >
                  <SelectTrigger className="h-7 w-full border-0 bg-transparent p-0 px-1 focus:ring-0">
                    {complaint.priority ? (
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${priorityColors[complaint.priority]}`}>
                        {PRIORITY_LABELS[complaint.priority]}
                        <ChevronDown className="h-3 w-3" />
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        Set...
                        <ChevronDown className="h-3 w-3" />
                      </span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <span className="inline-flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${priorityColors[key as Priority].split(' ')[0]}`} />
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              {/* Date closed - inline date picker */}
              <TableCell className="border-r p-1">
                <DatePickerPopover
                  value={complaint.closedAt?.toDate()}
                  onChange={(date) => handleClosedAtChange(complaint.id, date)}
                  disabled={updatingId === complaint.id}
                />
              </TableCell>

              {/* Due Date - inline date picker */}
              <TableCell className="border-r p-1">
                <DatePickerPopover
                  value={complaint.dueDate?.toDate()}
                  onChange={(date) => handleDueDateChange(complaint.id, date)}
                  disabled={updatingId === complaint.id}
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
