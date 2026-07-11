import { Chip, alpha, useTheme } from '@mui/material';
import type { ReactElement } from 'react';
import { CheckCircle, Cancel, Schedule, HourglassEmpty, Warning, TrendingUp } from '@mui/icons-material';

const statusConfig: Record<string, { color: string; icon: ReactElement; label: string }> = {
  active: { color: '#22c55e', icon: <CheckCircle sx={{ fontSize: 14 }} />, label: 'Active' },
  scheduled: { color: '#3b82f6', icon: <Schedule sx={{ fontSize: 14 }} />, label: 'Scheduled' },
  completed: { color: '#64748b', icon: <CheckCircle sx={{ fontSize: 14 }} />, label: 'Completed' },
  cancelled: { color: '#ef4444', icon: <Cancel sx={{ fontSize: 14 }} />, label: 'Cancelled' },
  pending: { color: '#f59e0b', icon: <HourglassEmpty sx={{ fontSize: 14 }} />, label: 'Pending' },
  delayed: { color: '#f97316', icon: <Warning sx={{ fontSize: 14 }} />, label: 'Delayed' },
  present: { color: '#22c55e', icon: <CheckCircle sx={{ fontSize: 14 }} />, label: 'Present' },
  absent: { color: '#ef4444', icon: <Cancel sx={{ fontSize: 14 }} />, label: 'Absent' },
  late: { color: '#f59e0b', icon: <Warning sx={{ fontSize: 14 }} />, label: 'Late' },
  boarding: { color: '#3b82f6', icon: <TrendingUp sx={{ fontSize: 14 }} />, label: 'Boarding' },
  in_transit: { color: '#22c55e', icon: <TrendingUp sx={{ fontSize: 14 }} />, label: 'In Transit' },
  emergency: { color: '#ef4444', icon: <Warning sx={{ fontSize: 14 }} />, label: 'Emergency' },
  onboard: { color: '#22c55e', icon: <CheckCircle sx={{ fontSize: 14 }} />, label: 'Onboard' },
  dropped: { color: '#64748b', icon: <CheckCircle sx={{ fontSize: 14 }} />, label: 'Dropped' },
  offline: { color: '#94a3b8', icon: <Cancel sx={{ fontSize: 14 }} />, label: 'Offline' },
};

interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
  label?: string;
}

export default function StatusChip({ status, size = 'small', label }: StatusChipProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const config = statusConfig[status.toLowerCase()];
  const color = config?.color || '#64748b';
  const displayLabel = label || config?.label || status;

  return (
    <Chip
      icon={config?.icon}
      label={displayLabel}
      size={size}
      sx={{
        fontWeight: 700,
        fontSize: size === 'small' ? '0.65rem' : '0.75rem',
        height: size === 'small' ? 22 : 28,
        bgcolor: alpha(color, isDark ? 0.15 : 0.1),
        color: color,
        border: `1px solid ${alpha(color, 0.2)}`,
        '& .MuiChip-icon': { ml: 0.5, fontSize: size === 'small' ? 14 : 16 },
      }}
    />
  );
}
