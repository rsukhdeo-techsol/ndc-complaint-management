"use client";

import { useEffect, useMemo, useState } from "react";
import type { Complaint } from "@/types";
import { cn } from "@/lib/utils";
import { getComplaints } from "@/lib/services";
import {
  COMPLAINT_COLUMN_DEFINITIONS,
  ComplaintsTable,
} from "@/components/ComplaintsTable";
import { ComplaintDetailPanel } from "@/components/complaint-detail";
import { StatusTabs } from "@/components/StatusTabs";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NewComplaintDialog } from "@/components/NewComplaintDialog";
import {
  Columns3,
  Filter,
  LayoutGrid,
  List,
  Plus,
} from "lucide-react";

const COLUMN_IDS = COMPLAINT_COLUMN_DEFINITIONS.map((column) => column.id);
const STORAGE_KEY = "complaintsTable.visibleColumns";

export default function Home() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(COLUMN_IDS);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  async function refreshComplaints() {
    const data = await getComplaints();
    setComplaints(data);
  }

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await getComplaints();
        if (isMounted) setComplaints(data);
      } catch (error) {
        console.error('Error fetching complaints:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const next = parsed.filter((id) => COLUMN_IDS.includes(id));
        if (next.length > 0) {
          setVisibleColumnIds(next);
        }
      }
    } catch {
      // ignore malformed storage values
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumnIds));
  }, [visibleColumnIds]);

  const stats = useMemo(() => {
    const total = complaints.length;
    const open = complaints.filter((c) => !['resolved', 'closed'].includes(c.status)).length;
    const inProgress = complaints.filter((c) => c.status === 'in_progress').length;
    const resolved = complaints.filter((c) => c.status === 'resolved').length;
    return { total, open, inProgress, resolved };
  }, [complaints]);

  // Count complaints by status for tabs
  const statusCounts = useMemo(() => {
    return complaints.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [complaints]);

  // Filter complaints by selected status
  const filteredComplaints = useMemo(() => {
    if (!statusFilter) return complaints;
    return complaints.filter((c) => c.status === statusFilter);
  }, [complaints, statusFilter]);

  const isOnlyVisibleColumn = visibleColumnIds.length === 1;

  const handleToggleColumn = (columnId: string) => {
    setVisibleColumnIds((prev) => {
      const isVisible = prev.includes(columnId);
      if (isVisible && prev.length === 1) {
        return prev;
      }

      const next = isVisible
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId];

      return COLUMN_IDS.filter((id) => next.includes(id));
    });
  };

  return (
    <AppShell onNavigate={() => setSelectedComplaint(null)}>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2">
            <List className="h-4 w-4" />
            List
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Board
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Columns3 className="h-4 w-4" />
                Fields
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] p-0">
              <SheetHeader className="border-b">
                <SheetTitle>Fields</SheetTitle>
                <SheetDescription>
                  Toggle which columns appear in the table.
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    Visible columns
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setVisibleColumnIds(COLUMN_IDS)}
                  >
                    Show all
                  </Button>
                </div>
                <div className="space-y-2">
                  {COMPLAINT_COLUMN_DEFINITIONS.map((column) => {
                    const isChecked = visibleColumnIds.includes(column.id);
                    const isDisabled = isOnlyVisibleColumn && isChecked;

                    return (
                      <div
                        key={column.id}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                      >
                        <span className="text-sm">{column.label}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isChecked}
                          aria-label={`Toggle ${column.label} column`}
                          disabled={isDisabled}
                          onClick={() => handleToggleColumn(column.id)}
                          className={cn(
                            "relative inline-flex h-4 w-7 items-center rounded-full border transition-colors",
                            isChecked
                              ? "bg-purple-600 border-purple-600"
                              : "bg-muted border-input",
                            isDisabled && "cursor-not-allowed opacity-50"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-3 w-3 rounded-full bg-white shadow transition-transform",
                              isChecked ? "translate-x-3" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <NewComplaintDialog
            onCreated={async () => {
              await refreshComplaints();
            }}
            trigger={
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New
              </Button>
            }
          />
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-4">
        <StatusTabs
          value={statusFilter}
          onChange={setStatusFilter}
          counts={statusCounts}
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <ComplaintsTable
          complaints={filteredComplaints}
          onRowClick={setSelectedComplaint}
          onUpdate={refreshComplaints}
          selectedId={selectedComplaint?.id}
          isLoading={isLoading}
          visibleColumnIds={visibleColumnIds}
        />
      </div>

      {/* Complaint Detail Panel */}
      <ComplaintDetailPanel
        complaint={selectedComplaint}
        open={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        onUpdate={async () => {
          await refreshComplaints();
          // Refresh the selected complaint data
          if (selectedComplaint) {
            const updated = await getComplaints();
            const refreshed = updated.find(c => c.id === selectedComplaint.id);
            if (refreshed) setSelectedComplaint(refreshed);
          }
        }}
      />
    </AppShell>
  );
}
