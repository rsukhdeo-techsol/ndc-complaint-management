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
export type TimelineEventType = 'comment' | 'status_change' | 'attachment' | 'assignment';

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
  status: ComplaintStatus;
  priority?: Priority;
  assignedTo?: string;

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
  previousStatus?: ComplaintStatus;
  newStatus?: ComplaintStatus;
  statusNote?: string;

  // For attachments
  attachment?: AttachmentData;

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
  complainantEmail?: string;
  complainantAddress?: string;
  title?: string;
  description?: string;
  category?: ComplaintCategory;
  location?: string;
  priority?: Priority;
  assignedTo?: string;
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
