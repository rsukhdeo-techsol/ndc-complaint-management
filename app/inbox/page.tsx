'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Notification,
  NotificationType,
  NOTIFICATION_TYPE_LABELS,
} from '@/types';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from '@/lib/services';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  FilePlus,
  UserPlus,
  MessageSquare,
  AtSign,
  RefreshCw,
  Clock,
  AlertTriangle,
  Bell,
  MoreHorizontal,
  Check,
  CheckCheck,
  Trash2,
  Inbox,
  Loader2,
  Filter,
} from 'lucide-react';

// Icon mapping for notification types
const NotificationIcon: Record<NotificationType, React.ElementType> = {
  new_complaint: FilePlus,
  assignment: UserPlus,
  comment: MessageSquare,
  mention: AtSign,
  status_change: RefreshCw,
  due_date_reminder: Clock,
  overdue_alert: AlertTriangle,
  follow_up_reminder: Bell,
};

// Color mapping for notification types
const notificationColors: Record<NotificationType, string> = {
  new_complaint: 'bg-blue-500',
  assignment: 'bg-purple-500',
  comment: 'bg-green-500',
  mention: 'bg-yellow-500',
  status_change: 'bg-indigo-500',
  due_date_reminder: 'bg-orange-500',
  overdue_alert: 'bg-red-500',
  follow_up_reminder: 'bg-pink-500',
};

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
}

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  onClick,
}: NotificationItemProps) {
  const Icon = NotificationIcon[notification.type];
  const timeAgo = formatDistanceToNow(notification.createdAt.toDate(), {
    addSuffix: true,
  });

  return (
    <div
      className={cn(
        'group flex gap-3 p-4 border-b cursor-pointer transition-colors hover:bg-muted/50',
        !notification.isRead && 'bg-primary/5'
      )}
      onClick={() => onClick(notification)}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white',
          notificationColors[notification.type]
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'font-medium text-sm',
                  !notification.isRead && 'text-foreground',
                  notification.isRead && 'text-muted-foreground'
                )}
              >
                {notification.title}
              </span>
              {!notification.isRead && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
              {notification.message}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {notification.complaintRef && (
                <Badge variant="secondary" className="text-xs">
                  {notification.complaintRef}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!notification.isRead && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead(notification.id);
                  }}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark as read
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export default function InboxPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');

  async function loadNotifications() {
    try {
      const data = await getNotifications({
        // In production, filter by current user
        // recipientId: currentUserId,
      });
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      await handleMarkRead(notification.id);
    }

    // Navigate to complaint if applicable
    if (notification.complaintId) {
      router.push(`/?complaint=${notification.complaintId}`);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    // Tab filter
    if (activeTab === 'unread' && n.isRead) return false;
    if (
      activeTab === 'reminders' &&
      !['due_date_reminder', 'overdue_alert', 'follow_up_reminder'].includes(
        n.type
      )
    )
      return false;

    // Type filter
    if (filterType !== 'all' && n.type !== filterType) return false;

    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Inbox</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                : 'All caught up!'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive"
                  disabled={notifications.length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all notifications. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Clear all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="all">
                All
                {notifications.length > 0 && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({notifications.length})
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && (
                  <Badge className="ml-1.5 h-5 min-w-5 px-1.5" variant="default">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
            </TabsList>

            {/* Type filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {filterType === 'all'
                    ? 'All types'
                    : NOTIFICATION_TYPE_LABELS[filterType]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterType('all')}>
                  All types
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {Object.entries(NOTIFICATION_TYPE_LABELS).map(([type, label]) => (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => setFilterType(type as NotificationType)}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          <div className="rounded-lg border bg-card">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading notifications...</span>
                </div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Inbox className="h-12 w-12 mb-4 stroke-1" />
                <p className="text-lg font-medium">No notifications</p>
                <p className="text-sm">
                  {activeTab === 'unread'
                    ? "You're all caught up!"
                    : activeTab === 'reminders'
                      ? 'No reminders yet'
                      : 'Your inbox is empty'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-280px)]">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                    onDelete={handleDelete}
                    onClick={handleNotificationClick}
                  />
                ))}
              </ScrollArea>
            )}
          </div>
        </Tabs>
      </div>
    </AppShell>
  );
}
