import { Badge } from '@/components/ui/badge';
import { Priority, PRIORITY_LABELS } from '@/types';

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityVariants: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-600 hover:bg-slate-100',
  medium: 'bg-blue-100 text-blue-600 hover:bg-blue-100',
  high: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  urgent: 'bg-red-100 text-red-700 hover:bg-red-100',
};

const priorityDots: Record<Priority, string> = {
  low: 'bg-slate-400',
  medium: 'bg-blue-500',
  high: 'bg-amber-500',
  urgent: 'bg-red-500',
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <Badge className={priorityVariants[priority]} variant="secondary">
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${priorityDots[priority]}`} />
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
