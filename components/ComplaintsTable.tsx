'use client';

import { Complaint, SOURCE_LABELS } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Loader2, MessageSquare, Image } from 'lucide-react';

interface ComplaintsTableProps {
  complaints: Complaint[];
  onRowClick: (complaint: Complaint) => void;
  selectedId?: string;
  isLoading?: boolean;
}

export function ComplaintsTable({
  complaints,
  onRowClick,
  selectedId,
  isLoading,
}: ComplaintsTableProps) {
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
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b">
            <TableHead className="w-10 text-center text-xs">#</TableHead>
            <TableHead className="w-[120px] text-xs">Name</TableHead>
            <TableHead className="w-[130px] text-xs">Person</TableHead>
            <TableHead className="w-[90px] text-xs">Method</TableHead>
            <TableHead className="w-[100px] text-xs">Date created</TableHead>
            <TableHead className="w-[100px] text-xs">Status</TableHead>
            <TableHead className="w-[80px] text-xs">Priority</TableHead>
            <TableHead className="w-[70px] text-xs text-center">Comments</TableHead>
            <TableHead className="w-[110px] text-xs">Phone number</TableHead>
            <TableHead className="w-[100px] text-xs">Date closed</TableHead>
            <TableHead className="w-[100px] text-xs">Due Date</TableHead>
            <TableHead className="w-[80px] text-xs">Photos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {complaints.map((complaint, index) => (
            <TableRow
              key={complaint.id}
              onClick={() => onRowClick(complaint)}
              className={cn(
                'cursor-pointer',
                selectedId === complaint.id && 'bg-accent'
              )}
            >
              <TableCell className="text-center text-muted-foreground text-sm">
                {index + 1}
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm text-blue-500">
                  {complaint.referenceNumber}
                </span>
              </TableCell>
              <TableCell className="font-medium text-sm">
                {complaint.complainantName}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  {SOURCE_LABELS[complaint.source]}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(complaint.createdAt.toDate())}
              </TableCell>
              <TableCell>
                <StatusBadge status={complaint.status} />
              </TableCell>
              <TableCell>
                {complaint.priority && <PriorityBadge priority={complaint.priority} />}
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="text-xs">0</span>
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {complaint.complainantPhone || '—'}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {complaint.closedAt
                  ? formatDate(complaint.closedAt.toDate())
                  : '—'}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {complaint.dueDate
                  ? formatDate(complaint.dueDate.toDate())
                  : '—'}
              </TableCell>
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
