import { ComplaintStatus, Priority } from '@/types';

// Status color mappings used across components
export const STATUS_COLORS: Record<ComplaintStatus, string> = {
  submitted: 'bg-gray-500',
  acknowledged: 'bg-blue-500',
  under_review: 'bg-purple-500',
  assigned: 'bg-indigo-500',
  in_progress: 'bg-yellow-500',
  pending_external_action: 'bg-orange-500',
  resolved: 'bg-green-500',
  closed: 'bg-gray-400',
};

export const STATUS_TEXT_COLORS: Record<ComplaintStatus, string> = {
  submitted: 'text-white',
  acknowledged: 'text-white',
  under_review: 'text-white',
  assigned: 'text-white',
  in_progress: 'text-black',
  pending_external_action: 'text-white',
  resolved: 'text-white',
  closed: 'text-white',
};

// Priority color mappings
export const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-gray-400',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

export const PRIORITY_TEXT_COLORS: Record<Priority, string> = {
  low: 'text-gray-500',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
};

export const PRIORITY_BADGE_COLORS: Record<Priority, string> = {
  low: 'bg-gray-400 text-white',
  medium: 'bg-blue-500 text-white',
  high: 'bg-orange-500 text-white',
  urgent: 'bg-red-500 text-white',
};
