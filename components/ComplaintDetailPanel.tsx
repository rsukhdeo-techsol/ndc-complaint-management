'use client';

import { useState, useEffect } from 'react';
import type { Complaint, ComplaintStatus, Priority, TimelineEntry } from '@/types';
import { STATUS_LABELS, PRIORITY_LABELS, SOURCE_LABELS, CATEGORY_LABELS } from '@/types';
import { formatDate } from '@/lib/utils';
import { updateComplaint, getTimeline, addComment } from '@/lib/services';

import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  X,
  Calendar,
  Phone,
  MapPin,
  User,
  Tag,
  Flag,
  Clock,
  Paperclip,
  Send,
  ChevronRight,
} from 'lucide-react';

interface ComplaintDetailPanelProps {
  complaint: Complaint | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

// Status badge component with dropdown
function StatusSelect({ 
  value, 
  onChange 
}: { 
  value: ComplaintStatus; 
  onChange: (status: ComplaintStatus) => void;
}) {
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

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-auto h-7 border-0 bg-transparent p-0 focus:ring-0">
        <span className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium uppercase text-white ${statusColors[value]}`}>
          {STATUS_LABELS[value]}
          <ChevronRight className="h-3 w-3 rotate-90" />
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
  );
}

// Priority select component
function PrioritySelect({ 
  value, 
  onChange 
}: { 
  value: Priority | undefined; 
  onChange: (priority: Priority) => void;
}) {
  const priorityColors: Record<Priority, string> = {
    low: 'text-gray-500',
    medium: 'text-blue-500',
    high: 'text-orange-500',
    urgent: 'text-red-500',
  };

  return (
    <Select value={value || 'medium'} onValueChange={onChange}>
      <SelectTrigger className="w-auto h-auto border-0 bg-transparent p-0 focus:ring-0">
        <span className={`inline-flex items-center gap-1.5 text-sm ${value ? priorityColors[value] : 'text-muted-foreground'}`}>
          <Flag className="h-4 w-4" />
          {value ? PRIORITY_LABELS[value] : 'Set priority'}
        </span>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
          <SelectItem key={key} value={key}>
            <span className={`inline-flex items-center gap-2 ${priorityColors[key as Priority]}`}>
              <Flag className="h-3 w-3" />
              {label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
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
}: { 
  user: string; 
  action?: string; 
  timestamp: string; 
  content?: string;
}) {
  const initials = user.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  return (
    <div className="flex gap-3 py-3 border-b border-border/30 last:border-0">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-xs text-white">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{user}</span>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>
        {action && (
          <p className="text-sm text-muted-foreground mt-0.5">{action}</p>
        )}
        {content && (
          <div className="mt-2 p-3 rounded-lg bg-muted/50 text-sm">
            {content}
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

  const handleStatusChange = async (newStatus: ComplaintStatus) => {
    setIsUpdating(true);
    try {
      await updateComplaint(complaint.id, { status: newStatus } as any);
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

  const getTimelineAction = (entry: TimelineEntry): string => {
    switch (entry.type) {
      case 'status_change':
        if (entry.previousStatus) {
          return `changed status from ${STATUS_LABELS[entry.previousStatus]} to ${STATUS_LABELS[entry.newStatus!]}`;
        }
        return `set status to ${STATUS_LABELS[entry.newStatus!]}`;
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
          <span className="font-mono text-xl font-bold text-blue-500">
            {complaint.referenceNumber}
          </span>
          <StatusSelect 
            value={complaint.status} 
            onChange={handleStatusChange}
          />
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side - Details */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-6 max-w-3xl">
              {/* Title */}
              <h1 className="text-2xl font-semibold mb-2">{complaint.title}</h1>
              
              {/* Quick Info Row */}
              <div className="flex items-center gap-6 mb-6 text-sm text-muted-foreground">
                <PrioritySelect 
                  value={complaint.priority} 
                  onChange={handlePriorityChange}
                />
              </div>

              {/* Description */}
              <div className="mb-8 p-4 rounded-lg bg-muted/30 border">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {complaint.description || 'No description provided.'}
                </p>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 mb-4">
                  <TabsTrigger 
                    value="details" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm"
                  >
                    Details
                  </TabsTrigger>
                  <TabsTrigger 
                    value="attachments"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm"
                  >
                    Attachments
                    {complaint.attachments && complaint.attachments.length > 0 && (
                      <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs">
                        {complaint.attachments.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-0">
                  <div className="space-y-0">
                    <FieldRow icon={User} label="Complainant">
                      {complaint.complainantName}
                    </FieldRow>
                    <FieldRow icon={Phone} label="Phone">
                      {complaint.complainantPhone || <span className="text-muted-foreground">—</span>}
                    </FieldRow>
                    <FieldRow icon={Tag} label="Source">
                      <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {SOURCE_LABELS[complaint.source]}
                      </span>
                    </FieldRow>
                    {complaint.category && (
                      <FieldRow icon={Tag} label="Category">
                        {CATEGORY_LABELS[complaint.category]}
                      </FieldRow>
                    )}
                    {complaint.location && (
                      <FieldRow icon={MapPin} label="Location">
                        {complaint.location}
                      </FieldRow>
                    )}
                    {complaint.respondentName && (
                      <FieldRow icon={User} label="Respondent">
                        {complaint.respondentName}
                      </FieldRow>
                    )}
                    <FieldRow icon={Clock} label="Created">
                      {formatDate(complaint.createdAt.toDate())}
                    </FieldRow>
                    {complaint.dueDate && (
                      <FieldRow icon={Calendar} label="Due Date">
                        {formatDate(complaint.dueDate.toDate())}
                      </FieldRow>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="attachments" className="mt-0">
                  {complaint.attachments && complaint.attachments.length > 0 ? (
                    <>
                      {/* Drop zone placeholder */}
                      <div className="mb-4 border-2 border-dashed border-border/50 rounded-lg p-4 text-center text-muted-foreground text-sm">
                        Drop your files here to <button className="text-primary underline">upload</button>
                      </div>
                      
                      {/* Image grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {complaint.attachments.map((attachment, idx) => {
                          const isImage = attachment.fileType.startsWith('image/');
                          return (
                            <div key={idx} className="group">
                              {isImage ? (
                                <button
                                  onClick={() => {
                                    setLightboxIndex(idx);
                                    setLightboxOpen(true);
                                  }}
                                  className="w-full aspect-square rounded-lg overflow-hidden bg-muted border hover:border-primary transition-colors"
                                >
                                  <img
                                    src={attachment.fileUrl}
                                    alt={attachment.fileName}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                </button>
                              ) : (
                                <a
                                  href={attachment.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
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

                      {/* Lightbox */}
                      <Lightbox
                        open={lightboxOpen}
                        close={() => setLightboxOpen(false)}
                        index={lightboxIndex}
                        slides={complaint.attachments
                          .filter(a => a.fileType.startsWith('image/'))
                          .map(a => ({ src: a.fileUrl, alt: a.fileName }))}
                      />
                    </>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Paperclip className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">No attachments</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </div>

        {/* Right Side - Activity */}
        <div className="w-[360px] border-l flex flex-col bg-muted/10">
          <div className="px-4 py-3 border-b">
            <h3 className="font-medium">Activity</h3>
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
    </div>
  );
}
