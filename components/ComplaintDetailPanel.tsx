'use client';

import { useState } from 'react';
import type { Complaint, ComplaintStatus, Priority } from '@/types';
import { STATUS_LABELS, PRIORITY_LABELS, SOURCE_LABELS, CATEGORY_LABELS } from '@/types';
import { formatDate } from '@/lib/utils';
import { updateComplaint } from '@/lib/services';

import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
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
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  MessageSquare,
  ChevronRight,
  MoreHorizontal,
  Send,
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
        <span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium uppercase text-white ${statusColors[value]}`}>
          {STATUS_LABELS[value]}
          <ChevronRight className="h-3 w-3 rotate-90" />
        </span>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <SelectItem key={key} value={key}>
            <span className={`inline-flex items-center gap-2`}>
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
        <span className={`inline-flex items-center gap-1 text-sm ${value ? priorityColors[value] : 'text-muted-foreground'}`}>
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

// Field row component for custom fields
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
    <div className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 w-40 text-muted-foreground">
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
  content 
}: { 
  user: string; 
  action: string; 
  timestamp: string; 
  content?: string;
}) {
  const initials = user.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  return (
    <div className="flex gap-3 py-3">
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
        {action && !content && (
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

  if (!complaint) return null;

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
    // TODO: Add comment to timeline
    console.log('Adding comment:', comment);
    setComment('');
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-[900px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-mono text-xl font-bold text-blue-500">
                {complaint.referenceNumber}
              </span>
              <StatusSelect 
                value={complaint.status} 
                onChange={handleStatusChange}
              />
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>More options</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Side - Details */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="p-6">
                {/* Title */}
                <h2 className="text-lg font-semibold mb-4">{complaint.title}</h2>

                {/* Quick Fields Row */}
                <div className="flex items-center gap-6 mb-6 pb-4 border-b">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Assignees</span>
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-[10px] text-white">
                        RS
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex items-center gap-2">
                    <PrioritySelect 
                      value={complaint.priority} 
                      onChange={handlePriorityChange}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6 p-4 rounded-lg bg-muted/30 border">
                  <p className="text-sm leading-relaxed">
                    {complaint.description || 'No description provided.'}
                  </p>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 mb-4">
                    <TabsTrigger 
                      value="details" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                    >
                      Details
                    </TabsTrigger>
                    <TabsTrigger 
                      value="attachments"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                    >
                      Attachments
                      {complaint.attachments && complaint.attachments.length > 0 && (
                        <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs">
                          {complaint.attachments.length}
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-0">
                    <div className="space-y-0">
                      <FieldRow icon={Calendar} label="Due Date">
                        {complaint.dueDate 
                          ? formatDate(complaint.dueDate.toDate())
                          : <span className="text-muted-foreground">Not set</span>
                        }
                      </FieldRow>
                      <FieldRow icon={Tag} label="Method">
                        <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          {SOURCE_LABELS[complaint.source]}
                        </span>
                      </FieldRow>
                      <FieldRow icon={Phone} label="Mobile">
                        {complaint.complainantPhone || <span className="text-muted-foreground">—</span>}
                      </FieldRow>
                      <FieldRow icon={Tag} label="Category">
                        {complaint.category 
                          ? CATEGORY_LABELS[complaint.category]
                          : <span className="text-muted-foreground">—</span>
                        }
                      </FieldRow>
                      <FieldRow icon={User} label="Person">
                        {complaint.complainantName}
                      </FieldRow>
                      <FieldRow icon={MapPin} label="Location">
                        {complaint.location || <span className="text-muted-foreground">—</span>}
                      </FieldRow>
                      {complaint.respondentName && (
                        <FieldRow icon={User} label="Respondent">
                          {complaint.respondentName}
                        </FieldRow>
                      )}
                      <FieldRow icon={Clock} label="Created">
                        {formatDate(complaint.createdAt.toDate())}
                      </FieldRow>
                    </div>
                  </TabsContent>

                  <TabsContent value="attachments" className="mt-0">
                    {complaint.attachments && complaint.attachments.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {complaint.attachments.map((attachment, idx) => (
                          <a
                            key={idx}
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                {(attachment.fileSize / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No attachments</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </div>

          {/* Right Side - Activity */}
          <div className="w-[320px] border-l flex flex-col bg-muted/20">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-medium text-sm">Activity</h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                Show more
              </Button>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="px-4 py-2">
                {/* Sample activity items - TODO: Load from timeline */}
                <ActivityItem 
                  user="System"
                  action="Complaint created"
                  timestamp={formatDate(complaint.createdAt.toDate())}
                />
                {complaint.status !== 'submitted' && (
                  <ActivityItem 
                    user="Rampaul Sukhdeo"
                    action={`Status changed to ${STATUS_LABELS[complaint.status]}`}
                    timestamp="Recently"
                  />
                )}
              </div>
            </ScrollArea>

            {/* Comment Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea 
                  placeholder="Write a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[60px] resize-none text-sm"
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Paperclip className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button 
                  size="sm" 
                  className="h-7"
                  disabled={!comment.trim()}
                  onClick={handleAddComment}
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Comment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
