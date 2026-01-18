import { Timestamp } from 'firebase/firestore';

// ============================================
// ENUMS & LITERAL TYPES
// ============================================

/**
 * Complaint lifecycle statuses
 */
export type ComplaintStatus =
  | 'submitted'
  | 'acknowledged'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'pending_external_action'
  | 'resolved'
  | 'closed';

/**
 * How the complaint was received
 */
export type ComplaintSource = 'phone' | 'walk_in' | 'councillor' | 'chairman';

/**
 * Priority levels
 */
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Timeline event types
 */
export type TimelineEventType = 'comment' | 'status_change' | 'attachment' | 'attachment_removed' | 'assignment';

// ============================================
// STATUS LABELS & CONFIGS (for UI)
// ============================================

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  submitted: 'Submitted',
  acknowledged: 'Acknowledged',
  under_review: 'Under Review',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  pending_external_action: 'Pending External Action',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const STATUS_ORDER: ComplaintStatus[] = [
  'submitted',
  'acknowledged',
  'under_review',
  'assigned',
  'in_progress',
  'pending_external_action',
  'resolved',
  'closed',
];

export const SOURCE_LABELS: Record<ComplaintSource, string> = {
  phone: 'Phone Call',
  walk_in: 'Walk-in',
  councillor: 'Councillor',
  chairman: 'Chairman',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const PRIORITY_ORDER: Priority[] = ['low', 'medium', 'high', 'urgent'];

// ============================================
// COMPLAINT CATEGORIES (expandable)
// ============================================

export const COMPLAINT_CATEGORIES = [
  'roads',
  'drainage',
  'sanitation',
  'streetlights',
  'water',
  'noise',
  'land',
  'building',
  'environmental',
  'other',
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  roads: 'Roads & Bridges',
  drainage: 'Drainage',
  sanitation: 'Sanitation & Garbage',
  streetlights: 'Street Lights',
  water: 'Water Supply',
  noise: 'Noise Complaint',
  land: 'Land Issues',
  building: 'Building & Construction',
  environmental: 'Environmental',
  other: 'Other',
};

// ============================================
// MAIN INTERFACES
// ============================================

/**
 * Attachment metadata stored in timeline entries
 */
export interface AttachmentData {
  fileName: string;
  fileUrl: string;           // Firebase Storage download URL
  fileType: string;          // MIME type
  fileSize: number;          // Bytes
  storagePath: string;       // Path in Firebase Storage for deletion
  thumbnailUrl?: string;     // Lazy-loaded preview asset
  thumbnailStoragePath?: string; // Storage path for generated thumbnail
}

/**
 * Main Complaint document
 * Collection: complaints/{complaintId}
 */
export interface Complaint {
  // Identity
  id: string;
  referenceNumber: string;   // Human-readable: "NDC-2025-0001"

  // Complainant info
  complainantName: string;
  complainantPhone?: string;
  complainantMobile?: string;
  complainantEmail?: string;
  complainantAddress?: string;

  // Complaint details
  title: string;
  description: string;
  category?: ComplaintCategory;
  location?: string;
  respondentName?: string;        // Person being complained about (optional)
  attachments?: AttachmentData[]; // Files uploaded at intake

  // Intake
  source: ComplaintSource;

  // Status & workflow
  status: ComplaintStatus | string; // Can be legacy status or custom status ID
  priority?: Priority;
  assignedTo?: string;
  commentCount?: number;  // Number of comments on this complaint

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  dueDate?: Timestamp;
  resolvedAt?: Timestamp;
  closedAt?: Timestamp;

  // Audit
  createdBy: string;
}

/**
 * Timeline entry document
 * Subcollection: complaints/{complaintId}/timeline/{eventId}
 */
export interface TimelineEntry {
  id: string;
  type: TimelineEventType;

  // For comments
  content?: string;

  // For status changes
  previousStatus?: ComplaintStatus | string;
  newStatus?: ComplaintStatus | string;
  statusNote?: string;

  // For attachments
  attachment?: AttachmentData;
  fileName?: string; // For attachment_removed events

  // For assignments
  previousAssignee?: string;
  newAssignee?: string;

  // Common
  createdAt: Timestamp;
  createdBy: string;
}

// ============================================
// FORM/INPUT TYPES (without server-generated fields)
// ============================================

/**
 * Data required to create a new complaint
 */
export interface CreateComplaintInput {
  complainantName: string;
  complainantPhone?: string;
  complainantMobile?: string;
  complainantEmail?: string;
  complainantAddress?: string;
  title: string;
  description: string;
  category?: ComplaintCategory;
  location?: string;
  respondentName?: string;
  attachments?: AttachmentData[];
  source: ComplaintSource;
  priority?: Priority;
  createdBy: string;
}

/**
 * Data for updating a complaint (partial)
 */
export interface UpdateComplaintInput {
  complainantName?: string;
  complainantPhone?: string;
  complainantMobile?: string;
  complainantEmail?: string;
  complainantAddress?: string;
  title?: string;
  description?: string;
  category?: ComplaintCategory;
  location?: string;
  priority?: Priority;
  assignedTo?: string;
  dueDate?: Timestamp | null;
  closedAt?: Timestamp | null;
}

/**
 * Data for adding a comment
 */
export interface AddCommentInput {
  content: string;
  createdBy: string;
}

/**
 * Data for changing status
 */
export interface StatusChangeInput {
  newStatus: ComplaintStatus;
  statusNote?: string;
  createdBy: string;
}

/**
 * Data for assigning complaint
 */
export interface AssignmentInput {
  newAssignee: string;
  createdBy: string;
}

/**
 * Data for adding attachment
 */
export interface AddAttachmentInput {
  attachment: AttachmentData;
  createdBy: string;
}

/**
 * Data for removing attachment
 */
export interface RemoveAttachmentInput {
  storagePath: string;
  fileName: string;
  removedBy: string;
}

// ============================================
// NOTIFICATIONS / INBOX
// ============================================

/**
 * Notification types
 */
export type NotificationType =
  | 'new_complaint'
  | 'assignment'
  | 'comment'
  | 'mention'
  | 'status_change'
  | 'due_date_reminder'
  | 'overdue_alert'
  | 'follow_up_reminder';

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  new_complaint: 'New Complaint',
  assignment: 'Assignment',
  comment: 'Comment',
  mention: 'Mention',
  status_change: 'Status Change',
  due_date_reminder: 'Due Date Reminder',
  overdue_alert: 'Overdue Alert',
  follow_up_reminder: 'Follow-up Reminder',
};

export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, string> = {
  new_complaint: 'file-plus',
  assignment: 'user-plus',
  comment: 'message-square',
  mention: 'at-sign',
  status_change: 'refresh-cw',
  due_date_reminder: 'clock',
  overdue_alert: 'alert-triangle',
  follow_up_reminder: 'bell',
};

/**
 * Notification document
 * Collection: notifications/{notificationId}
 */
export interface Notification {
  id: string;
  recipientId: string;          // User who receives the notification
  type: NotificationType;
  title: string;
  message: string;
  
  // Related entities
  complaintId?: string;
  complaintRef?: string;        // Reference number for display
  
  // State
  isRead: boolean;
  readAt?: Timestamp;
  
  // Metadata
  actorId?: string;             // User who triggered the notification
  actorName?: string;           // Display name of actor
  
  // Timestamps
  createdAt: Timestamp;
}

/**
 * Data required to create a notification
 */
export interface CreateNotificationInput {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  complaintId?: string;
  complaintRef?: string;
  actorId?: string;
  actorName?: string;
}

// Re-export status types
export * from './status';
