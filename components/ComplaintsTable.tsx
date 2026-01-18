"use client";

import type { ReactNode } from "react";
import { Timestamp } from "firebase/firestore";
import { Complaint, Priority, SOURCE_LABELS } from "@/types";
import { cn, formatDate, formatGuyanaPhone } from "@/lib/utils";
import { updateComplaint } from "@/lib/services";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DatePickerPopover } from "@/components/DatePickerPopover";
import { CommentsPopover } from "@/components/CommentsPopover";
import { StatusPopover } from "@/components/StatusPopover";
import { PriorityPopover } from "@/components/PriorityPopover";
import { FileText, Image, Loader2 } from "lucide-react";

interface ComplaintsTableProps {
  complaints: Complaint[];
  onRowClick: (complaint: Complaint) => void;
  onUpdate?: () => void;
  selectedId?: string;
  isLoading?: boolean;
  visibleColumnIds: string[];
}

type ColumnConfig = {
  id: string;
  label: string;
  headerClassName?: string;
  cellClassName?: string;
  render: (complaint: Complaint) => ReactNode;
};

export const COMPLAINT_COLUMN_DEFINITIONS = [
  { id: "complainant", label: "Complainant" },
  { id: "method", label: "Method" },
  { id: "createdAt", label: "Date created" },
  { id: "status", label: "Status" },
  { id: "priority", label: "Priority" },
  { id: "comments", label: "Comments" },
  { id: "mobile", label: "Mobile" },
  { id: "phone", label: "Phone number" },
  { id: "closedAt", label: "Date closed" },
  { id: "dueDate", label: "Due Date" },
  { id: "photos", label: "Photos" },
];

const COLUMN_IDS = COMPLAINT_COLUMN_DEFINITIONS.map((column) => column.id);

export function ComplaintsTable({
  complaints,
  onRowClick,
  onUpdate,
  selectedId,
  isLoading,
  visibleColumnIds,
}: ComplaintsTableProps) {
  const isInteractiveTarget = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement | null;
    return target?.closest('[data-table-interactive="true"]');
  };
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

  const renderPhoneCell = (value?: string) => {
    const formatted = formatGuyanaPhone(value);
    if (!formatted) {
      return <span className="text-muted-foreground">—</span>;
    }

    const telValue = formatted.replace(/[^+\d]/g, "");

    return (
      <a
        href={`tel:${telValue}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <span aria-hidden>🇬🇾</span>
        <span className="text-sm">{formatted}</span>
      </a>
    );
  };

  const columns: ColumnConfig[] = [
    {
      id: "complainant",
      label: "Complainant",
      headerClassName: "w-[180px] text-xs border-r",
      cellClassName: "border-r",
      render: (complaint) => (
        <button
          onClick={() => onRowClick(complaint)}
          className="font-medium text-sm text-blue-500 hover:text-blue-700 hover:underline cursor-pointer"
        >
          {complaint.complainantName}
        </button>
      ),
    },
    {
      id: "method",
      label: "Method",
      headerClassName: "w-[90px] text-xs border-r",
      cellClassName: "border-r",
      render: (complaint) => (
        <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          {SOURCE_LABELS[complaint.source]}
        </span>
      ),
    },
    {
      id: "createdAt",
      label: "Date created",
      headerClassName: "w-[100px] text-xs border-r",
      cellClassName: "text-muted-foreground text-sm border-r",
      render: (complaint) => formatDate(complaint.createdAt.toDate()),
    },
    {
      id: "status",
      label: "Status",
      headerClassName: "w-[120px] text-xs border-r",
      cellClassName: "border-r p-1",
      render: (complaint) => (
        <div data-table-interactive="true">
          <StatusPopover
            value={complaint.status}
            onChange={(status) => handleStatusChange(complaint.id, status)}
          />
        </div>
      ),
    },
    {
      id: "priority",
      label: "Priority",
      headerClassName: "w-[100px] text-xs border-r",
      cellClassName: "border-r p-1",
      render: (complaint) => (
        <div data-table-interactive="true">
          <PriorityPopover
            value={complaint.priority}
            onChange={(priority) => handlePriorityChange(complaint.id, priority)}
          />
        </div>
      ),
    },
    {
      id: "comments",
      label: "Comments",
      headerClassName: "w-[70px] text-xs text-center border-r",
      cellClassName: "text-center border-r",
      render: (complaint) => (
        <div data-table-interactive="true">
          <CommentsPopover
            complaint={complaint}
            onUpdate={onUpdate}
          />
        </div>
      ),
    },
    {
      id: "mobile",
      label: "Mobile",
      headerClassName: "w-[120px] text-xs border-r",
      cellClassName: "border-r",
      render: (complaint) => (
        <div data-table-interactive="true">
          {renderPhoneCell(complaint.complainantMobile)}
        </div>
      ),
    },
    {
      id: "phone",
      label: "Phone number",
      headerClassName: "w-[120px] text-xs border-r",
      cellClassName: "border-r",
      render: (complaint) => (
        <div data-table-interactive="true">
          {renderPhoneCell(complaint.complainantPhone)}
        </div>
      ),
    },
    {
      id: "closedAt",
      label: "Date closed",
      headerClassName: "w-[120px] text-xs border-r",
      cellClassName: "border-r p-1",
      render: (complaint) => (
        <div data-table-interactive="true">
          <DatePickerPopover
            value={complaint.closedAt?.toDate()}
            onChange={(date) => handleClosedAtChange(complaint.id, date)}
          />
        </div>
      ),
    },
    {
      id: "dueDate",
      label: "Due Date",
      headerClassName: "w-[120px] text-xs border-r",
      cellClassName: "border-r p-1",
      render: (complaint) => (
        <div data-table-interactive="true">
          <DatePickerPopover
            value={complaint.dueDate?.toDate()}
            onChange={(date) => handleDueDateChange(complaint.id, date)}
          />
        </div>
      ),
    },
    {
      id: "photos",
      label: "Photos",
      headerClassName: "w-[80px] text-xs",
      render: (complaint) =>
        complaint.attachments && complaint.attachments.length > 0 ? (
          <button
            data-table-interactive="true"
            onClick={() => onRowClick(complaint)}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <Image className="h-3.5 w-3.5" />
            <span className="text-xs">{complaint.attachments.length}</span>
          </button>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  const activeColumnIds = visibleColumnIds.length > 0 ? visibleColumnIds : COLUMN_IDS;
  const visibleColumns = columns.filter((column) =>
    activeColumnIds.includes(column.id)
  );

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
            {visibleColumns.map((column) => (
              <TableHead key={column.id} className={column.headerClassName}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
            {complaints.map((complaint) => (
              <TableRow
                key={complaint.id}
                onClick={(event) => {
                  if (isInteractiveTarget(event)) {
                    return;
                  }
                  onRowClick(complaint);
                }}
                className={cn(
                  "border-b cursor-pointer",
                  selectedId === complaint.id && "bg-accent"
                )}
              >
              {visibleColumns.map((column) => (
                <TableCell key={column.id} className={column.cellClassName}>
                  {column.render(complaint)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
