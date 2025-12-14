import { ComplaintStatus, STATUS_LABELS } from '@/types';

interface StatusBadgeProps {
  status: ComplaintStatus;
}

const statusStyles: Record<ComplaintStatus, string> = {
  submitted: 'bg-gray-500 text-white',
  acknowledged: 'bg-blue-500 text-white',
  under_review: 'bg-purple-500 text-white',
  assigned: 'bg-indigo-500 text-white',
  in_progress: 'bg-yellow-500 text-black',
  pending_external_action: 'bg-orange-500 text-white',
  resolved: 'bg-green-500 text-white',
  closed: 'bg-gray-400 text-white',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span 
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${statusStyles[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
