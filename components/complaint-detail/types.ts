import type { Complaint, TimelineEntry, Priority } from '@/types';

export interface ComplaintDetailPanelProps {
  complaint: Complaint | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export interface ComplaintHeaderProps {
  complaint: Complaint;
  onStatusChange: (status: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
  isDeleting: boolean;
}

export interface DetailsSectionProps {
  complaint: Complaint;
  onFieldUpdate: (field: string, value: string) => Promise<void>;
  onPriorityChange: (priority: Priority) => Promise<void>;
  onDueDateChange: (date: Date | undefined) => Promise<void>;
  onClosedAtChange: (date: Date | undefined) => Promise<void>;
}

export interface AttachmentsSectionProps {
  complaint: Complaint;
  onUpload: (files: FileList | null) => Promise<void>;
  isUploading: boolean;
  uploadProgress: { [key: string]: { name: string; progress: number; size: number } };
}

export interface ActivityPanelProps {
  complaintId: string;
  timeline: TimelineEntry[];
  isLoadingTimeline: boolean;
  onAddComment: (content: string) => Promise<void>;
  onEditComment: (entryId: string, content: string) => Promise<void>;
  onDeleteComment: (entryId: string) => Promise<void>;
  getStatusName: (statusId: string | undefined) => string;
}

export interface VideoPlayerModalProps {
  open: boolean;
  videoUrl: string | null;
  onClose: () => void;
}

export interface UploadProgress {
  [key: string]: { 
    name: string; 
    progress: number; 
    size: number;
  };
}
