'use client';

import { useState, useEffect } from 'react';
import { Complaint, TimelineEntry } from '@/types';
import { formatDate } from '@/lib/utils';
import { getTimeline, addComment } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentsPopoverProps {
  complaint: Complaint;
  onUpdate?: () => void;
  className?: string;
}

export function CommentsPopover({
  complaint,
  onUpdate,
  className,
}: CommentsPopoverProps) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<TimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadComments();
    }
  }, [open, complaint.id]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const timeline = await getTimeline(complaint.id);
      const commentEntries = timeline.filter((entry) => entry.type === 'comment');
      setComments(commentEntries);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(complaint.id, {
        content: newComment,
        createdBy: 'current-user',
      });
      setNewComment('');
      await loadComments();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAddComment();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'inline-flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer',
            className
          )}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span className="text-xs">{complaint.commentCount || 0}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="start" 
        sideOffset={4}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              Comments ({complaint.commentCount || 0})
            </span>
          </div>
        </div>

        {/* Comments list */}
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No comments yet
            </div>
          ) : (
            <div className="divide-y">
              {comments.map((comment) => {
                const initials = comment.createdBy
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div key={comment.id} className="p-3">
                    <div className="flex items-start gap-2">
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-[10px] text-white">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">
                            {comment.createdBy}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(comment.createdAt.toDate())}
                          </span>
                        </div>
                        <p className="text-xs mt-1 text-muted-foreground whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add comment */}
        <div className="border-t p-3">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] text-xs resize-none mb-2"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              Ctrl+Enter to submit
            </span>
            <Button
              size="sm"
              disabled={!newComment.trim() || isSubmitting}
              onClick={(e) => {
                e.stopPropagation();
                handleAddComment();
              }}
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <Send className="h-3.5 w-3.5 mr-1" />
              )}
              Send
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
