'use client';

import { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import type { Complaint, Priority, TimelineEntry } from '@/types';
import { STATUS_LABELS } from '@/types';
import { useStatusConfig } from '@/lib/contexts/StatusContext';
import { 
  updateComplaint, 
  getTimeline, 
  addComment, 
  updateComment, 
  uploadAttachmentWithProgress, 
  addAttachment, 
  deleteComplaint, 
  deleteTimelineEntry 
} from '@/lib/services';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { ComplaintDetailPanelProps, UploadProgress } from './types';
import { ComplaintHeader } from './ComplaintHeader';
import { DetailsSection } from './DetailsSection';
import { AttachmentsSection } from './AttachmentsSection';
import { ActivityPanel } from './ActivityPanel';
import { VideoPlayerModal } from './VideoPlayerModal';

export function ComplaintDetailPanel({ 
  complaint, 
  open, 
  onClose,
  onUpdate 
}: ComplaintDetailPanelProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const { getStatusById } = useStatusConfig();

  // Helper to get status name (supports both legacy and custom statuses)
  const getStatusName = (statusId: string | undefined): string => {
    if (!statusId) return 'Unknown';
    const customStatus = getStatusById(statusId);
    if (customStatus) return customStatus.name;
    return STATUS_LABELS[statusId as keyof typeof STATUS_LABELS] || statusId;
  };

  // Load timeline when complaint changes
  useEffect(() => {
    if (complaint?.id) {
      setIsLoadingTimeline(true);
      getTimeline(complaint.id)
        .then(setTimeline)
        .catch(console.error)
        .finally(() => setIsLoadingTimeline(false));
    }
  }, [complaint?.id]);

  // Refresh timeline helper
  const refreshTimeline = async () => {
    if (complaint?.id) {
      const newTimeline = await getTimeline(complaint.id);
      setTimeline(newTimeline);
    }
  };

  if (!open || !complaint) return null;

  // Handler functions
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteComplaint(complaint.id);
      onClose();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting complaint:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatusId: string) => {
    setIsUpdating(true);
    try {
      await updateComplaint(complaint.id, { status: newStatusId } as any);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority: Priority) => {
    setIsUpdating(true);
    try {
      await updateComplaint(complaint.id, { priority: newPriority });
      onUpdate?.();
    } catch (error) {
      console.error('Error updating priority:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDueDateChange = async (date: Date | undefined) => {
    setIsUpdating(true);
    try {
      await updateComplaint(complaint.id, { 
        dueDate: date ? Timestamp.fromDate(date) : null 
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error updating due date:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClosedAtChange = async (date: Date | undefined) => {
    setIsUpdating(true);
    try {
      await updateComplaint(complaint.id, { 
        closedAt: date ? Timestamp.fromDate(date) : null 
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error updating closed date:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFieldUpdate = async (field: string, value: string) => {
    await updateComplaint(complaint.id, { [field]: value || null });
    onUpdate?.();
  };

  const handleAddComment = async (content: string) => {
    try {
      await addComment(complaint.id, {
        content,
        createdBy: 'current-user', // TODO: Get from auth
      });
      await refreshTimeline();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleEditComment = async (entryId: string, content: string) => {
    try {
      await updateComment(complaint.id, entryId, content);
      await refreshTimeline();
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async (entryId: string) => {
    try {
      await deleteTimelineEntry(complaint.id, entryId);
      await refreshTimeline();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !complaint) return;
    
    setIsUploading(true);
    const fileArray = Array.from(files);
    
    // Initialize progress for all files
    const initialProgress: UploadProgress = {};
    fileArray.forEach((file, idx) => {
      initialProgress[`file-${idx}`] = { name: file.name, progress: 0, size: file.size };
    });
    setUploadProgress(initialProgress);
    
    try {
      const uploadPromises = fileArray.map(async (file, idx) => {
        const fileKey = `file-${idx}`;
        
        const attachmentData = await uploadAttachmentWithProgress(
          complaint.id,
          file,
          (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [fileKey]: { ...prev[fileKey], progress }
            }));
          }
        );
        
        await addAttachment(complaint.id, {
          attachment: attachmentData,
          createdBy: 'current-user',
        });
        
        return attachmentData;
      });
      
      await Promise.all(uploadPromises);
      await refreshTimeline();
      onUpdate?.();
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const handleOpenVideoPlayer = (url: string) => {
    setCurrentVideoUrl(url);
    setVideoPlayerOpen(true);
  };

  const handleCloseVideoPlayer = () => {
    setVideoPlayerOpen(false);
    setCurrentVideoUrl(null);
  };

  return (
    <div className="fixed inset-0 z-50 md:left-64 bg-background flex flex-col">
      {/* Header */}
      <ComplaintHeader
        complaint={complaint}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        onClose={onClose}
        isDeleting={isDeleting}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Side - Details & Attachments */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <ScrollArea className="flex-1">
            <DetailsSection
              complaint={complaint}
              onFieldUpdate={handleFieldUpdate}
              onPriorityChange={handlePriorityChange}
              onDueDateChange={handleDueDateChange}
              onClosedAtChange={handleClosedAtChange}
            />
            <AttachmentsSection
              complaint={complaint}
              onUpload={handleFileUpload}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              onOpenVideoPlayer={handleOpenVideoPlayer}
            />
          </ScrollArea>
        </div>

        {/* Right Side - Activity & Comments */}
        <ActivityPanel
          complaintId={complaint.id}
          timeline={timeline}
          isLoadingTimeline={isLoadingTimeline}
          onAddComment={handleAddComment}
          onEditComment={handleEditComment}
          onDeleteComment={handleDeleteComment}
          getStatusName={getStatusName}
        />
      </div>

      {/* Video Player Modal */}
      <VideoPlayerModal
        open={videoPlayerOpen}
        videoUrl={currentVideoUrl}
        onClose={handleCloseVideoPlayer}
      />
    </div>
  );
}
