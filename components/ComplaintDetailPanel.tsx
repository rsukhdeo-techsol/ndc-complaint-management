'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Timestamp } from 'firebase/firestore';
import type { Complaint, ComplaintStatus, Priority, TimelineEntry } from '@/types';
import { STATUS_LABELS, SOURCE_LABELS, CATEGORY_LABELS } from '@/types';
import { formatDate } from '@/lib/utils';
import { useStatusConfig } from '@/lib/contexts/StatusContext';
import { updateComplaint, getTimeline, addComment, updateComment, uploadAttachmentWithProgress, addAttachment, deleteComplaint, deleteTimelineEntry } from '@/lib/services';
import { formatFileSize } from '@/lib/utils';

import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

// Dynamically import Plyr to avoid SSR issues with document
const Plyr = dynamic(() => import('plyr-react').then(mod => mod.Plyr), { 
  ssr: false,
  loading: () => <div className="aspect-video bg-black/50 flex items-center justify-center"><span className="text-white">Loading player...</span></div>
});

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerPopover } from '@/components/DatePickerPopover';
import { StatusSelect, PrioritySelect, EditableText, EditableTextarea, CategorySelect } from '@/components/editable';
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
  X,
  Calendar,
  CalendarCheck,
  Phone,
  MapPin,
  User,
  Tag,
  Clock,
  Paperclip,
  Send,
  Upload,
  Loader2,
  Trash2,
  Play,
  Pencil,
  Check,
  XIcon,
} from 'lucide-react';

interface ComplaintDetailPanelProps {
  complaint: Complaint | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

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

// Activity item component
function ActivityItem({ 
  user, 
  action, 
  timestamp, 
  content,
  isComment,
  isEditing,
  editContent,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onDelete,
}: { 
  user: string; 
  action?: string; 
  timestamp: string; 
  content?: string;
  isComment?: boolean;
  isEditing?: boolean;
  editContent?: string;
  onEditStart?: () => void;
  onEditChange?: (value: string) => void;
  onEditSave?: () => void;
  onEditCancel?: () => void;
  onDelete?: () => void;
}) {
  const initials = user.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  return (
    <div className="group flex gap-3 py-3 border-b border-border/30 last:border-0">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-xs text-white">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{user}</span>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
          {/* Edit/Delete buttons for comments */}
          {isComment && !isEditing && (
            <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onEditStart}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Edit comment"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    title="Delete comment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this comment? This action cannot be undone.
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
          )}
        </div>
        {action && (
          <p className="text-sm text-muted-foreground mt-0.5">{action}</p>
        )}
        {content && !isEditing && (
          <div className="mt-2 p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
            {content}
          </div>
        )}
        {isEditing && (
          <div className="mt-2">
            <Textarea
              value={editContent}
              onChange={(e) => onEditChange?.(e.target.value)}
              className="min-h-[60px] text-sm resize-none"
              autoFocus
            />
            <div className="flex items-center gap-2 mt-2">
              <Button size="sm" onClick={onEditSave} disabled={!editContent?.trim()}>
                <Check className="h-3.5 w-3.5 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={onEditCancel}>
                <XIcon className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ComplaintDetailPanel({ 
  complaint, 
  open, 
  onClose,
  onUpdate 
}: ComplaintDetailPanelProps) {
  const [comment, setComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: { name: string; progress: number; size: number } }>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getStatusById } = useStatusConfig();

  // Load plyr CSS on client side only
  useEffect(() => {
    // @ts-expect-error - CSS module import for styling
    import('plyr/dist/plyr.css');
  }, []);

  // Helper to get status name (supports both legacy and custom statuses)
  const getStatusName = (statusId: string | undefined): string => {
    if (!statusId) return 'Unknown';
    // Try custom status first
    const customStatus = getStatusById(statusId);
    if (customStatus) return customStatus.name;
    // Fall back to legacy labels
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

  if (!open || !complaint) return null;

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

  // Generic field update handler
  const handleFieldUpdate = async (field: string, value: string) => {
    await updateComplaint(complaint.id, { [field]: value || null });
    onUpdate?.();
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      await addComment(complaint.id, {
        content: comment,
        createdBy: 'current-user', // TODO: Get from auth
      });
      setComment('');
      // Refresh timeline
      const newTimeline = await getTimeline(complaint.id);
      setTimeline(newTimeline);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleEditComment = async (entryId: string) => {
    if (!editingCommentContent.trim()) return;
    try {
      await updateComment(complaint.id, entryId, editingCommentContent);
      setEditingCommentId(null);
      setEditingCommentContent('');
      // Refresh timeline
      const newTimeline = await getTimeline(complaint.id);
      setTimeline(newTimeline);
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async (entryId: string) => {
    try {
      await deleteTimelineEntry(complaint.id, entryId);
      // Refresh timeline
      const newTimeline = await getTimeline(complaint.id);
      setTimeline(newTimeline);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !complaint) return;
    
    setIsUploading(true);
    const fileArray = Array.from(files);
    
    // Initialize progress for all files
    const initialProgress: { [key: string]: { name: string; progress: number; size: number } } = {};
    fileArray.forEach((file, idx) => {
      initialProgress[`file-${idx}`] = { name: file.name, progress: 0, size: file.size };
    });
    setUploadProgress(initialProgress);
    
    try {
      // Upload all files with individual progress tracking
      const uploadPromises = fileArray.map(async (file, idx) => {
        const fileKey = `file-${idx}`;
        
        // Upload with progress
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
        
        // Add to timeline and complaint attachments
        await addAttachment(complaint.id, {
          attachment: attachmentData,
          createdBy: 'current-user',
        });
        
        return attachmentData;
      });
      
      await Promise.all(uploadPromises);
      
      // Refresh timeline and complaint data
      const newTimeline = await getTimeline(complaint.id);
      setTimeline(newTimeline);
      onUpdate?.();
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const getTimelineAction = (entry: TimelineEntry): string => {
    switch (entry.type) {
      case 'status_change':
        if (entry.previousStatus) {
          return `changed status from ${getStatusName(entry.previousStatus)} to ${getStatusName(entry.newStatus)}`;
        }
        return `set status to ${getStatusName(entry.newStatus)}`;
      case 'assignment':
        return `assigned to ${entry.newAssignee}`;
      case 'comment':
        return '';
      case 'attachment':
        return `added attachment: ${entry.attachment?.fileName}`;
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 md:left-64 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold">
            {complaint.complainantName}
          </span>
          <StatusSelect 
            value={complaint.status} 
            onChange={handleStatusChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Complaint</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this complaint from {complaint.complainantName}? This action cannot be undone and will permanently remove the complaint along with all its attachments and activity history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side - Details */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-6 max-w-3xl">
              {/* Quick Info Row */}
              <div className="flex items-center gap-6 mb-6 text-sm text-muted-foreground">
                <PrioritySelect 
                  value={complaint.priority} 
                  onChange={handlePriorityChange}
                />
              </div>

              {/* Description */}
              <div className="mb-8 p-4 rounded-lg bg-muted/30 border">
                <EditableTextarea
                  value={complaint.description}
                  onSave={(value) => handleFieldUpdate('description', value)}
                  placeholder="Enter complaint description..."
                />
              </div>

              {/* Details Section */}
              <div className="mb-8">
                <h3 className="text-sm font-medium mb-3">Details</h3>
                <div className="space-y-0">
                  <FieldRow icon={Phone} label="Phone">
                    <EditableText
                      value={complaint.complainantPhone}
                      onSave={(value) => handleFieldUpdate('complainantPhone', value)}
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
                      onSave={(value) => handleFieldUpdate('category', value)}
                    />
                  </FieldRow>
                  <FieldRow icon={MapPin} label="Location">
                    <EditableText
                      value={complaint.location}
                      onSave={(value) => handleFieldUpdate('location', value)}
                      placeholder="Enter location..."
                    />
                  </FieldRow>
                  <FieldRow icon={User} label="Respondent">
                    <EditableText
                      value={complaint.respondentName}
                      onSave={(value) => handleFieldUpdate('respondentName', value)}
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
                        onChange={handleDueDateChange}
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
                        onChange={handleClosedAtChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
              <div>
                <h3 className="text-sm font-medium mb-3">
                  Attachments
                  {complaint.attachments && complaint.attachments.length > 0 && (
                    <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs">
                      {complaint.attachments.length}
                    </span>
                  )}
                </h3>
                
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                
                {/* Drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`mb-4 border-2 border-dashed rounded-lg p-4 text-center text-sm transition-colors ${
                    isUploading 
                      ? 'border-border/50 bg-muted/30 cursor-default'
                      : isDragging 
                        ? 'border-primary bg-primary/5 text-primary cursor-pointer' 
                        : 'border-border/50 text-muted-foreground hover:border-primary/50 hover:bg-muted/50 cursor-pointer'
                  }`}
                >
                  {Object.keys(uploadProgress).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(uploadProgress).map(([key, { name, progress, size }]) => (
                        <div key={key} className="text-left">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium truncate max-w-[200px]">{name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {progress < 100 ? `${Math.round(progress)}%` : 'Processing...'}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {formatFileSize(size)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Upload className="h-4 w-4" />
                      <span>Drop files here or <span className="text-primary underline">browse</span></span>
                    </div>
                  )}
                </div>

                {complaint.attachments && complaint.attachments.length > 0 && (
                  <>
                    {/* Media grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {complaint.attachments.map((attachment, idx) => {
                        const isImage = attachment.fileType.startsWith('image/');
                        const isVideo = attachment.fileType.startsWith('video/');
                        
                        // Calculate the index for lightbox (only image files now)
                        const imageIndex = complaint.attachments!
                          .slice(0, idx)
                          .filter(a => a.fileType.startsWith('image/'))
                          .length;
                        
                        return (
                          <div key={idx} className="group">
                            {isImage ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLightboxIndex(imageIndex);
                                  setLightboxOpen(true);
                                }}
                                className="w-full aspect-square rounded-lg overflow-hidden bg-muted border hover:border-primary transition-colors cursor-pointer"
                              >
                                <img
                                  src={attachment.fileUrl}
                                  alt={attachment.fileName}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </button>
                            ) : isVideo ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentVideoUrl(attachment.fileUrl);
                                  setVideoPlayerOpen(true);
                                }}
                                className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted border hover:border-primary transition-colors cursor-pointer"
                              >
                                <video
                                  src={attachment.fileUrl}
                                  className="w-full h-full object-cover"
                                  muted
                                  preload="metadata"
                                />
                                {/* Play button overlay */}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/90 group-hover:bg-white transition-colors">
                                    <Play className="h-6 w-6 text-gray-800 ml-1" />
                                  </div>
                                </div>
                              </button>
                            ) : (
                              <a
                                href={attachment.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="w-full aspect-square rounded-lg overflow-hidden bg-muted border flex items-center justify-center hover:border-primary transition-colors"
                              >
                                <Paperclip className="h-8 w-8 text-muted-foreground" />
                              </a>
                            )}
                            <div className="mt-2">
                              <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(complaint.createdAt.toDate())}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Lightbox for images only */}
                    <Lightbox
                      open={lightboxOpen}
                      close={() => setLightboxOpen(false)}
                      index={lightboxIndex}
                      slides={complaint.attachments
                        .filter(a => a.fileType.startsWith('image/'))
                        .map(a => ({ src: a.fileUrl, alt: a.fileName }))}
                    />
                  </>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Right Side - Activity & Comments */}
        <div className="w-[360px] border-l flex flex-col bg-muted/10">
          <div className="px-4 py-3 border-b">
            <h3 className="font-medium">Activity & Comments</h3>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="px-4 py-2">
              {timeline.length === 0 && !isLoadingTimeline ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No activity yet</p>
              ) : (
                timeline.map((entry) => (
                  <ActivityItem 
                    key={entry.id}
                    user={entry.createdBy === 'system' ? 'System' : entry.createdBy}
                    action={getTimelineAction(entry)}
                    timestamp={formatDate(entry.createdAt.toDate())}
                    content={entry.type === 'comment' ? entry.content : undefined}
                    isComment={entry.type === 'comment'}
                    isEditing={editingCommentId === entry.id}
                    editContent={editingCommentId === entry.id ? editingCommentContent : ''}
                    onEditStart={() => {
                      setEditingCommentId(entry.id);
                      setEditingCommentContent(entry.content || '');
                    }}
                    onEditChange={setEditingCommentContent}
                    onEditSave={() => handleEditComment(entry.id)}
                    onEditCancel={() => {
                      setEditingCommentId(null);
                      setEditingCommentContent('');
                    }}
                    onDelete={() => handleDeleteComment(entry.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>

          {/* Comment Input */}
          <div className="p-4 border-t bg-background">
            <Textarea 
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[80px] resize-none text-sm mb-2"
            />
            <div className="flex items-center justify-end">
              <Button 
                size="sm"
                disabled={!comment.trim()}
                onClick={handleAddComment}
              >
                <Send className="h-4 w-4 mr-1.5" />
                Comment
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Player Modal - rendered outside main content for proper z-index */}
      {videoPlayerOpen && currentVideoUrl && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-8"
          onClick={() => {
            setVideoPlayerOpen(false);
            setCurrentVideoUrl(null);
          }}
        >
          <div 
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setVideoPlayerOpen(false);
                setCurrentVideoUrl(null);
              }}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white transition-colors z-10 cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Video Player */}
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ maxHeight: '70vh' }}>
              <Plyr
                source={{
                  type: 'video',
                  sources: [{ src: currentVideoUrl, type: 'video/mp4' }],
                }}
                options={{
                  autoplay: true,
                  controls: [
                    'play-large',
                    'play',
                    'progress',
                    'current-time',
                    'duration',
                    'mute',
                    'volume',
                    'settings',
                    'pip',
                    'fullscreen',
                  ],
                  settings: ['speed'],
                  speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
                  ratio: '16:9',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
