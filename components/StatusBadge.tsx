import { Badge } from '@/components/ui/badge';
import { ComplaintStatus, STATUS_LABELS } from '@/types';

interface StatusBadgeProps {
  status: ComplaintStatus;
}

const statusStyles: Record<ComplaintStatus, string> = {
  submitted: 'bg-gray-500 text-white hover:bg-gray-500',
  acknowledged: 'bg-blue-500 text-white hover:bg-blue-500',
  under_review: 'bg-purple-500 text-white hover:bg-purple-500',
  assigned: 'bg-indigo-500 text-white hover:bg-indigo-500',
  in_progress: 'bg-yellow-500 text-black hover:bg-yellow-500',
  pending_external_action: 'bg-orange-500 text-white hover:bg-orange-500',
  resolved: 'bg-green-500 text-white hover:bg-green-500',
  closed: 'bg-gray-400 text-white hover:bg-gray-400',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge className={`uppercase tracking-wide ${statusStyles[status]}`}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
