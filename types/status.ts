import { Timestamp } from 'firebase/firestore';

/**
 * Status category types
 */
export type StatusCategory = 'active' | 'done' | 'closed';

export const STATUS_CATEGORY_LABELS: Record<StatusCategory, string> = {
  active: 'Active',
  done: 'Done',
  closed: 'Closed',
};

export const STATUS_CATEGORY_ORDER: StatusCategory[] = ['active', 'done', 'closed'];

/**
 * A single custom status
 */
export interface CustomStatus {
  id: string;
  name: string;
  color: string;
  category: StatusCategory;
  order: number;
}

/**
 * Status configuration document
 * Collection: settings/statuses
 */
export interface StatusConfig {
  id: string;
  statuses: CustomStatus[];
  updatedAt: Timestamp;
  updatedBy: string;
}

/**
 * Default statuses for new installations
 */
export const DEFAULT_STATUSES: Omit<CustomStatus, 'id'>[] = [
  { name: 'Submitted', color: '#6b7280', category: 'active', order: 0 },
  { name: 'Acknowledged', color: '#3b82f6', category: 'active', order: 1 },
  { name: 'Under Review', color: '#8b5cf6', category: 'active', order: 2 },
  { name: 'Assigned', color: '#6366f1', category: 'active', order: 3 },
  { name: 'In Progress', color: '#eab308', category: 'active', order: 4 },
  { name: 'Pending External', color: '#f97316', category: 'active', order: 5 },
  { name: 'Resolved', color: '#22c55e', category: 'done', order: 0 },
  { name: 'Closed', color: '#9ca3af', category: 'closed', order: 0 },
];

/**
 * Preset colors for status picker
 */
export const STATUS_PRESET_COLORS = [
  '#6b7280', // gray
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#6366f1', // indigo
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
];
