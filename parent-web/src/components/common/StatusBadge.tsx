import Chip from '@mui/material/Chip';
import type { ChipProps } from '@mui/material/Chip';
import type { AttendanceStatus, TripStatus } from '@/types';

interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
  status: AttendanceStatus | TripStatus | string;
  type?: 'attendance' | 'trip';
}

const attendanceConfig: Record<string, { color: ChipProps['color']; label: string }> = {
  present: { color: 'success', label: 'Present' },
  absent: { color: 'error', label: 'Absent' },
  late: { color: 'warning', label: 'Late' },
  no_school: { color: 'default', label: 'No School' },
  unknown: { color: 'default', label: 'Unknown' },
};

const tripConfig: Record<string, { color: ChipProps['color']; label: string }> = {
  PENDING: { color: 'default', label: 'Pending' },
  BOARDED: { color: 'info', label: 'Boarded' },
  IN_TRANSIT: { color: 'primary', label: 'In Transit' },
  COMPLETED: { color: 'success', label: 'Completed' },
  CANCELLED: { color: 'error', label: 'Cancelled' },
};

export default function StatusBadge({ status, type = 'attendance', ...props }: StatusBadgeProps) {
  const config = type === 'trip' ? tripConfig : attendanceConfig;
  const match = config[status] ?? { color: 'default' as const, label: status };

  return (
    <Chip
      label={match.label}
      color={match.color}
      size="small"
      {...props}
      sx={{
        fontWeight: 600,
        fontSize: '0.75rem',
        ...props.sx,
      }}
    />
  );
}
