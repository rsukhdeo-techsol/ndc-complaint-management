'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Complaint } from '@/types';
import { getComplaints } from '@/lib/services';
import { ComplaintsTable } from '@/components/ComplaintsTable';
import { ComplaintDetailPanel } from '@/components/ComplaintDetailPanel';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { NewComplaintDialog } from '@/components/NewComplaintDialog';
import { AlertCircle, CheckCircle, Clock, FileText, Plus, Filter, List, LayoutGrid } from 'lucide-react';

export default function Home() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const stats = useMemo(() => {
    const total = complaints.length;
    const open = complaints.filter((c) => !['resolved', 'closed'].includes(c.status)).length;
    const inProgress = complaints.filter((c) => c.status === 'in_progress').length;
    const resolved = complaints.filter((c) => c.status === 'resolved').length;
    return { total, open, inProgress, resolved };
  }, [complaints]);

  return (
    <AppShell>
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

      {/* Stats row */}
      <div className="mb-4 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Total:</span>
          <span className="font-medium">{stats.total}</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <span className="text-muted-foreground">Open:</span>
          <span className="font-medium text-blue-500">{stats.open}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-yellow-500" />
          <span className="text-muted-foreground">In Progress:</span>
          <span className="font-medium text-yellow-500">{stats.inProgress}</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-muted-foreground">Resolved:</span>
          <span className="font-medium text-green-500">{stats.resolved}</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <ComplaintsTable
          complaints={complaints}
          onRowClick={setSelectedComplaint}
          selectedId={selectedComplaint?.id}
          isLoading={isLoading}
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
