'use client';

import { useState } from 'react';
import type { TimelineEntry } from '@/types';
import type { ActivityPanelProps } from './types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
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
import { Send, Pencil, Check, X as XIcon, Trash2 } from 'lucide-react';

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
                <AlertDialogContent className="rounded-md">
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

export function ActivityPanel({
  timeline,
  isLoadingTimeline,
  onAddComment,
  onEditComment,
  onDeleteComment,
  getStatusName,
}: ActivityPanelProps) {
  const [comment, setComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');

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
      case 'attachment_removed':
        return `removed attachment: ${entry.fileName ?? entry.attachment?.fileName ?? 'file'}`;
      default:
        return '';
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    await onAddComment(comment);
    setComment('');
  };

  const handleEditComment = async (entryId: string) => {
    if (!editingCommentContent.trim()) return;
    await onEditComment(entryId, editingCommentContent);
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const commentEntries = timeline.filter(entry => entry.type === 'comment');

  return (
    <div className="w-full md:w-[360px] border-t md:border-t-0 md:border-l flex flex-col bg-muted/10 min-h-0 flex-shrink-0">
      <div className="px-4 py-3 border-b flex-shrink-0">
        <h3 className="font-medium">Comments</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="px-4 py-2">
          {commentEntries.length === 0 && !isLoadingTimeline ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No comments yet</p>
          ) : (
            commentEntries.map((entry) => (
              <ActivityItem 
                key={entry.id}
                user={entry.createdBy === 'system' ? 'System' : entry.createdBy}
                action={getTimelineAction(entry)}
                timestamp={formatDate(entry.createdAt.toDate())}
                content={entry.content}
                isComment={true}
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
                onDelete={() => onDeleteComment(entry.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Comment Input */}
      <div className="p-4 border-t bg-background flex-shrink-0">
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
  );
}
