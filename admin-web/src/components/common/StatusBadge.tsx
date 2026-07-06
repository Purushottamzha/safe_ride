import { Chip } from '@mui/material';

type StatusType = 'active' | 'inactive' | 'present' | 'absent' | 'late' | 'excused' | 'open' | 'investigating' | 'resolved' | 'closed' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'low' | 'medium' | 'high' | 'critical' | 'info' | 'warning' | 'error' | 'success' | 'morning' | 'evening' | 'both';

const statusConfig: Record<string, { color: 'success' | 'warning' | 'error' | 'info' | 'default' | 'primary' | 'secondary'; label: string }> = {
  active: { color: 'success', label: 'Active' },
  inactive: { color: 'default', label: 'Inactive' },
  present: { color: 'success', label: 'Present' },
  absent: { color: 'error', label: 'Absent' },
  late: { color: 'warning', label: 'Late' },
  excused: { color: 'info', label: 'Excused' },
  open: { color: 'error', label: 'Open' },
  investigating: { color: 'warning', label: 'Investigating' },
  resolved: { color: 'success', label: 'Resolved' },
  closed: { color: 'default', label: 'Closed' },
  scheduled: { color: 'info', label: 'Scheduled' },
  in_progress: { color: 'primary', label: 'In Progress' },
  completed: { color: 'success', label: 'Completed' },
  cancelled: { color: 'default', label: 'Cancelled' },
  low: { color: 'success', label: 'Low' },
  medium: { color: 'warning', label: 'Medium' },
  high: { color: 'error', label: 'High' },
  critical: { color: 'error', label: 'Critical' },
  morning: { color: 'info', label: 'Morning' },
  evening: { color: 'secondary', label: 'Evening' },
  both: { color: 'primary', label: 'Both' },
};

interface StatusBadgeProps {
  status: StatusType | string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { color: 'default' as const, label: status };
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="filled"
      sx={{
        fontWeight: 600,
        fontSize: '0.7rem',
        textTransform: 'capitalize',
      }}
    />
  );
}
